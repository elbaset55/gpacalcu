import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";
import { useLang } from "@/lib/use-lang";
import { Logo } from "@/components/gpa/Logo";
import { AppBackground } from "@/components/gpa/AppBackground";

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

const FONT = "'Plus Jakarta Sans','Manrope','Cairo','Noto Sans Arabic',sans-serif";
const FONT_CAIRO = "'Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    tagline: "خطط · تتبع · تفوق",
    taglineSub: "مستشارك الأكاديمي الذكي",
    signin: "تسجيل الدخول",
    signup: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordHint: "٦ أحرف على الأقل",
    loading: "جاري...",
    btnIn: "دخول",
    btnUp: "إنشاء الحساب",
    or: "أو تابع بـ",
    google: "Google",
    apple: "Apple",
    footer: "بياناتك الأكاديمية محفوظة بأمان",
    err: "حدث خطأ",
    oauthErr: "فشل تسجيل الدخول",
    forgot: "نسيت كلمة المرور؟",
    welcomeBack: "مرحباً بعودتك 👋",
    getStarted: "ابدأ رحلتك الأكاديمية ✨",
    statLabel1: "طالب نشط",
    statLabel2: "معدل محسّن",
    statLabel3: "توصية ذكية",
    feature1: "تحليل كشف الدرجات بالذكاء الاصطناعي",
    feature2: "تتبع المعدل التراكمي فصل بفصل",
    feature3: "مستشار أكاديمي متاح 24/7",
  },
  en: {
    tagline: "Plan · Track · Excel",
    taglineSub: "Your Smart Academic Advisor",
    signin: "Sign In",
    signup: "Create Account",
    email: "Email address",
    password: "Password",
    passwordHint: "Min. 6 characters",
    loading: "Loading...",
    btnIn: "Sign In",
    btnUp: "Create Account",
    or: "or continue with",
    google: "Google",
    apple: "Apple",
    footer: "Your academic data is securely encrypted",
    err: "An error occurred",
    oauthErr: "Sign in failed",
    forgot: "Forgot password?",
    welcomeBack: "Welcome back 👋",
    getStarted: "Start your journey ✨",
    statLabel1: "Active Students",
    statLabel2: "GPA Improved",
    statLabel3: "AI Advice",
    feature1: "AI Transcript Analysis",
    feature2: "Semester-by-semester GPA tracking",
    feature3: "24/7 Smart Academic Advisor",
  },
} as const;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.98 10.72A5.41 5.41 0 0 1 3.7 9c0-.6.1-1.18.28-1.72V4.94H.96A9.009 9.009 0 0 0 0 9c0 1.45.35 2.82.96 4.06l3.02-2.34z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.94L3.98 7.28C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="20" viewBox="0 0 17 20" fill="currentColor">
      <path d="M13.83 10.63c-.02-2.2 1.8-3.27 1.88-3.32-1.03-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.8-3.33.8-.68 0-1.73-.78-2.85-.76-1.46.02-2.81.85-3.57 2.16-1.52 2.64-.39 6.55 1.09 8.7.73 1.04 1.59 2.21 2.72 2.17 1.1-.04 1.51-.7 2.84-.7 1.32 0 1.7.7 2.84.68 1.18-.02 1.92-1.07 2.64-2.12.84-1.21 1.18-2.39 1.2-2.45-.03-.01-2.3-.88-2.28-3.44z"/>
      <path d="M11.6 3.37c.6-.74 1.01-1.76.9-2.78-.87.04-1.92.58-2.55 1.32-.56.65-1.05 1.69-.92 2.69.97.07 1.96-.5 2.57-1.23z"/>
    </svg>
  );
}


function StatBadge({ value, label, color, delay }: { value: string; label: string; color: string; delay: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 16px",
      background: "var(--gpa-glass)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid var(--gpa-glass-border)",
      borderRadius: 14,
      animation: `gpa-fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${delay} both`,
    }}>
      <span style={{ fontSize: 18, fontWeight: 900, color, fontFamily: FONT, letterSpacing: "-0.5px" }}>{value}</span>
      <span style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT }}>{label}</span>
    </div>
  );
}

