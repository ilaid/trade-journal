import { sb } from "./supabase";

const BUCKET = "trade-screenshots";
const MAX_BYTES = 5 * 1024 * 1024;

export function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function validateScreenshotFile(file) {
  if (!file.type.startsWith("image/")) return "Only image files are supported";
  if (file.size > MAX_BYTES) return "Image must be under 5MB";
  return null;
}

export async function uploadScreenshot(userId, tradeId, file) {
  const path = `${userId}/${tradeId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await sb
    .from("trade_screenshots")
    .insert({ trade_id: tradeId, user_id: userId, storage_path: path, file_name: file.name, content_type: file.type, size_bytes: file.size })
    .select()
    .single();
  if (insertError) throw insertError;
  return data;
}

export async function listScreenshots(tradeId) {
  const { data, error } = await sb.from("trade_screenshots").select("*").eq("trade_id", tradeId).order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function getSignedUrl(path, expiresIn = 3600) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteScreenshot(screenshot) {
  await sb.storage.from(BUCKET).remove([screenshot.storage_path]);
  await sb.from("trade_screenshots").delete().eq("id", screenshot.id);
}

// trade_screenshots rows cascade-delete via FK when the trade row is deleted,
// but Storage objects are not FK-aware — the actual files must be removed separately.
export async function deleteAllScreenshotsForTrade(tradeId) {
  const shots = await listScreenshots(tradeId);
  if (!shots.length) return;
  await sb.storage.from(BUCKET).remove(shots.map((s) => s.storage_path));
}
