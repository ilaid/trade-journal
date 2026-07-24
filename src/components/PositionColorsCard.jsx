import { useEffect, useState } from "react";
import { loadSettings, saveSetting } from "../lib/settings";

// Named colors the user can assign to each position level. The names (not hex)
// are what we send to the vision model, so keep them plain and recognizable.
const PALETTE = [
  { name: "white", hex: "#ffffff" },
  { name: "gray", hex: "#9ca3af" },
  { name: "green", hex: "#16a34a" },
  { name: "teal", hex: "#14b8a6" },
  { name: "blue", hex: "#3b82f6" },
  { name: "purple", hex: "#8b5cf6" },
  { name: "red", hex: "#ef4444" },
  { name: "orange", hex: "#f59e0b" },
  { name: "yellow", hex: "#eab308" },
  { name: "pink", hex: "#ec4899" },
];

export const DEFAULT_POS_COLORS = { entry: "white", target: "teal", stop: "orange" };

const ROWS = [
  { key: "target", label: "מקום לקיחת רווח (Take Profit)" },
  { key: "entry", label: "כניסה (Entry)" },
  { key: "stop", label: "סטופ (Stop)" },
];

export default function PositionColorsCard({ userId }) {
  const [colors, setColors] = useState(DEFAULT_POS_COLORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await loadSettings(userId);
      if (alive) {
        setColors({ ...DEFAULT_POS_COLORS, ...(s.pos_colors || {}) });
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const pick = async (key, name) => {
    const next = { ...colors, [key]: name };
    setColors(next);
    await saveSetting(userId, "pos_colors", next);
  };

  return (
    <div className="sc" style={{ maxWidth: 460, marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>🎨 Auto-Fill · צבעי כלי הפוזיציה</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>בחר את הצבעים שאתה משתמש בהם ב-TradingView לכל רמה. המערכת תזהה לפי זה את הכניסה, היעד והסטופ כשתעלה תמונה.</div>

      {loading ? (
        <div style={{ fontSize: 11, color: "#94a3b8" }}>טוען…</div>
      ) : (
        ROWS.map((row) => (
          <div key={row.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, textAlign: "right" }}>{row.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PALETTE.map((c) => (
                <div
                  key={c.name}
                  onClick={() => pick(row.key, c.name)}
                  title={c.name}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: c.hex,
                    cursor: "pointer",
                    border: colors[row.key] === c.name ? "3px solid #0f172a" : "1px solid #e2e8f0",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
