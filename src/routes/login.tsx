import { createFileRoute, redirect } from "@tanstack/react-router";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";
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
    if (hasSid) {
      throw redirect({ to: "/app" });
    }
  },
  component: LoginPage,
});

const FONT = "'Plus Jakarta Sans','Manrope','Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    taglineSub: "مستشارك الأكاديمي الذكي",
    signin: "تسجيل الدخول",
    footer: "بياناتك الأكاديمية محفوظة بأمان",
    loginBtn: "تسجيل الدخول →",
    loginDesc: "سجّل دخولك للوصول إلى تطبيق Termly الأكاديمي",
  },
  en: {
    taglineSub: "Your Smart Academic Advisor",
    signin: "Sign In",
    footer: "Your academic data is securely encrypted",
    loginBtn: "Sign In →",
    loginDesc: "Sign in to access your Termly academic advisor",
  },
} as const;

function LoginPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const isDark = theme === "dark";

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
      ? "0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)"
      : "0 24px 60px rgba(15,23,66,0.12), inset 0 1px 0 rgba(255,255,255,1)",
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
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}>
          <LangSwitcher lang={lang} onChange={setLang} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>

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

        <div style={cardBg}>
          <p style={{
            margin: "0 0 20px",
            fontSize: 13,
            color: "var(--gpa-text-faint)",
            fontFamily: FONT,
            textAlign: "center",
          }}>{t.loginDesc}</p>

          <a
            href="/api/auth/login"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
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
              cursor: "pointer",
              boxShadow: isDark
                ? "0 4px 24px rgba(79,255,176,0.25), 0 2px 8px rgba(0,0,0,0.4)"
                : "0 4px 20px rgba(32,84,224,0.30), 0 2px 8px rgba(32,84,224,0.15)",
              textDecoration: "none",
              letterSpacing: "0.2px",
              transition: "all 0.25s ease",
            }}
          >
            <ReplitIcon />
            {t.loginBtn}
          </a>
        </div>

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
        @keyframes gpa-fade-in-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gpa-fade-in-scale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function ReplitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3zm10 0h8v8h-8zm0 10h8v8h-8zM3 13h8v8H3z"/>
    </svg>
  );
}
