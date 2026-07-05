import { useState } from "react";
import { f$ } from "../lib/calc";

const KEY = "tj_monthly_goal";
const loadGoal = () => {
  const v = parseFloat(localStorage.getItem(KEY));
  return Number.isFinite(v) && v > 0 ? v : 1000;
};

export default function MonthlyGoal({ mPnl }) {
  const [goal, setGoal] = useState(loadGoal);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));

  const save = () => {
    const v = parseFloat(draft);
    const next = Number.isFinite(v) && v > 0 ? v : goal;
    setGoal(next);
    localStorage.setItem(KEY, String(next));
    setEditing(false);
  };

  const pct = Math.max(0, Math.min(100, (mPnl / goal) * 100));
  const reached = mPnl >= goal;
  const barColor = mPnl < 0 ? "#dc2626" : reached ? "#16a34a" : "#5b52e0";

  return (
    <div className="sc" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>🎯 Monthly Goal</span>
        {editing ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: 13 }}>$</span>
            <input
              autoFocus
              className="inp"
              style={{ width: 110, padding: "6px 10px" }}
              type="number"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            <button onClick={save} style={{ background: "#5b52e0", border: "none", borderRadius: 8, color: "#fff", padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setDraft(String(goal));
              setEditing(true);
            }}
            style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, color: "#64748b", padding: "5px 12px", cursor: "pointer", fontSize: 12 }}
          >
            Target: <b style={{ color: "#0f172a" }}>${goal.toLocaleString()}</b> · edit
          </button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: mPnl >= 0 ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{f$(mPnl)}</span>
        <span style={{ fontSize: 13, color: reached ? "#16a34a" : "#64748b", fontWeight: 600 }}>
          {reached ? "✓ Goal reached!" : `${Math.round(pct)}% of $${goal.toLocaleString()}`}
        </span>
      </div>

      <div style={{ height: 10, background: "#eef0f7", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 6, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}
