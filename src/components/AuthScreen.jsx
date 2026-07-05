import { useState } from "react";
import { sb } from "../lib/supabase";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "register") {
        const { error: e } = await sb.auth.signUp({ email, password });
        if (e) throw e;
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else {
        const { data, error: e } = await sb.auth.signInWithPassword({ email, password });
        if (e) throw e;
        onAuth(data.user);
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#e7e9f1", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif", padding: 20 }}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "44px 48px", width: "100%", maxWidth: 420, boxShadow: "0 20px 50px rgba(15,23,42,.10)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e9e7fb", border: "1px solid #5b52e0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 0 20px rgba(91,82,224,.2)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#5b52e0", boxShadow: "0 0 8px #5b52e0" }} />
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: ".04em" }}>TRADE JOURNAL</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>ES · NQ Futures</div>
        </div>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setSuccess("");
              }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: mode === m ? "#e9e7fb" : "transparent", color: mode === m ? "#5b52e0" : "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "'Inter',system-ui,sans-serif", fontWeight: 500 }}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
        {["Email", "Password"].map((label, i) => (
          <div key={label} style={{ marginBottom: i === 0 ? 14 : 20 }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
            <input
              type={i === 1 ? "password" : "email"}
              value={i === 0 ? email : password}
              onChange={(e) => (i === 0 ? setEmail(e.target.value) : setPassword(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={i === 0 ? "your@email.com" : "••••••••"}
              className="inp"
            />
          </div>
        ))}
        {error && <div style={{ background: "#fee2e2", border: "1px solid #dc262655", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#dc2626", marginBottom: 14 }}>{error}</div>}
        {success && <div style={{ background: "#dcfce7", border: "1px solid #16a34a55", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#16a34a", marginBottom: 14 }}>{success}</div>}
        <button
          onClick={submit}
          disabled={loading}
          style={{ width: "100%", background: "#5b52e0", border: "1px solid #5b52e0", borderRadius: 10, color: "#ffffff", padding: "12px 0", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'Inter',system-ui,sans-serif", fontWeight: 600, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Loading..." : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
        {mode === "login" && (
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#94a3b8" }}>
            No account?{" "}
            <span onClick={() => setMode("register")} style={{ color: "#5b52e0", cursor: "pointer" }}>
              Create one free
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
