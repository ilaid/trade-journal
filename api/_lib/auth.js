// Verify the caller's Supabase session (JWT in the Authorization header) and
// return their user id, using the service-role client to validate the token.
import { supaAdmin } from "./trade.js";

export async function userFromRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const jwt = String(header).replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return null;
  const supa = supaAdmin();
  if (!supa) return null;
  const { data, error } = await supa.auth.getUser(jwt);
  if (error || !data?.user) return null;
  return data.user.id;
}
