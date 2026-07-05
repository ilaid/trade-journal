import { useMemo, useState } from "react";
import { BP, BS } from "../lib/constants";
import { parseCsvFile, applyMapping, detectDuplicates, IMPORT_FIELDS } from "../lib/csvImport";

export default function ImportModal({ CT, existingTrades, onImport, onClose }) {
  const [step, setStep] = useState(1);
  const [broker, setBroker] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [checked, setChecked] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState("");

  const validSymbols = useMemo(() => new Set(Object.keys(CT || {})), [CT]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    try {
      const { headers: h, rows } = await parseCsvFile(file);
      if (!h.length || !rows.length) {
        setParseError("Couldn't find any rows in that file.");
        return;
      }
      setHeaders(h);
      setRawRows(rows);
      setStep(2);
    } catch (err) {
      setParseError(err.message || "Failed to parse CSV");
    }
  };

  const setMap = (field, column) => setMapping((m) => ({ ...m, [field]: { column } }));

  const goToPreview = () => {
    const required = IMPORT_FIELDS.filter((f) => f.required);
    const missing = required.filter((f) => !mapping[f.key]?.column);
    if (missing.length) {
      setParseError(`Map all required fields: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setParseError("");
    const normalized = applyMapping(rawRows, mapping).map((r) => (validSymbols.has(r.instrument) ? r : { ...r, _errors: [...r._errors, "instrument"] }));
    const withDupes = detectDuplicates(normalized, existingTrades, broker);
    setPreview(withDupes);
    setChecked(Object.fromEntries(withDupes.map((r) => [r._rowIndex, r._errors.length === 0 && !r.isDuplicate])));
    setStep(3);
  };

  const confirmImport = async () => {
    const rowsToImport = preview.filter((r) => checked[r._rowIndex] && r._errors.length === 0);
    setBusy(true);
    const count = await onImport(rowsToImport, broker.trim() || "csv");
    setBusy(false);
    setResult(count);
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox" style={{ maxWidth: 760 }}>
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "#f9fafb" }}>Import Trades</div>
            <div style={{ fontSize: 10, color: "#374151", marginTop: 2 }}>Step {step} of 3</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>
            ×
          </button>
        </div>

        <div style={{ padding: "16px 24px 24px" }}>
          {result !== null ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ fontSize: 15, color: "#00c07a", fontWeight: 700, marginBottom: 8 }}>✓ Imported {result} trade{result === 1 ? "" : "s"}</div>
              <button style={BP} onClick={onClose}>
                Done
              </button>
            </div>
          ) : (
            <>
              {step === 1 && (
                <>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, lineHeight: 1.5 }}>
                    Upload a CSV export where each row is one completed trade (entry + exit + P&amp;L). Works with most brokers' "trade history" / "performance report" exports.
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <span className="fl">Broker name (optional)</span>
                    <input className="inp" value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="e.g. Tradovate, NinjaTrader…" />
                  </div>
                  <input type="file" accept=".csv" onChange={onFile} className="inp" />
                  {parseError && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 8 }}>{parseError}</div>}
                </>
              )}

              {step === 2 && (
                <>
                  <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 12, textTransform: "uppercase" }}>Map CSV Columns</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {IMPORT_FIELDS.map((f) => (
                      <div key={f.key}>
                        <span className="fl">
                          {f.label}
                          {f.required && <span style={{ color: "#ef4444" }}> *</span>}
                        </span>
                        <select className="inp" value={mapping[f.key]?.column || ""} onChange={(e) => setMap(f.key, e.target.value)}>
                          <option value="">— not mapped —</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  {parseError && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 10 }}>{parseError}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid #111827" }}>
                    <button className="pill" onClick={() => setStep(1)}>
                      ← Back
                    </button>
                    <button style={BP} onClick={goToPreview}>
                      Preview →
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 10, textTransform: "uppercase" }}>
                    Preview ({preview.filter((r) => checked[r._rowIndex]).length} of {preview.length} selected)
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #1e2635", borderRadius: 8 }}>
                    {preview.map((r) => {
                      const hasError = r._errors.length > 0;
                      return (
                        <div key={r._rowIndex} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #111827", opacity: hasError ? 0.5 : 1 }}>
                          <input type="checkbox" disabled={hasError} checked={!!checked[r._rowIndex]} onChange={(e) => setChecked((c) => ({ ...c, [r._rowIndex]: e.target.checked }))} />
                          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 90 }}>{r.date || "?"}</span>
                          <span style={{ fontSize: 11, color: "#60a5fa", minWidth: 40 }}>{r.instrument || "?"}</span>
                          <span style={{ fontSize: 11, color: r.direction === "Long" ? "#00c07a" : "#ef4444", minWidth: 50 }}>{r.direction || "?"}</span>
                          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 60 }}>{r.entryPrice}</span>
                          <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 60 }}>{r.exitPrice}</span>
                          <span style={{ fontSize: 11, color: "#4b5563", flex: 1 }}>
                            {hasError && `⚠ bad ${r._errors.join(", ")}`}
                            {!hasError && r.isDuplicate && "possible duplicate"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid #111827" }}>
                    <button className="pill" onClick={() => setStep(2)}>
                      ← Back
                    </button>
                    <button style={BS} onClick={confirmImport} disabled={busy}>
                      {busy ? "Importing…" : `✓ Import ${preview.filter((r) => checked[r._rowIndex]).length} trades`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
