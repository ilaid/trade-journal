import { sb } from "./supabase";
import { loadSettings, saveSetting } from "./settings";

// Backtest folders — each holds its own trades (trades.backtest_folder_id).
export async function listFolders(userId) {
  const { data, error } = await sb.from("backtest_folders").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createFolder(userId, name) {
  const { data, error } = await sb.from("backtest_folders").insert({ user_id: userId, name: name.trim() }).select().single();
  if (error) throw error;
  return data;
}

export async function renameFolder(userId, id, name) {
  const { data, error } = await sb.from("backtest_folders").update({ name: name.trim() }).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(userId, id) {
  const { error } = await sb.from("backtest_folders").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// The "recording" folder: TradingView imports land here (server reads the same
// key from user_settings.data). null = imports go to the live journal.
export async function getActiveFolder(userId) {
  const s = await loadSettings(userId);
  return s.active_backtest_folder_id ?? null;
}

export async function setActiveFolder(userId, id) {
  await saveSetting(userId, "active_backtest_folder_id", id ?? null);
}