function FeatureRow({ icon, text, delay }: { icon: string; text: string; delay: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      animation: `gpa-fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) ${delay} both`,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: "var(--gpa-accent-15)",
        border: "1px solid var(--gpa-accent-33)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        flexShrink: 0,
      }}>{icon}</div>
      <span style={{ fontSize: 13, color: "var(--gpa-text-soft)", fontFamily: FONT }}>{text}</span>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

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
      setErr(e.message || t.err);
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
      setErr((result.error as Error).message || t.oauthErr);
      return;
    }
    if (result.redirected) return;
    navigate({ to: redirectTo as "/app" });
  };

  const bgStyle: React.CSSProperties = {
    fontFamily: FONT,
    minHeight: "100vh",
    background: isDark
      ? "linear-gradient(135deg, #03040d 0%, #07091a 40%, #0b0a1f 70%, #050612 100%)"
      : "linear-gradient(135deg, #f0f3ff 0%, #e8eeff 40%, #f4f2ff 70%, #eef1ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 16px",
    position: "relative",
    overflow: "hidden",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,66,0.12)"}`,
    borderRadius: 12,
    color: "var(--gpa-text-strong)",
    fontSize: 14,
    fontFamily: FONT,
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  };

  const cardBg: React.CSSProperties = {
    background: isDark
      ? "linear-gradient(145deg, rgba(12,15,30,0.95) 0%, rgba(18,23,46,0.9) 100%)"
      : "rgba(255,255,255,0.94)",
    backdropFilter: "blur(24px) saturate(1.6)",
    WebkitBackdropFilter: "blur(24px) saturate(1.6)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)"}`,
    borderRadius: 24,
    padding: "28px 26px",
    boxShadow: isDark
      ? "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(79,255,176,0.04), inset 0 1px 0 rgba(255,255,255,0.06)"
      : "0 24px 60px rgba(15,23,66,0.12), 0 8px 24px rgba(15,23,66,0.06), inset 0 1px 0 rgba(255,255,255,1)",
  };

  return (
    <div dir={dir} style={bgStyle}>
      <AppBackground theme={theme} variant="login" />

      <div style={{
        width: "100%",
        maxWidth: 440,
        position: "relative",
        zIndex: 1,
        animation: "gpa-fade-in-scale 0.5s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Top bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}>
          <LangSwitcher lang={lang} onChange={setLang} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>

        {/* Logo & Tagline */}
        <div style={{
          textAlign: "center",
          marginBottom: 28,
          animation: "gpa-fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Logo height={42} />
          </div>
          <p style={{
            margin: 0,
            fontSize: 13,
            fontFamily: FONT,
            color: "var(--gpa-text-faint)",
            letterSpacing: "0.4px",
          }}>{t.taglineSub}</p>
        </div>

        {/* Auth Card */}
        <div style={cardBg}>
          {/* Mode tabs */}
          <div style={{
            display: "flex",
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,66,0.05)",
            borderRadius: 14,
            padding: 4,
            marginBottom: 24,
            gap: 4,
          }}>
            {(["signin", "signup"] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErr(""); }}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    background: active
                      ? isDark
                        ? "linear-gradient(135deg, rgba(79,255,176,0.14), rgba(124,131,245,0.10))"
                        : "white"
                      : "transparent",
                    border: active
                      ? `1px solid ${isDark ? "rgba(79,255,176,0.25)" : "rgba(15,23,66,0.10)"}`
                      : "1px solid transparent",
                    borderRadius: 10,
                    color: active ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: FONT,
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: active && !isDark ? "0 2px 8px rgba(15,23,66,0.08)" : "none",
                  }}
                >
                  {m === "signin" ? t.signin : t.signup}
                </button>
              );
            })}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              fontFamily: "'Sora'," + FONT,
              color: "var(--gpa-text-strong)",
              letterSpacing: "-0.4px",
            }}>
              {mode === "signin" ? t.welcomeBack : t.getStarted}
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Email */}
            <div style={{ position: "relative" }}>
              <input
                ref={emailRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.email}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--gpa-accent-44)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--gpa-accent-10)";
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "white";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,66,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`${t.password} — ${t.passwordHint}`}
                style={{ ...inputStyle, paddingInlineEnd: 48 }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--gpa-accent-44)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--gpa-accent-10)";
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "white";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,66,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute",
                  top: "50%",
                  insetInlineEnd: 14,
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--gpa-text-faint)",
                  fontSize: 15,
                  padding: "2px 4px",
                  lineHeight: 1,
                }}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>

            {/* Error */}
            {err && (
              <div style={{
                background: "var(--gpa-danger-15)",
                border: "1px solid var(--gpa-danger-33)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--gpa-danger)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                animation: "gpa-fade-in-up 0.3s ease both",
              }}>
                <span>⚠️</span>
                <span>{err}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "13px 20px",
                background: loading
                  ? "var(--gpa-surface-alpha-08)"
                  : isDark
                    ? "linear-gradient(135deg, #4fffb0 0%, #7c83f5 100%)"
                    : "linear-gradient(135deg, #2054e0 0%, #5b60e8 100%)",
                border: "none",
                borderRadius: 13,
                color: loading ? "var(--gpa-text-faint)" : isDark ? "#04060e" : "white",
                fontSize: 14,
                fontWeight: 800,
                fontFamily: FONT,
                cursor: loading ? "wait" : "pointer",
                boxShadow: loading ? "none" : isDark
                  ? "0 4px 24px rgba(79,255,176,0.25), 0 2px 8px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(32,84,224,0.30), 0 2px 8px rgba(32,84,224,0.15)",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.25s ease",
                letterSpacing: "0.2px",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 8px 32px rgba(79,255,176,0.35), 0 2px 8px rgba(0,0,0,0.5)"
                    : "0 8px 28px rgba(32,84,224,0.40), 0 2px 8px rgba(32,84,224,0.20)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = loading ? "none" : isDark
                  ? "0 4px 24px rgba(79,255,176,0.25), 0 2px 8px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(32,84,224,0.30), 0 2px 8px rgba(32,84,224,0.15)";
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "gpa-spin 0.7s linear infinite" }} />
                  {t.loading}
                </span>
              ) : (
                mode === "signin" ? `${t.btnIn} →` : `${t.btnUp} →`
              )}
            </button>

            {mode === "signin" && (
              <Link
                to="/forgot-password"
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--gpa-text-faint)",
                  textDecoration: "none",
                  marginTop: -4,
                  transition: "color 0.2s",
                  fontFamily: FONT,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gpa-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gpa-text-faint)"; }}
              >
                {t.forgot}
              </Link>
            )}
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,66,0.08)" }} />
            <span style={{ fontSize: 11, color: "var(--gpa-text-faintest)", fontFamily: FONT, whiteSpace: "nowrap" }}>{t.or}</span>
            <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,66,0.08)" }} />
          </div>

          {/* OAuth buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { provider: "google" as const, icon: <GoogleIcon />, label: t.google },
              { provider: "apple" as const, icon: <AppleIcon />, label: t.apple },
            ].map(({ provider, icon, label }) => (
              <button
                key={provider}
                onClick={() => handleOAuth(provider)}
                style={{
                  flex: 1,
                  padding: "11px 12px",
                  background: isDark ? "rgba(255,255,255,0.05)" : "white",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"}`,
                  borderRadius: 12,
                  color: "var(--gpa-text-soft)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: FONT,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                  boxShadow: isDark ? "none" : "0 1px 4px rgba(15,23,66,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.09)" : "#f8faff";
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.16)" : "rgba(32,84,224,0.20)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "white";
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginTop: 20,
          animation: "gpa-fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.3s both",
        }}>
          <span style={{ fontSize: 12, color: isDark ? "rgba(79,255,176,0.5)" : "rgba(32,84,224,0.4)" }}>🔒</span>
          <p style={{ margin: 0, fontSize: 11, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>{t.footer}</p>
        </div>
      </div>

      <style>{`
        @keyframes gpa-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gpa-fade-in-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gpa-fade-in-scale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gpa-orb-drift {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          25% { transform: translate(30px, -40px) scale(1.1); }
          50% { transform: translate(-20px, -20px) scale(0.9); }
          75% { transform: translate(10px, 30px) scale(1.05); }
        }
        @keyframes gpa-orb-drift2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          25% { transform: translate(-40px, 20px) scale(0.9); }
          50% { transform: translate(20px, 40px) scale(1.1); }
          75% { transform: translate(-10px, -30px) scale(0.95); }
        }
        @keyframes gpa-orb-drift3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -10px) scale(1.15); }
          66% { transform: translate(-30px, 40px) scale(0.85); }
        }
      `}</style>
    </div>
  );
}
