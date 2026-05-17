import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/app",
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: search.redirect as "/app" });
    }
  },
  component: LoginPage,
});

import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const { theme, setTheme } = useGpaTheme();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.dir = "rtl";
  }, []);

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: redirectTo as "/app" });
    } catch (e: any) {
      setErr(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setErr("");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErr((result.error as Error).message || "فشل تسجيل الدخول");
      return;
    }
    if (result.redirected) return;
    navigate({ to: redirectTo as "/app" });
  };

  const inp: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 10,
    color: "var(--gpa-text-strong)",
    padding: "12px 14px",
    fontSize: 14,
    fontFamily: FONT,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: FONT,
        background: "var(--gpa-bg)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%,var(--gpa-accent-10),transparent 50%),radial-gradient(ellipse at 80% 80%,var(--gpa-accent2-18),transparent 50%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg,var(--gpa-accent-20),var(--gpa-accent2-20))",
              border: "1px solid var(--gpa-accent-33)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 12px",
            }}
          >
            🎓
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "var(--gpa-text)" }}>
            المستشار الأكاديمي
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--gpa-text-faint)" }}>
            خطط · تتبع · تفوق
          </p>
        </div>

        <div
          style={{
            background: "var(--gpa-card)",
            border: "1px solid var(--gpa-border)",
            borderRadius: 18,
            padding: 22,
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setErr("");
                }}
                style={{
                  flex: 1,
                  padding: 11,
                  background: mode === m ? "var(--gpa-accent-12)" : "transparent",
                  border: mode === m ? "1px solid var(--gpa-accent-44)" : "1px solid var(--gpa-border)",
                  borderRadius: 10,
                  color: mode === m ? "var(--gpa-accent)" : "var(--gpa-text-muted-2)",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: FONT,
                  cursor: "pointer",
                }}
              >
                {m === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              style={inp}
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور (٦ أحرف على الأقل)"
              style={inp}
            />
            {err && (
              <div
                style={{
                  background: "var(--gpa-danger-15)",
                  border: "1px solid var(--gpa-danger-33)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "var(--gpa-danger)",
                }}
              >
                ⚠️ {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 13,
                background: "linear-gradient(135deg,var(--gpa-accent-25),var(--gpa-accent2-20))",
                border: "1px solid var(--gpa-accent-55)",
                borderRadius: 12,
                color: "var(--gpa-accent)",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: FONT,
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 0 20px var(--gpa-accent-20)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading
                ? "جاري..."
                : mode === "signin"
                  ? "دخول →"
                  : "إنشاء الحساب →"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--gpa-border)" }} />
            <span style={{ fontSize: 11, color: "var(--gpa-text-faintest)" }}>أو</span>
            <div style={{ flex: 1, height: 1, background: "var(--gpa-border)" }} />
          </div>

          {/* OAuth */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => handleOAuth("google")}
              style={{
                padding: 12,
                background: "var(--gpa-surface-alpha-08)",
                border: "1px solid var(--gpa-border)",
                borderRadius: 10,
                color: "var(--gpa-text-soft)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>🇬</span>
              المتابعة بحساب Google
            </button>
            <button
              onClick={() => handleOAuth("apple")}
              style={{
                padding: 12,
                background: "var(--gpa-surface-alpha-08)",
                border: "1px solid var(--gpa-border)",
                borderRadius: 10,
                color: "var(--gpa-text-soft)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>🍎</span>
              المتابعة بحساب Apple
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--gpa-text-ghost)", marginTop: 14 }}>
          بياناتك الأكاديمية تُحفظ بأمان ومرتبطة بحسابك فقط
        </p>
      </div>
    </div>
  );
}
