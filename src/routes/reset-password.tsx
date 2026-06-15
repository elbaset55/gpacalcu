import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { useLang } from "@/lib/use-lang";
import { PremiumControlsBar } from "@/components/gpa/PremiumControls";
import { Logo } from "@/components/gpa/Logo";
import { AppBackground } from "@/components/gpa/AppBackground";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : "" }),
  component: ResetPasswordPage,
});

const FONT = "'Plus Jakarta Sans','Manrope','Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    title: "تعيين كلمة مرور جديدة",
    sub: "اختر كلمة مرور قوية لحسابك.",
    noToken: "الرابط غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً.",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    submit: "حفظ كلمة المرور",
    loading: "جارٍ الحفظ...",
    mismatch: "كلمتا المرور غير متطابقتين.",
    short: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
    success: "✅ تم تغيير كلمة مرورك بنجاح!",
    successSub: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
    loginBtn: "تسجيل الدخول ←",
    getLink: "الحصول على رابط جديد",
    back: "← العودة",
  },
  en: {
    title: "Set a new password",
    sub: "Choose a strong password for your account.",
    noToken: "This link is invalid or has expired. Request a new one.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    submit: "Save password",
    loading: "Saving...",
    mismatch: "Passwords do not match.",
    short: "Password must be at least 8 characters.",
    success: "✅ Password changed successfully!",
    successSub: "You can now sign in with your new password.",
    loginBtn: "Sign in →",
    getLink: "Get a new link",
    back: "← Back",
  },
} as const;

function ResetPasswordPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const isDark = theme === "dark";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError(t.short); return; }
    if (password !== confirm) { setError(t.mismatch); return; }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/email/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Reset failed");
        setStatus("idle");
        return;
      }
      setStatus("success");
      setTimeout(() => navigate({ to: "/login", search: { redirect: "/app" } }), 2500);
    } catch {
      setError("Network error — please try again.");
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
          {!token ? (
            /* No token in URL */
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--gpa-danger, #e53e3e)", marginBottom: 18 }}>⚠️ {t.noToken}</p>
              <a href="/forgot-password" style={primaryBtn}>{t.getLink}</a>
            </div>
          ) : status === "success" ? (
            /* Success state */
            <div style={{ textAlign: "center", animation: "gpa-fade-in-up 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "var(--gpa-accent)", marginBottom: 8 }}>{t.success}</div>
              <p style={{ fontSize: 13, color: "var(--gpa-text-faint)", marginBottom: 20 }}>{t.successSub}</p>
              <a href="/login" style={primaryBtn}>{t.loginBtn}</a>
            </div>
          ) : (
            /* Reset form */
            <>
              <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "var(--gpa-text)" }}>{t.title}</h1>
              <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "var(--gpa-text-faint)", lineHeight: 1.6 }}>{t.sub}</p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: isDark ? "rgba(200,210,240,0.55)" : "rgba(15,23,66,0.5)", letterSpacing: "0.4px" }}>
                    {t.newPassword}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={inp}
                    onFocus={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(79,255,176,0.4)" : "rgba(32,84,224,0.4)"; e.currentTarget.style.boxShadow = isDark ? "0 0 0 3px rgba(79,255,176,0.08)" : "0 0 0 3px rgba(32,84,224,0.08)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: isDark ? "rgba(200,210,240,0.55)" : "rgba(15,23,66,0.5)", letterSpacing: "0.4px" }}>
                    {t.confirmPassword}
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={inp}
                    onFocus={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(79,255,176,0.4)" : "rgba(32,84,224,0.4)"; e.currentTarget.style.boxShadow = isDark ? "0 0 0 3px rgba(79,255,176,0.08)" : "0 0 0 3px rgba(32,84,224,0.08)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,66,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {error && (
                  <div style={{ padding: "9px 12px", background: isDark ? "rgba(255,107,107,0.10)" : "rgba(212,32,32,0.07)", border: `1px solid ${isDark ? "rgba(255,107,107,0.28)" : "rgba(212,32,32,0.20)"}`, borderRadius: 9, fontSize: 12.5, color: isDark ? "#ff8080" : "#c42020", fontFamily: FONT }}>
                    ⚠️ {error}
                  </div>
                )}

                <button type="submit" disabled={status === "loading"} style={primaryBtn}>
                  {status === "loading" ? t.loading : t.submit}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a href="/login" style={{ fontSize: 12, color: isDark ? "rgba(79,255,176,0.6)" : "rgba(32,84,224,0.6)", textDecoration: "none", fontWeight: 600, fontFamily: FONT }}>
            {t.back}
          </a>
        </div>
      </div>
    </div>
  );
}
