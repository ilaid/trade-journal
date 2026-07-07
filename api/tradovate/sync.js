// Pull newly-closed trades from Tradovate into the journal.
//
// POST /api/tradovate/sync
//   • scheduler:  header  x-sync-secret: <SYNC_SECRET>   → syncs every connected user
//   • "Sync now": Authorization: Bearer <supabase token>  → syncs just that user
//
// Idempotent: each closed round-trip (fillPair) is written with a stable
// external_id, so the unique index blocks duplicates even if the cursor lags.
import { supaAdmin, importTrade } from "../_lib/trade.js";
import { userFromRequest } from "../_lib/auth.js";
import { accessToken, renew, listFillPairs, listFills, contractItem } from "../_lib/tradovate.js";

async function validToken(supa, conn) {
  const soon = Date.now() + 60_000;
  const stillValid = conn.access_token && conn.token_expires_at && new Date(conn.token_expires_at).getTime() > soon;
  if (stillValid) return conn.access_token;
  // Try a cheap renew first, else full re-auth with stored credentials.
  try {
    const r = conn.access_token ? await renew(conn.access_token, conn.env) : await accessToken(conn.creds, conn.env);
    const tok = r.accessToken;
    await supa.from("broker_connections").update({ access_token: tok, token_expires_at: r.expiresAt }).eq("user_id", conn.user_id);
    return tok;
  } catch {
    const t = await accessToken(conn.creds, conn.env);
    await supa.from("broker_connections").update({ access_token: t.accessToken, token_expires_at: t.expiresAt }).eq("user_id", conn.user_id);
    return t.accessToken;
  }
}

async function syncOne(supa, conn) {
  const env = conn.env;
  let token;
  try {
    token = await validToken(supa, conn);
  } catch (e) {
    await supa.from("broker_connections").update({ status: "error", last_error: String(e.message || e) }).eq("user_id", conn.user_id);
    return { user: conn.user_id, error: String(e.message || e) };
  }

  let pairs, fills;
  try {
    [pairs, fills] = await Promise.all([listFillPairs(token, env), listFills(token, env)]);
  } catch (e) {
    await supa.from("broker_connections").update({ status: "error", last_error: String(e.message || e) }).eq("user_id", conn.user_id);
    return { user: conn.user_id, error: String(e.message || e) };
  }

  const fillById = new Map((fills || []).map((f) => [f.id, f]));
  const lastId = Number(conn.cursor?.lastFillPairId || 0);
  const contractCache = new Map();
  const symbolOf = async (cid) => {
    if (contractCache.has(cid)) return contractCache.get(cid);
    let name = "";
    try {
      const c = await contractItem(token, env, cid);
      name = c?.name || "";
    } catch {
      // leave blank — importTrade will reject an unknown symbol and we skip it
    }
    contractCache.set(cid, name);
    return name;
  };

  const fresh = (pairs || []).filter((p) => Number(p.id) > lastId).sort((a, b) => a.id - b.id);
  let imported = 0;
  let maxId = lastId;
  for (const p of fresh) {
    maxId = Math.max(maxId, Number(p.id));
    const buy = fillById.get(p.buyFillId);
    const sell = fillById.get(p.sellFillId);
    if (!buy || !sell) continue;
    const symbol = await symbolOf(buy.contractId || sell.contractId);
    if (!symbol) continue;
    const long = new Date(buy.timestamp).getTime() <= new Date(sell.timestamp).getTime();
    try {
      const r = await importTrade(supa, conn.user_id, {
        symbol,
        direction: long ? "Long" : "Short",
        entry: long ? buy.price : sell.price,
        exit: long ? sell.price : buy.price,
        qty: p.qty,
        externalId: `tv-fp-${p.id}`,
        timeISO: long ? buy.timestamp : sell.timestamp,
        notes: "Auto-imported from Tradovate",
        broker: "Tradovate",
      });
      if (r.ok && !r.duplicate) imported++;
    } catch {
      // skip a single bad row, keep importing the rest
    }
  }

  await supa.from("broker_connections").update({ cursor: { lastFillPairId: maxId }, status: "connected", last_error: null, last_sync_at: new Date().toISOString() }).eq("user_id", conn.user_id);
  return { user: conn.user_id, imported };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const supa = supaAdmin();
  if (!supa) return res.status(500).json({ error: "Server not configured: add SUPABASE_SERVICE_ROLE_KEY in Vercel env vars." });

  let conns = [];
  const secret = req.headers["x-sync-secret"];
  if (process.env.SYNC_SECRET && secret === process.env.SYNC_SECRET) {
    const { data } = await supa.from("broker_connections").select("*").eq("status", "connected");
    conns = data || [];
  } else {
    const userId = await userFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { data } = await supa.from("broker_connections").select("*").eq("user_id", userId);
    conns = data || [];
  }

  const results = [];
  for (const c of conns) {
    if (c.broker === "tradovate") results.push(await syncOne(supa, c));
  }
  return res.status(200).json({ ok: true, synced: results.length, results });
}
