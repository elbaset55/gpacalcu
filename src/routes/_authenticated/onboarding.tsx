import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, saveProfile } from "@/lib/profile.functions";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";
import { Logo } from "@/components/gpa/Logo";
import { AppBackground } from "@/components/gpa/AppBackground";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

/* ── Design tokens ─────────────────────────────────────────── */
const FONT = "'Cairo','Manrope','Noto Sans Arabic',sans-serif";

const SCALE_SYSTEMS = [
  {
    id: "benha",
    labelAr: "جامعة بنها — لائحة 2021",
    labelEn: "Benha University — 2021 Scale",
    descAr: "136 ساعة للتخرج · أ+=4.0 · مادتا 22 و24",
    descEn: "136cr graduation · A+=4.0 · Arts.22+24",
    totalReq: 136,
    isBenha: true,
  },
  {
    id: "generic",
    labelAr: "جامعات أخرى (نظام 4.0)",
    labelEn: "Other Universities (4.0 Scale)",
    descAr: "A+=4.0 · أدخل عدد ساعات التخرج يدوياً",
    descEn: "A+=4.0 · Enter your graduation credits manually",
    totalReq: null,
    isBenha: false,
  },
];

const SEMESTERS_AR = ["الفصل الدراسي الأول", "الفصل الدراسي الثاني", "الفصل الصيفي"];
const SEMESTERS_EN = ["First Semester", "Second Semester", "Summer Term"];
const SEMESTER_VALS = ["1", "2", "s"];

const LEVELS_AR = ["المستوى الأول (1-30 ساعة)", "المستوى الثاني (31-64 ساعة)", "المستوى الثالث (65-100 ساعة)", "المستوى الرابع (101+ ساعة)"];
const LEVELS_EN = ["Freshman (1-30 cr)", "Sophomore (31-64 cr)", "Junior (65-100 cr)", "Senior (101+ cr)"];

/* ── Translations ───────────────────────────────────────────── */
const T = {
  ar: {
    welcome: "أهلاً وسهلاً! 👋",
    subtitle: "دعنا نُعدّ Termly لك في دقيقتين",
    steps: ["اللغة والنظام", "بيانات الجامعة", "وضعك الحالي"],
    step1Title: "اختر لغتك ونظام التقدير",
    step2Title: "أخبرنا عن جامعتك",
    step3Title: "وضعك الأكاديمي الحالي",
    langLabel: "لغة التطبيق",
    scaleLabel: "نظام التقدير",
    uniLabel: "اسم الجامعة / الكلية",
    uniPlaceholder: "مثال: جامعة بنها · كلية العلوم",
    majorLabel: "التخصص / القسم",
    majorPlaceholder: "مثال: التقنية الحيوية",
    optional: "اختياري",
    totalReqLabel: "عدد ساعات التخرج",
    totalReqPlaceholder: "مثال: 128",
    gpaLabel: "المعدل التراكمي الحالي",
    gpaPlaceholder: "0.00 – 4.00",
    crLabel: "الساعات المعتمدة المكتسبة",
    crPlaceholder: "مثال: 48",
    levelLabel: "مستواك الأكاديمي",
    semLabel: "الفصل الدراسي القادم",
    targetLabel: "المعدل المستهدف للتخرج",
    next: "التالي ←",
    back: "→ السابق",
    finish: "ابدأ الآن 🚀",
    saving: "جاري الحفظ...",
    errRequired: "هذا الحقل مطلوب",
    errGpa: "المعدل يجب أن يكون بين 0 و4",
    errCr: "أدخل رقماً صحيحاً موجباً",
    errTotalReq: "أدخل عدد الساعات (60–300)",
    errSem: "اختر الفصل الدراسي",
    skip: "تخطى — سأدخل البيانات لاحقاً",
    benhaNote: "عدد الساعات محدد تلقائياً بـ 136 ساعة (لائحة بنها)",
    newUser: "حساب جديد؟",
    hasFailed: "سبق لي الرسوب في مادة",
    gradTargets: ["مقبول (2.0)", "جيد (2.5)", "جيد جداً (3.0)", "ممتاز (3.5)", "ممتاز+ (3.667+)"],
    gradTargetLabel: "المعدل المستهدف للتخرج",
  },
  en: {
    welcome: "Welcome! 👋",
    subtitle: "Let's set up Termly for you in 2 minutes",
    steps: ["Language & Scale", "Your University", "Your Standing"],
    step1Title: "Choose your language & grading scale",
    step2Title: "Tell us about your university",
    step3Title: "Your current academic standing",
    langLabel: "App language",
    scaleLabel: "Grading scale",
    uniLabel: "University / Faculty",
    uniPlaceholder: "e.g. Benha University · Faculty of Science",
    majorLabel: "Major / Department",
    majorPlaceholder: "e.g. Biotechnology",
    optional: "optional",
    totalReqLabel: "Credits required to graduate",
    totalReqPlaceholder: "e.g. 128",
    gpaLabel: "Current cumulative GPA",
    gpaPlaceholder: "0.00 – 4.00",
    crLabel: "Credits earned so far",
    crPlaceholder: "e.g. 48",
    levelLabel: "Academic level",
    semLabel: "Upcoming semester",
    targetLabel: "Target graduation GPA",
    next: "Next →",
    back: "← Back",
    finish: "Let's go 🚀",
    saving: "Saving...",
    errRequired: "This field is required",
    errGpa: "GPA must be between 0 and 4",
    errCr: "Enter a valid positive number",
    errTotalReq: "Enter credits required (60–300)",
    errSem: "Choose a semester",
    skip: "Skip — I'll fill this in later",
    benhaNote: "Graduation credits auto-set to 136 (Benha regulation)",
    newUser: "New to Termly?",
    hasFailed: "I've previously failed a course",
    gradTargets: ["Pass (2.0)", "Good (2.5)", "Very Good (3.0)", "Excellent (3.5)", "Excellent+ (3.667+)"],
    gradTargetLabel: "Target graduation GPA",
  },
} as const;

