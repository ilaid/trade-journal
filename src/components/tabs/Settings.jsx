import { exportCSV } from "../../lib/csv";
import { BP } from "../../lib/constants";

export default function Settings({ trades, user, setTrades, sb }) {
  return (
    <>
      <div className="sc" style={{ maxWidth: 460, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 8, textTransform: "uppercase" }}>☁️ Cloud Sync</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00c07a" }} />
          <span style={{ fontSize: 11, color: "#00c07a" }}>
            {trades.length} trades synced · {user.email}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#4b5563" }}>All data saved to Supabase. Access from any device.</div>
      </div>
      <div className="sc" style={{ maxWidth: 460, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 8, textTransform: "uppercase" }}>Export</div>
        <button onClick={() => exportCSV(trades)} style={{ ...BP, padding: "7px 16px", fontSize: 11 }}>
          ↓ Export CSV
        </button>
      </div>
      <div className="sc" style={{ maxWidth: 460 }}>
        <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 10, textTransform: "uppercase" }}>Danger Zone</div>
        <button
          onClick={async () => {
            if (window.confirm("Delete ALL trades permanently?")) {
              await sb.from("trades").delete().eq("user_id", user.id);
              setTrades([]);
            }
          }}
          style={{ background: "#3b0d14", border: "1px solid #ef4444", borderRadius: 8, color: "#ef4444", padding: "8px 16px", cursor: "pointer", fontSize: 11, fontFamily: "'Azeret Mono',monospace" }}
        >
          Clear All Trades
        </button>
      </div>
    </>
  );
}
