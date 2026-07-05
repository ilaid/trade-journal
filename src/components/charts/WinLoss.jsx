import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { winLossStats, GOOD, BAD } from "./chartUtils";

export default function WinLoss({ trades, height = 220 }) {
  const { wins, losses, be, maxWin, maxLoss, currentStreak } = winLossStats(trades);
  const total = wins + losses;
  const wr = total ? Math.round((wins / total) * 100) : 0;
  const data = total ? [{ name: "Wins", value: wins }, { name: "Losses", value: losses }] : [{ name: "none", value: 1 }];
  const colors = total ? [GOOD, BAD] : ["#e2e8f0"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, height, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={52} outerRadius={72} startAngle={90} endAngle={-270} paddingAngle={total ? 2 : 0} stroke="#ffffff" strokeWidth={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{total ? `${wr}%` : "—"}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Win Rate</div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 150 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: GOOD, display: "inline-block" }} />
          <span style={{ fontSize: 13, color: "#334155" }}>Wins</span>
          <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: GOOD, fontVariantNumeric: "tabular-nums" }}>{wins}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: BAD, display: "inline-block" }} />
          <span style={{ fontSize: 13, color: "#334155" }}>Losses</span>
          <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: BAD, fontVariantNumeric: "tabular-nums" }}>{losses}</span>
        </div>
        {be > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: "#94a3b8", display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "#334155" }}>Break-even</span>
            <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{be}</span>
          </div>
        )}
        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 8, paddingTop: 8, display: "flex", gap: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase" }}>Best streak</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: GOOD }}>{maxWin}W</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase" }}>Worst streak</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: BAD }}>{maxLoss}L</div>
          </div>
          {currentStreak && (
            <div>
              <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase" }}>Current</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: currentStreak.type === "w" ? GOOD : BAD }}>
                {currentStreak.len}
                {currentStreak.type === "w" ? "W" : "L"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
