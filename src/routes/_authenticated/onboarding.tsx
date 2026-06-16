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
import { FACULTY_DATA } from "@/data/seedData";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const FONT = "'Cairo','Manrope','Noto Sans Arabic',sans-serif";
const FONT_NUM = "'Sora','Cairo',sans-serif";

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

const SEMESTERS_AR = ["الفصل الأول", "الفصل الثاني", "الفصل الصيفي"];
const SEMESTERS_EN = ["Semester 1", "Semester 2", "Summer Term"];
const SEMESTER_VALS = ["1", "2", "s"];

const LEVELS = [1, 2, 3, 4];
const LEVELS_AR = ["المستوى الأول", "المستوى الثاني", "المستوى الثالث", "المستوى الرابع"];
const LEVELS_EN = ["Freshman (L1)", "Sophomore (L2)", "Junior (L3)", "Senior (L4)"];

const DEPT_PALETTE: Record<string, { grad: string; accent: string; glyph: string }> = {
  biotech:         { grad: "linear-gradient(135deg,#10B981,#059669)", accent: "#34D399", glyph: "🧬" },
  zoology_ecology: { grad: "linear-gradient(135deg,#F59E0B,#D97706)", accent: "#FBBF24", glyph: "🦎" },
};
const defaultPalette = { grad: "linear-gradient(135deg,#6366F1,#8B5CF6)", accent: "#A5B4FC", glyph: "★" };
const deptPalette = (id: string) => DEPT_PALETTE[id] ?? defaultPalette;

const T = {
  ar: {
    welcome: "أهلاً وسهلاً! 👋",
    subtitle: "دعنا نُعدّ Termly لك في دقيقتين",
    steps: ["اللغة والنظام", "الكلية والبرنامج", "وضعك الأكاديمي"],
    step1Title: "اختر لغتك ونظام التقدير",
    step2TitleBenha: "اختر برنامجك الدراسي",
    step2TitleGeneric: "بيانات جامعتك",
    step3Title: "وضعك الأكاديمي الحالي",
    langLabel: "لغة التطبيق",
    scaleLabel: "نظام التقدير",
    facultyLabel: "الكلية",
    deptLabel: "البرنامج / التخصص",
    deptRequired: "يجب اختيار البرنامج للمتابعة",
    uniLabel: "اسم الجامعة / الكلية",
    uniPlaceholder: "مثال: جامعة بنها · كلية العلوم",
    majorLabel: "التخصص / القسم",
    majorPlaceholder: "مثال: علوم الحاسب",
    majorRequired: "التخصص مطلوب",
    totalReqLabel: "عدد ساعات التخرج",
    totalReqPlaceholder: "مثال: 128",
    gpaLabel: "المعدل التراكمي الحالي",
    gpaPlaceholder: "0.00 – 4.00",
    crLabel: "الساعات المكتسبة حتى الآن",
    crPlaceholder: "مثال: 48",
    levelLabel: "المستوى الدراسي",
    levelRequired: "يجب اختيار المستوى",
    semLabel: "الفصل الدراسي القادم",
    semRequired: "يجب اختيار الفصل الدراسي",
    targetLabel: "المعدل المستهدف للتخرج",
    next: "التالي ←",
    back: "→ السابق",
    finish: "ابدأ الآن 🚀",
    saving: "جاري الحفظ...",
    errGpa: "المعدل يجب أن يكون بين 0 و4",
    errCr: "أدخل رقماً صحيحاً موجباً",
    errTotalReq: "أدخل عدد الساعات (60–300)",
    benhaNote: "عدد الساعات محدد تلقائياً بـ 136 ساعة (لائحة بنها)",
    hasFailed: "سبق لي الرسوب في مادة",
    gradTargets: ["مقبول (2.0)", "جيد (2.5)", "جيد جداً (3.0)", "ممتاز (3.5)", "ممتاز+ (3.667+)"],
    gradTargetLabel: "المعدل المستهدف للتخرج",
    autoSelected: "محدد تلقائياً",
    searchDept: "ابحث عن البرنامج...",
    preSelected: "كلية العلوم - جامعة بنها",
  },
  en: {
    welcome: "Welcome! 👋",
    subtitle: "Let's set up Termly for you in 2 minutes",
    steps: ["Language & Scale", "Faculty & Programme", "Your Standing"],
    step1Title: "Choose your language & grading scale",
    step2TitleBenha: "Select your academic programme",
    step2TitleGeneric: "Tell us about your university",
    step3Title: "Your current academic standing",
    langLabel: "App language",
    scaleLabel: "Grading scale",
    facultyLabel: "Faculty",
    deptLabel: "Department / Programme",
    deptRequired: "Please select a programme to continue",
    uniLabel: "University / Faculty",
    uniPlaceholder: "e.g. Benha University · Faculty of Science",
    majorLabel: "Major / Department",
    majorPlaceholder: "e.g. Computer Science",
    majorRequired: "Major is required",
    totalReqLabel: "Credits required to graduate",
    totalReqPlaceholder: "e.g. 128",
    gpaLabel: "Current cumulative GPA",
    gpaPlaceholder: "0.00 – 4.00",
    crLabel: "Credits earned so far",
    crPlaceholder: "e.g. 48",
    levelLabel: "Academic level",
    levelRequired: "Please select your academic level",
    semLabel: "Upcoming semester",
    semRequired: "Please select your semester",
    targetLabel: "Target graduation GPA",
    next: "Next →",
    back: "← Back",
    finish: "Let's go 🚀",
    saving: "Saving...",
    errGpa: "GPA must be between 0 and 4",
    errCr: "Enter a valid positive number",
    errTotalReq: "Enter credits required (60–300)",
    benhaNote: "Graduation credits auto-set to 136 (Benha regulation)",
    hasFailed: "I've previously failed a course",
    gradTargets: ["Pass (2.0)", "Good (2.5)", "Very Good (3.0)", "Excellent (3.5)", "Excellent+ (3.667+)"],
    gradTargetLabel: "Target graduation GPA",
    autoSelected: "Pre-selected",
    searchDept: "Search programme...",
    preSelected: "Faculty of Science - Benha University",
  },
} as const;

