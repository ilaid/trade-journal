import { sb } from "./supabase";

// Investing / swing positions (table `investments`). Separate from day-trading.
// Rows are kept in DB (snake_case) shape; the UI reads them directly.

const NUMERIC = ["entry_price", "quantity", "exit_price", "fees", "target", "stop", "conviction"];
const DATES = ["entry_date", "exit_date"];
const TEXT = ["symbol", "asset_type", "direction", "time_horizon", "thesis", "market_context", "review", "notes"];

// Turn a form object into a DB-safe payload: "" -> null, numbers coerced.
function toPayload(inv) {
  const out = {};
  for (const k of TEXT) if (inv[k] !== undefined) out[k] = inv[k] === "" ? null : inv[k];
  for (const k of DATES) if (inv[k] !== undefined) out[k] = inv[k] || null;
  for (const k of NUMERIC) if (inv[k] !== undefined) out[k] = inv[k] === "" || inv[k] == null ? null : Number(inv[k]);
  if (inv.tags !== undefined) out.tags = Array.isArray(inv.tags) ? inv.tags : [];
  if (out.fees == null) out.fees = 0;
  if (out.quantity == null) out.quantity = 1;
  return out;
}

export async function listInvestments(userId) {
  const { data, error } = await sb.from("investments").select("*").eq("user_id", userId).order("entry_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createInvestment(userId, inv) {
  const { data, error } = await sb.from("investments").insert({ ...toPayload(inv), user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateInvestment(userId, id, inv) {
  const { data, error } = await sb.from("investments").update(toPayload(inv)).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInvestment(userId, id) {
  const { error } = await sb.from("investments").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// --- P&L helpers (closed positions only; an open position has no exit) ---
export function invClosed(inv) {
  return inv.exit_price != null && inv.exit_price !== "";
}

export function invPnL(inv) {
  if (!invClosed(inv)) return null;
  const dir = inv.direction === "Short" ? -1 : 1;
  const gross = (Number(inv.exit_price) - Number(inv.entry_price)) * Number(inv.quantity || 0) * dir;
  return gross - Number(inv.fees || 0);
}

export function invReturnPct(inv) {
  if (!invClosed(inv) || !Number(inv.entry_price)) return null;
  const dir = inv.direction === "Short" ? -1 : 1;
  return ((Number(inv.exit_price) - Number(inv.entry_price)) / Number(inv.entry_price)) * dir * 100;
}
