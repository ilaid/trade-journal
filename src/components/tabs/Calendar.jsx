import { f$ } from "../../lib/calc";
import { DAYS, MONTH_NAMES } from "../../lib/constants";

export default function Calendar({ calYear, calMonth, navMonth, goToday, isCurMonth, calDays, todayKey, openDay, mPnl, mTrades, mWr }) {
  return (
    <div className="sc">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => navMonth(-1)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 16, padding: "6px 14px", fontFamily: "'Inter',system-ui,sans-serif" }}>
          ‹
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </div>
          <div style={{ fontSize: 12, marginTop: 3, color: mPnl >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{mTrades.length > 0 ? `${f$(mPnl)} · ${mTrades.length} trades · ${mWr}% WR` : "No trades this month"}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!isCurMonth && (
            <button onClick={goToday} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 7, color: "#64748b", cursor: "pointer", fontSize: 11, padding: "6px 10px", fontFamily: "'Inter',system-ui,sans-serif" }}>
              Today
            </button>
          )}
          <button onClick={() => navMonth(1)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 16, padding: "6px 14px", fontFamily: "'Inter',system-ui,sans-serif" }}>
            ›
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", padding: "4px 0", fontWeight: 600 }}>
            {d}
          </div>
        ))}
      </div>
      {Array.from({ length: calDays.length / 7 }, (_, row) => (
        <div key={row} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
          {calDays.slice(row * 7, (row + 1) * 7).map((c, i) =>
            c === null ? (
              <div key={i} style={{ minHeight: 66 }} />
            ) : (
              <div
                key={c.key}
                className="day-cell"
                onClick={() => openDay(c.key)}
                style={{
                  minHeight: 66,
                  background: c.pnl !== null ? (c.pnl > 0 ? "rgba(22,163,74,.10)" : "rgba(220,38,38,.10)") : c.hasNote ? "rgba(91,82,224,.07)" : "#f8fafc",
                  border: c.key === todayKey ? "2px solid #5b52e0" : `1px solid ${c.pnl !== null ? (c.pnl > 0 ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)") : c.hasNote ? "rgba(91,82,224,.25)" : "#e2e8f0"}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: c.key === todayKey ? "700" : "500", color: c.key === todayKey ? "#5b52e0" : c.count > 0 ? "#475569" : c.hasNote ? "#64748b" : "#94a3b8" }}>{c.day}</div>
                {c.pnl !== null && (
                  <div style={{ fontSize: 11, color: c.pnl >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
                    {c.pnl >= 0 ? "+" : "-"}${Math.abs(c.pnl).toFixed(0)}
                  </div>
                )}
                {c.count > 0 && <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>{c.count}T</div>}
                {c.hasNote && c.count === 0 && <div style={{ fontSize: 11, color: "#5b52e0", marginTop: 2 }}>📝</div>}
              </div>
            )
          )}
        </div>
      ))}
      <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8" }}>Click any day to view trades or add a note</div>
    </div>
  );
}
