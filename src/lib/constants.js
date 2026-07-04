export const CT = {
  ES: [
    { id: "ES_mini", label: "E-mini ES", ts: 0.25, tv: 12.5 },
    { id: "MES_micro", label: "Micro MES", ts: 0.25, tv: 1.25 },
  ],
  NQ: [
    { id: "NQ_mini", label: "E-mini NQ", ts: 0.25, tv: 5.0 },
    { id: "MNQ_micro", label: "Micro MNQ", ts: 0.25, tv: 0.5 },
  ],
};

export const INST = ["ES", "NQ"];
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

export const INIT_TAGS = [
  { id: 1, name: "Breakout", color: "#3b82f6" },
  { id: 2, name: "Reversal", color: "#f59e0b" },
  { id: 3, name: "VWAP Reclaim", color: "#8b5cf6" },
  { id: 4, name: "Trend Follow", color: "#10b981" },
  { id: 5, name: "Gap Fill", color: "#ef4444" },
  { id: 6, name: "Range", color: "#ec4899" },
];

export const BP = { background: "linear-gradient(135deg,#1d3461,#1e40af)", border: "1px solid #3b82f6", borderRadius: 8, color: "#93c5fd", padding: "9px 20px", cursor: "pointer", fontSize: 12, fontFamily: "'Azeret Mono',monospace" };
export const BS = { background: "linear-gradient(135deg,#052e16,#064e3b)", border: "1px solid #00c07a", borderRadius: 8, color: "#00c07a", padding: "9px 22px", cursor: "pointer", fontSize: 12, fontFamily: "'Azeret Mono',monospace" };
