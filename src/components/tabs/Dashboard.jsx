import { f$, avg } from "../../lib/calc";
import { DAYS, MONTH_NAMES } from "../../lib/constants";
import TRow from "../TRow";
import EquityCurve from "../charts/EquityCurve";
import DailyPnL from "../charts/DailyPnL";
import WinLoss from "../charts/WinLoss";

const cardTitle = { fontSize: 11, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 };

export default function Dashboard({
  trades,
  mPnl, mWr, mTrades, mPf, mAvgRR,
  calYear, calMonth, navMonth, goToday, isCurMonth,
  calDays, todayKey, openDay,
  byDay, byWeek, byMonth,
  tags, instrumentMeta, openEdit, deleteTrade,
}) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { l: "Month P&L", v: f$(mPnl), c: mPnl >= 0 ? "#16a34a" : "#dc2626" },
          { l: "Win Rate", v: mTrades.length ? `${mWr}%` : "—", c: "#5b52e0" },
          { l: "Trades", v: mTrades.length, c: "#0f172a" },
          { l: "Profit Factor", v: mPf, c: "#d97706" },
          { l: "Avg R:R", v: mAvgRR, c: "#7c3aed" },
        ].map((s) => (
          <div key={s.l} className="sc" style={{ textAlign: "center", padding: "14px 8px" }}>
            <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Equity curve — all-time account growth */}
      <div className="sc" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={cardTitle}>Equity Curve · All Time</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: (trades || []).reduce((s, t) => s + (t.pnl || 0), 0) >= 0 ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
            {f$((trades || []).map((t) => (t.exits?.length ? t.exits.reduce((a, l) => a + (l.pnl || 0), 0) : t.pnl || 0)).reduce((a, b) => a + b, 0))}
          </span>
        </div>
        <EquityCurve trades={trades || []} />
      </div>

      {/* Daily P&L + Win/Loss for the displayed month */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 14 }}>
        <div className="sc">
          <div style={cardTitle}>Daily P&L · {MONTH_NAMES[calMonth]}</div>
          <DailyPnL trades={mTrades} />
        </div>
        <div className="sc">
          <div style={cardTitle}>Win / Loss · {MONTH_NAMES[calMonth]}</div>
          <WinLoss trades={mTrades} />
        </div>
      </div>

      <div className="sc" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => navMonth(-1)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 16, padding: "6px 14px", fontFamily: "'Inter',system-ui,sans-serif" }}>
            ‹
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {MONTH_NAMES[calMonth]} {calYear}
            </div>
            <div style={{ fontSize: 11, marginTop: 3, color: mPnl >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{mTrades.length > 0 ? `${f$(mPnl)} · ${mTrades.length} trades · ${mWr}% WR` : "No trades this month"}</div>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 9, color: "#94a3b8", padding: "4px 0" }}>
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
                    background: c.pnl !== null ? (c.pnl > 0 ? "rgba(22,163,74,.13)" : "rgba(220,38,38,.13)") : c.hasNote ? "rgba(91,82,224,.07)" : "#f8fafc",
                    border: c.key === todayKey ? "2px solid #5b52e0" : `1px solid ${c.pnl !== null ? (c.pnl > 0 ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)") : c.hasNote ? "rgba(91,82,224,.25)" : "#e2e8f0"}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: c.key === todayKey ? "700" : "400", color: c.key === todayKey ? "#5b52e0" : c.count > 0 ? "#475569" : c.hasNote ? "#64748b" : "#94a3b8" }}>{c.day}</div>
                  {c.pnl !== null && (
                    <div style={{ fontSize: 10, color: c.pnl >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600, marginTop: 2 }}>
                      {c.pnl >= 0 ? "+" : "-"}${Math.abs(c.pnl).toFixed(0)}
                    </div>
                  )}
                  {c.count > 0 && (
                    <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{c.count}T</div>
                  )}
                  {c.hasNote && c.count === 0 && <div style={{ fontSize: 10, color: "#5b52e0", marginTop: 2 }}>📝</div>}
                </div>
              )
            )}
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 10, color: "#94a3b8" }}>Click any day to view trades or add a note</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { l: "Avg Daily", v: `$${avg(byDay)}`, c: parseFloat(avg(byDay)) >= 0 ? "#16a34a" : "#dc2626" },
          { l: "Avg Weekly", v: `$${avg(byWeek)}`, c: parseFloat(avg(byWeek)) >= 0 ? "#16a34a" : "#dc2626" },
          { l: "Avg Monthly", v: `$${avg(byMonth)}`, c: parseFloat(avg(byMonth)) >= 0 ? "#16a34a" : "#dc2626" },
        ].map((s) => (
          <div key={s.l} className="sc" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{s.l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>Recent Trades — {MONTH_NAMES[calMonth]}</div>
      {mTrades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#e2e8f0" }}>
          <div style={{ fontSize: 36 }}>📋</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>No trades in {MONTH_NAMES[calMonth]}</div>
        </div>
      ) : (
        mTrades.slice(0, 6).map((t) => <TRow key={t.id} trade={t} tags={tags} instrumentMeta={instrumentMeta} onEdit={openEdit} onDelete={deleteTrade} />)
      )}
    </>
  );
}
