import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    title: "نسيت كلمة المرور؟",
    sub: "أدخل بريدك وسنرسل لك رابط إعادة التعيين إن كان مسجلاً لدينا",
    email: "البريد الإلكتروني",
    submit: "إرسال الرابط",
    loading: "جاري الإرسال...",
    sent: "✓ إذا كان البريد مسجلاً، ستصلك رسالة — افحص بريدك وملف السبام",
    back: "← العودة لتسجيل الدخول",
  },
  en: {
    title: "Forgot password?",
    sub: "Enter your email and we'll send a reset link if an account exists",
    email: "Email address",
    submit: "Send reset link",
    loading: "Sending...",
    sent: "✓ If that email is registered, a link is on its way — check your inbox and spam folder",
    back: "← Back to sign in",
  },
} as const;

function ForgotPasswordPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // Intentionally swallow all errors to prevent account enumeration
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  return (
    <div dir={dir} style={{ fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <LangSwitcher lang={lang} onChange={setLang} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--gpa-text)" }}>{t.title}</h1>
          <p style={{ fontSize: 12, color: "var(--gpa-text-faint)", margin: "8px 0 18px" }}>{t.sub}</p>

          {done ? (
            <div style={{ background: "var(--gpa-accent-12)", border: "1px solid var(--gpa-accent-44)", color: "var(--gpa-accent)", padding: 12, borderRadius: 10, fontSize: 13 }}>
              {t.sent}
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.email}
                style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 10, color: "var(--gpa-text-strong)", padding: "12px 14px", fontSize: 14, fontFamily: FONT, width: "100%", boxSizing: "border-box" }}
              />
              <button type="submit" disabled={loading} style={{ padding: 13, background: "linear-gradient(135deg,var(--gpa-accent-25),var(--gpa-accent2-20))", border: "1px solid var(--gpa-accent-55)", borderRadius: 12, color: "var(--gpa-accent)", fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? t.loading : t.submit}
              </button>
            </form>
          )}

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Link to="/login" search={{ redirect: "/app" }} style={{ fontSize: 12, color: "var(--gpa-text-faint)", textDecoration: "none" }}>
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
