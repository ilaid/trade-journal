// TradeMethod — inbound trade webhook (Vercel serverless function)
//
// Receives a trade from TradingView (alert webhook) or any platform that can
// POST JSON, identifies the user by their personal token, and writes the trade
// into their journal via the shared importTrade() pipeline (service role).
//
// Endpoint:  POST /api/ingest?token=<user token>
// Env (set in Vercel):  SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
import { supaAdmin, importTrade, norm } from "./_lib/trade.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const supa = supaAdmin();
  if (!supa) return res.status(500).json({ error: "Server not configured: add SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_URL) in Vercel env vars." });

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

  // Identify the user by their webhook token (stored in user_settings.data).
  const { data: rows, error: sErr } = await supa.from("user_settings").select("user_id, data").eq("data->>webhook_token", token).limit(1);
  if (sErr) return res.status(500).json({ error: "Lookup failed", detail: sErr.message });
  const owner = rows && rows[0];
  if (!owner) return res.status(403).json({ error: "Unknown token" });

  // When a backtest folder is "recording", imports land in it; else the live journal.
  const activeFolder = owner.data?.active_backtest_folder_id ?? null;

  try {
    const result = await importTrade(supa, owner.user_id, {
      backtestFolderId: activeFolder,
      symbol: body.symbol || body.ticker || body.instrument,
      direction: body.direction || body.action || body.side,
      entry: body.entry ?? body.entry_price ?? body.price ?? body.close,
      exit: body.exit ?? body.exit_price,
      stop: body.stop ?? body.stop_loss ?? body.sl,
      target: body.target ?? body.take_profit ?? body.tp,
      qty: body.qty ?? body.contracts ?? body.quantity ?? body.position_size,
      providedPnl: body.pnl ?? body.profit,
      externalId: body.id || body.external_id || body.alert_id,
      timeISO: body.time,
      notes: body.notes,
      broker: body.broker || "TradingView",
      contractHint: body.contract,
    });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
}
