import { f$, tPnL } from "../../lib/calc";
import { MONTH_NAMES } from "../../lib/constants";

export default function Analytics({ trades, totalAll, winRate, grossW, grossL, byMonth, setCalYear, setCalMonth, setTab }) {
  const byYear = trades.reduce((acc, t) => {
    const y = t.date.slice(0, 4);
    if (!acc[y]) acc[y] = { pnl: 0, wins: 0, losses: 0, trades: 0, grossW: 0, grossL: 0 };
    const p = tPnL(t);
    acc[y].pnl += p;
    acc[y].trades++;
    if (p > 0) {
      acc[y].wins++;
      acc[y].grossW += p;
    } else if (p < 0) {
      acc[y].losses++;
      acc[y].grossL += Math.abs(p);
    }
    return acc;
  }, {});

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { l: "Total P&L", v: f$(totalAll), c: totalAll >= 0 ? "#00c07a" : "#ef4444" },
          { l: "Win Rate", v: `${winRate}%`, c: "#60a5fa" },
          { l: "Gross Profit", v: `+$${grossW.toFixed(0)}`, c: "#00c07a" },
          { l: "Gross Loss", v: `-$${grossL.toFixed(0)}`, c: "#ef4444" },
        ].map((s) => (
          <div key={s.l} className="sc" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 4, textTransform: "uppercase" }}>{s.l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {Object.keys(byYear).length > 0 && (
        <div className="sc" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 12, textTransform: "uppercase" }}>Yearly Performance</div>
          {Object.entries(byYear)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([year, y]) => {
              const yWr = y.trades ? Math.round((y.wins / y.trades) * 100) : 0;
              const yPf = y.grossL > 0 ? (y.grossW / y.grossL).toFixed(2) : "—";
              return (
                <div key={year} style={{ marginBottom: 8 }}>
                  <div
                    style={{ background: "#111827", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={(e) => {
                      const next = e.currentTarget.nextSibling;
                      next.style.display = next.style.display === "none" ? "block" : "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#f9fafb" }}>{year}</span>
                      <span style={{ fontSize: 11, color: "#4b5563" }}>
                        {y.trades} trades · {yWr}% WR · PF {yPf}
                      </span>
                    </div>
                    <span style={{ fontSize: 17, fontWeight: 700, color: y.pnl >= 0 ? "#00c07a" : "#ef4444" }}>{f$(y.pnl)}</span>
                  </div>
                  <div style={{ display: "none", background: "#0d1117", borderRadius: 10, padding: "12px 16px", border: "1px solid #1e2635", marginTop: 2 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3 }}>
                      {Array.from({ length: 12 }, (_, mi) => {
                        const mk2 = `${year}-${String(mi + 1).padStart(2, "0")}`;
                        const mTs = trades.filter((t) => t.date.startsWith(mk2));
                        const mP = mTs.reduce((s, t) => s + tPnL(t), 0);
                        return (
                          <div
                            key={mi}
                            onClick={() => {
                              setCalYear(parseInt(year));
                              setCalMonth(mi);
                              setTab("dashboard");
                            }}
                            style={{ borderRadius: 5, padding: "5px 3px", textAlign: "center", cursor: "pointer", background: mTs.length > 0 ? (mP >= 0 ? "rgba(0,192,122,.13)" : "rgba(239,68,68,.13)") : "#111827", border: `1px solid ${mTs.length > 0 ? (mP >= 0 ? "rgba(0,192,122,.3)" : "rgba(239,68,68,.3)") : "#1e2635"}` }}
                          >
                            <div style={{ fontSize: 9, color: "#4b5563" }}>{MONTH_NAMES[mi].slice(0, 3)}</div>
                            {mTs.length > 0 ? (
                              <div style={{ fontSize: 9, color: mP >= 0 ? "#00c07a" : "#ef4444", fontWeight: 600 }}>
                                {mP >= 0 ? "+" : "-"}${Math.abs(mP).toFixed(0)}
                              </div>
                            ) : (
                              <div style={{ fontSize: 9, color: "#1e2635" }}>—</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <div className="sc" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 10, textTransform: "uppercase" }}>Monthly P&L</div>
        {Object.keys(byMonth).length === 0 ? (
          <div style={{ color: "#374151", fontSize: 12 }}>No data</div>
        ) : (
          Object.entries(byMonth)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([k, v]) => {
              const mTs = trades.filter((t) => t.date.startsWith(k));
              return (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #111827" }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: 11, color: "#374151", marginLeft: 10 }}>{mTs.length} trades</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: v >= 0 ? "#00c07a" : "#ef4444" }}>{f$(v)}</span>
                </div>
              );
            })
        )}
      </div>

      <div className="sc">
        <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 10, textTransform: "uppercase" }}>Mistake Frequency</div>
        {["Over-leveraged", "Moved SL", "Chased entry", "Ignored plan", "Exited early", "Held too long", "Revenge trade"].map((m) => {
          const c = trades.filter((t) => (t.mistakes || []).includes(m)).length;
          return (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: "#6b7280" }}>{m}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 4, width: 80, background: "#111827", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#ef4444", borderRadius: 2, width: `${trades.length ? Math.min(100, (c / trades.length) * 100) : 0}%` }} />
                </div>
                <span style={{ fontSize: 11, color: "#4b5563", minWidth: 16, textAlign: "right" }}>{c}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
