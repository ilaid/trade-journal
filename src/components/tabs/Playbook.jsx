import { useEffect, useState } from "react";
import { TCOLORS, BP } from "../../lib/constants";
import { listPlaybooks, createPlaybook, updatePlaybook, deletePlaybook } from "../../lib/playbooks";

const blank = () => ({ name: "", color: TCOLORS[0], description: "", entry_rules: "", exit_rules: "", notes: "" });

export default function Playbook({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [modal, setModal] = useState(null); // null | {form, editId}
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setItems(await listPlaybooks(userId));
      setNeedsMigration(false);
    } catch {
      setNeedsMigration(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openNew = () => setModal({ form: blank(), editId: null });
  const openEdit = (pb) => setModal({ form: { ...pb }, editId: pb.id });
  const setField = (k, v) => setModal((m) => ({ ...m, form: { ...m.form, [k]: v } }));

  const save = async () => {
    if (!modal.form.name.trim()) return;
    setSaving(true);
    try {
      if (modal.editId) await updatePlaybook(userId, modal.editId, modal.form);
      else await createPlaybook(userId, modal.form);
      await refresh();
      setModal(null);
    } catch {
      setNeedsMigration(true);
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this strategy?")) return;
    setItems((s) => s.filter((x) => x.id !== id));
    try {
      await deletePlaybook(userId, id);
    } catch {
      refresh();
    }
  };

  if (loading) return <div style={{ fontSize: 12, color: "#94a3b8", padding: "40px 0", textAlign: "center" }}>Loading playbook…</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>Playbook · Strategies</span>
        <button style={{ ...BP, padding: "8px 16px", fontSize: 12 }} onClick={openNew}>
          + New Strategy
        </button>
      </div>

      {needsMigration && (
        <div className="sc" style={{ marginBottom: 12, background: "#fef3c7", borderColor: "#fcd34d" }}>
          <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
            ⚠️ To enable the Playbook, run <b>sql/0005_playbooks.sql</b> once in your Supabase SQL editor. Until then strategies can't be saved.
          </div>
        </div>
      )}

      {items.length === 0 && !needsMigration ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 36 }}>📓</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>No strategies yet — document your first setup.</div>
        </div>
      ) : (
        items.map((pb) => (
          <div key={pb.id} className="sc" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: pb.description || pb.entry_rules || pb.exit_rules || pb.notes ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: pb.color }} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{pb.name}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="pill" onClick={() => openEdit(pb)}>
                  Edit
                </button>
                <button onClick={() => remove(pb.id)} style={{ background: "#fee2e2", border: "1px solid #dc2626", borderRadius: 8, color: "#dc2626", cursor: "pointer", fontSize: 12, padding: "6px 10px" }}>
                  Delete
                </button>
              </div>
            </div>
            {pb.description && <div style={{ fontSize: 13, color: "#334155", marginBottom: 10, lineHeight: 1.5 }}>{pb.description}</div>}
            <div style={{ display: "grid", gridTemplateColumns: pb.entry_rules && pb.exit_rules ? "1fr 1fr" : "1fr", gap: 10 }}>
              {pb.entry_rules && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Entry Rules</div>
                  <div style={{ fontSize: 12, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{pb.entry_rules}</div>
                </div>
              )}
              {pb.exit_rules && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Exit Rules</div>
                  <div style={{ fontSize: 12, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{pb.exit_rules}</div>
                </div>
              )}
            </div>
            {pb.notes && <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", whiteSpace: "pre-wrap" }}>📝 {pb.notes}</div>}
          </div>
        ))
      )}

      {modal && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="mbox" style={{ maxWidth: 560 }}>
            <div style={{ padding: "22px 24px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>{modal.editId ? "Edit Strategy" : "New Strategy"}</div>
              <span className="fl">Name</span>
              <input className="inp" style={{ marginBottom: 12 }} value={modal.form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Opening Range Breakout" />
              <span className="fl" style={{ marginBottom: 8 }}>
                Color
              </span>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {TCOLORS.map((c) => (
                  <div key={c} onClick={() => setField("color", c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${modal.form.color === c ? "#0f172a" : "transparent"}` }} />
                ))}
              </div>
              <span className="fl">Description</span>
              <textarea className="inp ta" style={{ marginBottom: 12, minHeight: 50 }} value={modal.form.description} onChange={(e) => setField("description", e.target.value)} placeholder="What is this setup and when does it apply?" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <span className="fl">Entry Rules</span>
                  <textarea className="inp ta" value={modal.form.entry_rules} onChange={(e) => setField("entry_rules", e.target.value)} placeholder="Conditions to enter…" />
                </div>
                <div>
                  <span className="fl">Exit Rules</span>
                  <textarea className="inp ta" value={modal.form.exit_rules} onChange={(e) => setField("exit_rules", e.target.value)} placeholder="Targets, stops, invalidation…" />
                </div>
              </div>
              <span className="fl">Notes</span>
              <textarea className="inp ta" style={{ marginBottom: 16, minHeight: 50 }} value={modal.form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Anything else…" />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="pill" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button style={BP} onClick={save} disabled={saving}>
                  {saving ? "Saving…" : modal.editId ? "Save Changes" : "Create Strategy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
