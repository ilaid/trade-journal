// TradeMethod — inbound trade webhook (Vercel serverless function)
//
// Receives a trade from TradingView (alert webhook) or any platform that can
// POST JSON, identifies the user by their personal token, and writes the trade
// straight into their journal. Uses the Supabase service role (server-side only)
// so it can write on the user's behalf; the token is what scopes it to one user.
//
// Endpoint:  POST /api/ingest?token=<user token>
// Env (set in Vercel):  SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const norm = (s) => (s == null ? "" : String(s).trim());
// "CME_MINI:ES1!" / "ES1!" / "ESU2025" -> "ES"
const cleanSymbol = (raw) => {
  let s = norm(raw).toUpperCase();
  if (s.includes(":")) s = s.split(":").pop();
  s = s.replace(/[0-9]+!?$/, ""); // drop continuous/expiry suffix like 1! or U2025
  s = s.replace(/!+$/, "");
  return s;
};
const dirOf = (raw) => {
  const s = norm(raw).toLowerCase();
  if (["buy", "long", "b", "bought"].includes(s)) return "Long";
  if (["sell", "short", "s", "sold"].includes(s)) return "Short";
  return "";
};
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }
  if (!SUPA_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: "Server not configured: add SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_URL) in Vercel env vars." });
  }

  // Body may arrive as an object (application/json) or a raw string (TradingView default text/plain).
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const token = norm(req.query.token || body.token);
  if (!token) return res.status(401).json({ error: "Missing token" });

  const supa = createClient(SUPA_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // 1. Identify the user by their webhook token (stored in user_settings.data).
  const { data: settingsRows, error: sErr } = await supa.from("user_settings").select("user_id, data").eq("data->>webhook_token", token).limit(1);
  if (sErr) return res.status(500).json({ error: "Lookup failed", detail: sErr.message });
  const owner = settingsRows && settingsRows[0];
  if (!owner) return res.status(403).json({ error: "Unknown token" });
  const userId = owner.user_id;

  // 2. Parse the trade payload (flexible field names).
  const symbol = cleanSymbol(body.symbol || body.ticker || body.instrument);
  const direction = dirOf(body.direction || body.action || body.side);
  const entry = num(body.entry ?? body.entry_price ?? body.price ?? body.close);
  const exit = num(body.exit ?? body.exit_price);
  const stop = num(body.stop ?? body.stop_loss ?? body.sl);
  const target = num(body.target ?? body.take_profit ?? body.tp);
  const qty = num(body.qty ?? body.contracts ?? body.quantity ?? body.position_size) || 1;
  const providedPnl = num(body.pnl ?? body.profit);
  const externalId = norm(body.id || body.external_id || body.alert_id) || null;

  if (!symbol) return res.status(400).json({ error: "Missing symbol" });
  if (!direction) return res.status(400).json({ error: "Missing/invalid direction (use buy/sell or long/short)" });
  if (entry == null) return res.status(400).json({ error: "Missing entry price" });

  // 3. Resolve instrument + contract (prefer the user's own, else the global built-in).
  const { data: insts } = await supa.from("instruments").select("id, symbol, user_id").eq("symbol", symbol);
  const inst = (insts || []).find((i) => i.user_id === userId) || (insts || []).find((i) => i.user_id === null) || (insts || [])[0];
  if (!inst) return res.status(400).json({ error: `Unknown instrument "${symbol}". Add it in Settings → Instruments first.` });

  const { data: contracts } = await supa.from("contracts").select("id, label, tick_size, tick_value, is_active").eq("instrument_id", inst.id).order("id");
  // optional contract hint (e.g. "Micro"); default to first active.
  const hint = norm(body.contract).toLowerCase();
  const contract = (contracts || []).find((c) => hint && c.label.toLowerCase().includes(hint)) || (contracts || []).find((c) => c.is_active) || (contracts || [])[0];
  if (!contract) return res.status(400).json({ error: `No contract configured for ${symbol}.` });

  // 4. Compute P&L if we have an exit (else store as an open trade with pnl 0).
  let pnl = providedPnl;
  if (pnl == null && exit != null) {
    const d = direction === "Short" ? -1 : 1;
    pnl = parseFloat(((d * (exit - entry)) / Number(contract.tick_size) * Number(contract.tick_value) * qty).toFixed(2));
  }
  if (pnl == null) pnl = 0;

  let rr = null;
  if (stop != null && target != null) {
    const d = direction === "Long" ? 1 : -1;
    const risk = Math.abs(entry - stop);
    if (risk > 0) rr = parseFloat(((d * (target - entry)) / risk).toFixed(2));
  }

  const now = new Date();
  const when = body.time ? new Date(body.time) : now;
  const tradeDate = (isNaN(when) ? now : when).toISOString().slice(0, 10);
  const tradeTime = (isNaN(when) ? now : when).toISOString().slice(11, 16);
  const tradeId = Date.now() * 1000 + Math.floor(Math.random() * 1000);

  // 5. Insert the trade (+ exit) with the service role (bypasses RLS; user_id is set explicitly).
  const { error: tErr } = await supa.from("trades").insert({
    id: tradeId,
    user_id: userId,
    is_historical: false,
    trade_date: tradeDate,
    trade_time: tradeTime,
    instrument_id: inst.id,
    contract_id: contract.id,
    direction,
    entry_price: entry,
    total_contracts: qty,
    stop_loss: stop,
    take_profit: target,
    risk_reward: rr,
    pnl,
    events: [],
    mistakes: [],
    notes: norm(body.notes) || "Auto-imported from TradingView",
    source: "api",
    broker: norm(body.broker) || "TradingView",
    external_id: externalId,
  });
  if (tErr) return res.status(500).json({ error: "Insert failed", detail: tErr.message });

  if (exit != null) {
    await supa.from("trade_exits").insert({ trade_id: tradeId, user_id: userId, exit_price: exit, contracts: qty, pnl, exit_order: 0 });
  }

  return res.status(200).json({ ok: true, id: tradeId, symbol, direction, pnl });
}
