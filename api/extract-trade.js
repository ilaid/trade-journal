// Extract trade fields from a screenshot using a vision model.
//
// POST /api/extract-trade   body: { imageBase64 (data URL ok), mimeType, colors? }
// Providers (first configured wins):
//   GROQ_API_KEY   — free, no billing card required (https://console.groq.com/keys)
//   GEMINI_API_KEY — Google AI Studio (free tier now needs account validation)
// Optional: GROQ_MODEL, GEMINI_MODEL to override the defaults.
const GROQ_MODEL = process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const PROMPT = `You are reading a screenshot of a single futures trade, from a broker platform or from a TradingView chart.
Return ONLY a JSON object (no prose) with these fields:
- "symbol": the futures root symbol only, uppercase, stripped of exchange prefix and month/expiry codes (e.g. "CME_MINI:ESU2025" -> "ES", "MNQ1!" -> "MNQ", "MNQU2026" -> "MNQ"). null if unclear.
- "direction": "Long" or "Short". null if unclear.
- "entry": entry price as a number. null if not visible.
- "exit": the ACTUAL closed/filled exit price as a number. If the image only shows a plan (a position tool with target/stop but no realized close), set this to null — do NOT guess it.
- "stop": stop-loss price as a number, or null.
- "target": take-profit / target price as a number, or null.
- "date": trade date as "YYYY-MM-DD", or null.
- "time": trade time as "HH:MM" 24-hour, or null.

IMPORTANT — TradingView "Long/Short Position" drawing tool. Many screenshots show this tool, which has three horizontal levels:
- A middle line = the ENTRY (usually a white/neutral price label).
- A colored profit zone (usually green/teal) on the target side; its far edge = the TARGET (take profit).
- A colored loss zone (usually red/orange) on the stop side; its far edge = the STOP loss.
Determine direction from geometry: if the green/profit zone is ABOVE the entry line -> "Long"; if the profit zone is BELOW the entry -> "Short".
Read the actual numeric prices from the right-hand price axis labels that align with each level (e.g. teal label = target, white label = entry, orange label = stop).

Do NOT include the number of contracts or position size. Return JSON only.`;

async function callGroq(dataUrl, text) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: [{ type: "text", text }, { type: "image_url", image_url: { url: dataUrl } }] }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || `Groq HTTP ${res.status}`);
  return j?.choices?.[0]?.message?.content || "";
}

async function callGemini(base64, mimeType, text) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
      generationConfig: { response_mime_type: "application/json", temperature: 0 },
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || `Gemini HTTP ${res.status}`);
  return j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  if (!hasGroq && !hasGemini) return res.status(500).json({ error: "Server not configured: add GROQ_API_KEY (or GEMINI_API_KEY) in Vercel env vars." });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  let raw = body.imageBase64 || "";
  const mimeType = body.mimeType || "image/png";
  if (!raw) return res.status(400).json({ error: "Missing image" });
  const dataUrl = raw.startsWith("data:") ? raw : `data:${mimeType};base64,${raw}`;
  const base64 = raw.startsWith("data:") ? raw.split(",").pop() : raw;

  const c = body.colors || null;
  const colorHint = c && (c.target || c.stop || c.entry) ? `\n\nThis user's TradingView color convention (use it to identify each level): the take-profit/target zone is ${c.target || "?"}, the stop zone is ${c.stop || "?"}, and the entry line is ${c.entry || "?"}.` : "";
  const text = PROMPT + colorHint;

  try {
    const out = hasGroq ? await callGroq(dataUrl, text) : await callGemini(base64, mimeType, text);
    let fields;
    try {
      fields = JSON.parse(out);
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
    return res.status(502).json({ error: "Vision request failed", detail: String(e.message || e) });
  }
}
