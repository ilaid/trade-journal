import { useState } from "react";
import { f$ } from "../lib/calc";
import { DIRS, EMO, MIS, EVENTS, BP, BS } from "../lib/constants";
import { extractTradeFromImage } from "../lib/vision";
import ScreenshotUploader from "./ScreenshotUploader";

// Micro symbols map to their parent instrument (+ micro contract) for auto-fill.
const MICRO_MAP = { MNQ: "NQ", MES: "ES", MGC: "GC", MCL: "CL", MYM: "YM", M2K: "RTY", SIL: "SI" };

export default function TradeModal({
  form, set, step, setStep, editId, closing,
  addExit, updateExit, removeExit, contractsOk, usedContracts,
  toggleEvent, toggleTag, toggleMistake,
  tags, CT, INST, totalPnL_form, onClose, onSave,
}) {
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState(null); // {kind:'ok'|'err', text}

  const applyExtracted = (f) => {
    if (f.date) set("date", f.date);
    if (f.time) set("time", f.time);
    if (f.direction === "Long" || f.direction === "Short") set("direction", f.direction);
    if (f.entry != null) set("entryPrice", String(f.entry));
    if (f.stop != null) set("sl", String(f.stop));
    if (f.target != null) set("tp", String(f.target));
    if (f.exit != null) updateExit(0, "exitPrice", String(f.exit));
    if (f.symbol) {
      const sym = String(f.symbol).toUpperCase();
      let instrument = INST.includes(sym) ? sym : null;
      let micro = false;
      if (!instrument && MICRO_MAP[sym] && INST.includes(MICRO_MAP[sym])) {
        instrument = MICRO_MAP[sym];
        micro = true;
      }
      if (instrument) {
        set("instrument", instrument);
        const contracts = CT[instrument] || [];
        const chosen = (micro && contracts.find((c) => c.label.toLowerCase().includes("micro"))) || contracts[0];
        if (chosen) set("contractTypeId", chosen.id);
      }
    }
  };

  const onAiFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAiBusy(true);
    setAiMsg(null);
    try {
      const f = await extractTradeFromImage(file);
      applyExtracted(f);
      setAiMsg({ kind: "ok", text: "מולא מהתמונה. בדוק את השדות והוסף כמות חוזים." });
    } catch (er) {
      setAiMsg({ kind: "err", text: er.message || "לא הצלחתי לקרוא את התמונה" });
    }
    setAiBusy(false);
  };

  return (
    <div className={`overlay${closing ? " cl" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox">
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{editId ? "Edit Trade" : form.isHistorical ? "⏪ Backtest" : "Post-Trade Reflection"}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Step {step} of 4</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div style={{ height: 2, background: "#e2e8f0", margin: "12px 24px 18px" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#5b52e0,#7c3aed)", width: `${(step / 4) * 100}%`, borderRadius: 1, transition: "width .4s" }} />
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          {step === 1 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: aiBusy ? "#94a3b8" : "#5b52e0", cursor: aiBusy ? "default" : "pointer", border: "1px dashed #c7d2fe", borderRadius: 8, padding: "8px 14px", background: "#f5f3ff" }}>
                  {aiBusy ? "קורא את התמונה…" : "📷 מלא מתמונה"}
                  <input type="file" accept="image/*" onChange={onAiFile} disabled={aiBusy} style={{ display: "none" }} />
                </label>
                {aiMsg && <span style={{ fontSize: 11, color: aiMsg.kind === "ok" ? "#16a34a" : "#dc2626" }}>{aiMsg.text}</span>}
              </div>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>Trade Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <span className="fl">Date</span>
                  <input className="inp" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div>
                  <span className="fl">Time</span>
                  <input className="inp" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {INST.map((i) => (
                  <button
                    key={i}
                    className={`pill${form.instrument === i ? " on" : ""}`}
                    onClick={() => {
                      set("instrument", i);
                      set("contractTypeId", (CT[i] || [])[0]?.id || "");
                    }}
                  >
                    {i}
                  </button>
                ))}
                <div style={{ width: 1, background: "#e2e8f0", margin: "0 3px" }} />
                {(CT[form.instrument] || []).map((ct) => (
                  <button key={ct.id} className={`pill${form.contractTypeId === ct.id ? " on" : ""}`} onClick={() => set("contractTypeId", ct.id)}>
                    {ct.label}
                    <span style={{ fontSize: 9, color: "#555", marginLeft: 3 }}>${ct.tv}/tick</span>
                  </button>
                ))}
                <div style={{ width: 1, background: "#e2e8f0", margin: "0 3px" }} />
                {DIRS.map((d) => (
                  <button key={d} className={`pill${form.direction === d ? (d === "Long" ? " g" : " r") : ""}`} onClick={() => set("direction", d)}>
                    {d}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <span className="fl">Entry Price</span>
                  <input className="inp" type="number" step="0.25" value={form.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} placeholder="5000.00" />
                </div>
                <div>
                  <span className="fl">Total Contracts</span>
                  <input className="inp" type="number" min="1" value={form.totalContracts} onChange={(e) => set("totalContracts", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <span className="fl">Stop Loss</span>
                  <input className="inp" type="number" step="0.25" value={form.sl} onChange={(e) => set("sl", e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <span className="fl">Take Profit</span>
                  <input className="inp" type="number" step="0.25" value={form.tp} onChange={(e) => set("tp", e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <span className="fl" style={{ marginBottom: 0 }}>
                    Exits {form.exits.length > 1 && <span style={{ color: "#7c3aed" }}>({form.exits.length} partial)</span>}
                  </span>
                  <button onClick={addExit} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 5, color: "#64748b", cursor: "pointer", fontSize: 11, padding: "3px 10px", fontFamily: "'Inter',system-ui,sans-serif" }}>
                    + Split
                  </button>
                </div>
                {form.exits.map((ex, i) => (
                  <div key={ex.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 30px", gap: 8, alignItems: "end", marginBottom: 7 }}>
                    <div>
                      {i === 0 && <span className="fl">Exit Price</span>}
                      <input className="inp" type="number" step="0.25" value={ex.exitPrice} onChange={(e) => updateExit(i, "exitPrice", e.target.value)} placeholder="5010.00" />
                    </div>
                    <div>
                      {i === 0 && <span className="fl">Contracts</span>}
                      <input className="inp" type="number" min="1" value={ex.contracts} onChange={(e) => updateExit(i, "contracts", e.target.value)} placeholder="1" />
                    </div>
                    <div style={{ paddingTop: i === 0 ? 18 : 0 }}>
                      {form.exits.length > 1 && (
                        <button onClick={() => removeExit(i)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, padding: "7px 2px" }}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!contractsOk && form.exits.length > 1 && (
                  <div style={{ fontSize: 10, color: "#d97706" }}>
                    ⚠ Exits ({usedContracts}) ≠ Total ({form.totalContracts})
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { l: "P&L", v: totalPnL_form !== 0 ? f$(totalPnL_form) : "—", c: totalPnL_form === 0 ? "#94a3b8" : totalPnL_form > 0 ? "#16a34a" : "#dc2626" },
                  { l: "R:R", v: form.rr !== null ? `1:${form.rr}` : "—", c: form.rr === null ? "#94a3b8" : form.rr >= 1 ? "#16a34a" : "#dc2626" },
                ].map((s) => (
                  <div key={s.l} style={{ background: "#f1f5f9", border: `1px solid ${s.c}33`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{s.l}</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: s.c }}>{s.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <span className="fl" style={{ marginBottom: 7 }}>
                  Economic Events
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {EVENTS.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => toggleEvent(ev.id)}
                      style={{ padding: "5px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: "'Inter',system-ui,sans-serif", border: `1px solid ${form.events.includes(ev.id) ? ev.color : "#e2e8f0"}`, background: form.events.includes(ev.id) ? ev.bg : "transparent", color: form.events.includes(ev.id) ? ev.color : "#555" }}
                      title={ev.desc}
                    >
                      {ev.label}
                    </button>
                  ))}
                </div>
              </div>
              <span className="fl" style={{ marginBottom: 7 }}>
                Setup Tags
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${form.tags.includes(tag.name) ? tag.color : "#e2e8f0"}`, background: form.tags.includes(tag.name) ? `${tag.color}22` : "transparent", color: form.tags.includes(tag.name) ? tag.color : "#64748b", cursor: "pointer", fontSize: 11, fontFamily: "'Inter',system-ui,sans-serif" }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 14, textTransform: "uppercase" }}>Psychology</div>
              {[
                { k: "emotion_before", l: "Before entry" },
                { k: "emotion_during", l: "During trade" },
              ].map((f) => (
                <div key={f.k} style={{ marginBottom: 14 }}>
                  <span className="fl">{f.l}</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {EMO.map((e) => (
                      <button key={e} className={`pill${form[f.k] === e ? " on" : ""}`} onClick={() => set(f.k, e)}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <span className="fl">Followed plan?</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className={`pill${form.followed_plan === true ? " g" : ""}`} onClick={() => set("followed_plan", true)}>
                    ✓ Yes
                  </button>
                  <button className={`pill${form.followed_plan === false ? " r" : ""}`} onClick={() => set("followed_plan", false)}>
                    ✗ No
                  </button>
                </div>
              </div>
              <span className="fl">Mistakes</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {MIS.map((m) => (
                  <button key={m} className={`pill${form.mistakes.includes(m) ? " r" : ""}`} onClick={() => toggleMistake(m)}>
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 14, textTransform: "uppercase" }}>Reflection</div>
              {[
                { k: "what_went_well", l: "✅ What went well?", p: "Execution, patience…" },
                { k: "what_to_improve", l: "📈 What to improve?", p: "Timing, sizing…" },
                { k: "notes", l: "📝 Notes", p: "Market context…" },
              ].map((f) => (
                <div key={f.k} style={{ marginBottom: 12 }}>
                  <span className="fl">{f.l}</span>
                  <textarea className="inp ta" value={form[f.k]} onChange={(e) => set(f.k, e.target.value)} placeholder={f.p} />
                </div>
              ))}
              {editId ? (
                <div style={{ marginTop: 16 }}>
                  <span className="fl">📷 Chart Screenshots</span>
                  <ScreenshotUploader tradeId={editId} />
                </div>
              ) : (
                <div style={{ marginTop: 16, fontSize: 11, color: "#94a3b8" }}>Save this trade first, then reopen it to attach chart screenshots.</div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>Review & Save</div>
              <div style={{ background: "#f1f5f9", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  {[
                    ["Date/Time", `${form.date} ${form.time}`],
                    ["Instrument", form.instrument],
                    ["Contract", (CT[form.instrument] || []).find((c) => c.id === form.contractTypeId)?.label || ""],
                    ["Direction", form.direction],
                    ["Entry", form.entryPrice || "—"],
                    ["Contracts", form.totalContracts],
                    ["P&L", totalPnL_form !== 0 ? f$(totalPnL_form) : "—"],
                    ["R:R", form.rr !== null ? `1:${form.rr}` : "—"],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{l}</div>
                      <div style={{ fontSize: 12, color: "#1a1c2e", fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {form.exits.filter((e) => e.exitPrice).length > 0 && (
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>EXITS</div>
                    {form.exits
                      .filter((e) => e.exitPrice)
                      .map((l, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "#64748b" }}>
                            Exit {i + 1}: @{l.exitPrice} × {l.contracts}c
                          </span>
                          <span style={{ color: (l.pnl || 0) >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{f$(l.pnl || 0)}</span>
                        </div>
                      ))}
                  </div>
                )}
                {form.events.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #e2e8f0", marginBottom: 8 }}>
                    {form.events.map((eid) => {
                      const ev = EVENTS.find((e) => e.id === eid);
                      return ev ? (
                        <span key={eid} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: ev.bg, color: ev.color, border: `1px solid ${ev.color}44` }}>
                          {ev.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                {form.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
                    {form.tags.map((t) => {
                      const tag = tags.find((x) => x.name === t);
                      return (
                        <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: `1px solid ${tag?.color || "#5b52e0"}`, color: tag?.color || "#5b52e0", background: `${tag?.color || "#5b52e0"}15` }}>
                          {t}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            {step > 1 ? (
              <button className="pill" onClick={() => setStep((s) => s - 1)}>
                ← Back
              </button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <button style={BP} onClick={() => setStep((s) => s + 1)}>
                Continue →
              </button>
            ) : (
              <button style={BS} onClick={onSave}>
                ✓ Save Trade
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
