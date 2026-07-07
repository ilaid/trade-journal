// Connect (or disconnect) a user's Tradovate account.
//
// POST /api/tradovate/connect   (Authorization: Bearer <supabase access token>)
//   body: { action?: "connect"|"disconnect", env, name, password, appId, cid, sec }
// On connect we validate the credentials by fetching an access token, then store
// the connection (service role) and return the account list.
import { supaAdmin } from "../_lib/trade.js";
import { userFromRequest } from "../_lib/auth.js";
import { accessToken, listAccounts } from "../_lib/tradovate.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const supa = supaAdmin();
  if (!supa) return res.status(500).json({ error: "Server not configured: add SUPABASE_SERVICE_ROLE_KEY in Vercel env vars." });

  const userId = await userFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  if (body.action === "disconnect") {
    await supa.from("broker_connections").delete().eq("user_id", userId);
    return res.status(200).json({ ok: true, status: "disconnected" });
  }

  const env = body.env === "live" ? "live" : "demo";
  const creds = {
    name: (body.name || "").trim(),
    password: body.password || "",
    appId: (body.appId || "").trim(),
    appVersion: "1.0",
    cid: body.cid,
    sec: (body.sec || "").trim(),
    deviceId: body.deviceId || globalThis.crypto?.randomUUID?.() || `tm-${Date.now()}`,
  };
  if (!creds.name || !creds.password || !creds.appId || !creds.sec) {
    return res.status(400).json({ error: "Missing credentials — name, password, appId and sec are required." });
  }

  let tok;
  try {
    tok = await accessToken(creds, env);
  } catch (e) {
    await supa.from("broker_connections").upsert({ user_id: userId, broker: "tradovate", env, creds, status: "error", last_error: String(e.message || e), updated_at: new Date().toISOString() });
    return res.status(400).json({ error: String(e.message || e) });
  }

  let accounts = [];
  try {
    const a = await listAccounts(tok.accessToken, env);
    accounts = (a || []).map((x) => ({ id: x.id, name: x.name }));
  } catch {
    // account listing is best-effort; the connection is still valid
  }

  await supa.from("broker_connections").upsert({
    user_id: userId,
    broker: "tradovate",
    env,
    creds,
    access_token: tok.accessToken,
    token_expires_at: tok.expiresAt,
    status: "connected",
    last_error: null,
    updated_at: new Date().toISOString(),
  });

  return res.status(200).json({ ok: true, status: "connected", accounts });
}
