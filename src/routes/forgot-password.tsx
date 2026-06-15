import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { useLang } from "@/lib/use-lang";
import { PremiumControlsBar } from "@/components/gpa/PremiumControls";
import { Logo } from "@/components/gpa/Logo";
import { AppBackground } from "@/components/gpa/AppBackground";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const FONT = "'Plus Jakarta Sans','Manrope','Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    title: "نسيت كلمة المرور؟",
    sub: "أدخل بريدك الإلكتروني لإظهار رابط إعادة التعيين مباشرةً على الشاشة.",
    onlyEmail: "هذه الخاصية متاحة فقط للحسابات المسجَّلة بالبريد الإلكتروني.",
    emailLabel: "البريد الإلكتروني",
    placeholder: "example@mail.com",
    submit: "الحصول على رابط الإعادة",
    loading: "جارٍ التحقق...",
    linkReady: "✅ رابطك جاهز!",
    linkReadySub: "انقر على الزر أدناه لإعادة تعيين كلمة مرورك. الرابط صالح لمدة ساعة واحدة.",
    resetBtn: "إعادة تعيين كلمة المرور ←",
    noAccount: "إذا كان هذا البريد مسجَّلاً بكلمة مرور، سيظهر الرابط هنا.",
    back: "← العودة لتسجيل الدخول",
  },
  en: {
    title: "Forgot your password?",
    sub: "Enter your email and we'll show your reset link right here on this page.",
    onlyEmail: "Password reset is only available for email/password accounts.",
    emailLabel: "Email address",
    placeholder: "example@mail.com",
    submit: "Get reset link",
    loading: "Checking...",
    linkReady: "✅ Your link is ready!",
    linkReadySub: "Click below to set a new password. The link expires in 1 hour.",
    resetBtn: "Reset my password →",
    noAccount: "If this email is registered with a password, the link will appear here.",
    back: "← Back to sign in",
  },
} as const;

function ForgotPasswordPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setServerError("");
    try {
      const res = await fetch("/api/auth/email/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; token?: string | null; error?: string };
      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "Request failed");
        setStatus("idle");
        return;
      }
      setResetToken(data.token ?? null);
      setStatus("done");
    } catch {
      setServerError("Network error — please try again.");
      setStatus("idle");
    }
  }

  const card: React.CSSProperties = {
    background: isDark ? "rgba(20,22,48,0.82)" : "rgba(255,255,255,0.92)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.10)"}`,
    borderRadius: 20,
    padding: "26px 24px",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: isDark
      ? "0 24px 60px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.05) inset"
      : "0 16px 48px rgba(15,23,66,0.13), 0 1px 0 rgba(255,255,255,1) inset",
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,66,0.04)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"}`,
    borderRadius: 12,
    color: "var(--gpa-text)",
    fontSize: 14,
    fontFamily: FONT,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const primaryBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "13px 16px",
    background: "var(--gpa-accent)",
    border: "none",
    borderRadius: 13,
    color: isDark ? "#0a0e24" : "#fff",
    fontSize: 14,
    fontWeight: 800,
    fontFamily: FONT,
    cursor: status === "loading" ? "wait" : "pointer",
    opacity: status === "loading" ? 0.7 : 1,
    letterSpacing: "0.2px",
    transition: "opacity 0.2s",
    textDecoration: "none",
  };

  return (
    <div
      dir={dir}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "var(--gpa-bg)",
        fontFamily: FONT,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AppBackground theme={theme} variant="login" />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "gpa-fade-in-scale 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Logo height={36} />
            <p style={{ margin: 0, fontSize: 11, fontFamily: FONT, color: isDark ? "rgba(200,210,240,0.38)" : "rgba(15,23,66,0.35)", letterSpacing: "0.5px", paddingInlineStart: 2 }}>
              {lang === "ar" ? "خطط · تتبع · تفوق" : "Plan · Track · Excel"}
            </p>
          </div>
          <PremiumControlsBar lang={lang} onLangChange={setLang} theme={theme} onThemeChange={setTheme} />
        </div>

        <div style={card}>
          <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "var(--gpa-text)" }}>{t.title}</h1>
          <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "var(--gpa-text-faint)", lineHeight: 1.6 }}>{t.sub}</p>
          <p style={{ margin: "0 0 18px", fontSize: 11.5, color: isDark ? "rgba(124,131,245,0.7)" : "rgba(32,84,224,0.6)", lineHeight: 1.5 }}>ℹ️ {t.onlyEmail}</p>

          {status !== "done" ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: isDark ? "rgba(200,210,240,0.55)" : "rgba(15,23,66,0.5)", letterSpacing: "0.4px" }}>
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.placeholder}
                  required
                  autoComplete="email"
                  style={inp}
                  onFocus={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(79,255,176,0.4)" : "rgba(32,84,224,0.4)"; e.currentTarget.style.boxShadow = isDark ? "0 0 0 3px rgba(79,255,176,0.08)" : "0 0 0 3px rgba(32,84,224,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {serverError && (
                <div style={{ padding: "9px 12px", background: isDark ? "rgba(255,107,107,0.10)" : "rgba(212,32,32,0.07)", border: `1px solid ${isDark ? "rgba(255,107,107,0.28)" : "rgba(212,32,32,0.20)"}`, borderRadius: 9, fontSize: 12.5, color: isDark ? "#ff8080" : "#c42020", fontFamily: FONT }}>
                  ⚠️ {serverError}
                </div>
              )}

              <button type="submit" disabled={status === "loading"} style={primaryBtn}>
                {status === "loading" ? t.loading : t.submit}
              </button>
            </form>
          ) : (
            <div style={{ animation: "gpa-fade-in-up 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
              {resetToken ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--gpa-accent)", marginBottom: 8 }}>{t.linkReady}</div>
                  <p style={{ fontSize: 12.5, color: "var(--gpa-text-faint)", marginBottom: 18, lineHeight: 1.6 }}>{t.linkReadySub}</p>
                  <a href={`/reset-password?token=${resetToken}`} style={primaryBtn}>{t.resetBtn}</a>
                </>
              ) : (
                <p style={{ fontSize: 13, color: "var(--gpa-text-faint)", lineHeight: 1.7, textAlign: "center", padding: "8px 0" }}>
                  {t.noAccount}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/login" search={{ redirect: "/app" }} style={{ fontSize: 12, color: isDark ? "rgba(79,255,176,0.6)" : "rgba(32,84,224,0.6)", textDecoration: "none", fontWeight: 600, fontFamily: FONT }}>
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
