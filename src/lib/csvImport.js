import Papa from "papaparse";

// v1 scope: each CSV row is one already-completed round-trip trade (entry +
// exit + optional P&L in a single row) — matches most brokers' "trade
// history" / "performance report" exports. Execution/fill-level reconciliation
// (grouping many partial-fill rows into one trade) is explicitly out of scope.

export const IMPORT_FIELDS = [
  { key: "date", label: "Date", required: true },
  { key: "time", label: "Time", required: false },
  { key: "instrument", label: "Instrument symbol (e.g. ES, NQ)", required: true },
  { key: "direction", label: "Direction (Long/Short)", required: true },
  { key: "entryPrice", label: "Entry price", required: true },
  { key: "exitPrice", label: "Exit price", required: true },
  { key: "contracts", label: "Contracts", required: false },
  { key: "pnl", label: "P&L (optional — recomputed if blank)", required: false },
  { key: "externalId", label: "Broker trade ID (optional — used for de-dupe)", required: false },
  { key: "notes", label: "Notes", required: false },
];

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve({ headers: results.meta.fields || [], rows: results.data }),
      error: (err) => reject(err),
    });
  });
}

const DIRECTION_ALIASES = {
  long: "Long",
  buy: "Long",
  b: "Long",
  l: "Long",
  short: "Short",
  sell: "Short",
  s: "Short",
  sh: "Short",
};

export function normalizeDirection(raw) {
  if (!raw) return "";
  return DIRECTION_ALIASES[String(raw).trim().toLowerCase()] || "";
}

// Accepts YYYY-MM-DD, MM/DD/YYYY, M/D/YY, DD-MM-YYYY (best-effort); returns
// YYYY-MM-DD or "" if unparseable.
export function normalizeDate(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let [, a, b, y] = m;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function applyMapping(rows, mapping) {
  const get = (row, field) => {
    const col = mapping[field]?.column;
    return col ? row[col] : undefined;
  };

  return rows.map((row, idx) => {
    const errors = [];
    const direction = normalizeDirection(get(row, "direction"));
    if (!direction) errors.push("direction");

    const instrument = (get(row, "instrument") || "").trim().toUpperCase();
    if (!instrument) errors.push("instrument");

    const date = normalizeDate(get(row, "date"));
    if (!date) errors.push("date");

    const entryPrice = parseFloat(get(row, "entryPrice"));
    if (Number.isNaN(entryPrice)) errors.push("entryPrice");

    const exitPrice = parseFloat(get(row, "exitPrice"));
    if (Number.isNaN(exitPrice)) errors.push("exitPrice");

    const contractsRaw = parseFloat(get(row, "contracts"));
    const contracts = Number.isNaN(contractsRaw) || contractsRaw <= 0 ? 1 : contractsRaw;

    const pnlRaw = get(row, "pnl");
    const pnl = pnlRaw !== undefined && pnlRaw !== "" && !Number.isNaN(parseFloat(pnlRaw)) ? parseFloat(pnlRaw) : null;

    return {
      _rowIndex: idx,
      _errors: errors,
      date,
      time: (get(row, "time") || "").trim(),
      instrument,
      direction,
      entryPrice,
      exitPrice,
      contracts,
      pnl,
      externalId: (get(row, "externalId") || "").trim() || null,
      notes: get(row, "notes") || "",
    };
  });
}

// existingTrades: array of the app's in-memory flat trade objects.
export function detectDuplicates(normalizedRows, existingTrades, broker) {
  const existingExternalIds = new Set(existingTrades.filter((t) => t.broker === broker && t.externalId).map((t) => t.externalId));
  const existingComposite = new Set(existingTrades.map((t) => `${t.date}|${t.instrument}|${t.direction}|${t.entryPrice}|${t.totalContracts}`));

  return normalizedRows.map((r) => {
    const isDuplicate = (r.externalId && existingExternalIds.has(r.externalId)) || existingComposite.has(`${r.date}|${r.instrument}|${r.direction}|${r.entryPrice}|${r.contracts}`);
    return { ...r, isDuplicate };
  });
}
