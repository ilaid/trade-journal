import { f$ } from "../../lib/calc";
import { BP } from "../../lib/constants";

export default function Setups({ tagStats, setModal, deleteTag }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>Setup Win Rates</span>
        <button onClick={() => setModal("tag")} style={{ ...BP, padding: "7px 12px", fontSize: 11 }}>
          + New Tag
        </button>
      </div>
      {tagStats.map((tag) => (
        <div key={tag.id} className="sc" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: tag.color }} />
            <span style={{ fontSize: 13, color: "#1a1c2e", fontWeight: 700 }}>{tag.name}</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>{tag.count}</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "#64748b" }}>WIN%</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tag.wr >= 50 ? "#16a34a" : "#dc2626" }}>{tag.count ? `${tag.wr}%` : "—"}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "#64748b" }}>P&L</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tag.pnl >= 0 ? "#16a34a" : "#dc2626" }}>{tag.count ? f$(tag.pnl) : "—"}</div>
            </div>
            <button
              onClick={() => deleteTag(tag.id)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, padding: "3px 6px" }}
              onMouseOver={(e) => (e.target.style.color = "#dc2626")}
              onMouseOut={(e) => (e.target.style.color = "#94a3b8")}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
