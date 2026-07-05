import { f$, tPnL, avg } from "../../lib/calc";
import { MONTH_NAMES } from "../../lib/constants";

export default function Analytics({ trades, totalAll, winRate, grossW, grossL, byDay, byWeek, byMonth, setCalYear, setCalMonth, setTab }) {
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
          { l: "Total P&L", v: f$(totalAll), c: totalAll >= 0 ? "#16a34a" : "#dc2626" },
          { l: "Win Rate", v: `${winRate}%`, c: "#5b52e0" },
          { l: "Gross Profit", v: `+$${grossW.toFixed(0)}`, c: "#16a34a" },
          { l: "Gross Loss", v: `-$${grossL.toFixed(0)}`, c: "#dc2626" },
        ].map((s) => (
          <div key={s.l} className="sc" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>{s.l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { l: "Avg Daily", v: `$${avg(byDay || {})}`, c: parseFloat(avg(byDay || {})) >= 0 ? "#16a34a" : "#dc2626" },
          { l: "Avg Weekly", v: `$${avg(byWeek || {})}`, c: parseFloat(avg(byWeek || {})) >= 0 ? "#16a34a" : "#dc2626" },
          { l: "Avg Monthly", v: `$${avg(byMonth || {})}`, c: parseFloat(avg(byMonth || {})) >= 0 ? "#16a34a" : "#dc2626" },
        ].map((s) => (
          <div key={s.l} className="sc" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>{s.l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {Object.keys(byYear).length > 0 && (
        <div className="sc" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>Yearly Performance</div>
          {Object.entries(byYear)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([year, y]) => {
              const yWr = y.trades ? Math.round((y.wins / y.trades) * 100) : 0;
              const yPf = y.grossL > 0 ? (y.grossW / y.grossL).toFixed(2) : "—";
              return (
                <div key={year} style={{ marginBottom: 8 }}>
                  <div
                    style={{ background: "#f1f5f9", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={(e) => {
                      const next = e.currentTarget.nextSibling;
                      next.style.display = next.style.display === "none" ? "block" : "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{year}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {y.trades} trades · {yWr}% WR · PF {yPf}
                      </span>
                    </div>
                    <span style={{ fontSize: 17, fontWeight: 700, color: y.pnl >= 0 ? "#16a34a" : "#dc2626" }}>{f$(y.pnl)}</span>
                  </div>
                  <div style={{ display: "none", background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #e2e8f0", marginTop: 2 }}>
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
                            style={{ borderRadius: 5, padding: "5px 3px", textAlign: "center", cursor: "pointer", background: mTs.length > 0 ? (mP >= 0 ? "rgba(22,163,74,.13)" : "rgba(220,38,38,.13)") : "#f1f5f9", border: `1px solid ${mTs.length > 0 ? (mP >= 0 ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)") : "#e2e8f0"}` }}
                          >
                            <div style={{ fontSize: 9, color: "#64748b" }}>{MONTH_NAMES[mi].slice(0, 3)}</div>
                            {mTs.length > 0 ? (
                              <div style={{ fontSize: 9, color: mP >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                                {mP >= 0 ? "+" : "-"}${Math.abs(mP).toFixed(0)}
                              </div>
                            ) : (
                              <div style={{ fontSize: 9, color: "#e2e8f0" }}>—</div>
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
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10, textTransform: "uppercase" }}>Monthly P&L</div>
        {Object.keys(byMonth).length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 12 }}>No data</div>
        ) : (
          Object.entries(byMonth)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([k, v]) => {
              const mTs = trades.filter((t) => t.date.startsWith(k));
              return (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 10 }}>{mTs.length} trades</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: v >= 0 ? "#16a34a" : "#dc2626" }}>{f$(v)}</span>
                </div>
              );
            })
        )}
      </div>

      <div className="sc">
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10, textTransform: "uppercase" }}>Mistake Frequency</div>
        {["Over-leveraged", "Moved SL", "Chased entry", "Ignored plan", "Exited early", "Held too long", "Revenge trade"].map((m) => {
          const c = trades.filter((t) => (t.mistakes || []).includes(m)).length;
          return (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>{m}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 4, width: 80, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#dc2626", borderRadius: 2, width: `${trades.length ? Math.min(100, (c / trades.length) * 100) : 0}%` }} />
                </div>
                <span style={{ fontSize: 11, color: "#64748b", minWidth: 16, textAlign: "right" }}>{c}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
