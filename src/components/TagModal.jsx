import { TCOLORS, BP } from "../lib/constants";

export default function TagModal({ newTag, setNewTag, onCreate, onClose }) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox" style={{ maxWidth: 380 }}>
        <div style={{ padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#f9fafb", marginBottom: 18 }}>Create Setup Tag</div>
          <span className="fl">Name</span>
          <input className="inp" style={{ marginBottom: 12 }} value={newTag.name} onChange={(e) => setNewTag((n) => ({ ...n, name: e.target.value }))} placeholder="e.g. Opening Drive…" />
          <span className="fl" style={{ marginBottom: 8 }}>
            Color
          </span>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {TCOLORS.map((c) => (
              <div key={c} onClick={() => setNewTag((n) => ({ ...n, color: c }))} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${newTag.color === c ? "white" : "transparent"}` }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pill" onClick={onClose}>
              Cancel
            </button>
            <button
              style={BP}
              onClick={() => {
                onCreate();
                onClose();
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
