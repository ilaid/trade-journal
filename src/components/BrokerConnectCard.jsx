import { useEffect, useState } from "react";
import { BP } from "../lib/constants";
import { connectTradovate, disconnectTradovate, syncTradovate, getBrokerStatus } from "../lib/broker";

const blankForm = () => ({ env: "demo", name: "", password: "", appId: "", cid: "", sec: "" });

export default function BrokerConnectCard({ userId }) {
  const [status, setStatus] = useState(null); // {status, env, last_sync_at, last_error} | null
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm());
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null); // {kind:'ok'|'err', text}

  const refresh = async () => {
    setLoading(true);
    setStatus(await getBrokerStatus(userId));
    setLoading(false);
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const connect = async () => {
    setBusy("connect");
    setMsg(null);
    try {
      const r = await connectTradovate(form);
      const n = r.accounts?.length || 0;
      setMsg({ kind: "ok", text: `Connected${n ? ` · ${n} account${n > 1 ? "s" : ""} found` : ""}. Trades will import automatically.` });
      setForm(blankForm());
      await refresh();
    } catch (e) {
      setMsg({ kind: "err", text: String(e.message || e) });
    }
    setBusy("");
  };

  const sync = async () => {
    setBusy("sync");
    setMsg(null);
    try {
      const r = await syncTradovate();
      const imported = (r.results || []).reduce((s, x) => s + (x.imported || 0), 0);
      const err = (r.results || []).find((x) => x.error);
      if (err) setMsg({ kind: "err", text: err.error });
      else setMsg({ kind: "ok", text: imported ? `Imported ${imported} new trade${imported > 1 ? "s" : ""}.` : "Up to date — no new closed trades." });
      await refresh();
    } catch (e) {
      setMsg({ kind: "err", text: String(e.message || e) });
    }
    setBusy("");
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect Tradovate? Automatic import will stop.")) return;
    setBusy("disconnect");
    try {
      await disconnectTradovate();
      setMsg(null);
      await refresh();
    } catch (e) {
      setMsg({ kind: "err", text: String(e.message || e) });
    }
    setBusy("");
  };

  const connected = status?.status === "connected";
  const lbl = { fontSize: 11, color: "#475569", marginBottom: 4, display: "block" };

  return (
    <div className="sc" style={{ maxWidth: 460, marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>🔗 Broker · Tradovate (real fills)</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>Connect your Tradovate account once. Closed trades import automatically with real entry, exit, contracts and P&amp;L. Needs API Access enabled on the account.</div>

      {loading ? (
        <div style={{ fontSize: 11, color: "#94a3b8" }}>Loading…</div>
      ) : connected ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Connected · {status.env === "live" ? "Live" : "Demo"}</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>{status.last_sync_at ? `Last sync: ${new Date(status.last_sync_at).toLocaleString()}` : "Not synced yet."}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={sync} disabled={!!busy} style={{ ...BP, padding: "7px 16px", fontSize: 11 }}>
              {busy === "sync" ? "Syncing…" : "Sync now"}
            </button>
            <button onClick={disconnect} disabled={!!busy} style={{ background: "#fee2e2", border: "1px solid #dc2626", borderRadius: 8, color: "#dc2626", cursor: "pointer", fontSize: 11, padding: "7px 14px" }}>
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {["demo", "live"].map((e) => (
              <button key={e} onClick={() => set("env", e)} className="pill" style={form.env === e ? { background: "#5b52e0", color: "#fff", borderColor: "#5b52e0" } : {}}>
                {e === "demo" ? "Demo" : "Live"}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <span style={lbl}>Username</span>
              <input className="inp" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Tradovate login" />
            </div>
            <div>
              <span style={lbl}>Password</span>
              <input className="inp" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <span style={lbl}>App ID</span>
              <input className="inp" value={form.appId} onChange={(e) => set("appId", e.target.value)} placeholder="e.g. TradeMethod" />
            </div>
            <div>
              <span style={lbl}>CID</span>
              <input className="inp" value={form.cid} onChange={(e) => set("cid", e.target.value)} placeholder="numeric" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={lbl}>API Secret (sec)</span>
              <input className="inp" value={form.sec} onChange={(e) => set("sec", e.target.value)} placeholder="from Tradovate API Access" />
            </div>
          </div>
          <button onClick={connect} disabled={!!busy} style={{ ...BP, padding: "7px 16px", fontSize: 11 }}>
            {busy === "connect" ? "Connecting…" : "Connect & Test"}
          </button>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 10, lineHeight: 1.5 }}>
            Get App ID / CID / Secret from Tradovate → Application Settings → API Access (requires the API Access entitlement; prop-firm accounts may need to request it).
          </div>
        </>
      )}

      {msg && <div style={{ marginTop: 10, fontSize: 11, color: msg.kind === "ok" ? "#16a34a" : "#dc2626", lineHeight: 1.5 }}>{msg.text}</div>}
    </div>
  );
}
