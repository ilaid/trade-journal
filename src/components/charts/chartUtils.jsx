import { tPnL } from "../../lib/calc";

export const GOOD = "#16a34a";
export const BAD = "#dc2626";
export const ACCENT = "#5b52e0";
export const GRID = "#e8ecf1";
export const AXIS = "#94a3b8";

export const money = (v) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export const moneyShort = (v) => `${v >= 0 ? "" : "-"}$${Math.abs(v) >= 1000 ? (Math.abs(v) / 1000).toFixed(1) + "k" : Math.abs(v).toFixed(0)}`;

const fmtDay = (d) => {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

// Cumulative end-of-day equity across a set of trades.
export function equitySeries(trades) {
  const byDay = {};
  trades.forEach((t) => {
    byDay[t.date] = (byDay[t.date] || 0) + tPnL(t);
  });
  const days = Object.keys(byDay).sort();
  let running = 0;
  const pts = days.map((d) => {
    running += byDay[d];
    return { date: d, label: fmtDay(d), equity: parseFloat(running.toFixed(2)) };
  });
  // seed a zero point so the area starts at the baseline
  if (pts.length) pts.unshift({ date: "", label: "", equity: 0 });
  return pts;
}

// Per-day P&L bars.
export function dailySeries(trades) {
  const byDay = {};
  trades.forEach((t) => {
    byDay[t.date] = (byDay[t.date] || 0) + tPnL(t);
  });
  return Object.keys(byDay)
    .sort()
    .map((d) => ({ date: d, label: fmtDay(d), pnl: parseFloat(byDay[d].toFixed(2)) }));
}

// Win/loss counts + streak analysis (ordered by date/time).
export function winLossStats(trades) {
  const ordered = [...trades].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  let wins = 0,
    losses = 0,
    be = 0;
  let curType = null,
    curLen = 0,
    maxWin = 0,
    maxLoss = 0;
  ordered.forEach((t) => {
    const p = tPnL(t);
    const type = p > 0 ? "w" : p < 0 ? "l" : "be";
    if (type === "w") wins++;
    else if (type === "l") losses++;
    else be++;
    if (type === "be") return;
    if (type === curType) curLen++;
    else {
      curType = type;
      curLen = 1;
    }
    if (curType === "w") maxWin = Math.max(maxWin, curLen);
    else maxLoss = Math.max(maxLoss, curLen);
  });
  const currentStreak = curType ? { type: curType, len: curLen } : null;
  return { wins, losses, be, maxWin, maxLoss, currentStreak };
}

export function ChartTooltip({ active, payload, label, valueKey = "value", prefix = "" }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", boxShadow: "0 6px 20px rgba(15,23,42,.12)", fontSize: 12 }}>
      {label ? <div style={{ color: "#94a3b8", marginBottom: 3, fontVariantNumeric: "tabular-nums" }}>{label}</div> : null}
      <div style={{ fontWeight: 700, color: v >= 0 ? GOOD : BAD, fontVariantNumeric: "tabular-nums" }}>
        {prefix}
        {money(v)}
      </div>
    </div>
  );
}
