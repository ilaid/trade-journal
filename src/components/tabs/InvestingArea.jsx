import { useEffect, useMemo, useState } from "react";
import { BP, BS } from "../../lib/constants";
import { f$ } from "../../lib/calc";
import { listInvestments, createInvestment, updateInvestment, deleteInvestment, invClosed, invPnL, invReturnPct } from "../../lib/investments";

const ASSETS = [
  ["stock", "מניה"],
  ["etf", "ETF"],
  ["crypto", "קריפטו"],
  ["forex", "מט\"ח"],
];
const HORIZONS = [
  ["", "—"],
  ["swing", "סווינג"],
  ["months", "חודשים"],
  ["long", "טווח ארוך"],
];
const todayStr = () => new Date().toISOString().slice(0, 10);

const BLANK = {
  symbol: "", asset_type: "stock", direction: "Long",
  entry_date: todayStr(), entry_price: "", quantity: "",
  exit_date: "", exit_price: "", fees: "",
  target: "", stop: "", time_horizon: "", conviction: "",
  thesis: "", market_context: "", review: "", tagsText: "", notes: "",
};

const pct = (v) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`);

export default function InvestingArea({ userId, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsMig, setNeedsMig] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | row
  const [f, setF] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listInvestments(userId));
      setNeedsMig(false);
    } catch (e) {
      if (/relation|does not exist|investments/i.test(String(e.message))) setNeedsMig(true);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [userId]);

  const openNew = () => {
    setF(BLANK);
    setEditing("new");
  };
  const openEdit = (row) => {
    setF({
      ...BLANK,
      ...row,
      entry_price: row.entry_price ?? "", quantity: row.quantity ?? "", exit_price: row.exit_price ?? "",
      exit_date: row.exit_date ?? "", fees: row.fees ?? "", target: row.target ?? "", stop: row.stop ?? "",
      conviction: row.conviction ?? "", time_horizon: row.time_horizon ?? "",
      thesis: row.thesis ?? "", market_context: row.market_context ?? "", review: row.review ?? "", notes: row.notes ?? "",
      tagsText: (row.tags || []).join(", "),
    });
    setEditing(row);
  };

  const save = async () => {
    if (!f.symbol.trim() || !f.entry_date || f.entry_price === "") {
      alert("סימבול, תאריך כניסה ומחיר כניסה הם שדות חובה");
      return;
    }
    setSaving(true);
    const payload = { ...f, symbol: f.symbol.trim().toUpperCase(), tags: f.tagsText.split(",").map((s) => s.trim()).filter(Boolean) };
    delete payload.tagsText;
    delete payload.id;
    delete payload.user_id;
    delete payload.created_at;
    try {
      if (editing === "new") await createInvestment(userId, payload);
      else await updateInvestment(userId, editing.id, payload);
      setEditing(null);
      await load();
    } catch (e) {
      alert("שמירה נכשלה: " + (e.message || e));
    }
    setSaving(false);
  };

  const remove = async (row) => {
    if (!confirm(`למחוק את הפוזיציה ${row.symbol}?`)) return;
    await deleteInvestment(userId, row.id);
    await load();
  };

  const summary = useMemo(() => {
    const closed = items.filter(invClosed);
    const totalPnl = closed.reduce((s, r) => s + (invPnL(r) || 0), 0);
    const wins = closed.filter((r) => (invPnL(r) || 0) > 0).length;
    const wr = closed.length ? Math.round((wins / closed.length) * 100) : 0;
    const rets = closed.map(invReturnPct).filter((v) => v != null);
    const avgRet = rets.length ? rets.reduce((s, v) => s + v, 0) / rets.length : null;
    return { totalPnl, wr, avgRet, open: items.length - closed.length, closed: closed.length };
  }, [items]);

  const card = (label, value, color) => (
    <div className="sc" style={{ flex: "1 1 120px", padding: "12px 14px" }}>
      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || "#0f172a", marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox" style={{ maxWidth: 940, width: "94%", maxHeight: "92vh", overflowY: "auto" }} dir="rtl">
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>📈 תיק השקעות</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 24, padding: "4px 8px" }}>
            ×
          </button>
        </div>

        <div style={{ padding: "18px 24px 24px" }}>
          {loading ? (
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "30px 0" }}>טוען…</div>
          ) : needsMig ? (
            <div className="sc" style={{ background: "#fef3c7", borderColor: "#fcd34d" }}>
              <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.7, textAlign: "right" }}>
                כדי להפעיל את אזור ההשקעות, הרץ פעם אחת ב-Supabase SQL editor את הקובץ:
                <br />
                <b>sql/0010_investments.sql</b>
              </div>
            </div>
          ) : editing ? (
            <InvestForm f={f} set={set} save={save} saving={saving} onCancel={() => setEditing(null)} isNew={editing === "new"} />
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {card("רווח ממומש", f$(summary.totalPnl), summary.totalPnl >= 0 ? "#16a34a" : "#dc2626")}
                {card("תשואה ממוצעת", pct(summary.avgRet), summary.avgRet == null ? "#94a3b8" : summary.avgRet >= 0 ? "#16a34a" : "#dc2626")}
                {card("Win Rate", `${summary.wr}%`, "#5b52e0")}
                {card("פתוחות", summary.open, "#0f172a")}
                {card("סגורות", summary.closed, "#0f172a")}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <button style={{ ...BP, padding: "8px 16px", fontSize: 12 }} onClick={openNew}>
                  + פוזיציה חדשה
                </button>
              </div>

              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 34 }}>📈</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>אין עדיין פוזיציות. הוסף את הראשונה.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((r) => (
                    <InvestRow key={r.id} r={r} onEdit={() => openEdit(r)} onDelete={() => remove(r)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestRow({ r, onEdit, onDelete }) {
  const closed = invClosed(r);
  const pnl = invPnL(r);
  const ret = invReturnPct(r);
  return (
    <div className="sc" style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, color: "#0f172a" }}>{r.symbol}</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: r.direction === "Short" ? "#fee2e2" : "#dcfce7", color: r.direction === "Short" ? "#dc2626" : "#16a34a" }}>{r.direction}</span>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>{(ASSETS.find((a) => a[0] === r.asset_type) || [])[1] || r.asset_type}</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: closed ? "#f1f5f9" : "#eef2ff", color: closed ? "#64748b" : "#5b52e0" }}>{closed ? "סגורה" : "פתוחה"}</span>
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
          כניסה {r.entry_date} @ {r.entry_price} × {r.quantity}
          {closed && ` · יציאה ${r.exit_date} @ ${r.exit_price}`}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 700, color: pnl == null ? "#94a3b8" : pnl >= 0 ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{pnl == null ? "—" : f$(pnl)}</div>
          <div style={{ fontSize: 11, color: ret == null ? "#94a3b8" : ret >= 0 ? "#16a34a" : "#dc2626" }}>{pct(ret)}</div>
        </div>
        <button onClick={onEdit} className="pill" style={{ padding: "5px 10px" }}>ערוך</button>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 15 }}>✕</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="fl" style={{ textAlign: "right", display: "block" }}>{label}</span>
      {children}
    </div>
  );
}

function InvestForm({ f, set, save, saving, onCancel, isNew }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14, textAlign: "right" }}>{isNew ? "פוזיציה חדשה" : "עריכת פוזיציה"}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="סימבול / טיקר"><input className="inp" value={f.symbol} onChange={(e) => set("symbol", e.target.value)} placeholder="AAPL" /></Field>
        <Field label="סוג נכס">
          <select className="inp" value={f.asset_type} onChange={(e) => set("asset_type", e.target.value)}>
            {ASSETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="כיוון">
          <select className="inp" value={f.direction} onChange={(e) => set("direction", e.target.value)}>
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="תאריך כניסה"><input className="inp" type="date" value={f.entry_date} onChange={(e) => set("entry_date", e.target.value)} /></Field>
        <Field label="מחיר כניסה"><input className="inp" type="number" step="any" value={f.entry_price} onChange={(e) => set("entry_price", e.target.value)} /></Field>
        <Field label="כמות"><input className="inp" type="number" step="any" value={f.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="תאריך יציאה (ריק = פתוחה)"><input className="inp" type="date" value={f.exit_date} onChange={(e) => set("exit_date", e.target.value)} /></Field>
        <Field label="מחיר יציאה"><input className="inp" type="number" step="any" value={f.exit_price} onChange={(e) => set("exit_price", e.target.value)} /></Field>
        <Field label="עמלות"><input className="inp" type="number" step="any" value={f.fees} onChange={(e) => set("fees", e.target.value)} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="יעד"><input className="inp" type="number" step="any" value={f.target} onChange={(e) => set("target", e.target.value)} /></Field>
        <Field label="סטופ / יציאה מתוכננת"><input className="inp" type="number" step="any" value={f.stop} onChange={(e) => set("stop", e.target.value)} /></Field>
        <Field label="אופק זמן">
          <select className="inp" value={f.time_horizon} onChange={(e) => set("time_horizon", e.target.value)}>
            {HORIZONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="רמת ביטחון (1-5)"><input className="inp" type="number" min="1" max="5" value={f.conviction} onChange={(e) => set("conviction", e.target.value)} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 10 }}>
        <Field label="תזה / למה נכנסתי"><textarea className="inp ta" value={f.thesis} onChange={(e) => set("thesis", e.target.value)} placeholder="הסיבה לכניסה, הקטליזטור…" /></Field>
        <Field label="קונטקסט שוק / מאקרו"><textarea className="inp ta" value={f.market_context} onChange={(e) => set("market_context", e.target.value)} placeholder="מצב השוק, ריבית, סקטור…" /></Field>
        <Field label="ביקורת / מה ללמוד"><textarea className="inp ta" value={f.review} onChange={(e) => set("review", e.target.value)} placeholder="מה עבד, מה לשפר (אחרי סגירה)…" /></Field>
        <Field label="תגיות (מופרדות בפסיק)"><input className="inp" value={f.tagsText} onChange={(e) => set("tagsText", e.target.value)} placeholder="Growth, Dividend, Breakout" /></Field>
        <Field label="הערות"><textarea className="inp ta" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <button className="pill" onClick={onCancel}>ביטול</button>
        <button style={BS} onClick={save} disabled={saving}>{saving ? "שומר…" : "✓ שמור פוזיציה"}</button>
      </div>
    </div>
  );
}