const GRAD_TARGET_VALS = [2.0, 2.5, 3.0, 3.5, 3.667];

function OnboardingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useGpaTheme();
  const { lang: globalLang, setLang: setGlobalLang } = useLang();
  const getProfileFn = useServerFn(getProfile);
  const saveProfileFn = useServerFn(saveProfile);

  useEffect(() => {
    getProfileFn().then((p) => {
      if (p) navigate({ to: "/app" });
    }).catch(() => {});
  }, []);

  const [step, setStep] = useState(0);

  // Step 0
  const [lang, setLang] = useState<"ar" | "en">(globalLang as "ar" | "en");
  const [scaleId, setScaleId] = useState("benha");

  // Step 1 — Benha
  const [deptId, setDeptId] = useState(""); // REQUIRED for Benha
  const [deptSearch, setDeptSearch] = useState("");

  // Step 1 — Generic
  const [uniName, setUniName] = useState("");
  const [major, setMajor] = useState(""); // REQUIRED for Generic
  const [customTotalReq, setCustomTotalReq] = useState("");

  // Step 2 — both
  const [currentLevel, setCurrentLevel] = useState<number | null>(null); // REQUIRED
  const [semester, setSemester] = useState(""); // REQUIRED
  const [prevGpa, setPrevGpa] = useState("");
  const [prevCr, setPrevCr] = useState("");
  const [hasFailed, setHasFailed] = useState(false);
  const [gradTargetIdx, setGradTargetIdx] = useState(2);

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

  // Validation per step
  const validate = (s: number): boolean => {
    setErr("");
    if (s === 1) {
      if (scale.isBenha) {
        if (!deptId) { setErr(t.deptRequired); return false; }
      } else {
        if (!major.trim()) { setErr(t.majorRequired); return false; }
        const v = parseInt(customTotalReq);
        if (isNaN(v) || v < 60 || v > 300) { setErr(t.errTotalReq); return false; }
      }
    }
    if (s === 2) {
      if (currentLevel === null) { setErr(t.levelRequired); return false; }
      if (!semester) { setErr(t.semRequired); return false; }
      const g = parseFloat(prevGpa);
      if (prevGpa && (isNaN(g) || g < 0 || g > 4)) { setErr(t.errGpa); return false; }
      const c = parseInt(prevCr);
      if (prevCr && (isNaN(c) || c < 0)) { setErr(t.errCr); return false; }
    }
    return true;
  };

  const goNext = () => {
    if (!validate(step)) return;
    setErr("");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setErr("");
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
      const majorToSave = scale.isBenha ? deptId : major.trim();
      await saveProfileFn({
        data: {
          lang,
          scale_id: scaleId,
          is_benha: scale.isBenha,
          total_req: totalReq,
          uni_name: scale.isBenha ? "جامعة بنها · كلية العلوم" : (uniName || ""),
          major: majorToSave,
          prev_gpa: g,
          prev_cr: c,
          semester,
          has_failed: hasFailed,
          min_prev_sem_gpa: g,
          grad_target: GRAD_TARGET_VALS[gradTargetIdx],
          current_level: currentLevel!,
        },
      });
      navigate({ to: "/app" });
    } catch (e: any) {
      setErr((ar ? "فشل الحفظ: " : "Save failed: ") + (e?.message ?? "error"));
    } finally {
      setSaving(false);
    }
  };

  // Disable logic per step
  const isNextDisabled = (() => {
    if (step === 0) return false;
    if (step === 1) {
      if (scale.isBenha) return !deptId;
      return !major.trim();
    }
    return false;
  })();

  const isFinishDisabled = saving || currentLevel === null || !semester;

  /* ── Styles ───────────────────────────────── */
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

  const reqBadge = (
    <span style={{ color: "var(--gpa-danger)", marginInlineStart: 4, fontSize: 13 }}>*</span>
  );

  /* ────────────────────────────────────────────
     STEP 0 — Language + Scale
  ──────────────────────────────────────────── */
  const Step0 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={labelStyle}>{t.langLabel}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(["ar", "en"] as const).map((l) => (
            <button key={l} type="button" onClick={() => handleLangChange(l)} style={{
              padding: "14px 10px", fontFamily: FONT, fontSize: 15, fontWeight: 700,
              background: lang === l ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
              border: `2px solid ${lang === l ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
              borderRadius: 12, color: lang === l ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
              cursor: "pointer", transition: "all 0.18s",
            }}>
              {l === "ar" ? "العربية 🇪🇬" : "English 🇬🇧"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>{t.scaleLabel}</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SCALE_SYSTEMS.map((s) => {
            const active = scaleId === s.id;
            return (
              <button key={s.id} type="button" onClick={() => setScaleId(s.id)} style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
                background: active ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                border: `2px solid ${active ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                borderRadius: 12, textAlign: "start", width: "100%", marginBottom: 0, cursor: "pointer",
              }}>
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

  /* ────────────────────────────────────────────
     STEP 1 — Benha: Faculty + Programme (required)
  ──────────────────────────────────────────── */
  const filteredDepts = FACULTY_DATA.departments.filter((d) => {
    if (!deptSearch.trim()) return true;
    const q = deptSearch.toLowerCase();
    return d.nameAr.includes(q) || d.nameEn.toLowerCase().includes(q) || d.id.includes(q);
  });

  const Step1Benha = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Faculty — read-only */}
      <div>
        <label style={labelStyle}>{t.facultyLabel}</label>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 12,
          background: "var(--gpa-surface-alpha-06)",
          border: "1px solid rgba(34,211,238,0.25)",
        }}>
          <span style={{ fontSize: 20 }}>🏛️</span>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "var(--gpa-text)" }}>
              {ar ? FACULTY_DATA.nameAr : FACULTY_DATA.nameEn}
            </div>
            <div style={{ fontSize: 11, color: "var(--gpa-accent)", fontFamily: FONT, marginTop: 2 }}>
              {t.autoSelected}
            </div>
          </div>
        </div>
      </div>

      {/* Department — REQUIRED */}
      <div>
        <label style={labelStyle}>
          {t.deptLabel}{reqBadge}
        </label>

        {/* Search if more than 3 depts */}
        {FACULTY_DATA.departments.length > 3 && (
          <input
            value={deptSearch}
            onChange={(e) => setDeptSearch(e.target.value)}
            placeholder={t.searchDept}
            style={{ ...inputStyle, marginBottom: 10 }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredDepts.map((d) => {
            const pal = deptPalette(d.id);
            const sel = deptId === d.id;
            return (
              <button key={d.id} type="button" onClick={() => setDeptId(d.id)} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 18px", borderRadius: 14, textAlign: "start", width: "100%",
                border: sel ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)",
                background: sel ? `linear-gradient(135deg, ${pal.accent}14, ${pal.accent}06)` : "var(--gpa-surface-alpha-06)",
                cursor: "pointer", transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
                boxShadow: sel ? `0 0 0 1px ${pal.accent}28, 0 4px 20px rgba(0,0,0,0.15)` : "none",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: pal.grad, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 22, flexShrink: 0,
                  boxShadow: sel ? `0 4px 14px ${pal.accent}40` : "none",
                }}>
                  {pal.glyph}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: FONT, fontSize: 14,
                    fontWeight: sel ? 800 : 600,
                    color: sel ? pal.accent : "var(--gpa-text)", lineHeight: 1.3,
                  }}>
                    {ar ? d.nameAr : d.nameEn}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT_NUM, marginTop: 3 }}>
                    {d.levels.length} {ar ? "مستويات" : "levels"} · {d.levels.reduce((s, l) => s + l.semesters.length, 0)} {ar ? "فصل" : "semesters"}
                  </div>
                </div>
                {sel && (
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: pal.accent, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 13, color: "#000",
                    fontWeight: 900, flexShrink: 0,
                  }}>✓</div>
                )}
              </button>
            );
          })}
        </div>

        {!deptId && (
          <div style={{
            marginTop: 10, fontSize: 12, color: "var(--gpa-text-faintest)",
            textAlign: "center", fontFamily: FONT,
          }}>
            {t.deptRequired}
          </div>
        )}
      </div>
    </div>
  );

  /* ────────────────────────────────────────────
     STEP 1 — Generic: University + Major + TotalReq
  ──────────────────────────────────────────── */
  const Step1Generic = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>{t.uniLabel}</label>
        <input value={uniName} onChange={(e) => setUniName(e.target.value)}
          placeholder={t.uniPlaceholder} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>{t.majorLabel}{reqBadge}</label>
        <input value={major} onChange={(e) => setMajor(e.target.value)}
          placeholder={t.majorPlaceholder} style={{
            ...inputStyle,
            borderColor: !major.trim() ? "var(--gpa-border)" : "var(--gpa-accent-55)",
          }} />
      </div>
      <div>
        <label style={labelStyle}>{t.totalReqLabel}{reqBadge}</label>
        <input type="number" min={60} max={300} value={customTotalReq}
          onChange={(e) => setCustomTotalReq(e.target.value)}
          placeholder={t.totalReqPlaceholder} style={inputStyle} />
      </div>
    </div>
  );

  /* ────────────────────────────────────────────
     STEP 2 — Academic Standing (BOTH)
     Level + Semester are REQUIRED
  ──────────────────────────────────────────── */
  const Step2 = (
    <form id="step2form" onSubmit={finish} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Level — REQUIRED */}
      <div>
        <label style={{ ...labelStyle, color: currentLevel === null ? "var(--gpa-danger)" : "var(--gpa-text-faint)" }}>
          {t.levelLabel}{reqBadge}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LEVELS.map((lvl, i) => {
            const active = currentLevel === lvl;
            return (
              <button key={lvl} type="button" onClick={() => setCurrentLevel(lvl)} style={{
                padding: "12px 8px", fontFamily: FONT, fontSize: 12.5,
                fontWeight: active ? 700 : 500,
                background: active ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                border: `1.5px solid ${active ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                borderRadius: 10,
                color: active ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                cursor: "pointer", transition: "all 0.16s", textAlign: "center",
              }}>
                {ar ? LEVELS_AR[i] : LEVELS_EN[i]}
              </button>
            );
          })}
        </div>
        {currentLevel === null && (
          <div style={{ fontSize: 11, color: "var(--gpa-danger)", marginTop: 6, fontFamily: FONT }}>
            ⚠ {t.levelRequired}
          </div>
        )}
      </div>

      {/* Semester — REQUIRED */}
      <div>
        <label style={{ ...labelStyle, color: !semester ? "var(--gpa-danger)" : "var(--gpa-text-faint)" }}>
          {t.semLabel}{reqBadge}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {SEMESTER_VALS.map((v, i) => {
            const active = semester === v;
            return (
              <button key={v} type="button" onClick={() => setSemester(v)} style={{
                padding: "11px 6px", fontFamily: FONT, fontSize: 12,
                fontWeight: active ? 700 : 500,
                background: active ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                border: `1.5px solid ${active ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                borderRadius: 10,
                color: active ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                cursor: "pointer", transition: "all 0.16s", textAlign: "center",
              }}>
                {ar ? SEMESTERS_AR[i] : SEMESTERS_EN[i]}
              </button>
            );
          })}
        </div>
        {!semester && (
          <div style={{ fontSize: 11, color: "var(--gpa-danger)", marginTop: 6, fontFamily: FONT }}>
            ⚠ {t.semRequired}
          </div>
        )}
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "var(--gpa-border)", margin: "4px 0" }} />

      {/* GPA + Credits */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>{t.gpaLabel}</label>
          <input type="number" step="0.001" min={0} max={4}
            value={prevGpa} onChange={(e) => setPrevGpa(e.target.value)}
            placeholder={t.gpaPlaceholder} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t.crLabel}</label>
          <input type="number" min={0} max={500}
            value={prevCr} onChange={(e) => setPrevCr(e.target.value)}
            placeholder={t.crPlaceholder} style={inputStyle} />
        </div>
      </div>

      {/* Grad target */}
      <div>
        <label style={labelStyle}>{t.gradTargetLabel}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {GRAD_TARGET_VALS.map((v, i) => (
            <button key={v} type="button" onClick={() => setGradTargetIdx(i)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "10px 6px", fontFamily: FONT, fontSize: 11,
              background: gradTargetIdx === i ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
              border: `1.5px solid ${gradTargetIdx === i ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
              borderRadius: 10,
              color: gradTargetIdx === i ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
              cursor: "pointer", transition: "all 0.16s", textAlign: "center",
              fontWeight: gradTargetIdx === i ? 700 : 400,
            }}>
              <span style={{ fontSize: 16 }}>{["⚠️", "👍", "⭐", "🏅", "🏆"][i]}</span>
              {ar ? t.gradTargets[i] : t.gradTargets[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Has failed */}
      <button type="button" onClick={() => setHasFailed((v) => !v)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
        fontFamily: FONT, fontSize: 13,
        background: hasFailed ? "var(--gpa-danger-15)" : "var(--gpa-surface-alpha-06)",
        border: `1.5px solid ${hasFailed ? "var(--gpa-danger-33)" : "var(--gpa-border)"}`,
        borderRadius: 10, color: hasFailed ? "var(--gpa-danger)" : "var(--gpa-text-faint)",
        cursor: "pointer", transition: "all 0.16s", textAlign: "start", width: "100%",
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: 4,
          border: `2px solid ${hasFailed ? "var(--gpa-danger)" : "var(--gpa-border)"}`,
          background: hasFailed ? "var(--gpa-danger)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {hasFailed && <span style={{ color: "white", fontSize: 11, fontWeight: 900 }}>✓</span>}
        </span>
        {t.hasFailed}
      </button>

      {/* Benha info note */}
      {scale.isBenha && (
        <div style={{
          background: "var(--gpa-accent-10)", border: "1px solid var(--gpa-accent-25)",
          borderRadius: 10, padding: "10px 14px", fontSize: 12,
          color: "var(--gpa-accent)", fontFamily: FONT,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>🎓</span>{t.benhaNote}
        </div>
      )}
    </form>
  );

  const STEP_CONTENT = [
    Step0,
    scale.isBenha ? Step1Benha : Step1Generic,
    Step2,
  ];
  const STEP_TITLES = [
    t.step1Title,
    scale.isBenha ? t.step2TitleBenha : t.step2TitleGeneric,
    t.step3Title,
  ];

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div dir={dir} style={{
      fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px 40px", position: "relative", overflow: "hidden",
    }}>
      <AppBackground theme={theme} variant="login" />

      <div style={{ width: "100%", maxWidth: 520, position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <LangSwitcher lang={lang} onChange={handleLangChange} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Logo height={40} />
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 900, color: "var(--gpa-text-strong)", letterSpacing: "-0.5px" }}>
            {t.welcome}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--gpa-text-faint)" }}>{t.subtitle}</p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center" }}>
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
                      background: done ? "var(--gpa-accent)" : active ? "var(--gpa-accent-20)" : "var(--gpa-surface-alpha-06)",
                      border: `2px solid ${(done || active) ? "var(--gpa-accent)" : "var(--gpa-border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                      color: done ? "var(--gpa-bg)" : active ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                      transition: "all 0.3s", flexShrink: 0,
                    }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span style={{
                      fontSize: 10,
                      color: active ? "var(--gpa-accent)" : done ? "var(--gpa-text-soft)" : "var(--gpa-text-faintest)",
                      whiteSpace: "nowrap", fontWeight: active ? 700 : 400, transition: "color 0.3s",
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
          background: "var(--gpa-card)", border: "1px solid var(--gpa-border)",
          borderRadius: 20, padding: "24px 22px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "var(--gpa-text-strong)", letterSpacing: "-0.3px" }}>
            {STEP_TITLES[step]}
          </h2>

          <div key={step} style={{ animation: "ob-fade-in 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>
            {STEP_CONTENT[step]}
          </div>

          {/* Error */}
          {err && (
            <div style={{
              marginTop: 14, background: "var(--gpa-danger-15)",
              border: "1px solid var(--gpa-danger-33)", borderRadius: 9,
              padding: "9px 13px", fontSize: 12, color: "var(--gpa-danger)",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              ⚠️ {err}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 22, flexDirection: ar ? "row-reverse" : "row" }}>
            {step > 0 && (
              <button type="button" onClick={goBack} style={{
                padding: "12px 18px",
                background: "var(--gpa-surface-alpha-06)",
                border: "1px solid var(--gpa-border)", borderRadius: 11,
                color: "var(--gpa-text-faint)", fontSize: 13, fontWeight: 600,
                fontFamily: FONT, cursor: "pointer", flexShrink: 0,
              }}>
                {t.back}
              </button>
            )}

            {isLastStep ? (
              <button
                type="submit"
                form="step2form"
                disabled={isFinishDisabled}
                style={{
                  flex: 1, padding: "12px 20px",
                  background: isFinishDisabled
                    ? "var(--gpa-surface-alpha-08)"
                    : "linear-gradient(135deg, var(--gpa-accent-25), var(--gpa-accent2-20))",
                  border: `1px solid ${isFinishDisabled ? "var(--gpa-border)" : "var(--gpa-accent-55)"}`,
                  borderRadius: 11,
                  color: isFinishDisabled ? "var(--gpa-text-faintest)" : "var(--gpa-accent)",
                  fontSize: 14, fontWeight: 800, fontFamily: FONT,
                  cursor: isFinishDisabled ? "not-allowed" : "pointer",
                  opacity: isFinishDisabled ? 0.65 : 1,
                  transition: "all 0.2s", letterSpacing: "0.2px",
                }}>
                {saving ? t.saving : t.finish}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={isNextDisabled}
                style={{
                  flex: 1, padding: "12px 20px",
                  background: isNextDisabled
                    ? "var(--gpa-surface-alpha-08)"
                    : "linear-gradient(135deg, var(--gpa-accent-25), var(--gpa-accent2-20))",
                  border: `1px solid ${isNextDisabled ? "var(--gpa-border)" : "var(--gpa-accent-55)"}`,
                  borderRadius: 11,
                  color: isNextDisabled ? "var(--gpa-text-faintest)" : "var(--gpa-accent)",
                  fontSize: 14, fontWeight: 800, fontFamily: FONT,
                  cursor: isNextDisabled ? "not-allowed" : "pointer",
                  opacity: isNextDisabled ? 0.65 : 1,
                  transition: "all 0.2s", letterSpacing: "0.2px",
                }}>
                {t.next}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ob-fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
