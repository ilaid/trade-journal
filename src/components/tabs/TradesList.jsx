import TRow from "../TRow";

export default function TradesList({ trades, tags, openEdit, deleteTrade }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#4b5563" }}>{trades.length} trades total</span>
      </div>
      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#1e2635" }}>
          <div style={{ fontSize: 36 }}>📋</div>
        </div>
      ) : (
        trades.map((t) => <TRow key={t.id} trade={t} tags={tags} onEdit={openEdit} onDelete={deleteTrade} />)
      )}
    </>
  );
}
