import { tPnL, todayStr } from "./calc";

export function exportCSV(trades) {
  const h = ["Date", "Time", "Instrument", "Contract", "Direction", "Entry", "Contracts", "SL", "TP", "P&L", "RR", "Tags", "Events", "EmotionBefore", "EmotionDuring", "FollowedPlan", "Mistakes", "Notes"];
  const rows = trades.map((t) => [
    t.date,
    t.time || "",
    t.instrument,
    t.contractTypeId || "",
    t.direction,
    t.entryPrice,
    t.totalContracts,
    t.sl || "",
    t.tp || "",
    tPnL(t).toFixed(2),
    t.rr || "",
    (t.tags || []).join(";"),
    (t.events || []).join(";"),
    t.emotion_before || "",
    t.emotion_during || "",
    t.followed_plan === null ? "" : t.followed_plan ? "Yes" : "No",
    (t.mistakes || []).join(";"),
    (t.notes || "").replace(/\n/g, " "),
  ]);
  const csv = [h, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `trades_${todayStr()}.csv`;
  a.click();
}
