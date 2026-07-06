import { useEffect, useState } from "react";
import { BP } from "../lib/constants";
import { loadSettings, saveSetting } from "../lib/settings";

// A URL-safe random token that scopes the webhook to one user.
const genToken = () => {
  const bytes = new Uint8Array(24);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

// The JSON body the user pastes into their TradingView alert. Placeholders in
// {{…}} are filled by TradingView at fire time; api/ingest.js understands them.
const tvMessage = `{
  "symbol": "{{ticker}}",
  "direction": "{{strategy.order.action}}",
  "entry": {{strategy.order.price}},
  "contracts": {{strategy.position_size}},
  "time": "{{timenow}}"
}`;

export default function AutoImportCard({ userId }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await loadSettings(userId);
      let t = s.webhook_token;
      if (!t) {
        t = genToken();
        await saveSetting(userId, "webhook_token", t);
      }
      if (alive) {
        setToken(t);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const url = token ? `${window.location.origin}/api/ingest?token=${token}` : "";

  const copy = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard blocked — user can still select manually
    }
    setCopied(which);
    setTimeout(() => setCopied(""), 1500);
  };

  const regenerate = async () => {
    if (!window.confirm("Generate a new link? Your old TradingView alert will stop working until you paste the new URL.")) return;
    const t = genToken();
    setToken(t);
    await saveSetting(userId, "webhook_token", t);
  };

  const box = { fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 11, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 11px", color: "#334155", wordBreak: "break-all", lineHeight: 1.5 };
  const step = { display: "flex", gap: 9, marginBottom: 12 };
  const dot = { flex: "0 0 auto", width: 20, height: 20, borderRadius: "50%", background: "#5b52e0", color: "white", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div className="sc" style={{ maxWidth: 460, marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>⚡ Auto-Import · TradingView</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>Connect once. Every trade your TradingView strategy fires lands in the journal automatically — entry, exit, contracts and P&L.</div>

      {loading ? (
        <div style={{ fontSize: 11, color: "#94a3b8" }}>Loading your link…</div>
      ) : (
        <>
          {/* Step 1 — the personal webhook URL */}
          <div style={step}>
            <div style={dot}>1</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Your personal webhook URL</div>
              <div style={box}>{url}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => copy(url, "url")} style={{ ...BP, padding: "6px 14px", fontSize: 11 }}>
                  {copied === "url" ? "Copied ✓" : "Copy URL"}
                </button>
                <button onClick={regenerate} className="pill">
                  Regenerate
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>Keep this private — anyone with the link can add trades to your journal.</div>
            </div>
          </div>

          {/* Step 2 — create the alert */}
          <div style={step}>
            <div style={dot}>2</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>In TradingView</div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.7 }}>
                Open your strategy/chart → <b>Create Alert</b>. Under <b>Notifications</b>, tick <b>Webhook URL</b> and paste the URL above. Then paste the message below into the alert's <b>Message</b> box.
              </div>
            </div>
          </div>

          {/* Step 3 — the message body */}
          <div style={step}>
            <div style={dot}>3</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Alert message (JSON)</div>
              <pre style={{ ...box, whiteSpace: "pre-wrap", margin: 0 }}>{tvMessage}</pre>
              <button onClick={() => copy(tvMessage, "msg")} style={{ ...BP, padding: "6px 14px", fontSize: 11, marginTop: 8 }}>
                {copied === "msg" ? "Copied ✓" : "Copy message"}
              </button>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6, lineHeight: 1.5 }}>
                Add <code>"exit"</code>, <code>"stop"</code> or <code>"target"</code> lines if your alert has them — P&L is computed automatically when an exit arrives.
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: 10, lineHeight: 1.5 }}>
            Requires a TradingView plan that supports webhook alerts. Instrument must exist in Settings → Instruments (built-ins like ES, NQ, CL are ready).
          </div>
        </>
      )}
    </div>
  );
}
