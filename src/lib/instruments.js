import { sb } from "./supabase";
import { FALLBACK_CT, FALLBACK_INST } from "./constants";

const FALLBACK = {
  CT: FALLBACK_CT,
  INST: FALLBACK_INST,
  META: { ES: { id: -1, label: "E-mini S&P 500", color: "#60a5fa" } },
};

// Reshapes the normalized instruments/contracts tables into the CT/INST shape
// the rest of the app (TradeModal, calc.js) already expects, plus a META map
// keyed by symbol for per-instrument color (badges in TRow/DayPopup).
export async function loadInstruments() {
  try {
    const [{ data: instruments, error: instErr }, { data: contracts, error: contErr }] = await Promise.all([
      sb.from("instruments").select("*").eq("is_active", true).order("symbol"),
      sb.from("contracts").select("*").eq("is_active", true),
    ]);
    if (instErr) throw instErr;
    if (contErr) throw contErr;
    if (!instruments?.length || !contracts?.length) throw new Error("No instruments/contracts configured");

    const byId = Object.fromEntries(instruments.map((i) => [i.id, i]));
    const CT = {};
    const META = {};
    instruments.forEach((i) => {
      CT[i.symbol] = [];
      META[i.symbol] = { id: i.id, label: i.label, color: i.color };
    });
    contracts.forEach((c) => {
      const inst = byId[c.instrument_id];
      if (!inst) return;
      CT[inst.symbol].push({ id: c.id, label: c.label, ts: Number(c.tick_size), tv: Number(c.tick_value) });
    });
    const INST = Object.keys(CT).filter((s) => CT[s].length > 0);
    if (!INST.length) throw new Error("No active contracts configured");
    return { CT, INST, META };
  } catch (e) {
    console.error("Failed to load instruments from Supabase, using fallback:", e);
    return FALLBACK;
  }
}
