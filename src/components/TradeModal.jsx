import { f$ } from "../lib/calc";
import { DIRS, EMO, MIS, EVENTS, BP, BS } from "../lib/constants";
import ScreenshotUploader from "./ScreenshotUploader";

export default function TradeModal({
  form, set, step, setStep, editId, closing,
  addExit, updateExit, removeExit, contractsOk, usedContracts,
  toggleEvent, toggleTag, toggleMistake,
  tags, CT, INST, totalPnL_form, onClose, onSave,
}) {
  return (
    <div className={`overlay${closing ? " cl" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox">
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "#f9fafb" }}>{editId ? "Edit Trade" : form.isHistorical ? "⏪ Backtest" : "Post-Trade Reflection"}</div>
            <div style={{ fontSize: 10, color: "#374151", marginTop: 2 }}>Step {step} of 4</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div style={{ height: 2, background: "#1e2635", margin: "12px 24px 18px" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", width: `${(step / 4) * 100}%`, borderRadius: 1, transition: "width .4s" }} />
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          {step === 1 && (
            <>
              <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 12, textTransform: "uppercase" }}>Trade Details</div>
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
                <div style={{ width: 1, background: "#1e2635", margin: "0 3px" }} />
                {(CT[form.instrument] || []).map((ct) => (
                  <button key={ct.id} className={`pill${form.contractTypeId === ct.id ? " on" : ""}`} onClick={() => set("contractTypeId", ct.id)}>
                    {ct.label}
                    <span style={{ fontSize: 9, color: "#555", marginLeft: 3 }}>${ct.tv}/tick</span>
                  </button>
                ))}
                <div style={{ width: 1, background: "#1e2635", margin: "0 3px" }} />
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
                    Exits {form.exits.length > 1 && <span style={{ color: "#8b5cf6" }}>({form.exits.length} partial)</span>}
                  </span>
                  <button onClick={addExit} style={{ background: "none", border: "1px solid #1e2635", borderRadius: 5, color: "#6b7280", cursor: "pointer", fontSize: 11, padding: "3px 10px", fontFamily: "'Azeret Mono',monospace" }}>
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
                        <button onClick={() => removeExit(i)} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 14, padding: "7px 2px" }}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!contractsOk && form.exits.length > 1 && (
                  <div style={{ fontSize: 10, color: "#f59e0b" }}>
                    ⚠ Exits ({usedContracts}) ≠ Total ({form.totalContracts})
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { l: "P&L", v: totalPnL_form !== 0 ? f$(totalPnL_form) : "—", c: totalPnL_form === 0 ? "#374151" : totalPnL_form > 0 ? "#00c07a" : "#ef4444" },
                  { l: "R:R", v: form.rr !== null ? `1:${form.rr}` : "—", c: form.rr === null ? "#374151" : form.rr >= 1 ? "#00c07a" : "#ef4444" },
                ].map((s) => (
                  <div key={s.l} style={{ background: "#111827", border: `1px solid ${s.c}33`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#4b5563" }}>{s.l}</span>
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
                      style={{ padding: "5px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: "'Azeret Mono',monospace", border: `1px solid ${form.events.includes(ev.id) ? ev.color : "#1e2635"}`, background: form.events.includes(ev.id) ? ev.bg : "transparent", color: form.events.includes(ev.id) ? ev.color : "#555" }}
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
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${form.tags.includes(tag.name) ? tag.color : "#1e2635"}`, background: form.tags.includes(tag.name) ? `${tag.color}22` : "transparent", color: form.tags.includes(tag.name) ? tag.color : "#4b5563", cursor: "pointer", fontSize: 11, fontFamily: "'Azeret Mono',monospace" }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 14, textTransform: "uppercase" }}>Psychology</div>
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
              <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 14, textTransform: "uppercase" }}>Reflection</div>
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
                <div style={{ marginTop: 16, fontSize: 11, color: "#374151" }}>Save this trade first, then reopen it to attach chart screenshots.</div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 12, textTransform: "uppercase" }}>Review & Save</div>
              <div style={{ background: "#111827", borderRadius: 12, padding: 16, marginBottom: 12 }}>
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
                      <div style={{ fontSize: 9, color: "#4b5563" }}>{l}</div>
                      <div style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {form.exits.filter((e) => e.exitPrice).length > 0 && (
                  <div style={{ borderTop: "1px solid #1e2635", paddingTop: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 6 }}>EXITS</div>
                    {form.exits
                      .filter((e) => e.exitPrice)
                      .map((l, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "#6b7280" }}>
                            Exit {i + 1}: @{l.exitPrice} × {l.contracts}c
                          </span>
                          <span style={{ color: (l.pnl || 0) >= 0 ? "#00c07a" : "#ef4444", fontWeight: 600 }}>{f$(l.pnl || 0)}</span>
                        </div>
                      ))}
                  </div>
                )}
                {form.events.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #1e2635", marginBottom: 8 }}>
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
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #1e2635" }}>
                    {form.tags.map((t) => {
                      const tag = tags.find((x) => x.name === t);
                      return (
                        <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: `1px solid ${tag?.color || "#3b82f6"}`, color: tag?.color || "#60a5fa", background: `${tag?.color || "#3b82f6"}15` }}>
                          {t}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid #111827" }}>
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
