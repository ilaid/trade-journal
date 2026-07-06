import { f$ } from "../../lib/calc";
import { MONTH_NAMES } from "../../lib/constants";
import TRow from "../TRow";
import MonthlyGoal from "../MonthlyGoal";
import EquityCurve from "../charts/EquityCurve";
import DailyPnL from "../charts/DailyPnL";
import WinLoss from "../charts/WinLoss";

const cardTitle = { fontSize: 11, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 };

export default function Dashboard({ trades, goal, onSaveGoal, mPnl, mWr, mTrades, mPf, mAvgRR, calMonth, tags, instrumentMeta, openEdit, deleteTrade }) {
  const allTimePnl = (trades || []).map((t) => (t.exits?.length ? t.exits.reduce((a, l) => a + (l.pnl || 0), 0) : t.pnl || 0)).reduce((a, b) => a + b, 0);

  return (
    <>
      <MonthlyGoal mPnl={mPnl} goal={goal} onSaveGoal={onSaveGoal} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 12 }}>
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

      <div className="sc" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={cardTitle}>Equity Curve · All Time</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: allTimePnl >= 0 ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{f$(allTimePnl)}</span>
        </div>
        <EquityCurve trades={trades || []} />
      </div>

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

      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Recent Trades — {MONTH_NAMES[calMonth]}</div>
      {mTrades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 36 }}>📋</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>No trades in {MONTH_NAMES[calMonth]}</div>
        </div>
      ) : (
        mTrades.slice(0, 6).map((t) => <TRow key={t.id} trade={t} tags={tags} instrumentMeta={instrumentMeta} onEdit={openEdit} onDelete={deleteTrade} />)
      )}
    </>
  );
}
