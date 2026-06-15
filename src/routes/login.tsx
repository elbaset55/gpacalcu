import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { PremiumControlsBar } from "@/components/gpa/PremiumControls";
import { useLang } from "@/lib/use-lang";
import { Logo } from "@/components/gpa/Logo";
import { AppBackground } from "@/components/gpa/AppBackground";

function sanitizeRedirect(raw: unknown): string {
  const s = typeof raw === "string" ? raw : "/app";
  if (/^\/(?!\/)/.test(s)) return s;
  return "/app";
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: sanitizeRedirect(search.redirect),
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const hasSid = /(?:^|;\s*)termly_sid=/.test(document.cookie);
    if (hasSid) throw redirect({ to: "/app" });
  },
  component: LoginPage,
});

const FONT = "'Plus Jakarta Sans','Manrope','Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    taglineSub: "مستشارك الأكاديمي الذكي",
    loginWith: "تسجيل الدخول بـ",
    replit: "Replit",
    orContinue: "أو تابع بـ",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    signIn: "تسجيل الدخول",
    register: "إنشاء حساب",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    createOne: "أنشئ واحداً",
    signInHere: "سجّل دخولك هنا",
    guest: "تصفح كزائر",
    guestDesc: "بدون تسجيل — البيانات في هذا المتصفح فقط",
    footer: "بياناتك الأكاديمية محفوظة بأمان",
    loading: "جاري...",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "••••••••",
    passMatch: "كلمتا المرور غير متطابقتين",
    minPass: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
  },
  en: {
    taglineSub: "Your Smart Academic Advisor",
    loginWith: "Continue with",
    replit: "Replit",
    orContinue: "or continue with",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    signIn: "Sign in",
    register: "Create account",
    noAccount: "Don't have an account?",
    hasAccount: "Already have one?",
    createOne: "Create one",
    signInHere: "Sign in here",
    guest: "Browse as Guest",
    guestDesc: "No sign-up — data stays in this browser only",
    footer: "Your academic data is securely encrypted",
    loading: "Loading...",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "••••••••",
    passMatch: "Passwords don't match",
    minPass: "Password must be at least 8 characters",
  },
} as const;

type AuthMode = "replit" | "email";
type EmailMode = "login" | "register";

function LoginPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const isDark = theme === "dark";

  const [authMode, setAuthMode] = useState<AuthMode>("replit");
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (emailMode === "register") {
      if (password.length < 8) { setError(t.minPass); return; }
      if (password !== confirmPassword) { setError(t.passMatch); return; }
    }
    setLoading(true);
    try {
      const endpoint = emailMode === "login"
        ? "/api/auth/email/login"
        : "/api/auth/email/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) {
        window.location.href = "/app";
      } else {
        setError(data.error ?? "An error occurred");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const bg: React.CSSProperties = {
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

  const card: React.CSSProperties = {
    background: isDark
      ? "linear-gradient(145deg, rgba(12,15,30,0.96) 0%, rgba(18,23,46,0.92) 100%)"
      : "rgba(255,255,255,0.94)",
    backdropFilter: "blur(28px) saturate(1.6)",
    WebkitBackdropFilter: "blur(28px) saturate(1.6)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}`,
    borderRadius: 22,
    padding: "28px 24px",
    boxShadow: isDark
      ? "0 28px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)"
      : "0 28px 60px rgba(15,23,66,0.12), inset 0 1px 0 rgba(255,255,255,1)",
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px 0",
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    borderRadius: 11,
    transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
    background: active
      ? isDark
        ? "linear-gradient(135deg, rgba(79,255,176,0.15), rgba(124,131,245,0.12))"
        : "white"
      : "transparent",
    color: active
      ? isDark ? "#4fffb0" : "#2054e0"
      : isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,66,0.35)",
    boxShadow: active
      ? isDark
        ? "0 2px 12px rgba(79,255,176,0.12), 0 1px 0 rgba(255,255,255,0.06)"
        : "0 2px 10px rgba(15,23,66,0.10)"
      : "none",
  });

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    fontFamily: FONT,
    fontSize: 14,
    background: isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,66,0.04)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"}`,
    borderRadius: 11,
    color: isDark ? "#e8ecff" : "#0f1545",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const primaryBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "13px 20px",
    background: isDark
      ? "linear-gradient(135deg, #4fffb0 0%, #7c83f5 100%)"
      : "linear-gradient(135deg, #2054e0 0%, #5b60e8 100%)",
    border: "none",
    borderRadius: 13,
    color: isDark ? "#04060e" : "white",
    fontSize: 14,
    fontWeight: 800,
    fontFamily: FONT,
    cursor: loading ? "wait" : "pointer",
    boxShadow: isDark
      ? "0 4px 24px rgba(79,255,176,0.25), 0 2px 8px rgba(0,0,0,0.4)"
      : "0 4px 20px rgba(32,84,224,0.30), 0 2px 8px rgba(32,84,224,0.15)",
    letterSpacing: "0.2px",
    transition: "all 0.25s ease",
    opacity: loading ? 0.75 : 1,
    textDecoration: "none",
  };

  return (
    <div dir={dir} style={bg}>
      <AppBackground theme={theme} variant="login" />

      <div style={{
        width: "100%",
        maxWidth: 420,
        position: "relative",
        zIndex: 1,
        animation: "gpa-fade-in-scale 0.5s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Header row: Logo inline-start ←→ Controls inline-end (mirrors SetupScreen) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          animation: "gpa-fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s both",
        }}>
          {/* Logo + tagline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Logo height={36} />
            <p style={{
              margin: 0,
              fontSize: 11,
              fontFamily: FONT,
              color: isDark ? "rgba(200,210,240,0.38)" : "rgba(15,23,66,0.35)",
              letterSpacing: "0.5px",
              paddingInlineStart: 2,
            }}>{t.taglineSub}</p>
          </div>

          {/* Controls: [🌐 عربي|EN] [☀️🌙🖥] */}
          <PremiumControlsBar
            lang={lang}
            onLangChange={setLang}
            theme={theme}
            onThemeChange={setTheme}
          />
        </div>

        {/* Auth card */}
        <div style={card}>
          {/* Mode tabs */}
          <div style={{
            display: "flex",
            gap: 4,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,66,0.05)",
            borderRadius: 14,
            padding: 4,
            marginBottom: 22,
          }}>
            <button style={tabBtn(authMode === "replit")} onClick={() => setAuthMode("replit")}>
              <ReplitIcon size={13} /> Replit
            </button>
            <button style={tabBtn(authMode === "email")} onClick={() => setAuthMode("email")}>
              ✉️ {t.email}
            </button>
          </div>

          {/* Replit OAuth */}
          {authMode === "replit" && (
            <div style={{ animation: "gpa-tab-in 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
              <p style={{
                margin: "0 0 18px",
                fontSize: 12.5,
                color: isDark ? "rgba(200,210,240,0.5)" : "rgba(15,23,66,0.45)",
                fontFamily: FONT,
                textAlign: "center",
              }}>
                {lang === "ar"
                  ? "سجّل دخولك عبر حسابك على Replit"
                  : "Sign in using your Replit account"}
              </p>
              <a href="/api/auth/login" style={primaryBtn}>
                <ReplitIcon size={17} />
                {t.loginWith} {t.replit}
              </a>
            </div>
          )}

          {/* Email/Password */}
          {authMode === "email" && (
            <form
              onSubmit={handleEmailSubmit}
              style={{ animation: "gpa-tab-in 0.3s cubic-bezier(0.22,1,0.36,1) both", display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: isDark ? "rgba(200,210,240,0.55)" : "rgba(15,23,66,0.5)", letterSpacing: "0.4px" }}>
                  {t.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  required
                  autoComplete="email"
                  style={inp}
                  onFocus={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(79,255,176,0.4)" : "rgba(32,84,224,0.4)"; e.currentTarget.style.boxShadow = isDark ? "0 0 0 3px rgba(79,255,176,0.08)" : "0 0 0 3px rgba(32,84,224,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: isDark ? "rgba(200,210,240,0.55)" : "rgba(15,23,66,0.5)", letterSpacing: "0.4px" }}>
                  {t.password}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  required
                  autoComplete={emailMode === "login" ? "current-password" : "new-password"}
                  style={inp}
                  onFocus={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(79,255,176,0.4)" : "rgba(32,84,224,0.4)"; e.currentTarget.style.boxShadow = isDark ? "0 0 0 3px rgba(79,255,176,0.08)" : "0 0 0 3px rgba(32,84,224,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              {emailMode === "register" && (
                <div style={{ animation: "gpa-fade-in-up 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: isDark ? "rgba(200,210,240,0.55)" : "rgba(15,23,66,0.5)", letterSpacing: "0.4px" }}>
                    {t.confirmPassword}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    required
                    autoComplete="new-password"
                    style={inp}
                    onFocus={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(79,255,176,0.4)" : "rgba(32,84,224,0.4)"; e.currentTarget.style.boxShadow = isDark ? "0 0 0 3px rgba(79,255,176,0.08)" : "0 0 0 3px rgba(32,84,224,0.08)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              )}

              {error && (
                <div style={{
                  padding: "9px 12px",
                  background: isDark ? "rgba(255,107,107,0.10)" : "rgba(212,32,32,0.07)",
                  border: `1px solid ${isDark ? "rgba(255,107,107,0.28)" : "rgba(212,32,32,0.20)"}`,
                  borderRadius: 9,
                  fontSize: 12.5,
                  color: isDark ? "#ff8080" : "#c42020",
                  fontFamily: FONT,
                  animation: "gpa-fade-in-up 0.25s ease both",
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={primaryBtn}>
                {loading ? t.loading : emailMode === "login" ? t.signIn : t.register}
              </button>

              <button
                type="button"
                onClick={() => { setEmailMode(emailMode === "login" ? "register" : "login"); setError(""); setConfirmPassword(""); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: isDark ? "rgba(79,255,176,0.75)" : "rgba(32,84,224,0.75)",
                  fontFamily: FONT,
                  fontWeight: 600,
                  textAlign: "center",
                  padding: "4px 0 0",
                  letterSpacing: "0.1px",
                }}
              >
                {emailMode === "login" ? `${t.noAccount} ${t.createOne}` : `${t.hasAccount} ${t.signInHere}`}
              </button>
            </form>
          )}
        </div>

        {/* Guest mode */}
        <div style={{
          marginTop: 14,
          animation: "gpa-fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.25s both",
        }}>
          <a
            href="/guest"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "11px 16px",
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,66,0.04)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,66,0.10)"}`,
              borderRadius: 13,
              color: isDark ? "rgba(200,210,240,0.55)" : "rgba(15,23,66,0.5)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONT,
              textDecoration: "none",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition: "all 0.22s ease",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 15 }}>👤</span>
            {t.guest}
          </a>
          <p style={{
            margin: "6px 0 0",
            fontSize: 11,
            color: isDark ? "rgba(200,210,240,0.3)" : "rgba(15,23,66,0.3)",
            fontFamily: FONT,
            textAlign: "center",
          }}>
            {t.guestDesc}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          marginTop: 18,
          animation: "gpa-fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.35s both",
        }}>
          <span style={{ fontSize: 11, color: isDark ? "rgba(79,255,176,0.4)" : "rgba(32,84,224,0.35)" }}>🔒</span>
          <p style={{ margin: 0, fontSize: 10.5, color: isDark ? "rgba(200,210,240,0.28)" : "rgba(15,23,66,0.28)", fontFamily: FONT }}>
            {t.footer}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes gpa-fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gpa-fade-in-scale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gpa-tab-in {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function ReplitIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3zm10 0h8v8h-8zm0 10h8v8h-8zM3 13h8v8H3z" />
    </svg>
  );
}
