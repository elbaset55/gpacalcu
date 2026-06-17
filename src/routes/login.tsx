import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useGpaTheme } from "@/components/gpa/use-theme";
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
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const hasSid = /(?:^|;\s*)termly_sid=/.test(document.cookie);
    if (hasSid) throw redirect({ to: "/app" });
  },
  component: LoginPage,
});

const FONT = "'Cairo','Manrope','Noto Sans Arabic',sans-serif";
const FONT_EN = "'Manrope','Cairo',sans-serif";

const T = {
  ar: {
    tagline: "مستشارك الأكاديمي الذكي",
    heroTitle: "وصّل مسيرتك\nالأكاديمية",
    heroSub: "تتبّع معدلاتك، خطّط لفصولك، واحصل على توصيات ذكية مخصصة لك",
    feature1: "حساب المعدل الفوري",
    feature1Desc: "احسب GPA بدقة عالية مع دعم أنظمة التقدير المختلفة",
    feature2: "تحليل الأداء الأكاديمي",
    feature2Desc: "رسوم بيانية وتقارير تفصيلية لمسيرتك الجامعية",
    feature3: "خطة تخرج ذكية",
    feature3Desc: "تنبؤات دقيقة وأهداف قابلة للتحقيق لكل فصل",
    authTitle: "ابدأ الآن",
    authSub: "اختر طريقة تسجيل الدخول المناسبة لك",
    withGoogle: "متابعة بـ Google",
    withReplit: "متابعة بـ Replit",
    orEmail: "أو عبر البريد الإلكتروني",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    signIn: "تسجيل الدخول",
    register: "إنشاء حساب جديد",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    createOne: "أنشئ واحداً الآن",
    signInHere: "سجّل دخولك",
    forgotPassword: "نسيت كلمة المرور؟",
    guest: "تصفح كزائر بدون تسجيل",
    guestDesc: "البيانات تُحفظ في المتصفح فقط",
    footer: "بياناتك الأكاديمية محفوظة بأمان",
    loading: "جاري...",
    emailPH: "you@example.com",
    passPH: "8 أحرف على الأقل",
    passMatch: "كلمتا المرور غير متطابقتين",
    minPass: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    googleError: "فشل تسجيل الدخول بـ Google. حاول مجدداً.",
    googleUnavailable: "Google غير مفعّل بعد. أضف GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET.",
    showPass: "إظهار",
    hidePass: "إخفاء",
    langBtn: "EN",
    switchLang: "Switch to English",
  },
  en: {
    tagline: "Your Smart Academic Advisor",
    heroTitle: "Level Up Your\nAcademic Journey",
    heroSub: "Track your GPA, plan your semesters, and get AI-powered recommendations tailored to your goals",
    feature1: "Instant GPA Calculation",
    feature1Desc: "Accurate calculations with support for multiple grading systems",
    feature2: "Academic Performance Insights",
    feature2Desc: "Detailed charts and reports tracking your university journey",
    feature3: "Smart Graduation Plan",
    feature3Desc: "Precise forecasts and achievable goals for every semester",
    authTitle: "Get Started",
    authSub: "Choose how you'd like to sign in",
    withGoogle: "Continue with Google",
    withReplit: "Continue with Replit",
    orEmail: "or use your email",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    signIn: "Sign in",
    register: "Create account",
    noAccount: "Don't have an account?",
    hasAccount: "Already have one?",
    createOne: "Create one",
    signInHere: "Sign in here",
    forgotPassword: "Forgot password?",
    guest: "Browse as Guest — no sign-up needed",
    guestDesc: "Data stays in this browser only",
    footer: "Your academic data is securely encrypted",
    loading: "Loading...",
    emailPH: "you@example.com",
    passPH: "Min. 8 characters",
    passMatch: "Passwords don't match",
    minPass: "Password must be at least 8 characters",
    googleError: "Google sign-in failed. Please try again.",
    googleUnavailable: "Google sign-in is not configured. Add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET.",
    showPass: "Show",
    hidePass: "Hide",
    langBtn: "عربي",
    switchLang: "التبديل للعربية",
  },
} as const;

