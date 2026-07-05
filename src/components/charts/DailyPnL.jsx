import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { dailySeries, ChartTooltip, GOOD, BAD, GRID, AXIS, moneyShort } from "./chartUtils";

export default function DailyPnL({ trades, height = 220 }) {
  const data = dailySeries(trades);

  if (!data.length) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
        No trades in this period
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={16} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={moneyShort} />
          <ReferenceLine y={0} stroke="#cbd5e1" />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,.12)" }} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={34}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pnl >= 0 ? GOOD : BAD} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
