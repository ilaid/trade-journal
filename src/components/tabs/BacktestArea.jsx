import { useEffect, useState } from "react";
import { tPnL, f$, todayStr } from "../../lib/calc";
import { MONTH_NAMES, BP } from "../../lib/constants";
import { listFolders, createFolder, renameFolder, deleteFolder, getActiveFolder, setActiveFolder } from "../../lib/backtest";
import Calendar from "./Calendar";
import TradesList from "./TradesList";
import DayPopup from "../DayPopup";

// Build the month grid (same shape the Calendar component expects) from a set of trades.
function buildCalDays(folderTrades, dayNotes, year, month) {
  const byDay = {};
  const tByDay = {};
  for (const t of folderTrades) {
    byDay[t.date] = (byDay[t.date] || 0) + tPnL(t);
    (tByDay[t.date] = tByDay[t.date] || []).push(t);
  }
  const first = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const r = [];
  for (let i = 0; i < first; i++) r.push(null);
  for (let d = 1; d <= dim; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    r.push({ key, day: d, pnl: byDay[key] ?? null, count: (tByDay[key] || []).length, hasNote: !!dayNotes?.[key]?.trim() });
  }
  while (r.length % 7 !== 0) r.push(null);
  return r;
}

export default function BacktestArea({ userId, trades, tags, instrumentMeta, dayNotes, onSaveNote, onNewTrade, onEditTrade, onDeleteTrade, onClose }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [activeId, setActiveId] = useState(null); // the "recording" folder
  const [openId, setOpenId] = useState(null); // the folder being viewed
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(null); // {id, name}
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [dayPopup, setDayPopup] = useState(null);
  const [dayNoteVal, setDayNoteVal] = useState("");
  const [folderTab, setFolderTab] = useState("calendar"); // calendar | list

  const refresh = async () => {
    setLoading(true);
    try {
      setFolders(await listFolders(userId));
      setActiveId(await getActiveFolder(userId));
      setNeedsMigration(false);
    } catch {
      setNeedsMigration(true);
    }
    setLoading(false);
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const create = async () => {
    if (!newName.trim()) return;
    try {
      await createFolder(userId, newName);
      setNewName("");
      await refresh();
    } catch {
      setNeedsMigration(true);
    }
  };
  const doRename = async () => {
    if (!renaming?.name.trim()) return;
    await renameFolder(userId, renaming.id, renaming.name);
    setRenaming(null);
    await refresh();
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this folder and ALL its trades?")) return;
    if (activeId === id) await setActiveFolder(userId, null);
    await deleteFolder(userId, id);
    if (openId === id) setOpenId(null);
    await refresh();
  };
  const toggleRecording = async (id) => {
    const next = activeId === id ? null : id;
    setActiveId(next);
    await setActiveFolder(userId, next);
  };

  const openDay = (key) => {
    setDayPopup(key);
    setDayNoteVal(dayNotes?.[key] || "");
  };

  const folderTrades = (id) => trades.filter((t) => t.backtestFolderId === id);
  const summarize = (list) => {
    const pnl = list.reduce((s, t) => s + tPnL(t), 0);
    const wins = list.filter((t) => tPnL(t) > 0).length;
    const wr = list.length ? Math.round((wins / list.length) * 100) : 0;
    return { pnl, wr, count: list.length };
  };

  const openFolder = folders.find((f) => f.id === openId);
  const viewTrades = openFolder ? folderTrades(openFolder.id) : [];
  const navMonth = (delta) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    if (m < 0) {
      m = 11;
      y--;
    }
    setCalMonth(m);
    setCalYear(y);
  };
  const mKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const mTrades = viewTrades.filter((t) => t.date.startsWith(mKey));
  const mSum = summarize(mTrades);
  const totalSum = summarize(viewTrades);

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox" style={{ maxWidth: 900, width: "94%", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {openFolder && (
              <button onClick={() => setOpenId(null)} className="pill">
                ‹ Folders
              </button>
            )}
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{openFolder ? `⏪ ${openFolder.name}` : "⏪ Backtest"}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 24, padding: "4px 8px" }}>
            ×
          </button>
        </div>

        <div style={{ padding: "18px 24px 24px" }}>
          {loading ? (
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "30px 0" }}>Loading…</div>
          ) : needsMigration ? (
            <div className="sc" style={{ background: "#fef3c7", borderColor: "#fcd34d" }}>
              <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
                ⚠️ To enable the Backtest area, run <b>sql/0008_backtest.sql</b> once in your Supabase SQL editor.
              </div>
            </div>
          ) : openFolder ? (
            /* ── Folder view: recording banner + summary + calendar ── */
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <button
                  onClick={() => toggleRecording(openFolder.id)}
                  style={{
                    border: `1px solid ${activeId === openFolder.id ? "#16a34a" : "#e2e8f0"}`,
                    background: activeId === openFolder.id ? "#dcfce7" : "#f8fafc",
                    color: activeId === openFolder.id ? "#16a34a" : "#64748b",
                    borderRadius: 8,
                    padding: "7px 14px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'Inter',system-ui,sans-serif",
                  }}
                >
                  {activeId === openFolder.id ? "● Recording imports here — click to stop" : "○ Record TradingView imports here"}
                </button>
                <button onClick={() => onNewTrade(openFolder.id)} style={{ ...BP, padding: "7px 14px", fontSize: 12 }}>
                  + Add Trade
                </button>
              </div>

              <div className="sc" style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>Total P&L</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: totalSum.pnl >= 0 ? "#16a34a" : "#dc2626", fontFamily: "'Syne',sans-serif" }}>{f$(totalSum.pnl)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>Trades</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", fontFamily: "'Syne',sans-serif" }}>{totalSum.count}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>Win Rate</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", fontFamily: "'Syne',sans-serif" }}>{totalSum.wr}%</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button onClick={() => setFolderTab("calendar")} className="pill" style={folderTab === "calendar" ? { background: "#5b52e0", color: "#fff", borderColor: "#5b52e0" } : {}}>
                  לוח שנה
                </button>
                <button onClick={() => setFolderTab("list")} className="pill" style={folderTab === "list" ? { background: "#5b52e0", color: "#fff", borderColor: "#5b52e0" } : {}}>
                  כל העסקאות ({viewTrades.length})
                </button>
              </div>

              {folderTab === "calendar" ? (
                <Calendar
                  calYear={calYear}
                  calMonth={calMonth}
                  navMonth={navMonth}
                  goToday={() => {
                    setCalYear(now.getFullYear());
                    setCalMonth(now.getMonth());
                  }}
                  isCurMonth={calYear === now.getFullYear() && calMonth === now.getMonth()}
                  calDays={buildCalDays(viewTrades, dayNotes, calYear, calMonth)}
                  todayKey={todayStr()}
                  openDay={openDay}
                  mPnl={mSum.pnl}
                  mTrades={mTrades}
                  mWr={mSum.wr}
                />
              ) : (
                <TradesList trades={viewTrades} tags={tags} instrumentMeta={instrumentMeta} openEdit={onEditTrade} deleteTrade={onDeleteTrade} />
              )}
            </>
          ) : (
            /* ── Folder list ── */
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input className="inp" placeholder="New backtest folder name…" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
                <button onClick={create} style={{ ...BP, padding: "8px 16px", fontSize: 12, whiteSpace: "nowrap" }}>
                  + Create
                </button>
              </div>

              {folders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 34 }}>⏪</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>No backtest folders yet — create one per strategy or period.</div>
                </div>
              ) : (
                folders.map((fld) => {
                  const s = summarize(folderTrades(fld.id));
                  return (
                    <div key={fld.id} className="sc" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      {renaming?.id === fld.id ? (
                        <div style={{ display: "flex", gap: 6, flex: 1 }}>
                          <input className="inp" value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && doRename()} autoFocus />
                          <button onClick={doRename} className="pill">
                            Save
                          </button>
                          <button onClick={() => setRenaming(null)} className="pill">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ cursor: "pointer", flex: 1, minWidth: 180 }} onClick={() => setOpenId(fld.id)}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{fld.name}</span>
                              {activeId === fld.id && <span style={{ fontSize: 10, color: "#16a34a", background: "#dcfce7", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>● REC</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                              {s.count} trades · <span style={{ color: s.pnl >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{f$(s.pnl)}</span> · {s.wr}% WR
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => toggleRecording(fld.id)} className="pill" style={activeId === fld.id ? { background: "#dcfce7", borderColor: "#16a34a", color: "#16a34a" } : {}}>
                              {activeId === fld.id ? "Stop" : "Record"}
                            </button>
                            <button onClick={() => setOpenId(fld.id)} className="pill">
                              Open
                            </button>
                            <button onClick={() => setRenaming({ id: fld.id, name: fld.name })} className="pill">
                              Rename
                            </button>
                            <button onClick={() => remove(fld.id)} style={{ background: "#fee2e2", border: "1px solid #dc2626", borderRadius: 8, color: "#dc2626", cursor: "pointer", fontSize: 12, padding: "6px 10px" }}>
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}

              {activeId && (
                <div style={{ marginTop: 12, fontSize: 11, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", lineHeight: 1.5 }}>
                  ● TradingView imports are currently recording into <b>{folders.find((f) => f.id === activeId)?.name}</b>. Press “Stop” to send imports back to the live journal.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {dayPopup && (
        <DayPopup
          dateKey={dayPopup}
          trades={viewTrades}
          tags={tags}
          instrumentMeta={instrumentMeta}
          userId={userId}
          dayNoteVal={dayNoteVal}
          setDayNoteVal={setDayNoteVal}
          onClose={() => setDayPopup(null)}
          onSaveNote={onSaveNote}
          onDelete={onDeleteTrade}
          onEdit={onEditTrade}
        />
      )}
    </div>
  );
}
