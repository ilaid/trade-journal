import TRow from "../TRow";

export default function TradesList({ trades, tags, instrumentMeta, openEdit, deleteTrade }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>{trades.length} trades total</span>
      </div>
      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#e2e8f0" }}>
          <div style={{ fontSize: 36 }}>📋</div>
        </div>
      ) : (
        trades.map((t) => <TRow key={t.id} trade={t} tags={tags} instrumentMeta={instrumentMeta} onEdit={openEdit} onDelete={deleteTrade} />)
      )}
    </>
  );
}
