import { useState, useEffect, useCallback } from "react";
import { sb } from "../lib/supabase";
import { DEFAULT_TAGS, TCOLORS, BP } from "../lib/constants";
import { gs, lp, calcRR, todayStr, nowTime, wk, mk, tPnL, be, BLANK } from "../lib/calc";
import { exportCSV } from "../lib/csv";
import { loadInstruments } from "../lib/instruments";
import { deleteAllScreenshotsForTrade } from "../lib/screenshots";
import DayPopup from "./DayPopup";
import TradeModal from "./TradeModal";
import TagModal from "./TagModal";
import ImportModal from "./ImportModal";
import Dashboard from "./tabs/Dashboard";
import TradesList from "./tabs/TradesList";
import Analytics from "./tabs/Analytics";
import Setups from "./tabs/Setups";
import Settings from "./tabs/Settings";

const TRADE_SELECT = `
  id, user_id, is_historical, trade_date, trade_time, instrument_id, contract_id,
  direction, entry_price, total_contracts, stop_loss, take_profit, risk_reward, pnl,
  emotion_before, emotion_during, followed_plan, mistakes, events, what_went_well,
  what_to_improve, notes, source, broker, external_id,
  instruments(symbol),
  trade_exits(id, exit_price, contracts, pnl, exit_order),
  trade_tags(tags(id, name, color))
`;

function hydrateTrade(row) {
  return {
    id: row.id,
    isHistorical: row.is_historical,
    date: row.trade_date,
    time: row.trade_time ? String(row.trade_time).slice(0, 5) : "",
    instrument: row.instruments?.symbol,
    contractTypeId: row.contract_id,
    direction: row.direction,
    entryPrice: String(row.entry_price),
    totalContracts: String(row.total_contracts),
    exits: (row.trade_exits || [])
      .slice()
      .sort((a, b) => a.exit_order - b.exit_order)
      .map((e) => ({ id: e.id, exitPrice: String(e.exit_price), contracts: String(e.contracts), pnl: Number(e.pnl) })),
    sl: row.stop_loss != null ? String(row.stop_loss) : "",
    tp: row.take_profit != null ? String(row.take_profit) : "",
    rr: row.risk_reward != null ? Number(row.risk_reward) : null,
    tags: (row.trade_tags || []).map((tt) => tt.tags?.name).filter(Boolean),
    events: row.events || [],
    emotion_before: row.emotion_before || "",
    emotion_during: row.emotion_during || "",
    followed_plan: row.followed_plan,
    mistakes: row.mistakes || [],
    what_went_well: row.what_went_well || "",
    what_to_improve: row.what_to_improve || "",
    notes: row.notes || "",
    pnl: Number(row.pnl),
    source: row.source,
    broker: row.broker,
    externalId: row.external_id,
  };
}

