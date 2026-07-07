import { sb } from "./supabase";

// Calls to the server-side Tradovate endpoints, authenticated with the user's
// current Supabase session token so the server can resolve who they are.
async function authedPost(path, body) {
  const { data } = await sb.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body || {}),
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export const connectTradovate = (fields) => authedPost("/api/tradovate/connect", { action: "connect", ...fields });
export const disconnectTradovate = () => authedPost("/api/tradovate/connect", { action: "disconnect" });
export const syncTradovate = () => authedPost("/api/tradovate/sync", {});

// Current connection status for the Settings card (safe columns only).
export async function getBrokerStatus(userId) {
  try {
    const { data } = await sb.from("broker_connections").select("broker, env, status, last_sync_at, last_error").eq("user_id", userId).single();
    return data || null;
  } catch {
    return null;
  }
}
