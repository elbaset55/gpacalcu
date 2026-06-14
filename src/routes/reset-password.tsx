import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    title: "إعادة تعيين كلمة المرور",
    sub: "تتم إدارة كلمات المرور من خلال حسابك على Replit. سجّل الدخول مرة أخرى للوصول إلى حسابك.",
    back: "← العودة لتسجيل الدخول",
    loginBtn: "تسجيل الدخول →",
  },
  en: {
    title: "Password Reset",
    sub: "Passwords are managed through your Replit account. Sign in again to access your account.",
    back: "← Back to sign in",
    loginBtn: "Sign In →",
  },
} as const;

function ResetPasswordPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} style={{ fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <LangSwitcher lang={lang} onChange={setLang} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--gpa-text)" }}>{t.title}</h1>
          <p style={{ fontSize: 13, color: "var(--gpa-text-faint)", margin: "10px 0 20px", lineHeight: 1.6 }}>{t.sub}</p>
          <a
            href="/api/auth/login"
            style={{
              display: "block",
              textAlign: "center",
              padding: 13,
              background: "linear-gradient(135deg,var(--gpa-accent-25),var(--gpa-accent2-20))",
              border: "1px solid var(--gpa-accent-55)",
              borderRadius: 12,
              color: "var(--gpa-accent)",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: FONT,
              textDecoration: "none",
            }}
          >
            {t.loginBtn}
          </a>
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
