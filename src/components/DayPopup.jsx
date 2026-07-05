import { tPnL, f$ } from "../lib/calc";
import { EVENTS, BP } from "../lib/constants";

export default function DayPopup({ dateKey, trades, tags, instrumentMeta, dayNoteVal, setDayNoteVal, onClose, onSaveNote, onDelete, onEdit }) {
  const dayTrades = trades.filter((t) => t.date === dateKey);
  const dayPnl = dayTrades.reduce((s, t) => s + tPnL(t), 0);
  const d = new Date(dateKey + "T00:00:00");
  const label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox" style={{ maxWidth: 640 }}>
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#f9fafb" }}>{label}</div>
            {dayTrades.length > 0 && (
              <div style={{ fontSize: 13, marginTop: 3, color: dayPnl >= 0 ? "#00c07a" : "#ef4444", fontWeight: 700 }}>
                {f$(dayPnl)} · {dayTrades.length} trade{dayTrades.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 24, padding: "4px 8px" }}>
            ×
          </button>
        </div>
        <div style={{ padding: "14px 24px 0" }}>
          <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>📝 Day Note</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <textarea
              value={dayNoteVal}
              onChange={(e) => setDayNoteVal(e.target.value)}
              placeholder="Observation, missed trade, market note…"
              className="inp ta"
              style={{ flex: 1, minHeight: 60 }}
            />
            <button
              onClick={async () => {
                await onSaveNote(dateKey, dayNoteVal);
                onClose();
              }}
              style={{ ...BP, padding: "10px 14px", fontSize: 11, whiteSpace: "nowrap" }}
            >
              Save
            </button>
          </div>
        </div>
        <div style={{ padding: "14px 24px 22px" }}>
          {dayTrades.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#374151", fontSize: 12 }}>No trades on this day</div>
          ) : (
            dayTrades.map((t) => {
              const pnl = tPnL(t);
              return (
                <div key={t.id} style={{ background: "#111827", borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid #1e2635" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: `${instrumentMeta?.[t.instrument]?.color || "#60a5fa"}22`, color: instrumentMeta?.[t.instrument]?.color || "#60a5fa" }}>{t.instrument}</span>
                      <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: t.direction === "Long" ? "#052e16" : "#3b0d14", color: t.direction === "Long" ? "#00c07a" : "#ef4444" }}>{t.direction}</span>
                      <span style={{ fontSize: 11, color: "#555" }}>{t.time || ""}</span>
                      {(t.tags || []).map((x) => {
                        const tag = tags.find((g) => g.name === x);
                        return (
                          <span key={x} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, border: `1px solid ${tag?.color || "#3b82f6"}55`, color: tag?.color || "#60a5fa" }}>
                            {x}
                          </span>
                        );
                      })}
                      {(t.events || []).map((eid) => {
                        const ev = EVENTS.find((e) => e.id === eid);
                        return ev ? (
                          <span key={eid} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: ev.bg, color: ev.color, border: `1px solid ${ev.color}55` }}>
                            {ev.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: pnl >= 0 ? "#00c07a" : "#ef4444" }}>{f$(pnl)}</span>
                      <button
                        onClick={() => {
                          onDelete(t.id);
                          onClose();
                        }}
                        style={{ background: "#3b0d14", border: "1px solid #ef4444", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 10, padding: "3px 8px", fontFamily: "'Azeret Mono',monospace" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: t.what_went_well || t.notes ? 8 : 0 }}>
                    {[
                      ["Entry", t.entryPrice || "—"],
                      ["Contracts", t.totalContracts],
                      ["R:R", t.rr ? `1:${t.rr}` : "—"],
                      ["SL", t.sl || "—"],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 9, color: "#4b5563" }}>{l}</div>
                        <div style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {t.followed_plan !== null && <div style={{ fontSize: 11, color: t.followed_plan ? "#00c07a" : "#ef4444", marginBottom: 4 }}>Plan: {t.followed_plan ? "✓ Followed" : "✗ Not followed"}</div>}
                  {t.what_went_well && (
                    <div style={{ padding: "7px 10px", background: "#052e16", borderRadius: 6, fontSize: 11, color: "#00c07a", marginBottom: 4 }}>✅ {t.what_went_well}</div>
                  )}
                  {t.what_to_improve && (
                    <div style={{ padding: "7px 10px", background: "#1a120a", borderRadius: 6, fontSize: 11, color: "#f59e0b", marginBottom: 4 }}>📈 {t.what_to_improve}</div>
                  )}
                  {t.notes && <div style={{ padding: "7px 10px", background: "#0d1117", borderRadius: 6, fontSize: 11, color: "#6b7280" }}>{t.notes}</div>}
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(t);
                    }}
                    style={{ marginTop: 8, background: "none", border: "1px solid #1e2635", borderRadius: 6, color: "#4b5563", cursor: "pointer", fontSize: 10, padding: "4px 10px", fontFamily: "'Azeret Mono',monospace" }}
                  >
                    ✏️ Edit
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
