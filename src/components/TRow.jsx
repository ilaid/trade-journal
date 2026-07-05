import { tPnL, f$ } from "../lib/calc";
import { EVENTS } from "../lib/constants";

export default function TRow({ trade, tags, instrumentMeta, onEdit, onDelete }) {
  const pnl = tPnL(trade);
  const instColor = instrumentMeta?.[trade.instrument]?.color || "#60a5fa";
  return (
    <div className="tr" onClick={() => onEdit(trade)}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: `${instColor}22`, color: instColor }}>{trade.instrument}</span>
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: trade.direction === "Long" ? "#052e16" : "#3b0d14", color: trade.direction === "Long" ? "#00c07a" : "#ef4444" }}>{trade.direction}</span>
        {trade.isHistorical && <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, background: "#1a120a", color: "#f59e0b", border: "1px solid #92400e55" }}>HIST</span>}
        <span style={{ fontSize: 10, color: "#374151" }}>
          {trade.date} {trade.time}
        </span>
        <span style={{ fontSize: 10, color: "#4b5563" }}>{trade.totalContracts}c</span>
        {trade.screenshotCount > 0 && (
          <span style={{ fontSize: 10, color: "#4b5563" }}>
            📷 {trade.screenshotCount}
          </span>
        )}
        {(trade.tags || []).map((t) => {
          const tag = tags.find((x) => x.name === t);
          return (
            <span key={t} style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, border: `1px solid ${tag?.color || "#3b82f6"}55`, color: tag?.color || "#60a5fa" }}>
              {t}
            </span>
          );
        })}
        {(trade.events || []).map((eid) => {
          const ev = EVENTS.find((e) => e.id === eid);
          return ev ? (
            <span key={eid} style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, background: ev.bg, color: ev.color, border: `1px solid ${ev.color}44` }}>
              {ev.label}
            </span>
          ) : null;
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {trade.rr && <span style={{ fontSize: 10, color: "#4b5563" }}>1:{trade.rr}</span>}
        <span style={{ fontSize: 15, fontWeight: 700, color: pnl >= 0 ? "#00c07a" : "#ef4444", minWidth: 76, textAlign: "right" }}>{f$(pnl)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(trade.id);
          }}
          style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 13, padding: "4px 5px" }}
          onMouseOver={(e) => (e.target.style.color = "#ef4444")}
          onMouseOut={(e) => (e.target.style.color = "#374151")}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
