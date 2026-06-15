import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

function ResetPasswordPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  return (
    <div dir={dir} style={{ fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <LangSwitcher lang={lang} onChange={setLang} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: 22 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--gpa-text)" }}>
            {ar ? "تغيير كلمة المرور" : "Change Password"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--gpa-text-faint)", margin: "10px 0 18px", lineHeight: 1.7 }}>
            {ar
              ? "Termly يستخدم تسجيل الدخول عبر Google — لا توجد كلمة مرور مستقلة. يمكنك تغيير كلمة مرور Google من إعدادات حساب Google الخاص بك."
              : "Termly uses Google sign-in — there's no separate password. You can change your Google account password from Google's account settings."}
          </p>
          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              background: "var(--gpa-accent-12)",
              border: "1px solid var(--gpa-accent-44)",
              borderRadius: 10,
              color: "var(--gpa-accent)",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: FONT,
              textDecoration: "none",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {ar ? "إعدادات حساب Google ↗" : "Google Account Settings ↗"}
          </a>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Link to="/login" search={{ redirect: "/login", error: undefined }} style={{ fontSize: 12, color: "var(--gpa-text-faint)", textDecoration: "none" }}>
              {ar ? "→ العودة لتسجيل الدخول" : "← Back to sign in"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
