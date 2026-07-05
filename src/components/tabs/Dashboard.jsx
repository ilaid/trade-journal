import { f$, avg } from "../../lib/calc";
import { DAYS, MONTH_NAMES } from "../../lib/constants";
import TRow from "../TRow";

export default function Dashboard({
  mPnl, mWr, mTrades, mPf, mAvgRR,
  calYear, calMonth, navMonth, goToday, isCurMonth,
  calDays, todayKey, openDay,
  byDay, byWeek, byMonth,
  tags, instrumentMeta, openEdit, deleteTrade,
}) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { l: "Month P&L", v: f$(mPnl), c: mPnl >= 0 ? "#00c07a" : "#ef4444" },
          { l: "Win Rate", v: mTrades.length ? `${mWr}%` : "—", c: "#60a5fa" },
          { l: "Trades", v: mTrades.length, c: "#e5e7eb" },
          { l: "Profit Factor", v: mPf, c: "#f59e0b" },
          { l: "Avg R:R", v: mAvgRR, c: "#8b5cf6" },
        ].map((s) => (
          <div key={s.l} className="sc" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{s.l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="sc" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => navMonth(-1)} style={{ background: "#111827", border: "1px solid #1e2635", borderRadius: 8, color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: "6px 14px", fontFamily: "'Azeret Mono',monospace" }}>
            ‹
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#f9fafb" }}>
              {MONTH_NAMES[calMonth]} {calYear}
            </div>
            <div style={{ fontSize: 11, marginTop: 3, color: mPnl >= 0 ? "#00c07a" : "#ef4444", fontWeight: 600 }}>{mTrades.length > 0 ? `${f$(mPnl)} · ${mTrades.length} trades · ${mWr}% WR` : "No trades this month"}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {!isCurMonth && (
              <button onClick={goToday} style={{ background: "#111827", border: "1px solid #1e2635", borderRadius: 7, color: "#6b7280", cursor: "pointer", fontSize: 11, padding: "6px 10px", fontFamily: "'Azeret Mono',monospace" }}>
                Today
              </button>
            )}
            <button onClick={() => navMonth(1)} style={{ background: "#111827", border: "1px solid #1e2635", borderRadius: 8, color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: "6px 14px", fontFamily: "'Azeret Mono',monospace" }}>
              ›
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 9, color: "#374151", padding: "4px 0" }}>
              {d}
            </div>
          ))}
        </div>
        {Array.from({ length: calDays.length / 7 }, (_, row) => (
          <div key={row} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 3 }}>
            {calDays.slice(row * 7, (row + 1) * 7).map((c, i) =>
              c === null ? (
                <div key={i} style={{ minHeight: 58 }} />
              ) : (
                <div
                  key={c.key}
                  className="day-cell"
                  onClick={() => openDay(c.key)}
                  style={{
                    background: c.pnl !== null ? (c.pnl > 0 ? "rgba(0,192,122,.13)" : "rgba(239,68,68,.13)") : c.hasNote ? "rgba(59,130,246,.07)" : "#0d1117",
                    border: c.key === todayKey ? "2px solid #3b82f6" : `1px solid ${c.pnl !== null ? (c.pnl > 0 ? "rgba(0,192,122,.3)" : "rgba(239,68,68,.3)") : c.hasNote ? "rgba(59,130,246,.25)" : "#1e2635"}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: c.key === todayKey ? "700" : "400", color: c.key === todayKey ? "#60a5fa" : c.count > 0 ? "#9ca3af" : c.hasNote ? "#6b7280" : "#374151" }}>{c.day}</div>
                  {c.pnl !== null && (
                    <div style={{ fontSize: 10, color: c.pnl >= 0 ? "#00c07a" : "#ef4444", fontWeight: 600, marginTop: 2 }}>
                      {c.pnl >= 0 ? "+" : "-"}${Math.abs(c.pnl).toFixed(0)}
                    </div>
                  )}
                  {c.count > 0 && (
                    <div style={{ fontSize: 9, color: "#4b5563", marginTop: 1 }}>{c.count}T</div>
                  )}
                  {c.hasNote && c.count === 0 && <div style={{ fontSize: 10, color: "#3b82f6", marginTop: 2 }}>📝</div>}
                </div>
              )
            )}
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 10, color: "#374151" }}>Click any day to view trades or add a note</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { l: "Avg Daily", v: `$${avg(byDay)}`, c: parseFloat(avg(byDay)) >= 0 ? "#00c07a" : "#ef4444" },
          { l: "Avg Weekly", v: `$${avg(byWeek)}`, c: parseFloat(avg(byWeek)) >= 0 ? "#00c07a" : "#ef4444" },
          { l: "Avg Monthly", v: `$${avg(byMonth)}`, c: parseFloat(avg(byMonth)) >= 0 ? "#00c07a" : "#ef4444" },
        ].map((s) => (
          <div key={s.l} className="sc" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{s.l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>Recent Trades — {MONTH_NAMES[calMonth]}</div>
      {mTrades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#1e2635" }}>
          <div style={{ fontSize: 36 }}>📋</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>No trades in {MONTH_NAMES[calMonth]}</div>
        </div>
      ) : (
        mTrades.slice(0, 6).map((t) => <TRow key={t.id} trade={t} tags={tags} instrumentMeta={instrumentMeta} onEdit={openEdit} onDelete={deleteTrade} />)
      )}
    </>
  );
}
