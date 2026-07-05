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
export const TCOLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const EVENTS = [
  { id: "NFP", label: "NFP", color: "#ef4444", bg: "#3b0d14", desc: "Non-Farm Payrolls" },
  { id: "CPI", label: "CPI", color: "#f59e0b", bg: "#1a0f00", desc: "Consumer Price Index" },
  { id: "PPI", label: "PPI", color: "#f97316", bg: "#1a0900", desc: "Producer Price Index" },
  { id: "FOMC", label: "FOMC", color: "#8b5cf6", bg: "#1c1040", desc: "Fed Rate Decision" },
  { id: "JOBLESS", label: "Jobless", color: "#60a5fa", bg: "#0d1f40", desc: "Jobless Claims" },
  { id: "GDP", label: "GDP", color: "#00c07a", bg: "#052e16", desc: "GDP Release" },
  { id: "RETAIL", label: "Retail", color: "#ec4899", bg: "#2d0a1e", desc: "Retail Sales" },
  { id: "ISM", label: "ISM", color: "#06b6d4", bg: "#031e26", desc: "ISM Manufacturing" },
  { id: "PMI", label: "PMI", color: "#84cc16", bg: "#132008", desc: "PMI Data" },
];

// Seeded into the real `tags` table for a brand-new user with zero tags
// (see ensureDefaultTags in TradeJournal.jsx) — not a source of truth once rows exist.
export const DEFAULT_TAGS = [
  { name: "Breakout", color: "#3b82f6" },
  { name: "Reversal", color: "#f59e0b" },
  { name: "VWAP Reclaim", color: "#8b5cf6" },
  { name: "Trend Follow", color: "#10b981" },
  { name: "Gap Fill", color: "#ef4444" },
  { name: "Range", color: "#ec4899" },
];

export const BP = { background: "linear-gradient(135deg,#1d3461,#1e40af)", border: "1px solid #3b82f6", borderRadius: 8, color: "#93c5fd", padding: "9px 20px", cursor: "pointer", fontSize: 12, fontFamily: "'Azeret Mono',monospace" };
export const BS = { background: "linear-gradient(135deg,#052e16,#064e3b)", border: "1px solid #00c07a", borderRadius: 8, color: "#00c07a", padding: "9px 22px", cursor: "pointer", fontSize: 12, fontFamily: "'Azeret Mono',monospace" };
