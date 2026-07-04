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
    <div style={{ minHeight: "100vh", background: "#070a0e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Azeret Mono',monospace", padding: 20 }}>
      <div style={{ background: "#0f1318", border: "1px solid #1e2635", borderRadius: 20, padding: "44px 48px", width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,.7)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1d3461", border: "1px solid #3b82f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 0 20px rgba(59,130,246,.2)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#f9fafb", letterSpacing: ".04em" }}>TRADE JOURNAL</div>
          <div style={{ fontSize: 10, color: "#374151", marginTop: 4 }}>ES · NQ Futures</div>
        </div>
        <div style={{ display: "flex", background: "#111827", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setSuccess("");
              }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: mode === m ? "#1d3461" : "transparent", color: mode === m ? "#93c5fd" : "#4b5563", cursor: "pointer", fontSize: 12, fontFamily: "'Azeret Mono',monospace", fontWeight: 500 }}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
        {["Email", "Password"].map((label, i) => (
          <div key={label} style={{ marginBottom: i === 0 ? 14 : 20 }}>
            <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
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
        {error && <div style={{ background: "#3b0d14", border: "1px solid #ef444455", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#ef4444", marginBottom: 14 }}>{error}</div>}
        {success && <div style={{ background: "#052e16", border: "1px solid #00c07a55", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#00c07a", marginBottom: 14 }}>{success}</div>}
        <button
          onClick={submit}
          disabled={loading}
          style={{ width: "100%", background: "linear-gradient(135deg,#1d3461,#1e40af)", border: "1px solid #3b82f6", borderRadius: 10, color: "#93c5fd", padding: "12px 0", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'Azeret Mono',monospace", fontWeight: 600, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Loading..." : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
        {mode === "login" && (
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#374151" }}>
            No account?{" "}
            <span onClick={() => setMode("register")} style={{ color: "#60a5fa", cursor: "pointer" }}>
              Create one free
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
