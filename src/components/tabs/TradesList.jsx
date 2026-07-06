import { useMemo, useState } from "react";
import TRow from "../TRow";
import { tPnL, f$ } from "../../lib/calc";

const emptyFilters = { instrument: "", direction: "", tag: "", from: "", to: "", result: "" };

export default function TradesList({ trades, tags, instrumentMeta, openEdit, deleteTrade }) {
  const [f, setF] = useState(emptyFilters);
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  const active = Object.values(f).some((v) => v);

  const instruments = useMemo(() => Array.from(new Set(trades.map((t) => t.instrument).filter(Boolean))).sort(), [trades]);

  const filtered = useMemo(
    () =>
      trades.filter((t) => {
        if (f.instrument && t.instrument !== f.instrument) return false;
        if (f.direction && t.direction !== f.direction) return false;
        if (f.tag && !(t.tags || []).includes(f.tag)) return false;
        if (f.from && t.date < f.from) return false;
        if (f.to && t.date > f.to) return false;
        if (f.result === "win" && tPnL(t) <= 0) return false;
        if (f.result === "loss" && tPnL(t) >= 0) return false;
        return true;
      }),
    [trades, f]
  );

  const filteredPnl = filtered.reduce((s, t) => s + tPnL(t), 0);
  const sel = { flex: "1 1 130px", minWidth: 120 };

  return (
    <>
      <div className="sc" style={{ marginBottom: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={sel}>
            <span className="fl">Instrument</span>
            <select className="inp" value={f.instrument} onChange={(e) => set("instrument", e.target.value)}>
              <option value="">All</option>
              {instruments.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div style={sel}>
            <span className="fl">Direction</span>
            <select className="inp" value={f.direction} onChange={(e) => set("direction", e.target.value)}>
              <option value="">All</option>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>
          <div style={sel}>
            <span className="fl">Setup Tag</span>
            <select className="inp" value={f.tag} onChange={(e) => set("tag", e.target.value)}>
              <option value="">All</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div style={sel}>
            <span className="fl">Result</span>
            <select className="inp" value={f.result} onChange={(e) => set("result", e.target.value)}>
              <option value="">All</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
            </select>
          </div>
          <div style={sel}>
            <span className="fl">From</span>
            <input className="inp" type="date" value={f.from} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div style={sel}>
            <span className="fl">To</span>
            <input className="inp" type="date" value={f.to} onChange={(e) => set("to", e.target.value)} />
          </div>
          {active && (
            <button className="pill" style={{ height: 38 }} onClick={() => setF(emptyFilters)}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          {filtered.length} {active ? `of ${trades.length}` : ""} trades
        </span>
        {filtered.length > 0 && (
          <span style={{ fontSize: 13, fontWeight: 700, color: filteredPnl >= 0 ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{f$(filteredPnl)}</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 36 }}>📋</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>{active ? "No trades match these filters" : "No trades yet"}</div>
        </div>
      ) : (
        filtered.map((t) => <TRow key={t.id} trade={t} tags={tags} instrumentMeta={instrumentMeta} onEdit={openEdit} onDelete={deleteTrade} />)
      )}
    </>
  );
}
