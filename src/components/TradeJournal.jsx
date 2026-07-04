import { useState, useEffect, useCallback } from "react";
import { sb } from "../lib/supabase";
import { INIT_TAGS, TCOLORS, BP } from "../lib/constants";
import { gs, lp, calcRR, todayStr, nowTime, wk, mk, tPnL, be, BLANK } from "../lib/calc";
import { exportCSV } from "../lib/csv";
import DayPopup from "./DayPopup";
import TradeModal from "./TradeModal";
import TagModal from "./TagModal";
import Dashboard from "./tabs/Dashboard";
import TradesList from "./tabs/TradesList";
import Analytics from "./tabs/Analytics";
import Setups from "./tabs/Setups";
import Settings from "./tabs/Settings";

export default function TradeJournal({ user, onSignOut }) {
  const [trades, setTradesState] = useState([]);
  const [tags, setTagsState] = useState(INIT_TAGS);
  const [dayNotes, setDayNotes] = useState({});
  const [dbLoading, setDbLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [step, setStep] = useState(1);
  const [closing, setClosing] = useState(false);
  const [newTag, setNewTag] = useState({ name: "", color: TCOLORS[0] });
  const [editId, setEditId] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [dayPopup, setDayPopup] = useState(null);
  const [dayNoteVal, setDayNoteVal] = useState("");

  useEffect(() => {
    const load = async () => {
      setDbLoading(true);
      try {
        const [{ data: tData }, { data: tagData }, { data: noteData }] = await Promise.all([
          sb.from("trades").select("*").eq("user_id", user.id).order("id", { ascending: false }),
          sb.from("tags").select("*").eq("user_id", user.id).single(),
          sb.from("day_notes").select("*").eq("user_id", user.id),
        ]);
        if (tData) setTradesState(tData.map((r) => r.data));
        if (tagData) setTagsState(tagData.data);
        if (noteData) {
          const notes = {};
          noteData.forEach((r) => {
            notes[r.date] = r.note;
          });
          setDayNotes(notes);
        }
      } catch (e) {
        console.error(e);
      }
      setDbLoading(false);
    };
    load();
  }, [user.id]);

  const upsertTrade = async (trade) => {
    setSyncing(true);
    await sb.from("trades").upsert({ id: trade.id, user_id: user.id, data: trade });
    setSyncing(false);
  };
  const deleteSupa = async (id) => {
    setSyncing(true);
    await sb.from("trades").delete().eq("id", id).eq("user_id", user.id);
    setSyncing(false);
  };
  const syncTags = async (newTags) => {
    await sb.from("tags").upsert({ user_id: user.id, data: newTags, updated_at: new Date().toISOString() });
  };
  const syncNote = async (date, note) => {
    if (note) await sb.from("day_notes").upsert({ user_id: user.id, date, note });
    else await sb.from("day_notes").delete().eq("user_id", user.id).eq("date", date);
  };

  const setTrades = useCallback((fn) => setTradesState((prev) => (typeof fn === "function" ? fn(prev) : fn)), []);
  const setTags = useCallback(
    (fn) =>
      setTagsState((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        syncTags(next);
        return next;
      }),
    []
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const spec = gs(form.instrument, form.contractTypeId);
    const exits = form.exits.map((l) => ({ ...l, pnl: lp(form.entryPrice, l.exitPrice, l.contracts, spec, form.direction) }));
    const rr = calcRR(form.entryPrice, form.sl, form.tp, form.direction);
    setForm((f) => ({ ...f, exits, rr }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.entryPrice, form.sl, form.tp, form.direction, form.instrument, form.contractTypeId]);

  const updateExit = (idx, key, val) => {
    const spec = gs(form.instrument, form.contractTypeId);
    setForm((f) => {
      const exits = f.exits.map((l, i) => {
        if (i !== idx) return l;
        const u = { ...l, [key]: val };
        u.pnl = lp(f.entryPrice, u.exitPrice, u.contracts, spec, f.direction);
        return u;
      });
      return { ...f, exits };
    });
  };
  const addExit = () => setForm((f) => ({ ...f, exits: [...f.exits, be()] }));
  const removeExit = (idx) => setForm((f) => ({ ...f, exits: f.exits.filter((_, i) => i !== idx) }));
  const totalPnL_form = form.exits.reduce((s, l) => s + (l.pnl || 0), 0);
  const usedContracts = form.exits.reduce((s, l) => s + (parseFloat(l.contracts) || 0), 0);
  const contractsOk = usedContracts === 0 || Math.abs(usedContracts - (parseFloat(form.totalContracts) || 0)) < 0.001;

  const openAdd = () => {
    setForm({ ...BLANK(), date: todayStr(), time: nowTime() });
    setStep(1);
    setEditId(null);
    setModal("add");
  };
  const openBacktest = () => {
    setForm({ ...BLANK(), date: "", time: "", isHistorical: true });
    setStep(1);
    setEditId(null);
    setModal("add");
  };
  const openEdit = (t) => {
    const exits = t.exits?.length > 0 ? t.exits : [{ id: Date.now(), exitPrice: t.exitPrice || "", contracts: t.contracts || "", pnl: t.pnl }];
    setForm({ ...BLANK(), ...t, exits, tp: t.tp || "", events: t.events || [] });
    setStep(1);
    setEditId(t.id);
    setModal("add");
  };
  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setModal(null);
      setClosing(false);
    }, 280);
  };

  const saveTrade = async () => {
    const trade = { ...form, id: editId || Date.now(), pnl: totalPnL_form };
    if (editId) setTrades((ts) => ts.map((t) => (t.id === editId ? trade : t)));
    else setTrades((ts) => [trade, ...ts].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)));
    await upsertTrade(trade);
    closeModal();
  };

  const deleteTrade = async (id) => {
    setTrades((ts) => ts.filter((t) => t.id !== id));
    await deleteSupa(id);
  };
  const toggleMistake = (m) => set("mistakes", form.mistakes.includes(m) ? form.mistakes.filter((x) => x !== m) : [...form.mistakes, m]);
  const toggleTag = (name) => set("tags", form.tags.includes(name) ? form.tags.filter((x) => x !== name) : [...form.tags, name]);
  const toggleEvent = (eid) => set("events", form.events.includes(eid) ? form.events.filter((x) => x !== eid) : [...form.events, eid]);
  const addTag = () => {
    if (!newTag.name.trim()) return;
    setTags((ts) => [...ts, { id: Date.now(), ...newTag }]);
    setNewTag({ name: "", color: TCOLORS[0] });
  };

  const saveDayNote = async (date, note) => {
    const updated = { ...dayNotes };
    if (note.trim()) updated[date] = note.trim();
    else delete updated[date];
    setDayNotes(updated);
    await syncNote(date, note.trim());
  };

  const navMonth = (delta) => {
    let m = calMonth + delta,
      y = calYear;
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

  const pnls = trades.map(tPnL);
  const wins = pnls.filter((p) => p > 0).length;
  const losses = pnls.filter((p) => p < 0).length;
  const totalAll = pnls.reduce((a, b) => a + b, 0);
  const winRate = trades.length ? Math.round((wins / trades.length) * 100) : 0;
  const grossW = pnls.filter((p) => p > 0).reduce((a, b) => a + b, 0);
  const grossL = Math.abs(pnls.filter((p) => p < 0).reduce((a, b) => a + b, 0));
  const byDay = trades.reduce((acc, t) => {
    acc[t.date] = (acc[t.date] || 0) + tPnL(t);
    return acc;
  }, {});
  const byWeek = trades.reduce((acc, t) => {
    const k = wk(t.date);
    acc[k] = (acc[k] || 0) + tPnL(t);
    return acc;
  }, {});
  const byMonth = trades.reduce((acc, t) => {
    const k = mk(t.date);
    acc[k] = (acc[k] || 0) + tPnL(t);
    return acc;
  }, {});
  const tByDay = trades.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  const tagStats = tags
    .map((tag) => {
      const tg = trades.filter((t) => (t.tags || []).includes(tag.name)),
        tw = tg.filter((t) => tPnL(t) > 0).length;
      return { ...tag, count: tg.length, wr: tg.length ? Math.round((tw / tg.length) * 100) : 0, pnl: tg.reduce((s, t) => s + tPnL(t), 0) };
    })
    .sort((a, b) => b.count - a.count);

  const mKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const mTrades = trades.filter((t) => t.date.startsWith(mKey));
  const mPnl = mTrades.reduce((s, t2) => s + tPnL(t2), 0);
  const mWins = mTrades.filter((t2) => tPnL(t2) > 0).length;
  const mWr = mTrades.length ? Math.round((mWins / mTrades.length) * 100) : 0;
  const mRRs = mTrades.filter((t2) => t2.rr);
  const mAvgRR = mRRs.length ? (mRRs.reduce((s, t2) => s + (t2.rr || 0), 0) / mRRs.length).toFixed(2) : "—";
  const mGrossW = mTrades.filter((t2) => tPnL(t2) > 0).reduce((s, t2) => s + tPnL(t2), 0);
  const mGrossL = Math.abs(mTrades.filter((t2) => tPnL(t2) < 0).reduce((s, t2) => s + tPnL(t2), 0));
  const mPf = mGrossL > 0 ? (mGrossW / mGrossL).toFixed(2) : "—";
  const now = new Date();
  const todayKey = todayStr();
  const isCurMonth = calYear === now.getFullYear() && calMonth === now.getMonth();

  const calDays = (() => {
    const r = [],
      first = new Date(calYear, calMonth, 1).getDay(),
      dim = new Date(calYear, calMonth + 1, 0).getDate();
    for (let i = 0; i < first; i++) r.push(null);
    for (let d = 1; d <= dim; d++) {
      const k = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      r.push({ key: k, day: d, pnl: byDay[k] ?? null, count: (tByDay[k] || []).length, hasNote: !!dayNotes[k]?.trim() });
    }
    while (r.length % 7 !== 0) r.push(null);
    return r;
  })();

  const openDay = (dateKey) => {
    setDayPopup(dateKey);
    setDayNoteVal(dayNotes[dateKey] || "");
  };
  const closeDay = () => setDayPopup(null);

  if (dbLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#070a0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Azeret Mono',monospace" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 12px #3b82f6", animation: "pulse 1s infinite" }} />
        <div style={{ fontSize: 11, color: "#374151" }}>Loading your trades...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070a0e", fontFamily: "'Azeret Mono',monospace", color: "#c9d1d9" }}>
      {/* TOP BAR */}
      <div style={{ borderBottom: "1px solid #111827", padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#070a0e", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#f9fafb" }}>TRADE JOURNAL</span>
          {syncing && <span style={{ fontSize: 9, color: "#374151", animation: "pulse 1s infinite" }}>syncing...</span>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {trades.length > 0 && (
            <button onClick={() => exportCSV(trades)} style={{ background: "#111827", border: "1px solid #1e2635", borderRadius: 7, color: "#6b7280", padding: "7px 11px", cursor: "pointer", fontSize: 11, fontFamily: "'Azeret Mono',monospace" }}>
              ↓ CSV
            </button>
          )}
          <span style={{ fontSize: 10, color: "#374151", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
          <button onClick={onSignOut} style={{ background: "none", border: "1px solid #1e2635", borderRadius: 7, color: "#4b5563", padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: "'Azeret Mono',monospace" }}>
            Sign out
          </button>
          <button onClick={openBacktest} style={{ background: "linear-gradient(135deg,#1c1340,#2e1065)", border: "1px solid #7c3aed", borderRadius: 8, color: "#a78bfa", padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "'Azeret Mono',monospace" }}>
            ⏪
          </button>
          <button onClick={openAdd} style={{ ...BP, padding: "7px 14px", fontSize: 11 }}>
            + Trade
          </button>
        </div>
      </div>

      {/* NAV */}
      <div style={{ display: "flex", gap: 2, padding: "10px 24px 0", borderBottom: "1px solid #0d1117", overflowX: "auto" }}>
        {[
          ["dashboard", "📊 Dashboard"],
          ["trades", "📋 Trades"],
          ["stats", "📈 Analytics"],
          ["tags", "🏷️ Setups"],
          ["settings", "⚙️ Settings"],
        ].map(([k, l]) => (
          <button key={k} className={`nt${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: "22px 24px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "dashboard" && (
          <Dashboard
            mPnl={mPnl}
            mWr={mWr}
            mTrades={mTrades}
            mPf={mPf}
            mAvgRR={mAvgRR}
            calYear={calYear}
            calMonth={calMonth}
            navMonth={navMonth}
            goToday={() => {
              setCalYear(now.getFullYear());
              setCalMonth(now.getMonth());
            }}
            isCurMonth={isCurMonth}
            calDays={calDays}
            todayKey={todayKey}
            openDay={openDay}
            byDay={byDay}
            byWeek={byWeek}
            byMonth={byMonth}
            tags={tags}
            openEdit={openEdit}
            deleteTrade={deleteTrade}
          />
        )}

        {tab === "trades" && <TradesList trades={trades} tags={tags} openEdit={openEdit} deleteTrade={deleteTrade} />}

        {tab === "stats" && <Analytics trades={trades} totalAll={totalAll} winRate={winRate} grossW={grossW} grossL={grossL} byMonth={byMonth} setCalYear={setCalYear} setCalMonth={setCalMonth} setTab={setTab} />}

        {tab === "tags" && <Setups tagStats={tagStats} setModal={setModal} setTags={setTags} />}

        {tab === "settings" && <Settings trades={trades} user={user} setTrades={setTrades} sb={sb} />}
      </div>

      {dayPopup && (
        <DayPopup
          dateKey={dayPopup}
          trades={trades}
          tags={tags}
          dayNoteVal={dayNoteVal}
          setDayNoteVal={setDayNoteVal}
          onClose={closeDay}
          onSaveNote={saveDayNote}
          onDelete={deleteTrade}
          onEdit={openEdit}
        />
      )}

      {modal === "add" && (
        <TradeModal
          form={form}
          set={set}
          step={step}
          setStep={setStep}
          editId={editId}
          closing={closing}
          addExit={addExit}
          updateExit={updateExit}
          removeExit={removeExit}
          contractsOk={contractsOk}
          usedContracts={usedContracts}
          toggleEvent={toggleEvent}
          toggleTag={toggleTag}
          toggleMistake={toggleMistake}
          tags={tags}
          totalPnL_form={totalPnL_form}
          onClose={closeModal}
          onSave={saveTrade}
        />
      )}

      {modal === "tag" && <TagModal newTag={newTag} setNewTag={setNewTag} onCreate={addTag} onClose={() => setModal(null)} />}
    </div>
  );
}
