import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { equitySeries, ChartTooltip, ACCENT, GOOD, BAD, GRID, AXIS, moneyShort } from "./chartUtils";

export default function EquityCurve({ trades, height = 240 }) {
  const data = equitySeries(trades);
  const last = data.length ? data[data.length - 1].equity : 0;
  const up = last >= 0;
  const stroke = up ? GOOD : BAD;

  if (data.length <= 1) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
        No trades yet — your equity curve will grow here
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={moneyShort} />
          <ReferenceLine y={0} stroke="#cbd5e1" />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="equity" stroke={stroke} strokeWidth={2} fill="url(#eqFill)" dot={false} activeDot={{ r: 4, fill: stroke, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
