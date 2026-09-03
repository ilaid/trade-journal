import { useMemo } from "react";
import { f$ } from "../lib/calc";
import { accountStats } from "../lib/accounts";

// Live status of the active trading account, shown on the main dashboard:
// which account you're trading, how much you may still lose today, how much
// room is left before the drawdown, and progress toward the profit target.
export default function AccountStatus({ accounts, activeId, onChangeActive, trades, todayKey, onManage }) {
  const account = useMemo(() => (accounts || []).find((a) => a.id === activeId) || null, [accounts, activeId]);
  const stats = useMemo(() => {
    if (!account) return null;
    return accountStats(account, (trades || []).filter((t) => t.accountId === account.id), todayKey);
  }, [account, trades, todayKey]);

  if (!accounts || accounts.length === 0) {
    return (
      <div className="sc" style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>עדיין לא הגדרת תיק מסחר. הגדר גודל תיק, דראודאון ומגבלה יומית כדי לראות מעקב חי.</span>
        <button className="pill" onClick={onManage} style={{ borderColor: "#5b52e0", color: "#5b52e0" }}>
          + הגדר תיק
        </button>
      </div>
    );
  }

  const chip = (label, value, color) => (
    <div style={{ flex: "1 1 120px", minWidth: 110 }}>
      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: color || "#0f172a", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{value}</div>
    </div>
  );

  const alert = stats && (stats.ddBreached || stats.dailyBreached);

  return (
    <div className="sc" style={{ marginBottom: 14, borderColor: alert ? "#dc2626" : undefined, background: alert ? "#fef2f2" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>תיק פעיל</span>
          <select className="inp" style={{ width: "auto", minWidth: 180, padding: "5px 8px" }} value={activeId ?? ""} onChange={(e) => onChangeActive(e.target.value ? Number(e.target.value) : null)}>
            <option value="">— ללא תיק —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.size ? ` · ${Math.round(Number(a.size) / 1000)}K` : ""}
              </option>
            ))}
          </select>
        </div>
        <button className="pill" onClick={onManage} style={{ fontSize: 10 }}>
          נהל תיקים
        </button>
      </div>

      {!stats ? (
        <div style={{ fontSize: 12, color: "#64748b" }}>בחר תיק כדי לראות את המעקב מול תוכנית העבודה.</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {chip("יתרה", f$(stats.balance))}
            {chip("רווח כולל", f$(stats.totalPnl), stats.totalPnl >= 0 ? "#16a34a" : "#dc2626")}
            {chip("היום", f$(stats.todayPnl), stats.todayPnl >= 0 ? "#16a34a" : "#dc2626")}
            {stats.dailyLeft != null && chip("נשאר להפסיד היום", f$(Math.max(0, stats.dailyLeft)), stats.dailyBreached ? "#dc2626" : stats.dailyLeft < (stats.dailyLimit || 0) * 0.34 ? "#d97706" : "#16a34a")}
            {stats.ddBuffer != null && chip("מרווח עד דראודאון", f$(Math.max(0, stats.ddBuffer)), stats.ddBreached ? "#dc2626" : "#0f172a")}
            {stats.target != null && chip("התקדמות ליעד", `${Math.round(stats.targetPct)}%`, stats.targetHit ? "#16a34a" : "#5b52e0")}
          </div>

          {stats.target != null && (
            <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${stats.targetPct}%`, background: stats.targetHit ? "#16a34a" : "linear-gradient(90deg,#5b52e0,#7c3aed)", borderRadius: 3, transition: "width .4s" }} />
            </div>
          )}

          {(alert || stats.consistencyOk === false) && (
            <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.6, color: "#dc2626" }}>
              {stats.dailyBreached && <div>עברת את מגבלת ההפסד היומית. הפסק למסחר היום.</div>}
              {stats.ddBreached && <div>נגמר המרווח עד הדראודאון המקסימלי.</div>}
              {stats.consistencyOk === false && (
                <div style={{ color: "#d97706" }}>
                  כלל עקביות: היום הכי רווחי הוא {Math.round(stats.consistencyPct)}% מהרווח (מותר עד {stats.consistencyLimit}%).
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
