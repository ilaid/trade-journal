import { sb } from "./supabase";
import { loadSettings, saveSetting } from "./settings";
import { tPnL } from "./calc";

// Trading accounts (prop / personal) and the risk plan attached to each.

const NUM = ["size", "profit_target", "max_drawdown", "daily_loss_limit", "daily_loss_pct", "consistency_pct"];
const TXT = ["name", "firm", "drawdown_type", "status", "notes"];

function toPayload(a) {
  const out = {};
  for (const k of TXT) if (a[k] !== undefined) out[k] = a[k] === "" ? null : a[k];
  for (const k of NUM) if (a[k] !== undefined) out[k] = a[k] === "" || a[k] == null ? null : Number(a[k]);
  if (a.start_date !== undefined) out.start_date = a.start_date || null;
  if (!out.drawdown_type) out.drawdown_type = "trailing";
  if (!out.status) out.status = "active";
  return out;
}

export async function listAccounts(userId) {
  const { data, error } = await sb.from("accounts").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createAccount(userId, a) {
  const { data, error } = await sb.from("accounts").insert({ ...toPayload(a), user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateAccount(userId, id, a) {
  const { data, error } = await sb.from("accounts").update(toPayload(a)).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAccount(userId, id) {
  const { error } = await sb.from("accounts").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// The account new trades are attributed to.
export async function getActiveAccount(userId) {
  const s = await loadSettings(userId);
  return s.active_account_id ?? null;
}
export async function setActiveAccount(userId, id) {
  await saveSetting(userId, "active_account_id", id ?? null);
}

// --- Risk math -------------------------------------------------------------
// `trades` are the app's flat trade objects belonging to this account.
// Returns everything the status panel needs. Values are absolute dollars.
export function accountStats(account, trades, todayKey) {
  const size = Number(account?.size || 0);
  const maxDD = account?.max_drawdown == null ? null : Number(account.max_drawdown);

  // Chronological order so the trailing peak is computed correctly.
  const sorted = [...(trades || [])].sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));

  let balance = size;
  let peak = size;
  const byDay = {};
  for (const t of sorted) {
    const p = tPnL(t);
    balance += p;
    if (balance > peak) peak = balance;
    const d = t.date || "";
    byDay[d] = (byDay[d] || 0) + p;
  }

  const totalPnl = balance - size;
  const trailing = (account?.drawdown_type || "trailing") === "trailing";
  const failLevel = maxDD == null ? null : (trailing ? peak : size) - maxDD;
  const ddBuffer = failLevel == null ? null : balance - failLevel;

  // Daily loss limit: explicit dollars, else a percentage of the max drawdown.
  const dailyLimit =
    account?.daily_loss_limit != null
      ? Number(account.daily_loss_limit)
      : account?.daily_loss_pct != null && maxDD != null
      ? (Number(account.daily_loss_pct) / 100) * maxDD
      : null;

  const todayPnl = byDay[todayKey] || 0;
  const dailyLeft = dailyLimit == null ? null : dailyLimit + Math.min(0, todayPnl);

  const target = account?.profit_target == null ? null : Number(account.profit_target);
  const targetPct = target ? Math.max(0, Math.min(100, (totalPnl / target) * 100)) : null;

  // Consistency: biggest winning day as a share of total profit.
  const bestDay = Object.values(byDay).reduce((m, v) => (v > m ? v : m), 0);
  const consistencyPct = totalPnl > 0 ? (bestDay / totalPnl) * 100 : null;
  const consistencyLimit = account?.consistency_pct == null ? null : Number(account.consistency_pct);
  const consistencyOk = consistencyLimit == null || consistencyPct == null ? null : consistencyPct <= consistencyLimit;

  return {
    size,
    balance,
    peak,
    totalPnl,
    failLevel,
    ddBuffer,
    dailyLimit,
    todayPnl,
    dailyLeft,
    dailyBreached: dailyLeft != null && dailyLeft <= 0,
    ddBreached: ddBuffer != null && ddBuffer <= 0,
    target,
    targetPct,
    targetHit: target != null && totalPnl >= target,
    bestDay,
    consistencyPct,
    consistencyLimit,
    consistencyOk,
    trades: sorted.length,
  };
}
