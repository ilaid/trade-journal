import { useState } from "react";
import { exportCSV } from "../../lib/csv";
import { BP, TCOLORS } from "../../lib/constants";
import { loadInstruments } from "../../lib/instruments";
import AutoImportCard from "../AutoImportCard";

export default function Settings({ trades, user, setTrades, sb, CT, INST, instrumentMeta, userId, onInstrumentsChanged }) {
  const [form, setForm] = useState({ symbol: "", label: "", tickSize: "", tickValue: "", color: TCOLORS[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addInstrument = async () => {
    if (!form.symbol.trim() || !form.label.trim() || !form.tickSize || !form.tickValue) {
      setError("Symbol, label, tick size and tick value are all required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data: inst, error: instErr } = await sb
        .from("instruments")
        .insert({ user_id: userId, symbol: form.symbol.trim().toUpperCase(), label: form.label.trim(), color: form.color, is_active: true })
        .select()
        .single();
      if (instErr) throw instErr;
      const { error: contractErr } = await sb.from("contracts").insert({ instrument_id: inst.id, label: form.label.trim(), tick_size: parseFloat(form.tickSize), tick_value: parseFloat(form.tickValue), is_active: true });
      if (contractErr) throw contractErr;
      const reloaded = await loadInstruments();
      onInstrumentsChanged(reloaded.CT, reloaded.INST, reloaded.META);
      setForm({ symbol: "", label: "", tickSize: "", tickValue: "", color: TCOLORS[0] });
    } catch (e) {
      setError(e.message || "Failed to add instrument");
    }
    setSaving(false);
  };

  return (
    <>
      <div className="sc" style={{ maxWidth: 460, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>☁️ Cloud Sync</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
          <span style={{ fontSize: 11, color: "#16a34a" }}>
            {trades.length} trades synced · {user.email}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#64748b" }}>All data saved to Supabase. Access from any device.</div>
      </div>

      <AutoImportCard userId={userId} />

      <div className="sc" style={{ maxWidth: 460, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10, textTransform: "uppercase" }}>Instruments</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {(INST || []).map((sym) => (
            <span key={sym} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5, background: `${instrumentMeta?.[sym]?.color || "#5b52e0"}22`, color: instrumentMeta?.[sym]?.color || "#5b52e0" }}>
              {sym} <span style={{ color: "#64748b" }}>({(CT?.[sym] || []).length})</span>
            </span>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>+ Add Custom Instrument</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input className="inp" placeholder="Symbol (e.g. SI)" value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} />
          <input className="inp" placeholder="Label (e.g. Silver)" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <input className="inp" placeholder="Tick size" type="number" step="any" value={form.tickSize} onChange={(e) => setForm((f) => ({ ...f, tickSize: e.target.value }))} />
          <input className="inp" placeholder="Tick value ($)" type="number" step="any" value={form.tickValue} onChange={(e) => setForm((f) => ({ ...f, tickValue: e.target.value }))} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          {TCOLORS.map((c) => (
            <div key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} style={{ width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${form.color === c ? "white" : "transparent"}` }} />
          ))}
        </div>
        {error && <div style={{ color: "#dc2626", fontSize: 11, marginBottom: 8 }}>{error}</div>}
        <button onClick={addInstrument} disabled={saving} style={{ ...BP, padding: "7px 16px", fontSize: 11 }}>
          {saving ? "Adding…" : "+ Add Instrument"}
        </button>
      </div>

      <div className="sc" style={{ maxWidth: 460, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>Export</div>
        <button onClick={() => exportCSV(trades)} style={{ ...BP, padding: "7px 16px", fontSize: 11 }}>
          ↓ Export CSV
        </button>
      </div>

      <div className="sc" style={{ maxWidth: 460 }}>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10, textTransform: "uppercase" }}>Danger Zone</div>
        <button
          onClick={async () => {
            if (!window.confirm("Delete ALL trades permanently?")) return;
            const { data: shots } = await sb.from("trade_screenshots").select("storage_path").eq("user_id", user.id);
            if (shots?.length) await sb.storage.from("trade-screenshots").remove(shots.map((s) => s.storage_path));
            await sb.from("trades").delete().eq("user_id", user.id);
            setTrades([]);
          }}
          style={{ background: "#fee2e2", border: "1px solid #dc2626", borderRadius: 8, color: "#dc2626", padding: "8px 16px", cursor: "pointer", fontSize: 11, fontFamily: "'Inter',system-ui,sans-serif" }}
        >
          Clear All Trades
        </button>
      </div>
    </>
  );
}
