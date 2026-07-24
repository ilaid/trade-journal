// Extract trade fields from a screenshot using Google Gemini (free tier vision).
//
// POST /api/extract-trade   body: { imageBase64, mimeType }
// Env (Vercel): GEMINI_API_KEY  (free key from https://aistudio.google.com/apikey)
// Returns: { symbol, direction, entry, exit, stop, target, date, time } (nulls where unknown).
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const PROMPT = `You are reading a screenshot of a single futures trade (from a broker platform or TradingView).
Extract these fields and return ONLY a JSON object, no prose:
- "symbol": the futures root symbol only, uppercase, stripped of exchange prefix and month/expiry codes (e.g. "CME_MINI:ESU2025" -> "ES", "MNQ1!" -> "MNQ"). null if unclear.
- "direction": "Long" or "Short" (buy = Long, sell = Short). null if unclear.
- "entry": entry/fill price as a number. null if not visible.
- "exit": exit/close price as a number. null if not visible.
- "stop": stop-loss price as a number, or null.
- "target": take-profit/target price as a number, or null.
- "date": trade date as "YYYY-MM-DD", or null.
- "time": trade time as "HH:MM" 24-hour, or null.
Do NOT include the number of contracts or position size. Return JSON only.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "Server not configured: add GEMINI_API_KEY in Vercel env vars." });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  let data = body.imageBase64 || "";
  const mimeType = body.mimeType || "image/png";
  if (!data) return res.status(400).json({ error: "Missing image" });
  // Accept a full data: URL too.
  if (data.startsWith("data:")) data = data.split(",").pop();

  try {
    const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data } }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0 },
      }),
    });
    const gJson = await gRes.json();
    if (!gRes.ok) {
      return res.status(502).json({ error: "Vision request failed", detail: gJson?.error?.message || `HTTP ${gRes.status}` });
    }
    const text = gJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let fields;
    try {
      fields = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "Could not read the image. Try a clearer screenshot." });
    }
    return res.status(200).json({
      symbol: fields.symbol ?? null,
      direction: fields.direction ?? null,
      entry: fields.entry ?? null,
      exit: fields.exit ?? null,
      stop: fields.stop ?? null,
      target: fields.target ?? null,
      date: fields.date ?? null,
      time: fields.time ?? null,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