export default function TradeJournal({ user, onSignOut }) {
  const [trades, setTradesState] = useState([]);
  const [tags, setTagsState] = useState([]);
  const [dayNotes, setDayNotes] = useState({});
  const [CT, setCT] = useState({});
  const [INST, setINST] = useState([]);
  const [instrumentMeta, setInstrumentMeta] = useState({});
  const [dbLoading, setDbLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
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
        const [{ CT: ct, INST: inst, META: meta }, { data: tradeRows, error: tradesErr }, { data: tagRows, error: tagsErr }, { data: noteRows }] = await Promise.all([
          loadInstruments(),
          sb.from("trades").select(TRADE_SELECT).eq("user_id", user.id).order("trade_date", { ascending: false }),
          sb.from("tags").select("*").eq("user_id", user.id).order("name"),
          sb.from("day_notes").select("*").eq("user_id", user.id),
        ]);
        if (tradesErr) throw tradesErr;
        if (tagsErr) throw tagsErr;

        setCT(ct);
        setINST(inst);
        setInstrumentMeta(meta);
        setTradesState((tradeRows || []).map(hydrateTrade));

        if (!tagRows || tagRows.length === 0) {
          const { data: seeded } = await sb
            .from("tags")
            .insert(DEFAULT_TAGS.map((t) => ({ ...t, user_id: user.id })))
            .select();
          setTagsState(seeded || []);
        } else {
          setTagsState(tagRows);
        }

        if (noteRows) {
          const notes = {};
          noteRows.forEach((r) => {
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

  useEffect(() => {
    if (!dbLoading && !form) setForm(BLANK(CT, INST));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbLoading]);

  const tagIdByName = Object.fromEntries(tags.map((t) => [t.name, t.id]));
  const instrumentIdBySymbol = Object.fromEntries(Object.entries(instrumentMeta).map(([sym, m]) => [sym, m.id]));

  const saveTradeToSupabase = async (tradeForm, totalPnL) => {
    setSyncing(true);
    try {
      const payload = {
        p_id: tradeForm.id,
        p_is_historical: tradeForm.isHistorical,
        p_trade_date: tradeForm.date,
        p_trade_time: tradeForm.time || null,
        p_instrument_id: instrumentIdBySymbol[tradeForm.instrument],
        p_contract_id: tradeForm.contractTypeId,
        p_direction: tradeForm.direction,
        p_entry_price: parseFloat(tradeForm.entryPrice),
        p_total_contracts: parseFloat(tradeForm.totalContracts),
        p_stop_loss: tradeForm.sl ? parseFloat(tradeForm.sl) : null,
        p_take_profit: tradeForm.tp ? parseFloat(tradeForm.tp) : null,
        p_risk_reward: tradeForm.rr,
        p_pnl: totalPnL,
        p_emotion_before: tradeForm.emotion_before || null,
        p_emotion_during: tradeForm.emotion_during || null,
        p_followed_plan: tradeForm.followed_plan,
        p_mistakes: tradeForm.mistakes,
        p_events: tradeForm.events,
        p_what_went_well: tradeForm.what_went_well || null,
        p_what_to_improve: tradeForm.what_to_improve || null,
        p_notes: tradeForm.notes || null,
        p_source: tradeForm.source || "manual",
        p_broker: tradeForm.broker || null,
        p_external_id: tradeForm.externalId || null,
        p_exits: tradeForm.exits.filter((e) => e.exitPrice !== "" && e.exitPrice != null).map((e) => ({ exit_price: parseFloat(e.exitPrice), contracts: parseFloat(e.contracts), pnl: e.pnl || 0 })),
        p_tag_ids: (tradeForm.tags || []).map((name) => tagIdByName[name]).filter(Boolean),
      };
      const { error } = await sb.rpc("save_trade", payload);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to save trade:", e);
      throw e;
    } finally {
      setSyncing(false);
    }
  };

  const deleteSupa = async (id) => {
    setSyncing(true);
    try {
      await deleteAllScreenshotsForTrade(id);
      await sb.from("trades").delete().eq("id", id).eq("user_id", user.id);
    } finally {
      setSyncing(false);
    }
  };

  const setTrades = useCallback((fn) => setTradesState((prev) => (typeof fn === "function" ? fn(prev) : fn)), []);

  const addTag = async () => {
    if (!newTag.name.trim()) return;
    const { data, error } = await sb
      .from("tags")
      .insert({ user_id: user.id, name: newTag.name.trim(), color: newTag.color })
      .select()
      .single();
    if (error) {
      console.error("Failed to create tag:", error);
      return;
    }
    setTagsState((ts) => [...ts, data]);
    setNewTag({ name: "", color: TCOLORS[0] });
  };

  const deleteTag = async (id) => {
    setTagsState((ts) => ts.filter((t) => t.id !== id));
    await sb.from("tags").delete().eq("id", id).eq("user_id", user.id);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!form) return;
    const spec = gs(CT, form.instrument, form.contractTypeId);
    const exits = form.exits.map((l) => ({ ...l, pnl: lp(form.entryPrice, l.exitPrice, l.contracts, spec, form.direction) }));
    const rr = calcRR(form.entryPrice, form.sl, form.tp, form.direction);
    setForm((f) => ({ ...f, exits, rr }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.entryPrice, form?.sl, form?.tp, form?.direction, form?.instrument, form?.contractTypeId]);

  const updateExit = (idx, key, val) => {
    const spec = gs(CT, form.instrument, form.contractTypeId);
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
  const totalPnL_form = form ? form.exits.reduce((s, l) => s + (l.pnl || 0), 0) : 0;
  const usedContracts = form ? form.exits.reduce((s, l) => s + (parseFloat(l.contracts) || 0), 0) : 0;
  const contractsOk = !form || usedContracts === 0 || Math.abs(usedContracts - (parseFloat(form.totalContracts) || 0)) < 0.001;

  const openAdd = () => {
    setForm({ ...BLANK(CT, INST), date: todayStr(), time: nowTime() });
    setStep(1);
    setEditId(null);
    setModal("add");
  };
  const openBacktest = () => {
    setForm({ ...BLANK(CT, INST), date: "", time: "", isHistorical: true });
    setStep(1);
    setEditId(null);
    setModal("add");
  };
  const openEdit = (t) => {
    const exits = t.exits?.length > 0 ? t.exits : [{ id: crypto.randomUUID(), exitPrice: t.exitPrice || "", contracts: t.contracts || "", pnl: t.pnl }];
    setForm({ ...BLANK(CT, INST), ...t, exits, tp: t.tp || "", events: t.events || [] });
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
    try {
      await saveTradeToSupabase(trade, totalPnL_form);
    } catch {
      // state already optimistically updated; user sees "syncing" clear without a hard error banner for now
    }
    closeModal();
  };

  const importTrades = async (normalizedRows, broker) => {
    setSyncing(true);
    const imported = [];
    for (const row of normalizedRows) {
      const contract = CT[row.instrument]?.[0];
      if (!contract) continue;
      const spec = contract;
      const pnl = row.pnl ?? lp(row.entryPrice, row.exitPrice, row.contracts, spec, row.direction) ?? 0;
      const tradeId = Date.now() + Math.floor(Math.random() * 1000);
      const trade = {
        id: tradeId,
        isHistorical: true,
        date: row.date,
        time: row.time || "",
        instrument: row.instrument,
        contractTypeId: contract.id,
        direction: row.direction,
        entryPrice: String(row.entryPrice),
        totalContracts: String(row.contracts),
        exits: [{ id: crypto.randomUUID(), exitPrice: String(row.exitPrice), contracts: String(row.contracts), pnl }],
        sl: "",
        tp: "",
        rr: null,
        tags: [],
        events: [],
        emotion_before: "",
        emotion_during: "",
        followed_plan: null,
        mistakes: [],
        what_went_well: "",
        what_to_improve: "",
        notes: row.notes || "",
        pnl,
        source: "import",
        broker,
        externalId: row.externalId,
      };
      try {
        await saveTradeToSupabase(trade, pnl);
        imported.push(trade);
      } catch (e) {
        console.error("Import row failed:", row, e);
      }
    }
    setTrades((ts) => [...imported, ...ts].sort((a, b) => b.date.localeCompare(a.date) || (b.time || "").localeCompare(a.time || "")));
    setSyncing(false);
    return imported.length;
  };

  const deleteTrade = async (id) => {
    setTrades((ts) => ts.filter((t) => t.id !== id));
    await deleteSupa(id);
  };
  const toggleMistake = (m) => set("mistakes", form.mistakes.includes(m) ? form.mistakes.filter((x) => x !== m) : [...form.mistakes, m]);
  const toggleTag = (name) => set("tags", form.tags.includes(name) ? form.tags.filter((x) => x !== name) : [...form.tags, name]);
  const toggleEvent = (eid) => set("events", form.events.includes(eid) ? form.events.filter((x) => x !== eid) : [...form.events, eid]);

  const saveDayNote = async (date, note) => {
    const updated = { ...dayNotes };
    if (note.trim()) updated[date] = note.trim();
    else delete updated[date];
    setDayNotes(updated);
    if (note.trim()) await sb.from("day_notes").upsert({ user_id: user.id, date, note: note.trim() });
    else await sb.from("day_notes").delete().eq("user_id", user.id).eq("date", date);
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

  if (dbLoading || !form) {
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
          <button onClick={() => setModal("import")} style={{ background: "#111827", border: "1px solid #1e2635", borderRadius: 7, color: "#6b7280", padding: "7px 11px", cursor: "pointer", fontSize: 11, fontFamily: "'Azeret Mono',monospace" }}>
            ↑ Import
          </button>
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
            instrumentMeta={instrumentMeta}
            openEdit={openEdit}
            deleteTrade={deleteTrade}
          />
        )}

        {tab === "trades" && <TradesList trades={trades} tags={tags} instrumentMeta={instrumentMeta} openEdit={openEdit} deleteTrade={deleteTrade} />}

        {tab === "stats" && <Analytics trades={trades} totalAll={totalAll} winRate={winRate} grossW={grossW} grossL={grossL} byMonth={byMonth} setCalYear={setCalYear} setCalMonth={setCalMonth} setTab={setTab} />}

        {tab === "tags" && <Setups tagStats={tagStats} setModal={setModal} deleteTag={deleteTag} />}

        {tab === "settings" && <Settings trades={trades} user={user} setTrades={setTrades} sb={sb} CT={CT} INST={INST} instrumentMeta={instrumentMeta} userId={user.id} onInstrumentsChanged={(ct, inst, meta) => { setCT(ct); setINST(inst); setInstrumentMeta(meta); }} />}
      </div>

      {dayPopup && (
        <DayPopup dateKey={dayPopup} trades={trades} tags={tags} instrumentMeta={instrumentMeta} dayNoteVal={dayNoteVal} setDayNoteVal={setDayNoteVal} onClose={closeDay} onSaveNote={saveDayNote} onDelete={deleteTrade} onEdit={openEdit} />
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
          CT={CT}
          INST={INST}
          totalPnL_form={totalPnL_form}
          onClose={closeModal}
          onSave={saveTrade}
        />
      )}

      {modal === "tag" && <TagModal newTag={newTag} setNewTag={setNewTag} onCreate={addTag} onClose={() => setModal(null)} />}

      {modal === "import" && <ImportModal CT={CT} existingTrades={trades} onImport={importTrades} onClose={() => setModal(null)} />}
    </div>
  );
}
