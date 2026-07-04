import { useEffect, useState } from "react";
import { sb } from "./lib/supabase";
import AuthScreen from "./components/AuthScreen";
import TradeJournal from "./components/TradeJournal";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#070a0e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 12px #3b82f6", animation: "pulse 1s infinite" }} />
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;
  return <TradeJournal user={user} onSignOut={() => sb.auth.signOut()} />;
}
