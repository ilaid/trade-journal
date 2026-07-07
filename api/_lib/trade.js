// Shared server-side trade-ingestion pipeline.
//
// Both inbound paths — the TradingView webhook (api/ingest.js) and the Tradovate
// poller (api/tradovate/sync.js) — funnel through importTrade() so a trade is
// resolved, priced and written to the journal identically no matter the source.
//
// Files under api/_lib are NOT turned into routes by Vercel (leading underscore).
import { createClient } from "@supabase/supabase-js";

export const norm = (s) => (s == null ? "" : String(s).trim());
export const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
// "CME_MINI:ES1!" / "ES1!" / "ESU2025" / "ESZ4" -> "ES"
export const cleanSymbol = (raw) => {
  let s = norm(raw).toUpperCase();
  if (s.includes(":")) s = s.split(":").pop();
  s = s.replace(/[FGHJKMNQUVXZ]\d{1,4}$/, ""); // month-code + year (ESZ4, ESU2025)
  s = s.replace(/\d+!?$/, ""); // continuous/expiry suffix like 1!
  s = s.replace(/!+$/, "");
  return s;
};
export const dirOf = (raw) => {
  const s = norm(raw).toLowerCase();
  if (["buy", "long", "b", "bought"].includes(s)) return "Long";
  if (["sell", "short", "s", "sold"].includes(s)) return "Short";
  return "";
};

// Service-role client (bypasses RLS; writes on the user's behalf). Returns null
// if the server isn't configured so callers can surface a clear 500.
export function supaAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// A validation error carrying the HTTP status the endpoint should return.
export class TradeError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Resolve a symbol to the user's instrument + contract (prefer their own, else
// the global built-in). Throws TradeError(400) if nothing matches.
async function resolve(supa, userId, symbol, contractHint) {
  const { data: insts } = await supa.from("instruments").select("id, symbol, user_id").eq("symbol", symbol);
  const inst = (insts || []).find((i) => i.user_id === userId) || (insts || []).find((i) => i.user_id === null) || (insts || [])[0];
  if (!inst) throw new TradeError(400, `Unknown instrument "${symbol}". Add it in Settings → Instruments first.`);

  const { data: contracts } = await supa.from("contracts").select("id, label, tick_size, tick_value, is_active").eq("instrument_id", inst.id).order("id");
  const hint = norm(contractHint).toLowerCase();
  const contract = (contracts || []).find((c) => hint && c.label.toLowerCase().includes(hint)) || (contracts || []).find((c) => c.is_active) || (contracts || [])[0];
  if (!contract) throw new TradeError(400, `No contract configured for ${symbol}.`);
  return { inst, contract };
}

// Resolve, price and insert one trade (+ exit). `t` is a normalized payload:
//   { symbol, direction, entry, exit, stop, target, qty, providedPnl,
//     externalId, timeISO, notes, broker, contractHint }
// Returns { ok, id, symbol, direction, pnl }. Throws TradeError on bad input,
// or a plain Error on a DB failure.
export async function importTrade(supa, userId, t) {
  const symbol = cleanSymbol(t.symbol);
  const direction = dirOf(t.direction);
  const entry = num(t.entry);
  const exit = num(t.exit);
  const stop = num(t.stop);
  const target = num(t.target);
  const qty = num(t.qty) || 1;

  if (!symbol) throw new TradeError(400, "Missing symbol");
  if (!direction) throw new TradeError(400, "Missing/invalid direction (use buy/sell or long/short)");
  if (entry == null) throw new TradeError(400, "Missing entry price");

  const { inst, contract } = await resolve(supa, userId, symbol, t.contractHint);

  let pnl = num(t.providedPnl);
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
  const when = t.timeISO ? new Date(t.timeISO) : now;
  const at = isNaN(when) ? now : when;
  const tradeDate = at.toISOString().slice(0, 10);
  const tradeTime = at.toISOString().slice(11, 16);
  const tradeId = Date.now() * 1000 + Math.floor(Math.random() * 1000);

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
    notes: norm(t.notes) || `Auto-imported from ${t.broker || "API"}`,
    source: "api",
    broker: norm(t.broker) || "API",
    external_id: t.externalId ? norm(t.externalId) : null,
  });
  if (tErr) {
    // The unique index on (user_id, broker, external_id) makes re-imports idempotent.
    if (tErr.code === "23505") return { ok: true, id: null, symbol, direction, pnl, duplicate: true };
    const e = new Error(tErr.message);
    e.status = 500;
    throw e;
  }

  if (exit != null) {
    await supa.from("trade_exits").insert({ trade_id: tradeId, user_id: userId, exit_price: exit, contracts: qty, pnl, exit_order: 0 });
  }

  return { ok: true, id: tradeId, symbol, direction, pnl };
}
