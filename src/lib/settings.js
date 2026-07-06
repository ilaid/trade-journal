import { sb } from "./supabase";

const LS = "tj_settings";

const readLS = () => {
  try {
    return JSON.parse(localStorage.getItem(LS)) || {};
  } catch {
    return {};
  }
};

// Loads per-user settings from Supabase (public.user_settings), falling back to
// localStorage if the table doesn't exist yet or the user has no row.
export async function loadSettings(userId) {
  try {
    const { data, error } = await sb.from("user_settings").select("data").eq("user_id", userId).single();
    if (!error && data?.data) return { ...readLS(), ...data.data };
  } catch {
    // table missing / offline — fall through
  }
  return readLS();
}

// Persists a single setting. Always writes localStorage (instant + offline
// fallback); best-effort syncs to Supabase so it follows the user across devices.
export async function saveSetting(userId, key, value) {
  const next = { ...readLS(), [key]: value };
  try {
    localStorage.setItem(LS, JSON.stringify(next));
  } catch {
    // ignore
  }
  try {
    await sb.from("user_settings").upsert({ user_id: userId, data: next, updated_at: new Date().toISOString() });
  } catch {
    // table missing / offline — localStorage still holds it
  }
}
