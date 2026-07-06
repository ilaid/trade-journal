import { sb } from "./supabase";

export async function listPlaybooks(userId) {
  const { data, error } = await sb.from("playbooks").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createPlaybook(userId, pb) {
  const { data, error } = await sb
    .from("playbooks")
    .insert({ user_id: userId, name: pb.name, color: pb.color, description: pb.description || null, entry_rules: pb.entry_rules || null, exit_rules: pb.exit_rules || null, notes: pb.notes || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlaybook(userId, id, pb) {
  const { data, error } = await sb
    .from("playbooks")
    .update({ name: pb.name, color: pb.color, description: pb.description || null, entry_rules: pb.entry_rules || null, exit_rules: pb.exit_rules || null, notes: pb.notes || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlaybook(userId, id) {
  const { error } = await sb.from("playbooks").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