const GRAD_TARGET_VALS = [2.0, 2.5, 3.0, 3.5, 3.667];

/* ── Component ─────────────────────────────────────────────── */
function OnboardingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useGpaTheme();
  const { lang: globalLang, setLang: setGlobalLang } = useLang();
  const getProfileFn = useServerFn(getProfile);
  const saveProfileFn = useServerFn(saveProfile);

  // Redirect if user already has a profile
  useEffect(() => {
    getProfileFn().then((p) => {
      if (p) navigate({ to: "/app" });
    }).catch(() => {});
  }, []);

  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<"fwd" | "bwd">("fwd");

  // Step 1
  const [lang, setLang] = useState<"ar" | "en">(globalLang as "ar" | "en");
  const [scaleId, setScaleId] = useState("benha");

  // Step 2
  const [uniName, setUniName] = useState("");
  const [major, setMajor] = useState("");
  const [customTotalReq, setCustomTotalReq] = useState("");

  // Step 3
  const [prevGpa, setPrevGpa] = useState("");
  const [prevCr, setPrevCr] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [semester, setSemester] = useState("");
  const [hasFailed, setHasFailed] = useState(false);
  const [gradTargetIdx, setGradTargetIdx] = useState(2); // default 3.0

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const t = T[lang];
  const scale = SCALE_SYSTEMS.find((s) => s.id === scaleId)!;
  const TOTAL_STEPS = 3;

  const handleLangChange = (l: "ar" | "en") => {
    setLang(l);
    setGlobalLang(l);
  };

  const validate = (s: number) => {
    setErr("");
    if (s === 1 && !scale.isBenha) {
      const v = parseInt(customTotalReq);
      if (isNaN(v) || v < 60 || v > 300) { setErr(t.errTotalReq); return false; }
    }
    if (s === 2) {
      if (!semester) { setErr(t.errSem); return false; }
      const g = parseFloat(prevGpa);
      if (isNaN(g) || g < 0 || g > 4) { setErr(t.errGpa); return false; }
      const c = parseInt(prevCr);
      if (isNaN(c) || c < 0) { setErr(t.errCr); return false; }
    }
    return true;
  };

  const goNext = () => {
    if (!validate(step)) return;
    setAnimDir("fwd");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setErr("");
    setAnimDir("bwd");
    setStep((s) => s - 1);
  };

  const finish = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate(2)) return;
    setSaving(true);
    setErr("");
    try {
      const g = parseFloat(prevGpa) || 0;
      const c = parseInt(prevCr) || 0;
      const totalReq = scale.isBenha ? 136 : (parseInt(customTotalReq) || 120);
      await saveProfileFn({
        data: {
          lang,
          scale_id: scaleId,
          is_benha: scale.isBenha,
          total_req: totalReq,
          uni_name: uniName || (scaleId === "benha" ? "جامعة بنها · كلية العلوم" : ""),
          major,
          prev_gpa: g,
          prev_cr: c,
          semester: semester || "1",
          has_failed: hasFailed,
          min_prev_sem_gpa: g,
          grad_target: GRAD_TARGET_VALS[gradTargetIdx],
          current_level: currentLevel,
        },
      });
      navigate({ to: "/app" });
    } catch (e: any) {
      setErr((ar ? "فشل الحفظ: " : "Save failed: ") + (e?.message ?? "error"));
    } finally {
      setSaving(false);
    }
  };

  /* ── Styles ─────────────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 10,
    cursor: "pointer",
    transition: "all 0.18s ease",
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 11,
    color: "var(--gpa-text-strong)",
    padding: "12px 14px",
    fontSize: 14,
    fontFamily: FONT,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--gpa-text-faint)",
    marginBottom: 6,
    display: "block",
    letterSpacing: ".4px",
    textTransform: "uppercase",
  };

  /* ── Step renders ───────────────────────────────────────── */
  const Step1 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Language */}
      <div>
        <label style={labelStyle}>{t.langLabel}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(["ar", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLangChange(l)}
              style={{
                padding: "14px 10px",
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 700,
                background: lang === l ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                border: `2px solid ${lang === l ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                borderRadius: 12,
                color: lang === l ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              {l === "ar" ? "العربية 🇪🇬" : "English 🇬🇧"}
            </button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div>
        <label style={labelStyle}>{t.scaleLabel}</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SCALE_SYSTEMS.map((s) => {
            const active = scaleId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScaleId(s.id)}
                style={{
                  ...cardStyle,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  background: active ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                  border: `2px solid ${active ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                  textAlign: "start",
                  width: "100%",
                  marginBottom: 0,
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${active ? "var(--gpa-accent)" : "var(--gpa-border)"}`,
                  background: active ? "var(--gpa-accent)" : "transparent",
                  flexShrink: 0, marginTop: 2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gpa-bg)" }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: active ? "var(--gpa-accent)" : "var(--gpa-text-strong)", fontFamily: FONT }}>
                    {ar ? s.labelAr : s.labelEn}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", marginTop: 3, fontFamily: FONT }}>
                    {ar ? s.descAr : s.descEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const Step2 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>{t.uniLabel} <span style={{ color: "var(--gpa-text-faintest)", textTransform: "none" }}>({t.optional})</span></label>
        <input
          value={uniName}
          onChange={(e) => setUniName(e.target.value)}
          placeholder={t.uniPlaceholder}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>{t.majorLabel} <span style={{ color: "var(--gpa-text-faintest)", textTransform: "none" }}>({t.optional})</span></label>
        <input
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          placeholder={t.majorPlaceholder}
          style={inputStyle}
        />
      </div>
      {scale.isBenha ? (
        <div style={{
          background: "var(--gpa-accent-10)",
          border: "1px solid var(--gpa-accent-25)",
          borderRadius: 10,
          padding: "11px 14px",
          fontSize: 12,
          color: "var(--gpa-accent)",
          fontFamily: FONT,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span>🎓</span>
          {t.benhaNote}
        </div>
      ) : (
        <div>
          <label style={labelStyle}>{t.totalReqLabel}</label>
          <input
            type="number"
            min={60}
            max={300}
            value={customTotalReq}
            onChange={(e) => setCustomTotalReq(e.target.value)}
            placeholder={t.totalReqPlaceholder}
            style={inputStyle}
          />
        </div>
      )}
    </div>
  );

  const Step3 = (
    <form id="step3form" onSubmit={finish} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>{t.gpaLabel}</label>
          <input
            type="number"
            step="0.001"
            min={0}
            max={4}
            value={prevGpa}
            onChange={(e) => setPrevGpa(e.target.value)}
            placeholder={t.gpaPlaceholder}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t.crLabel}</label>
          <input
            type="number"
            min={0}
            max={500}
            value={prevCr}
            onChange={(e) => setPrevCr(e.target.value)}
            placeholder={t.crPlaceholder}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Academic level */}
      <div>
        <label style={labelStyle}>{t.levelLabel}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setCurrentLevel(lvl)}
              style={{
                padding: "10px 8px",
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: currentLevel === lvl ? 700 : 500,
                background: currentLevel === lvl ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                border: `1.5px solid ${currentLevel === lvl ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                borderRadius: 10,
                color: currentLevel === lvl ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                cursor: "pointer",
                transition: "all 0.16s",
                textAlign: "center",
              }}
            >
              {ar ? LEVELS_AR[lvl - 1] : LEVELS_EN[lvl - 1]}
            </button>
          ))}
        </div>
      </div>

      {/* Semester */}
      <div>
        <label style={labelStyle}>{t.semLabel}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {SEMESTER_VALS.map((v, i) => (
            <button
              key={v}
              type="button"
              onClick={() => setSemester(v)}
              style={{
                padding: "10px 6px",
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: semester === v ? 700 : 500,
                background: semester === v ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                border: `1.5px solid ${semester === v ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                borderRadius: 10,
                color: semester === v ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                cursor: "pointer",
                transition: "all 0.16s",
                textAlign: "center",
              }}
            >
              {ar ? SEMESTERS_AR[i] : SEMESTERS_EN[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Graduation target */}
      <div>
        <label style={labelStyle}>{t.gradTargetLabel}</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {GRAD_TARGET_VALS.map((v, i) => (
            <button
              key={v}
              type="button"
              onClick={() => setGradTargetIdx(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                fontFamily: FONT,
                fontSize: 13,
                background: gradTargetIdx === i ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                border: `1.5px solid ${gradTargetIdx === i ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                borderRadius: 10,
                color: gradTargetIdx === i ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                cursor: "pointer",
                transition: "all 0.16s",
                textAlign: "start",
                width: "100%",
                fontWeight: gradTargetIdx === i ? 700 : 400,
              }}
            >
              <span style={{ fontSize: 16 }}>
                {["⚠️", "👍", "⭐", "🏅", "🏆"][i]}
              </span>
              {ar ? t.gradTargets[i] : t.gradTargets[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Has failed toggle */}
      <button
        type="button"
        onClick={() => setHasFailed((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 14px",
          fontFamily: FONT,
          fontSize: 13,
          background: hasFailed ? "var(--gpa-danger-15)" : "var(--gpa-surface-alpha-06)",
          border: `1.5px solid ${hasFailed ? "var(--gpa-danger-33)" : "var(--gpa-border)"}`,
          borderRadius: 10,
          color: hasFailed ? "var(--gpa-danger)" : "var(--gpa-text-faint)",
          cursor: "pointer",
          transition: "all 0.16s",
          textAlign: "start",
          width: "100%",
        }}
      >
        <span style={{
          width: 18, height: 18, borderRadius: 4,
          border: `2px solid ${hasFailed ? "var(--gpa-danger)" : "var(--gpa-border)"}`,
          background: hasFailed ? "var(--gpa-danger)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {hasFailed && <span style={{ color: "white", fontSize: 11, fontWeight: 900 }}>✓</span>}
        </span>
        {t.hasFailed}
      </button>
    </form>
  );

  const STEP_CONTENT = [Step1, Step2, Step3];
  const STEP_TITLES = [t.step1Title, t.step2Title, t.step3Title];

  const isLastStep = step === TOTAL_STEPS - 1;
  void animDir;

  return (
    <div dir={dir} style={{ fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px 40px", position: "relative", overflow: "hidden" }}>
      <AppBackground theme={theme} variant="login" />

      <div style={{ width: "100%", maxWidth: 520, position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <LangSwitcher lang={lang} onChange={handleLangChange} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>

        {/* Logo + welcome */}
        <div style={{ textAlign: "center", marginBottom: 28, animation: "ob-fade-in 0.5s ease both" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Logo height={40} />
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 900, color: "var(--gpa-text-strong)", letterSpacing: "-0.5px" }}>
            {t.welcome}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--gpa-text-faint)" }}>{t.subtitle}</p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          {/* Step indicators */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 10, justifyContent: "center" }}>
            {t.steps.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  {i > 0 && (
                    <div style={{
                      width: 36, height: 2,
                      background: done || active ? "var(--gpa-accent)" : "var(--gpa-border)",
                      transition: "background 0.3s",
                    }} />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: done
                        ? "var(--gpa-accent)"
                        : active
                          ? "var(--gpa-accent-20)"
                          : "var(--gpa-surface-alpha-06)",
                      border: `2px solid ${(done || active) ? "var(--gpa-accent)" : "var(--gpa-border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                      color: done ? "var(--gpa-bg)" : active ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                      transition: "all 0.3s",
                      flexShrink: 0,
                    }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span style={{
                      fontSize: 10,
                      color: active ? "var(--gpa-accent)" : done ? "var(--gpa-text-soft)" : "var(--gpa-text-faintest)",
                      whiteSpace: "nowrap",
                      fontWeight: active ? 700 : 400,
                      transition: "color 0.3s",
                    }}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--gpa-card)",
          border: "1px solid var(--gpa-border)",
          borderRadius: 20,
          padding: "24px 22px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          animation: "ob-fade-in 0.35s ease both",
        }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "var(--gpa-text-strong)", letterSpacing: "-0.3px" }}>
            {STEP_TITLES[step]}
          </h2>

          {/* Step content */}
          <div key={step} style={{ animation: "ob-slide-in 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>
            {STEP_CONTENT[step]}
          </div>

          {/* Error */}
          {err && (
            <div style={{
              marginTop: 14,
              background: "var(--gpa-danger-15)",
              border: "1px solid var(--gpa-danger-33)",
              borderRadius: 9,
              padding: "9px 13px",
              fontSize: 12,
              color: "var(--gpa-danger)",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}>
              ⚠️ {err}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 22, flexDirection: ar ? "row-reverse" : "row" }}>
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                style={{
                  padding: "12px 18px",
                  background: "var(--gpa-surface-alpha-06)",
                  border: "1px solid var(--gpa-border)",
                  borderRadius: 11,
                  color: "var(--gpa-text-faint)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: FONT,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {t.back}
              </button>
            )}
            <button
              type={isLastStep ? "submit" : "button"}
              form={isLastStep ? "step3form" : undefined}
              onClick={isLastStep ? undefined : goNext}
              disabled={saving}
              style={{
                flex: 1,
                padding: "12px 20px",
                background: saving
                  ? "var(--gpa-surface-alpha-08)"
                  : "linear-gradient(135deg, var(--gpa-accent-25), var(--gpa-accent2-20))",
                border: "1px solid var(--gpa-accent-55)",
                borderRadius: 11,
                color: saving ? "var(--gpa-text-faint)" : "var(--gpa-accent)",
                fontSize: 14,
                fontWeight: 800,
                fontFamily: FONT,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
                transition: "all 0.2s",
                letterSpacing: "0.2px",
              }}
            >
              {saving ? t.saving : isLastStep ? t.finish : t.next}
            </button>
          </div>

          {/* Skip link (step 3 only) */}
          {step === 2 && (
            <button
              type="button"
              onClick={async () => {
                setSaving(true);
                try {
                  await saveProfileFn({
                    data: {
                      lang,
                      scale_id: scaleId,
                      is_benha: scale.isBenha,
                      total_req: scale.isBenha ? 136 : (parseInt(customTotalReq) || 120),
                      uni_name: uniName || "",
                      major,
                      prev_gpa: 0,
                      prev_cr: 0,
                      semester: "1",
                      has_failed: false,
                      min_prev_sem_gpa: 0,
                      grad_target: 3.0,
                      current_level: 1,
                    },
                  });
                  navigate({ to: "/app" });
                } catch { setSaving(false); }
              }}
              style={{
                display: "block",
                width: "100%",
                marginTop: 12,
                padding: "9px",
                background: "transparent",
                border: "none",
                color: "var(--gpa-text-faintest)",
                fontSize: 11,
                fontFamily: FONT,
                cursor: "pointer",
                textDecoration: "underline",
                textDecorationStyle: "dotted",
              }}
            >
              {t.skip}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ob-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ob-slide-in {
          from { opacity: 0; transform: translateX(${ar ? "-" : ""}20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
