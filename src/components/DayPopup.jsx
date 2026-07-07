import { useEffect, useState } from "react";
import { tPnL, f$ } from "../lib/calc";
import { EVENTS, BP } from "../lib/constants";
import { listScreenshots, uploadScreenshot, getSignedUrl, deleteScreenshot, validateScreenshotFile } from "../lib/screenshots";

// A trade's images, attached straight from the day view (click a date → attach).
// Reuses the per-trade screenshot storage (bucket trade-screenshots, keyed by trade_id).
function TradeImages({ tradeId, userId }) {
  const [shots, setShots] = useState([]);
  const [urls, setUrls] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const s = await listScreenshots(tradeId);
      setShots(s);
      const u = {};
      for (const sc of s) {
        try {
          u[sc.id] = await getSignedUrl(sc.storage_path);
        } catch {
          // skip a broken URL
        }
      }
      setUrls(u);
    } catch {
      // table/bucket missing — hide silently
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateScreenshotFile(file);
    if (err) return alert(err);
    setBusy(true);
    try {
      await uploadScreenshot(userId, tradeId, file);
      await load();
    } catch (er) {
      alert(er.message || "Upload failed");
    }
    setBusy(false);
  };
  const del = async (sc) => {
    if (!window.confirm("Delete this image?")) return;
    setShots((s) => s.filter((x) => x.id !== sc.id));
    try {
      await deleteScreenshot(sc);
    } catch {
      load();
    }
  };

  return (
    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {shots.map((sc) => (
        <div key={sc.id} style={{ position: "relative" }}>
          <img src={urls[sc.id]} alt={sc.file_name} onClick={() => urls[sc.id] && window.open(urls[sc.id], "_blank")} style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0", cursor: "pointer", background: "#f1f5f9" }} />
          <button onClick={() => del(sc)} title="Delete" style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#dc2626", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, lineHeight: "16px", padding: 0 }}>
            ×
          </button>
        </div>
      ))}
      <label style={{ fontSize: 11, color: "#5b52e0", cursor: "pointer", border: "1px dashed #c7d2fe", borderRadius: 6, padding: "6px 10px", background: "#f5f3ff" }}>
        {busy ? "Uploading…" : "📷 Add image"}
        <input type="file" accept="image/*" onChange={onFile} disabled={busy} style={{ display: "none" }} />
      </label>
    </div>
  );
}

export default function DayPopup({ dateKey, trades, tags, instrumentMeta, userId, dayNoteVal, setDayNoteVal, onClose, onSaveNote, onDelete, onEdit }) {
  const dayTrades = trades.filter((t) => t.date === dateKey);
  const dayPnl = dayTrades.reduce((s, t) => s + tPnL(t), 0);
  const d = new Date(dateKey + "T00:00:00");
  const label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox" style={{ maxWidth: 640 }}>
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{label}</div>
            {dayTrades.length > 0 && (
              <div style={{ fontSize: 13, marginTop: 3, color: dayPnl >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                {f$(dayPnl)} · {dayTrades.length} trade{dayTrades.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 24, padding: "4px 8px" }}>
            ×
          </button>
        </div>
        <div style={{ padding: "14px 24px 0" }}>
          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>📝 Day Note</div>
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
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>No trades on this day</div>
          ) : (
            dayTrades.map((t) => {
              const pnl = tPnL(t);
              return (
                <div key={t.id} style={{ background: "#f1f5f9", borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: `${instrumentMeta?.[t.instrument]?.color || "#5b52e0"}22`, color: instrumentMeta?.[t.instrument]?.color || "#5b52e0" }}>{t.instrument}</span>
                      <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: t.direction === "Long" ? "#dcfce7" : "#fee2e2", color: t.direction === "Long" ? "#16a34a" : "#dc2626" }}>{t.direction}</span>
                      <span style={{ fontSize: 11, color: "#555" }}>{t.time || ""}</span>
                      {(t.tags || []).map((x) => {
                        const tag = tags.find((g) => g.name === x);
                        return (
                          <span key={x} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, border: `1px solid ${tag?.color || "#5b52e0"}55`, color: tag?.color || "#5b52e0" }}>
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
                      <span style={{ fontSize: 17, fontWeight: 700, color: pnl >= 0 ? "#16a34a" : "#dc2626" }}>{f$(pnl)}</span>
                      <button
                        onClick={() => {
                          onDelete(t.id);
                          onClose();
                        }}
                        style={{ background: "#fee2e2", border: "1px solid #dc2626", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontSize: 10, padding: "3px 8px", fontFamily: "'Inter',system-ui,sans-serif" }}
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
                        <div style={{ fontSize: 9, color: "#64748b" }}>{l}</div>
                        <div style={{ fontSize: 12, color: "#1a1c2e", fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {t.followed_plan !== null && <div style={{ fontSize: 11, color: t.followed_plan ? "#16a34a" : "#dc2626", marginBottom: 4 }}>Plan: {t.followed_plan ? "✓ Followed" : "✗ Not followed"}</div>}
                  {t.what_went_well && (
                    <div style={{ padding: "7px 10px", background: "#dcfce7", borderRadius: 6, fontSize: 11, color: "#16a34a", marginBottom: 4 }}>✅ {t.what_went_well}</div>
                  )}
                  {t.what_to_improve && (
                    <div style={{ padding: "7px 10px", background: "#fef3c7", borderRadius: 6, fontSize: 11, color: "#d97706", marginBottom: 4 }}>📈 {t.what_to_improve}</div>
                  )}
                  {t.notes && <div style={{ padding: "7px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 11, color: "#64748b" }}>{t.notes}</div>}
                  <TradeImages tradeId={t.id} userId={userId} />
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(t);
                    }}
                    style={{ marginTop: 8, background: "none", border: "1px solid #e2e8f0", borderRadius: 6, color: "#64748b", cursor: "pointer", fontSize: 10, padding: "4px 10px", fontFamily: "'Inter',system-ui,sans-serif" }}
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