type EmailMode = "login" | "register";

function LoginPage() {
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const isDark = theme === "dark";
  const isHC = theme === "hc";
  const ar = lang === "ar";

  const { error: urlError } = Route.useSearch();

  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlError === "google_failed") setError(t.googleError);
    else if (urlError === "google_unavailable") setError(t.googleUnavailable);
  }, [urlError, t.googleError, t.googleUnavailable]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (emailMode === "register") {
      if (password.length < 8) { setError(t.minPass); return; }
      if (password !== confirmPassword) { setError(t.passMatch); return; }
    }
    setLoading(true);
    try {
      const endpoint = emailMode === "login" ? "/api/auth/email/login" : "/api/auth/email/register";
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

  /* ── Palette ── */
  const BG = isDark
    ? "linear-gradient(135deg,#03040d 0%,#07091a 45%,#0b0a1f 100%)"
    : isHC
    ? "#fff"
    : "linear-gradient(135deg,#eef1ff 0%,#e8edff 50%,#f0f3ff 100%)";

  const ACCENT = isDark ? "#4fffb0" : isHC ? "#1a35c1" : "#2054e0";
  const ACCENT2 = isDark ? "#7c83f5" : isHC ? "#2054e0" : "#5b60e8";
  const TEXT = isDark ? "#e8ecff" : "#0f1545";
  const MUTED = isDark ? "rgba(200,210,240,0.45)" : "rgba(15,23,66,0.45)";
  const CARD = isDark
    ? "linear-gradient(145deg,rgba(12,15,30,0.97),rgba(18,23,46,0.93))"
    : isHC
    ? "#fff"
    : "rgba(255,255,255,0.95)";
  const CARD_BORDER = isDark ? "rgba(255,255,255,0.08)" : isHC ? "#1a35c1" : "rgba(255,255,255,0.9)";
  const PANEL_BG = isDark
    ? "linear-gradient(145deg,rgba(15,20,50,0.97),rgba(20,28,70,0.95))"
    : isHC
    ? "#1a35c1"
    : "linear-gradient(145deg,#1d3fba 0%,#2563eb 60%,#3b71f5 100%)";
  const INP_BG = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,66,0.04)";
  const INP_BORDER = isDark ? "rgba(255,255,255,0.11)" : "rgba(15,23,66,0.13)";

  const features = [
    { emoji: "📊", title: t.feature1, desc: t.feature1Desc },
    { emoji: "📈", title: t.feature2, desc: t.feature2Desc },
    { emoji: "🎓", title: t.feature3, desc: t.feature3Desc },
  ];

  return (
    <div dir={dir} style={{
      fontFamily: ar ? FONT : FONT_EN,
      minHeight: "100vh",
      background: BG,
      display: "flex",
      position: "relative",
      overflow: "hidden",
    }}>
      <AppBackground theme={theme} variant="login" />

      <style>{`
        @keyframes lp-in { from { opacity:0; transform:translateY(22px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes lp-left { from { opacity:0; transform:translateX(${ar ? "30px" : "-30px"}); } to { opacity:1; transform:translateX(0); } }
        @keyframes lp-right { from { opacity:0; transform:translateX(${ar ? "-30px" : "30px"}); } to { opacity:1; transform:translateX(0); } }
        @keyframes lp-feat { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lp-slide { from { opacity:0; max-height:0; } to { opacity:1; max-height:600px; } }
        @keyframes lp-spin { to { transform:rotate(360deg); } }
        .lp-google-btn:hover { box-shadow: 0 6px 24px rgba(66,133,244,0.25) !important; transform:translateY(-1px); }
        .lp-replit-btn:hover { box-shadow: 0 6px 24px rgba(124,131,245,0.25) !important; transform:translateY(-1px); }
        .lp-email-btn:hover { background: ${isDark ? "rgba(79,255,176,0.08)" : "rgba(32,84,224,0.06)"} !important; }
        .lp-guest-btn:hover { background: ${isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,66,0.07)"} !important; }
        .lp-inp:focus { border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px ${isDark ? "rgba(79,255,176,0.1)" : "rgba(32,84,224,0.1)"} !important; outline:none; }
        .lp-submit:hover { opacity:0.92; transform:translateY(-1px); }
        .lp-toggle:hover { opacity:0.8; }
        .lp-feat-card:hover { background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.2)"} !important; transform:translateX(${ar ? "-3px" : "3px"}); }
        @media (max-width:768px) {
          .lp-panel { display:none !important; }
          .lp-right-col { border-radius:0 !important; min-height:100vh !important; }
        }
      `}</style>

      <div style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        position: "relative",
        zIndex: 1,
      }}>

        {/* ── LEFT BRANDING PANEL ── */}
        <div className="lp-panel" style={{
          flex: "0 0 44%",
          background: PANEL_BG,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 44px",
          position: "relative",
          overflow: "hidden",
          animation: "lp-left 0.6s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          {/* Decorative orbs */}
          <div style={{ position:"absolute", top:"-15%", insetInlineEnd:"-10%", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:"-10%", insetInlineStart:"-5%", width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(79,255,176,0.10) 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:"40%", insetInlineEnd:"10%", width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)", pointerEvents:"none" }} />

          {/* Logo */}
          <div style={{ marginBottom: 36, animation: "lp-feat 0.5s 0.1s both" }}>
            <Logo height={42} style={{ filter: "brightness(0) invert(1)" }} />
            <p style={{ margin:"8px 0 0", fontSize:13, color:"rgba(255,255,255,0.6)", fontFamily: ar ? FONT : FONT_EN, letterSpacing:"0.3px" }}>
              {t.tagline}
            </p>
          </div>

          {/* Hero text */}
          <div style={{ marginBottom: 40, animation: "lp-feat 0.5s 0.2s both" }}>
            <h1 style={{
              margin: 0,
              fontSize: ar ? 32 : 30,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.3,
              fontFamily: ar ? FONT : FONT_EN,
              whiteSpace: "pre-line",
            }}>
              {t.heroTitle}
            </h1>
            <p style={{
              margin: "14px 0 0",
              fontSize: 14,
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.7,
              fontFamily: ar ? FONT : FONT_EN,
              maxWidth: 340,
            }}>
              {t.heroSub}
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {features.map((f, i) => (
              <div key={i} className="lp-feat-card" style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                transition: "all 0.22s ease",
                animation: `lp-feat 0.5s ${0.3 + i * 0.1}s both`,
                cursor: "default",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  {f.emoji}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#fff", fontFamily: ar ? FONT : FONT_EN, marginBottom:3 }}>{f.title}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", fontFamily: ar ? FONT : FONT_EN, lineHeight:1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div style={{ display:"flex", gap:8, marginTop:28, animation:"lp-feat 0.5s 0.55s both" }}>
            {[
              { n: "4.0", sub: ar ? "أعلى معدل" : "Max GPA Scale", icon: "📈" },
              { n: "136", sub: ar ? "ساعة للتخرج" : "Credit Hours", icon: "📋" },
              { n: "AI", sub: ar ? "مستشار ذكي" : "Smart Advisor", icon: "🤖" },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center",
                background: "rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "12px 8px",
                border: "1px solid rgba(255,255,255,0.11)",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", fontFamily: "'Sora','Manrope',sans-serif", lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.48)", marginTop: 4, fontFamily: ar ? FONT : FONT_EN, lineHeight: 1.3 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "22px 0 16px", animation: "lp-feat 0.5s 0.6s both" }} />

          {/* Bottom trust label */}
          <div style={{ animation: "lp-feat 0.5s 0.65s both" }}>
            <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.32)", fontFamily: ar ? FONT : FONT_EN, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🔒</span>
              <span>{t.footer}</span>
            </p>
          </div>
        </div>

        {/* ── RIGHT AUTH PANEL ── */}
        <div className="lp-right-col" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          overflowY: "auto",
          animation: "lp-right 0.6s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          {/* Mobile logo (visible only on mobile) */}
          <div style={{ display:"none" }} className="lp-mobile-logo">
            <Logo height={36} />
          </div>

          {/* Top controls row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            width: "100%",
            maxWidth: 440,
            marginBottom: 24,
          }}>
            {/* Theme toggles */}
            <div style={{
              display: "flex",
              gap: 2,
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,66,0.06)",
              borderRadius: 10,
              padding: 3,
            }}>
              {([
                { v:"light" as const, icon:"☀️" },
                { v:"dark" as const, icon:"🌙" },
                { v:"hc" as const, icon:"🖥" },
              ]).map(({ v, icon }) => (
                <button key={v} onClick={() => setTheme(v)}
                  style={{
                    background: theme === v ? (isDark ? "rgba(79,255,176,0.15)" : "rgba(255,255,255,0.9)") : "transparent",
                    border: "none", cursor:"pointer",
                    borderRadius: 7, padding: "5px 8px", fontSize: 13,
                    boxShadow: theme === v && !isDark ? "0 1px 4px rgba(15,23,66,0.12)" : "none",
                    transition: "all 0.18s",
                  }}>
                  {icon}
                </button>
              ))}
            </div>
            {/* Lang toggle */}
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              style={{
                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,66,0.06)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,66,0.12)"}`,
                borderRadius: 9, cursor:"pointer",
                padding: "5px 12px", fontSize: 12, fontWeight: 700,
                color: TEXT, fontFamily: ar ? FONT : FONT_EN,
                transition: "all 0.18s",
              }}
              title={t.switchLang}
            >
              {t.langBtn}
            </button>
          </div>

          {/* Auth card */}
          <div style={{
            width: "100%",
            maxWidth: 440,
            background: CARD,
            backdropFilter: "blur(28px) saturate(1.6)",
            WebkitBackdropFilter: "blur(28px) saturate(1.6)",
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: 24,
            padding: "32px 28px",
            boxShadow: isDark
              ? "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "0 24px 60px rgba(15,23,66,0.13), inset 0 1px 0 rgba(255,255,255,1)",
            animation: "lp-in 0.55s 0.15s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            {/* Heading */}
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <h2 style={{ margin:0, fontSize: ar ? 22 : 20, fontWeight:800, color:TEXT, fontFamily: ar ? FONT : FONT_EN }}>
                {t.authTitle}
              </h2>
              <p style={{ margin:"6px 0 0", fontSize:13, color:MUTED, fontFamily: ar ? FONT : FONT_EN }}>
                {t.authSub}
              </p>
            </div>

            {/* Error banner */}
            {error && !showEmailForm && (
              <div style={{
                padding:"10px 14px", borderRadius:10, marginBottom:16,
                background: isDark ? "rgba(255,107,107,0.11)" : "rgba(212,32,32,0.07)",
                border: `1px solid ${isDark ? "rgba(255,107,107,0.3)" : "rgba(212,32,32,0.2)"}`,
                fontSize:12.5, color: isDark ? "#ff8080" : "#c42020",
                fontFamily: ar ? FONT : FONT_EN,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* ── Google ── */}
            <a href="/api/auth/google" className="lp-google-btn" style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              width:"100%", padding:"13px 16px",
              background: isDark ? "rgba(255,255,255,0.07)" : "#fff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(15,23,66,0.16)"}`,
              borderRadius:14, textDecoration:"none",
              color: isDark ? "rgba(255,255,255,0.9)" : "#0f1545",
              fontSize:14, fontWeight:700,
              fontFamily: ar ? FONT : FONT_EN,
              boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 2px 8px rgba(15,23,66,0.09)",
              transition:"all 0.22s ease",
              marginBottom:10,
            }}>
              <GoogleIcon size={18} />
              {t.withGoogle}
            </a>

            {/* ── Replit ── */}
            <a href="/api/auth/login" className="lp-replit-btn" style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              width:"100%", padding:"13px 16px",
              background: isDark
                ? "linear-gradient(135deg,rgba(79,255,176,0.12),rgba(124,131,245,0.10))"
                : "linear-gradient(135deg,rgba(32,84,224,0.08),rgba(91,96,232,0.07))",
              border: `1px solid ${isDark ? "rgba(79,255,176,0.22)" : "rgba(32,84,224,0.2)"}`,
              borderRadius:14, textDecoration:"none",
              color: isDark ? "#4fffb0" : ACCENT,
              fontSize:14, fontWeight:700,
              fontFamily: ar ? FONT : FONT_EN,
              boxShadow: isDark ? "0 2px 12px rgba(79,255,176,0.08)" : "0 2px 8px rgba(32,84,224,0.09)",
              transition:"all 0.22s ease",
              marginBottom:18,
            }}>
              <ReplitIcon size={17} />
              {t.withReplit}
            </a>

            {/* ── Separator ── */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <div style={{ flex:1, height:1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,66,0.09)" }} />
              <span style={{ fontSize:11, color:MUTED, fontFamily: ar ? FONT : FONT_EN, whiteSpace:"nowrap" }}>{t.orEmail}</span>
              <div style={{ flex:1, height:1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,66,0.09)" }} />
            </div>

            {/* ── Email expand toggle ── */}
            {!showEmailForm && (
              <button className="lp-email-btn" onClick={() => setShowEmailForm(true)} style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                width:"100%", padding:"12px 16px",
                background:"transparent",
                border: `1px dashed ${isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,66,0.18)"}`,
                borderRadius:14, cursor:"pointer",
                color:MUTED, fontSize:13, fontWeight:600,
                fontFamily: ar ? FONT : FONT_EN,
                transition:"all 0.22s ease",
              }}>
                ✉️ {t.email}
              </button>
            )}

            {/* ── Email Form ── */}
            {showEmailForm && (
              <div style={{ animation:"lp-in 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
                {/* Login / Register tabs */}
                <div style={{
                  display:"flex", gap:4,
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,66,0.05)",
                  borderRadius:12, padding:4, marginBottom:18,
                }}>
                  {(["login","register"] as const).map(mode => (
                    <button key={mode}
                      onClick={() => { setEmailMode(mode); setError(""); setConfirmPassword(""); }}
                      style={{
                        flex:1, padding:"8px 0",
                        fontFamily: ar ? FONT : FONT_EN,
                        fontSize:13, fontWeight:700, cursor:"pointer",
                        border:"none", borderRadius:9,
                        transition:"all 0.22s ease",
                        background: emailMode === mode
                          ? isDark ? "linear-gradient(135deg,rgba(79,255,176,0.15),rgba(124,131,245,0.12))" : "#fff"
                          : "transparent",
                        color: emailMode === mode
                          ? isDark ? "#4fffb0" : ACCENT
                          : MUTED,
                        boxShadow: emailMode === mode && !isDark ? "0 2px 10px rgba(15,23,66,0.10)" : "none",
                      }}>
                      {mode === "login" ? (ar ? "دخول" : "Sign in") : (ar ? "حساب جديد" : "Sign up")}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleEmailSubmit} style={{ display:"flex", flexDirection:"column", gap:13 }}>
                  {/* Email */}
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, marginBottom:5, color:MUTED, letterSpacing:"0.4px", fontFamily: ar ? FONT : FONT_EN }}>
                      {t.email}
                    </label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder={t.emailPH} required autoComplete="email"
                      className="lp-inp"
                      style={{
                        width:"100%", padding:"11px 14px",
                        fontFamily: ar ? FONT : FONT_EN, fontSize:14,
                        background:INP_BG, border:`1px solid ${INP_BORDER}`,
                        borderRadius:11, color:TEXT, boxSizing:"border-box",
                        transition:"border-color 0.2s, box-shadow 0.2s",
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, marginBottom:5, color:MUTED, letterSpacing:"0.4px", fontFamily: ar ? FONT : FONT_EN }}>
                      {t.password}
                    </label>
                    <div style={{ position:"relative" }}>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder={t.passPH} required
                        autoComplete={emailMode === "login" ? "current-password" : "new-password"}
                        className="lp-inp"
                        style={{
                          width:"100%", padding:`11px ${ar ? "14px" : "52px"} 11px ${ar ? "52px" : "14px"}`,
                          fontFamily: ar ? FONT : FONT_EN, fontSize:14,
                          background:INP_BG, border:`1px solid ${INP_BORDER}`,
                          borderRadius:11, color:TEXT, boxSizing:"border-box",
                          transition:"border-color 0.2s, box-shadow 0.2s",
                        }}
                      />
                      <button type="button" className="lp-toggle"
                        onClick={() => setShowPass(!showPass)}
                        style={{
                          position:"absolute", top:"50%", transform:"translateY(-50%)",
                          [ar ? "insetInlineStart" : "insetInlineEnd"]: "12px",
                          background:"none", border:"none", cursor:"pointer",
                          fontSize:11, fontWeight:600, color:MUTED,
                          fontFamily: ar ? FONT : FONT_EN, padding:0,
                          transition:"opacity 0.18s",
                        }}>
                        {showPass ? t.hidePass : t.showPass}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password (register only) */}
                  {emailMode === "register" && (
                    <div style={{ animation:"lp-in 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
                      <label style={{ display:"block", fontSize:11, fontWeight:600, marginBottom:5, color:MUTED, letterSpacing:"0.4px", fontFamily: ar ? FONT : FONT_EN }}>
                        {t.confirmPassword}
                      </label>
                      <div style={{ position:"relative" }}>
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          placeholder={t.passPH} required autoComplete="new-password"
                          className="lp-inp"
                          style={{
                            width:"100%", padding:`11px ${ar ? "14px" : "52px"} 11px ${ar ? "52px" : "14px"}`,
                            fontFamily: ar ? FONT : FONT_EN, fontSize:14,
                            background:INP_BG, border:`1px solid ${INP_BORDER}`,
                            borderRadius:11, color:TEXT, boxSizing:"border-box",
                            transition:"border-color 0.2s, box-shadow 0.2s",
                          }}
                        />
                        <button type="button" className="lp-toggle"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          style={{
                            position:"absolute", top:"50%", transform:"translateY(-50%)",
                            [ar ? "insetInlineStart" : "insetInlineEnd"]: "12px",
                            background:"none", border:"none", cursor:"pointer",
                            fontSize:11, fontWeight:600, color:MUTED,
                            fontFamily: ar ? FONT : FONT_EN, padding:0,
                            transition:"opacity 0.18s",
                          }}>
                          {showConfirmPass ? t.hidePass : t.showPass}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline error */}
                  {error && (
                    <div style={{
                      padding:"9px 13px", borderRadius:9,
                      background: isDark ? "rgba(255,107,107,0.10)" : "rgba(212,32,32,0.07)",
                      border: `1px solid ${isDark ? "rgba(255,107,107,0.28)" : "rgba(212,32,32,0.20)"}`,
                      fontSize:12.5, color: isDark ? "#ff8080" : "#c42020",
                      fontFamily: ar ? FONT : FONT_EN,
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={loading} className="lp-submit" style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    width:"100%", padding:"13px 20px",
                    background: `linear-gradient(135deg,${ACCENT} 0%,${ACCENT2} 100%)`,
                    border:"none", borderRadius:13,
                    color: isDark ? "#04060e" : "#fff",
                    fontSize:14, fontWeight:800,
                    fontFamily: ar ? FONT : FONT_EN,
                    cursor: loading ? "wait" : "pointer",
                    boxShadow: isDark
                      ? "0 4px 24px rgba(79,255,176,0.28)"
                      : "0 4px 20px rgba(32,84,224,0.32)",
                    transition:"all 0.22s ease",
                    opacity: loading ? 0.75 : 1,
                    letterSpacing:"0.2px",
                  }}>
                    {loading ? (
                      <>
                        <span style={{
                          width:14, height:14, border:"2px solid currentColor",
                          borderTopColor:"transparent", borderRadius:"50%",
                          animation:"lp-spin 0.7s linear infinite",
                          display:"inline-block",
                        }} />
                        {t.loading}
                      </>
                    ) : emailMode === "login" ? t.signIn : t.register}
                  </button>

                  {/* Switch login/register */}
                  <div style={{ textAlign:"center" }}>
                    <button type="button"
                      onClick={() => { setEmailMode(emailMode === "login" ? "register" : "login"); setError(""); setConfirmPassword(""); }}
                      style={{
                        background:"none", border:"none", cursor:"pointer",
                        fontSize:12.5, fontWeight:600,
                        color: isDark ? "rgba(79,255,176,0.75)" : "rgba(32,84,224,0.75)",
                        fontFamily: ar ? FONT : FONT_EN,
                        padding:"2px 0",
                      }}>
                      {emailMode === "login"
                        ? `${t.noAccount} ${t.createOne}`
                        : `${t.hasAccount} ${t.signInHere}`}
                    </button>
                  </div>

                  {/* Forgot password */}
                  {emailMode === "login" && (
                    <div style={{ textAlign:"center" }}>
                      <Link to="/forgot-password" style={{
                        fontSize:12, color:MUTED, textDecoration:"none",
                        fontFamily: ar ? FONT : FONT_EN,
                      }}>
                        {t.forgotPassword}
                      </Link>
                    </div>
                  )}
                </form>

                {/* Collapse email form */}
                <button type="button"
                  onClick={() => { setShowEmailForm(false); setError(""); setEmail(""); setPassword(""); setConfirmPassword(""); }}
                  style={{
                    display:"block", margin:"14px auto 0",
                    background:"none", border:"none", cursor:"pointer",
                    fontSize:11.5, color:MUTED,
                    fontFamily: ar ? FONT : FONT_EN,
                    padding:0, textDecoration:"underline",
                    textDecorationColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(15,23,66,0.2)",
                  }}>
                  {ar ? "← إخفاء نموذج البريد الإلكتروني" : "← Hide email form"}
                </button>
              </div>
            )}
          </div>

          {/* ── Guest mode ── */}
          <div style={{
            width:"100%", maxWidth:440, marginTop:12,
            animation:"lp-in 0.55s 0.3s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            <a href="/guest?onboard=1" className="lp-guest-btn" style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              width:"100%", padding:"11px 16px",
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,66,0.04)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,66,0.09)"}`,
              borderRadius:13, textDecoration:"none",
              color:MUTED, fontSize:13, fontWeight:600,
              fontFamily: ar ? FONT : FONT_EN,
              backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
              transition:"all 0.22s ease",
            }}>
              <span style={{ fontSize:16 }}>👤</span>
              {t.guest}
            </a>
            <p style={{
              margin:"6px 0 0", fontSize:11, color: isDark ? "rgba(200,210,240,0.28)" : "rgba(15,23,66,0.28)",
              fontFamily: ar ? FONT : FONT_EN, textAlign:"center",
            }}>
              {t.guestDesc}
            </p>
          </div>

          {/* Footer */}
          <div style={{
            marginTop:20,
            animation:"lp-in 0.55s 0.4s cubic-bezier(0.22,1,0.36,1) both",
            display:"flex", alignItems:"center", gap:5,
          }}>
            <span style={{ fontSize:12, color: isDark ? "rgba(79,255,176,0.4)" : "rgba(32,84,224,0.35)" }}>🔒</span>
            <p style={{ margin:0, fontSize:11, color: isDark ? "rgba(200,210,240,0.28)" : "rgba(15,23,66,0.28)", fontFamily: ar ? FONT : FONT_EN }}>
              {t.footer}
            </p>
          </div>
        </div>
      </div>
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

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
