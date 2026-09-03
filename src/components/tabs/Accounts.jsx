import { useMemo, useState } from "react";
import { BP, BS } from "../../lib/constants";
import { f$ } from "../../lib/calc";
import { accountStats } from "../../lib/accounts";

const BLANK_ACC = {
  name: "", firm: "", size: "", profit_target: "", max_drawdown: "",
  drawdown_type: "trailing", daily_loss_limit: "", daily_loss_pct: "",
  consistency_pct: "", status: "active", start_date: "", notes: "",
};

const STATUSES = [
  ["active", "פעיל"],
  ["passed", "עבר"],
  ["failed", "נכשל"],
  ["archived", "בארכיון"],
];

export default function Accounts({ accounts, trades, todayKey, activeId, onSetActive, onCreate, onUpdate, onDelete, onAdopt }) {
  const [editing, setEditing] = useState(null); // null | "new" | row
  const [f, setF] = useState(BLANK_ACC);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const unassigned = useMemo(() => (trades || []).filter((t) => !t.accountId).length, [trades]);

  const openNew = () => {
    setF(BLANK_ACC);
    setEditing("new");
  };
  const openEdit = (a) => {
    setF({
      ...BLANK_ACC,
      ...a,
      size: a.size ?? "", profit_target: a.profit_target ?? "", max_drawdown: a.max_drawdown ?? "",
      daily_loss_limit: a.daily_loss_limit ?? "", daily_loss_pct: a.daily_loss_pct ?? "",
      consistency_pct: a.consistency_pct ?? "", firm: a.firm ?? "", notes: a.notes ?? "", start_date: a.start_date ?? "",
    });
    setEditing(a);
  };

  const save = async () => {
    if (!f.name.trim() || f.size === "") {
      alert("שם התיק וגודל התיק הם שדות חובה");
      return;
    }
    setBusy(true);
    const payload = { ...f, name: f.name.trim() };
    delete payload.id;
    delete payload.user_id;
    delete payload.created_at;
    try {
      if (editing === "new") await onCreate(payload);
      else await onUpdate(editing.id, payload);
      setEditing(null);
    } catch (e) {
      alert("שמירה נכשלה: " + (e.message || e));
    }
    setBusy(false);
  };

  if (editing) return <AccountForm f={f} set={set} save={save} busy={busy} onCancel={() => setEditing(null)} isNew={editing === "new"} />;

  return (
    <div dir="rtl">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>תיקי מסחר ותוכנית עבודה</span>
        <button style={{ ...BP, padding: "8px 16px", fontSize: 12 }} onClick={openNew}>
          + תיק חדש
        </button>
      </div>

      {unassigned > 0 && (accounts || []).length > 0 && (
        <div className="sc" style={{ marginBottom: 12, background: "#fef3c7", borderColor: "#fcd34d", fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
          יש לך {unassigned} עסקאות שעדיין לא משויכות לאף תיק (מלפני שהוספנו את התכונה). בחר תיק למטה ולחץ "שייך עסקאות ללא תיק".
        </div>
      )}

      {(accounts || []).length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 34 }}>💼</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>אין תיקים עדיין. הגדר תיק כדי לעקוב אחרי הכללים שלך.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {accounts.map((a) => (
            <AccountRow
              key={a.id}
              a={a}
              stats={accountStats(a, (trades || []).filter((t) => t.accountId === a.id), todayKey)}
              isActive={a.id === activeId}
              onSetActive={() => onSetActive(a.id)}
              onEdit={() => openEdit(a)}
              onDelete={() => onDelete(a)}
              unassigned={unassigned}
              onAdopt={() => onAdopt(a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountRow({ a, stats, isActive, onSetActive, onEdit, onDelete, unassigned, onAdopt }) {
  const line = (l, v, c) => (
    <div style={{ minWidth: 96 }}>
      <div style={{ fontSize: 9, color: "#64748b" }}>{l}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: c || "#0f172a", fontVariantNumeric: "tabular-nums" }}>{v}</div>
    </div>
  );
  return (
    <div className="sc" style={{ padding: "14px 16px", borderColor: isActive ? "#5b52e0" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, color: "#0f172a" }}>{a.name}</span>
          {a.firm && <span style={{ fontSize: 10, color: "#94a3b8" }}>{a.firm}</span>}
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#f1f5f9", color: "#64748b" }}>
            {a.drawdown_type === "static" ? "דראודאון קבוע" : "דראודאון עוקב"}
          </span>
          {isActive && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#eef2ff", color: "#5b52e0" }}>פעיל</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isActive && (
            <button className="pill" onClick={onSetActive} style={{ fontSize: 10 }}>
              הפוך לפעיל
            </button>
          )}
          {unassigned > 0 && (
            <button className="pill" onClick={onAdopt} style={{ fontSize: 10, borderColor: "#d97706", color: "#b45309" }}>
              שייך {unassigned} עסקאות ללא תיק
            </button>
          )}
          <button className="pill" onClick={onEdit} style={{ fontSize: 10 }}>
            ערוך
          </button>
          <button onClick={onDelete} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 15 }}>
            ✕
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {line("גודל", f$(stats.size))}
        {line("יתרה", f$(stats.balance), stats.totalPnl >= 0 ? "#16a34a" : "#dc2626")}
        {stats.ddBuffer != null && line("מרווח דראודאון", f$(Math.max(0, stats.ddBuffer)), stats.ddBreached ? "#dc2626" : "#0f172a")}
        {stats.dailyLimit != null && line("מגבלה יומית", f$(stats.dailyLimit))}
        {stats.target != null && line("יעד", `${Math.round(stats.targetPct)}%`, stats.targetHit ? "#16a34a" : "#5b52e0")}
        {line("עסקאות", stats.trades)}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <span className="fl" style={{ display: "block", textAlign: "right" }}>{label}</span>
      {children}
      {hint && <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function AccountForm({ f, set, save, busy, onCancel, isNew }) {
  return (
    <div dir="rtl">
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>{isNew ? "תיק חדש" : "עריכת תיק"}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="שם התיק"><input className="inp" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Lucid 25K" /></Field>
        <Field label="חברה / ברוקר"><input className="inp" value={f.firm} onChange={(e) => set("firm", e.target.value)} placeholder="Lucid" /></Field>
        <Field label="גודל התיק"><input className="inp" type="number" step="any" value={f.size} onChange={(e) => set("size", e.target.value)} placeholder="25000" /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="יעד רווח" hint="לעבור / למשיכה"><input className="inp" type="number" step="any" value={f.profit_target} onChange={(e) => set("profit_target", e.target.value)} placeholder="1500" /></Field>
        <Field label="דראודאון מקסימלי"><input className="inp" type="number" step="any" value={f.max_drawdown} onChange={(e) => set("max_drawdown", e.target.value)} placeholder="1000" /></Field>
        <Field label="סוג דראודאון" hint="עוקב = זז אחרי שיא הרווח">
          <select className="inp" value={f.drawdown_type} onChange={(e) => set("drawdown_type", e.target.value)}>
            <option value="trailing">עוקב (Trailing)</option>
            <option value="static">קבוע (Static)</option>
          </select>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="מגבלת הפסד יומית ($)" hint="אם ריק — יחושב מהאחוז"><input className="inp" type="number" step="any" value={f.daily_loss_limit} onChange={(e) => set("daily_loss_limit", e.target.value)} placeholder="100" /></Field>
        <Field label="או % מהדראודאון" hint="למשל 10 = 10% מהדראודאון"><input className="inp" type="number" step="any" value={f.daily_loss_pct} onChange={(e) => set("daily_loss_pct", e.target.value)} placeholder="10" /></Field>
        <Field label="כלל עקביות (%)" hint="מקס' אחוז מהרווח ביום אחד"><input className="inp" type="number" step="any" value={f.consistency_pct} onChange={(e) => set("consistency_pct", e.target.value)} placeholder="30" /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="תאריך התחלה"><input className="inp" type="date" value={f.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
        <Field label="סטטוס">
          <select className="inp" value={f.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="הערות"><input className="inp" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <button className="pill" onClick={onCancel}>ביטול</button>
        <button style={BS} onClick={save} disabled={busy}>{busy ? "שומר…" : "✓ שמור תיק"}</button>
      </div>
    </div>
  );
}
