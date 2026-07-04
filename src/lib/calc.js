import { CT } from "./constants";

export const gs = (i, c) => {
  const l = CT[i] || CT.ES;
  return l.find((x) => x.id === c) || l[0];
};

export const lp = (en, ex, co, sp, dir) => {
  if (!en || !ex || !co || !sp) return null;
  const d = dir === "Short" ? -1 : 1;
  return parseFloat(((d * (parseFloat(ex) - parseFloat(en))) / sp.ts * sp.tv * parseFloat(co)).toFixed(2));
};

export const calcRR = (en, sl, tp, d) => {
  if (!en || !sl || !tp) return null;
  const x = d === "Long" ? 1 : -1;
  const r = Math.abs(parseFloat(en) - parseFloat(sl));
  const w = x * (parseFloat(tp) - parseFloat(en));
  return r === 0 ? null : parseFloat((w / r).toFixed(2));
};

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const nowTime = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const wk = (ds) => {
  const d = new Date(ds + "T00:00:00");
  const dy = d.getDay();
  const df = d.getDate() - dy + (dy === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(df);
  return m.toISOString().slice(0, 10);
};

export const mk = (ds) => ds.slice(0, 7);

export const tPnL = (t) => (t.exits?.length > 0 ? t.exits.reduce((s, l) => s + (l.pnl || 0), 0) : t.pnl || 0);

export const f$ = (v) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;

export const be = () => ({ id: Date.now() + Math.random(), exitPrice: "", contracts: "", pnl: null });

export const avg = (obj) => {
  const vs = Object.values(obj);
  return vs.length ? (vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(2) : "0.00";
};

export const BLANK = () => ({
  isHistorical: false,
  date: todayStr(),
  time: nowTime(),
  instrument: "ES",
  contractTypeId: "ES_mini",
  direction: "Long",
  entryPrice: "",
  totalContracts: "1",
  exits: [be()],
  sl: "",
  tp: "",
  rr: null,
  tags: [],
  events: [],
  emotion_before: "",
  emotion_during: "",
  followed_plan: null,
  mistakes: [],
  what_went_well: "",
  what_to_improve: "",
  notes: "",
});
