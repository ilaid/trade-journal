// Instruments/contracts now live in Supabase (public.instruments / public.contracts)
// so users aren't limited to a hardcoded list — see src/lib/instruments.js for the
// loader that fetches them and reshapes them into the CT/INST shape below.
// This fallback is only used if that fetch fails or the migration hasn't run yet,
// so the app never fully breaks.
export const FALLBACK_CT = {
  ES: [{ id: -1, label: "E-mini ES", ts: 0.25, tv: 12.5 }],
};
export const FALLBACK_INST = ["ES"];

export const DIRS = ["Long", "Short"];
export const EMO = ["🧘 Focused", "😎 Confident", "😐 Neutral", "😰 Anxious", "😤 Frustrated", "🤑 Greedy", "😴 Tired", "😤 FOMO"];
export const MIS = ["Over-leveraged", "Moved SL", "Chased entry", "Ignored plan", "Exited early", "Held too long", "Revenge trade", "None"];
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const TCOLORS = ["#2563eb", "#d97706", "#7c3aed", "#059669", "#dc2626", "#db2777", "#0891b2", "#65a30d"];
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Economic-event chips: light tint background + saturated ink/border (light theme).
export const EVENTS = [
  { id: "NFP", label: "NFP", color: "#dc2626", bg: "#fee2e2", desc: "Non-Farm Payrolls" },
  { id: "CPI", label: "CPI", color: "#d97706", bg: "#fef3c7", desc: "Consumer Price Index" },
  { id: "PPI", label: "PPI", color: "#ea580c", bg: "#ffedd5", desc: "Producer Price Index" },
  { id: "FOMC", label: "FOMC", color: "#7c3aed", bg: "#ede9fe", desc: "Fed Rate Decision" },
  { id: "JOBLESS", label: "Jobless", color: "#2563eb", bg: "#dbeafe", desc: "Jobless Claims" },
  { id: "GDP", label: "GDP", color: "#16a34a", bg: "#dcfce7", desc: "GDP Release" },
  { id: "RETAIL", label: "Retail", color: "#db2777", bg: "#fce7f3", desc: "Retail Sales" },
  { id: "ISM", label: "ISM", color: "#0891b2", bg: "#cffafe", desc: "ISM Manufacturing" },
  { id: "PMI", label: "PMI", color: "#65a30d", bg: "#ecfccb", desc: "PMI Data" },
];

// Seeded into the real `tags` table for a brand-new user with zero tags
// (see ensureDefaultTags in TradeJournal.jsx) — not a source of truth once rows exist.
export const DEFAULT_TAGS = [
  { name: "Breakout", color: "#2563eb" },
  { name: "Reversal", color: "#d97706" },
  { name: "VWAP Reclaim", color: "#7c3aed" },
  { name: "Trend Follow", color: "#059669" },
  { name: "Gap Fill", color: "#dc2626" },
  { name: "Range", color: "#db2777" },
];

export const BP = { background: "#2563eb", border: "1px solid #2563eb", borderRadius: 9, color: "#ffffff", padding: "9px 20px", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Inter',system-ui,sans-serif" };
export const BS = { background: "#16a34a", border: "1px solid #16a34a", borderRadius: 9, color: "#ffffff", padding: "9px 22px", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Inter',system-ui,sans-serif" };
