import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { AppBackground } from "@/components/gpa/AppBackground";
import { Logo } from "@/components/gpa/Logo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const FONT = "'Cairo','Manrope','Noto Sans Arabic',sans-serif";
const FONT_EN = "'Manrope','Sora',sans-serif";

function ResetPasswordPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const isDark = theme === "dark";

  const TEXT = isDark ? "#e8ecff" : "#0f1545";
  const MUTED = isDark ? "rgba(200,210,240,0.45)" : "rgba(15,23,66,0.45)";
  const CARD = isDark
    ? "linear-gradient(145deg,rgba(12,15,30,0.97),rgba(18,23,46,0.93))"
    : "rgba(255,255,255,0.97)";
  const CARD_BORDER = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)";
  const ACCENT = isDark ? "#4fffb0" : "#2054e0";
  const BG = isDark
    ? "linear-gradient(135deg,#03040d 0%,#07091a 45%,#0b0a1f 100%)"
    : "linear-gradient(135deg,#eef1ff 0%,#e8edff 50%,#f0f3ff 100%)";

  return (
    <div dir={dir} style={{ fontFamily: ar ? FONT : FONT_EN, minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", position: "relative", overflow: "hidden" }}>
      <AppBackground theme={theme} variant="login" />

      <style>{`
        @keyframes rp-in { from { opacity:0; transform:translateY(22px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, animation: "rp-in 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
          <Logo height={36} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setLang(ar ? "en" : "ar")}
              style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,66,0.06)", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,66,0.12)"}`, borderRadius: 9, cursor: "pointer", padding: "5px 12px", fontSize: 12, fontWeight: 700, color: TEXT, fontFamily: ar ? FONT : FONT_EN }}
            >
              {ar ? "EN" : "عربي"}
            </button>
            <div style={{ display: "flex", gap: 2, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,66,0.06)", borderRadius: 10, padding: 3 }}>
              {(["light", "dark", "hc"] as const).map((v) => (
                <button key={v} onClick={() => setTheme(v)} style={{ background: theme === v ? (isDark ? "rgba(79,255,176,0.15)" : "rgba(255,255,255,0.9)") : "transparent", border: "none", cursor: "pointer", borderRadius: 7, padding: "5px 8px", fontSize: 13 }}>
                  {v === "light" ? "☀️" : v === "dark" ? "🌙" : "🖥"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: CARD, backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)",
          border: `1px solid ${CARD_BORDER}`, borderRadius: 24, padding: "32px 28px",
          boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 24px 60px rgba(15,23,66,0.13), inset 0 1px 0 rgba(255,255,255,1)",
          animation: "rp-in 0.55s 0.1s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          {/* Icon */}
          <div style={{ width: 56, height: 56, borderRadius: 16, background: isDark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)", border: `1px solid rgba(168,85,247,0.22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 20px" }}>
            🔒
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: TEXT, fontFamily: ar ? FONT : FONT_EN }}>
              {ar ? "تغيير كلمة المرور" : "Change Password"}
            </h1>
            <p style={{ fontSize: 13, color: MUTED, margin: "8px 0 0", fontFamily: ar ? FONT : FONT_EN, lineHeight: 1.7 }}>
              {ar
                ? "Termly يستخدم تسجيل الدخول عبر Google أو Replit — لا توجد كلمة مرور مستقلة في Termly."
                : "Termly uses Google or Replit sign-in — there is no separate Termly password to change."}
            </p>
          </div>

          {/* Info box */}
          <div style={{ background: isDark ? "rgba(168,85,247,0.07)" : "rgba(168,85,247,0.05)", border: `1px solid rgba(168,85,247,0.18)`, borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: isDark ? "rgba(216,180,254,0.85)" : "#7c3aed", fontFamily: ar ? FONT : FONT_EN, lineHeight: 1.6 }}>
              💡 {ar
                ? "لتغيير كلمة مرور Google، توجه إلى إعدادات حساب Google. ستستمر في الوصول إلى Termly بحسابك الحالي."
                : "To change your Google password, go to Google Account settings. You'll continue accessing Termly with your current account."}
            </div>
          </div>

          {/* Google Settings CTA */}
          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "13px 16px",
              background: isDark ? "rgba(255,255,255,0.07)" : "#fff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(15,23,66,0.16)"}`,
              borderRadius: 14, textDecoration: "none",
              color: isDark ? "rgba(255,255,255,0.9)" : "#0f1545",
              fontSize: 14, fontWeight: 700, fontFamily: ar ? FONT : FONT_EN,
              boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 2px 8px rgba(15,23,66,0.09)",
              marginBottom: 20,
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {ar ? "إعدادات حساب Google ↗" : "Google Account Settings ↗"}
          </a>

          <div style={{ textAlign: "center" }}>
            <Link to="/login" search={{ redirect: "/login", error: undefined }} style={{ fontSize: 13, color: MUTED, textDecoration: "none", fontFamily: ar ? FONT : FONT_EN, fontWeight: 600 }}>
              {ar ? "→ العودة لتسجيل الدخول" : "← Back to sign in"}
            </Link>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: isDark ? "rgba(200,210,240,0.3)" : "rgba(15,23,66,0.3)", fontFamily: ar ? FONT : FONT_EN, animation: "rp-in 0.5s 0.3s both" }}>
          🔒 {ar ? "بياناتك الأكاديمية محفوظة بأمان" : "Your academic data is stored securely"}
        </p>
      </div>
    </div>
  );
}
