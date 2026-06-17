// Ported from user's original GPAAdvisorApp_2.jsx
// Inline styles preserved to keep the original neon dark aesthetic intact.
// Persistence layer (was in-memory SESSION) replaced with Supabase via server fns.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Menu as MenuIcon,
  CalendarDays,
  Percent,
  Download,
  Upload,
  Bell,
  Share2,
  Printer,
  RotateCcw,
  User,
  LogOut,
  X as XIcon,
} from "lucide-react";
import { TermlyAppShell } from "./TermlyAppShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PremiumControlsBar } from "./PremiumControls";

import {
  deleteProfile,
  deleteSemester,
  editCourse,
  getProfile,
  listSemesters,
  saveProfile,
  saveSemester,
} from "@/lib/profile.functions";
import { BENHA_PROGRAMS, computeDegreeAudit } from "@/data/benha-programs";
import { CourseWizard } from "@/components/gpa/CourseWizard";
import { analyzeTranscript } from "@/lib/transcript.functions";
import { askAdvisor } from "@/lib/advisor.functions";
import { chatWithAdvisor } from "@/lib/chat.functions";
import { generateRoadmap } from "@/lib/roadmap.functions";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "./use-theme";
import { AppBackground } from "./AppBackground";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LangSwitcher } from "./LangSwitcher";
import { RemindersPanel } from "./RemindersPanel";
import { AchievementCard } from "./AchievementCard";
import { TranscriptReview } from "./TranscriptReview";
import { Logo } from "./Logo";
import {
  structureTranscript,
  normalizeTranscript,
  type ReviewSem,
} from "@/lib/transcript-normalize";
import { FACULTY_DATA } from "@/data/seedData";

/* ══════════════════════════════════════════════════════════
   GRADING SYSTEMS
══════════════════════════════════════════════════════════ */
const GRADES_BENHA = [
  { ar: "أ+", en: "A+", label: "ممتاز", pts: 4.0, minPct: 90, clr: "var(--gpa-accent)" },
  { ar: "أ", en: "A", label: "ممتاز", pts: 3.667, minPct: 85, clr: "var(--gpa-grade-a)" },
  { ar: "ب+", en: "B+", label: "جيد جداً", pts: 3.333, minPct: 80, clr: "var(--gpa-grade-b-plus)" },
  { ar: "ب", en: "B", label: "جيد جداً", pts: 3.0, minPct: 75, clr: "var(--gpa-grade-b)" },
  { ar: "ب-", en: "B-", label: "جيد", pts: 2.667, minPct: 70, clr: "var(--gpa-grade-b-minus)" },
  { ar: "ج+", en: "C+", label: "جيد", pts: 2.333, minPct: 65, clr: "var(--gpa-grade-c-plus)" },
  { ar: "ج", en: "C", label: "مقبول", pts: 2.0, minPct: 60, clr: "var(--gpa-grade-c)" },
  { ar: "ر", en: "F", label: "راسب", pts: 0.0, minPct: 0, clr: "var(--gpa-danger)" },
];
const GRADES_GENERIC = [
  { ar: "A+", en: "A+", label: "Excellent+", pts: 4.0, minPct: 97, clr: "var(--gpa-accent)" },
  { ar: "A", en: "A", label: "Excellent", pts: 3.7, minPct: 93, clr: "var(--gpa-grade-a)" },
  { ar: "A-", en: "A-", label: "Excellent-", pts: 3.3, minPct: 90, clr: "var(--gpa-grade-b-plus)" },
  { ar: "B+", en: "B+", label: "V.Good+", pts: 3.0, minPct: 87, clr: "var(--gpa-grade-b)" },
  { ar: "B", en: "B", label: "V.Good", pts: 2.7, minPct: 83, clr: "var(--gpa-grade-b-minus)" },
  { ar: "B-", en: "B-", label: "Good+", pts: 2.3, minPct: 80, clr: "var(--gpa-grade-c-plus)" },
  { ar: "C+", en: "C+", label: "Good", pts: 2.0, minPct: 77, clr: "var(--gpa-grade-c)" },
  { ar: "C", en: "C", label: "Pass", pts: 1.7, minPct: 73, clr: "var(--gpa-danger)" },
  { ar: "D", en: "D", label: "Weak", pts: 1.0, minPct: 60, clr: "#e53935" },
  { ar: "F", en: "F", label: "Fail", pts: 0.0, minPct: 0, clr: "#7b1fa2" },
];
const SCALE_SYSTEMS = [
  { id: "benha", label: "جامعة بنها — لائحة 2021", grades: GRADES_BENHA, totalReq: 136, isBenha: true },
  { id: "generic", label: "جامعات أخرى (4.0)", grades: GRADES_GENERIC, totalReq: null, isBenha: false },
];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const FONT = "'Manrope','Cairo','Noto Sans Arabic',sans-serif";
const FONT_HEAD = "'Sora','Cairo','Noto Sans Arabic',sans-serif";
const gc = (pts: number | null | undefined, grades: any[]) => {
  if (pts == null || isNaN(pts) || !grades?.length) return "var(--gpa-text-muted)";
  return grades.reduce((p, c) => (Math.abs(c.pts - pts) < Math.abs(p.pts - pts) ? c : p)).clr;
};
const ga = (pts: number | null | undefined, grades: any[]) => {
  if (pts == null || isNaN(pts) || !grades?.length) return "—";
  return grades.reduce((p, c) => (Math.abs(c.pts - pts) < Math.abs(p.pts - pts) ? c : p)).ar;
};
const gpaClr = (g: number) =>
  g >= 3.667
    ? "var(--gpa-accent)"
    : g >= 3.333
      ? "var(--gpa-grade-b-plus)"
      : g >= 3.0
        ? "var(--gpa-grade-b)"
        : g >= 2.667
          ? "var(--gpa-grade-b-minus)"
          : g >= 2.333
            ? "var(--gpa-grade-c-plus)"
            : g >= 2.0
              ? "var(--gpa-grade-c)"
              : "var(--gpa-danger)";

const standing = (g: number) => {
  if (g >= 3.667) return { label: "ممتاز", en: "Excellent", clr: "var(--gpa-accent)", emoji: "🏆", pct: "90-100%" };
  if (g >= 3.333) return { label: "جيد جداً", en: "Very Good+", clr: "var(--gpa-grade-b-plus)", emoji: "✨", pct: "80-85%" };
  if (g >= 3.0) return { label: "جيد جداً", en: "Very Good", clr: "var(--gpa-grade-b)", emoji: "⭐", pct: "75-80%" };
  if (g >= 2.667) return { label: "جيد", en: "Good+", clr: "var(--gpa-grade-b-minus)", emoji: "👍", pct: "70-75%" };
  if (g >= 2.333) return { label: "جيد", en: "Good", clr: "var(--gpa-grade-c-plus)", emoji: "👍", pct: "65-70%" };
  if (g >= 2.0) return { label: "مقبول", en: "Pass", clr: "var(--gpa-grade-c)", emoji: "⚠️", pct: "60-65%" };
  return { label: "راسب", en: "Fail", clr: "var(--gpa-danger)", emoji: "❌", pct: "<60%" };
};

const levelInfo = (cr: number) => {
  if (cr <= 30) return { ar: "المستوى الأول", en: "Freshman", maxFail: 30, clr: "var(--gpa-purple)" };
  if (cr <= 64) return { ar: "المستوى الثاني", en: "Sophomore", maxFail: 64, clr: "var(--gpa-accent-2)" };
  if (cr <= 100) return { ar: "المستوى الثالث", en: "Junior", maxFail: 100, clr: "var(--gpa-info)" };
  return { ar: "المستوى الرابع", en: "Senior", maxFail: 136, clr: "var(--gpa-accent)" };
};

const loadRule = (gpa: number, earned: number) => {
  if (gpa < 2.0) return { max: 12, clr: "var(--gpa-danger)", key: "watch" };
  if (gpa >= 3.333) return { max: 20, clr: "var(--gpa-accent)", key: "excel" };
  if (earned >= 100 && gpa >= 2) return { max: 22, clr: "var(--gpa-grade-b-plus)", key: "finish" };
  return { max: 18, clr: "var(--gpa-info)", key: "normal" };
};

const pctToGrade = (pct: number, grades: any[]) => {
  for (const g of [...grades].sort((a, b) => b.minPct - a.minPct))
    if (pct >= g.minPct && g.pts > 0) return g;
  return grades[grades.length - 1];
};

function useIdGen() {
  const r = useRef(Date.now());
  return useCallback((p = "c") => `${p}${++r.current}`, []);
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        background: ok
          ? "linear-gradient(135deg, var(--gpa-accent-20), var(--gpa-accent2-18))"
          : "var(--gpa-danger-15)",
        border: `1px solid ${ok ? "var(--gpa-accent-55)" : "var(--gpa-danger-55)"}`,
        color: ok ? "var(--gpa-accent)" : "var(--gpa-danger)",
        padding: "10px 22px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 9999,
        fontFamily: FONT,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: ok
          ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px var(--gpa-accent-20)"
          : "0 8px 32px rgba(0,0,0,0.5)",
        animation: "gpa-slide-toast 0.3s cubic-bezier(0.22,1,0.36,1) both",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 14 }}>{ok ? "✓" : "⚠"}</span>
      {msg}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SETUP SCREEN
══════════════════════════════════════════════════════════ */
type Profile = {
  lang: string;
  scaleId: string;
  grades: any[];
  totalReq: number;
  isBenha: boolean;
  uniName: string;
  major: string;
  prevGpa: number;
  prevCr: number;
  semester: string;
  hasFailed: boolean;
  minPrevSemGpa: number;
  gradTarget: number;
  currentLevel: number;
};

export type ImportPayload = {
  profile: Profile;
  semesters: Array<{
    label: string;
    sem_type: string;
    year?: number | null;
    courses: Array<{ name: string; code?: string; credits: number; grade_letter?: string | null; grade_pts?: number | null }>;
  }>;
};

/* Lang + Theme switchers are in PremiumControls.tsx (shared with login) */

/* ── Dept palette — drives icons + colours in SetupScreen's dept picker ── */
const SS_DEPT_PALETTE: Record<string, { grad: string; accent: string; glyph: string }> = {
  biotech:             { grad: "linear-gradient(135deg,#10B981,#059669)", accent: "#34D399", glyph: "🧬" },
  zoology_ecology:     { grad: "linear-gradient(135deg,#F59E0B,#D97706)", accent: "#FBBF24", glyph: "🦎" },
  chemistry:           { grad: "linear-gradient(135deg,#8B5CF6,#7C3AED)", accent: "#A78BFA", glyph: "⚗️" },
  physics:             { grad: "linear-gradient(135deg,#3B82F6,#1D4ED8)", accent: "#60A5FA", glyph: "⚛️" },
  mathematics:         { grad: "linear-gradient(135deg,#EC4899,#DB2777)", accent: "#F472B6", glyph: "∑" },
  computer_science:    { grad: "linear-gradient(135deg,#14B8A6,#0F766E)", accent: "#2DD4BF", glyph: "💻" },
  botany_microbiology: { grad: "linear-gradient(135deg,#22C55E,#15803D)", accent: "#4ADE80", glyph: "🌿" },
  geology:             { grad: "linear-gradient(135deg,#D97706,#92400E)", accent: "#FBBF24", glyph: "🪨" },
  biophysics:          { grad: "linear-gradient(135deg,#06B6D4,#0E7490)", accent: "#22D3EE", glyph: "🔬" },
};
const ssDeptPalette = (id: string) =>
  SS_DEPT_PALETTE[id] ?? { grad: "linear-gradient(135deg,#6366F1,#8B5CF6)", accent: "#A5B4FC", glyph: "📚" };

function SetupScreen({
  onDone,
  existingProfile = null,
  onContinue,
  onStartFresh,
}: {
  onDone: (p: Profile, sems?: ReviewSem[]) => void | Promise<void>;
  existingProfile?: any | null;
  onContinue?: () => void;
  onStartFresh?: () => void;
}) {
  const { theme, setTheme } = useGpaTheme();
  const { lang: globalLang, setLang: setGlobalLang } = useLang();
  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState<"fwd" | "bwd">("fwd");
  const [lang, setLang] = useState<string>(globalLang);
  useEffect(() => { setLang(globalLang); }, [globalLang]);
  const [scaleId, setScaleId] = useState("benha");
  const [uniName, setUniName] = useState("");
  const [major, setMajor] = useState("");
  const [prevGpa, setPrevGpa] = useState("");
  const [prevCr, setPrevCr] = useState("");
  const [semester, setSemester] = useState("");
  const [hasFailed, setHasFailed] = useState(false);
  const [minSemGpa, setMinSemGpa] = useState("");
  const [gradTarget, setGradTarget] = useState(3.0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [customTotalReq, setCustomTotalReq] = useState("");
  const [err, setErr] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [pendingSems, setPendingSems] = useState<ReviewSem[]>([]);
  const [reviewData, setReviewData] = useState<{ sems: ReviewSem[]; warnings: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");
  const [showWelcomeBack, setShowWelcomeBack] = useState(!!existingProfile);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const analyzeFn = useServerFn(analyzeTranscript);
  const scale = SCALE_SYSTEMS.find((s) => s.id === scaleId)!;
  const resolvedTotalReq = scale.isBenha ? 136 : parseInt(customTotalReq) || 120;

  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  const STEPS = ar
    ? ["اللغة والنظام", scale.isBenha ? "البرنامج والمستوى" : "بيانات الجامعة", "المعدل والساعات", "الفصل والهدف", "مرتبة الشرف"]
    : ["Language & Scale", scale.isBenha ? "Programme & Level" : "University Info", "GPA & Credits", "Semester & Goal", "Honors Check"];

  const STEP_META = ar ? [
    { icon: "🌐", title: "اللغة ونظام التقدير", desc: "اختر لغة التطبيق ونظام التقدير المناسب لجامعتك" },
    { icon: "🎓", title: scale.isBenha ? "البرنامج الأكاديمي" : "بيانات جامعتك", desc: scale.isBenha ? "اختر قسمك ومستواك الدراسي في كلية العلوم" : "أدخل بيانات تخصصك وجامعتك" },
    { icon: "📊", title: "المعدل التراكمي والساعات", desc: "أدخل بياناتك يدوياً أو استخدم التحليل بالذكاء الاصطناعي" },
    { icon: "🗓️", title: "الفصل الدراسي والهدف", desc: "حدد فصلك الحالي وضع هدفك للمعدل التراكمي عند التخرج" },
    { icon: "🏆", title: "أهلية مرتبة الشرف", desc: "أجب على أسئلة مرتبة الشرف طبقاً للمادة 24 من اللائحة" },
  ] : [
    { icon: "🌐", title: "Language & Grading Scale", desc: "Choose your preferred language and university grading system" },
    { icon: "🎓", title: scale.isBenha ? "Academic Programme" : "University Details", desc: scale.isBenha ? "Select your department and academic year in Faculty of Science" : "Enter your major, university, and year details" },
    { icon: "📊", title: "GPA & Credit Hours", desc: "Enter manually or use the AI transcript analyzer to auto-fill" },
    { icon: "🗓️", title: "Semester & Graduation Goal", desc: "Set your current semester and target cumulative GPA" },
    { icon: "🏆", title: "Honors Eligibility", desc: "Answer honors standing questions per Article 24 of by-laws" },
  ];

  const inp: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 10,
    color: "var(--gpa-text-strong)",
    padding: "11px 14px",
    fontSize: 14,
    fontFamily: FONT,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = { fontSize: 11, color: "var(--gpa-text-muted-2)", marginBottom: 5, display: "block", letterSpacing: ".5px" };

  const validateStep = () => {
    if (step === 1 && scale.isBenha) {
      if (!major) { setErr(ar ? "يجب اختيار البرنامج للمتابعة" : "Please select a programme to continue"); return false; }
    }
    if (step === 1 && !scale.isBenha) {
      const t = parseInt(customTotalReq);
      if (isNaN(t) || t < 60 || t > 300) {
        setErr(ar ? "أدخل عدد ساعات التخرج (60-300)" : "Enter graduation credits (60-300)");
        return false;
      }
    }
    if (step === 2) {
      const g = parseFloat(prevGpa), c = parseInt(prevCr);
      if (isNaN(g) || g < 0 || g > 4 || isNaN(c) || c < 0) {
        setErr(ar ? "خطأ في البيانات" : "Invalid data");
        return false;
      }
    }
    if (step === 3) {
      if (!semester) {
        setErr(ar ? "اختر الفصل" : "Choose semester");
        return false;
      }
    }
    setErr("");
    return true;
  };

  const next = () => {
    if (validateStep()) {
      if (step < STEPS.length - 1) { setSlideDir("fwd"); setStep((s) => s + 1); }
      else submit();
    }
  };
  const back = () => { setSlideDir("bwd"); setStep((s) => s - 1); };

  const submit = async () => {
    const g = parseFloat(prevGpa), c = parseInt(prevCr), ms = parseFloat(minSemGpa);
    if (isNaN(g) || isNaN(c)) return;
    setSaving(true);
    setErr("");
    try {
      await onDone(
        {
          lang,
          scaleId,
          grades: scale.grades,
          totalReq: resolvedTotalReq,
          isBenha: scale.isBenha,
          uniName: uniName || (scaleId === "benha" ? "جامعة بنها · كلية العلوم" : ""),
          major,
          prevGpa: g,
          prevCr: c,
          semester,
          hasFailed,
          minPrevSemGpa: isNaN(ms) ? g : ms,
          gradTarget,
          currentLevel,
        },
        pendingSems.length ? pendingSems : undefined,
      );
    } catch (e: any) {
      setErr((ar ? "فشل الحفظ: " : "Save failed: ") + (e?.message ?? "error"));
    } finally {
      setSaving(false);
    }
  };


  const handleAnalyzeFile = async (file: File) => {
    setAiMsg("");
    setAiBusy(true);
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = () => rej(new Error("read fail"));
        r.readAsDataURL(file);
      });
      const result = await analyzeFn({
        data: {
          fileDataUrl: dataUrl,
          mimeType: file.type || "application/pdf",
          scaleHint: scaleId === "benha" ? "benha" : "generic",
          lang: lang === "en" ? "en" : "ar",
        },
      });
      let filled = 0;
      if (result.cumulative_gpa != null) { setPrevGpa(String(result.cumulative_gpa)); filled++; }
      if (result.total_credits_earned != null) { setPrevCr(String(result.total_credits_earned)); filled++; }
      if (result.current_level != null) { setCurrentLevel(result.current_level); filled++; }
      if (result.university && !uniName) { setUniName(result.university); filled++; }
      if (result.major && !major) { setMajor(result.major); filled++; }

      // PHASE 1 — structure into app template
      const structured = structureTranscript(result as any, scale.grades, lang);
      // PHASE 2 — normalize & validate
      const { sems, warnings } = normalizeTranscript(structured, scale.grades, result as any, lang);
      const courseCount = sems.reduce((a, s) => a + s.courses.length, 0);

      if (courseCount > 0) {
        setReviewData({ sems, warnings });
        setAiMsg(
          lang === "ar"
            ? `✅ تم استخراج ${filled} حقل + ${courseCount} مادة. راجع وعدّل قبل الحفظ.`
            : `✅ Extracted ${filled} fields + ${courseCount} courses. Review before saving.`,
        );
      } else {
        setAiMsg(
          lang === "ar"
            ? `✅ تم استخراج ${filled} حقل. لم نجد مواد واضحة في المستند.`
            : `✅ Extracted ${filled} fields. No clear courses found.`,
        );
      }
    } catch (e: any) {
      setAiMsg((lang === "ar" ? "❌ فشل التحليل: " : "❌ Analysis failed: ") + (e?.message ?? "error"));
    } finally {
      setAiBusy(false);
    }
  };

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Language selector */}
            <div>
              <label style={{ ...lbl, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {ar ? "لغة التطبيق" : "Application Language"}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([["ar", "العربية", "🇪🇬", ar ? "اللغة الرسمية للنظام" : "Arabic interface"], ["en", "English", "🇬🇧", ar ? "النسخة الإنجليزية" : "English interface"]] as [string, string, string, string][]).map(([v, label, flag, sub]) => {
                  const sel = lang === v;
                  return (
                    <button
                      key={v}
                      onClick={() => { setLang(v); setGlobalLang(v === "en" ? "en" : "ar"); }}
                      style={{
                        padding: "14px 12px", fontFamily: FONT, textAlign: "center",
                        background: sel ? "var(--gpa-accent2-18)" : "var(--gpa-surface-alpha-06)",
                        border: sel ? "2px solid #6366f166" : "1.5px solid var(--gpa-border)",
                        borderRadius: 14,
                        color: sel ? "var(--gpa-accent-2-soft)" : "var(--gpa-text-muted)",
                        cursor: "pointer", transition: "all 0.18s",
                        boxShadow: sel ? "0 2px 14px rgba(99,102,241,.15)" : "none",
                        position: "relative",
                      }}
                    >
                      {sel && <div style={{ position: "absolute", top: 7, insetInlineEnd: 8, width: 7, height: 7, borderRadius: "50%", background: "#6366f1" }} />}
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{flag}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>{label}</div>
                      <div style={{ fontSize: 10, marginTop: 3, color: "var(--gpa-text-faintest)" }}>{sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grading scale selector */}
            <div>
              <label style={{ ...lbl, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {ar ? "نظام التقدير الجامعي" : "University Grading Scale"}
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SCALE_SYSTEMS.map((s) => {
                  const sel = scaleId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setScaleId(s.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        width: "100%", textAlign: ar ? "right" : "left",
                        padding: "14px 16px", fontFamily: FONT,
                        background: sel ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                        border: sel ? "2px solid var(--gpa-accent-44)" : "1.5px solid var(--gpa-border)",
                        borderRadius: 14,
                        cursor: "pointer", transition: "all 0.18s",
                        boxShadow: sel ? "0 2px 14px var(--gpa-accent-15)" : "none",
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: sel ? "var(--gpa-accent-20)" : "var(--gpa-surface-alpha-08)",
                        border: `1px solid ${sel ? "var(--gpa-accent-44)" : "var(--gpa-border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>
                        {s.isBenha ? "🏛️" : "🌍"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: sel ? 800 : 600, color: sel ? "var(--gpa-accent)" : "var(--gpa-text)", lineHeight: 1.3 }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--gpa-text-faint)", marginTop: 2 }}>
                          {s.isBenha
                            ? ar ? "136 ساعة للتخرج · مادة 22 + 24" : "136cr to graduate · Art.22 + Art.24"
                            : ar ? `${s.totalReq} ساعة للتخرج · نظام عام` : `${s.totalReq}cr to graduate · Generic scale`}
                        </div>
                      </div>
                      {sel && (
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gpa-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--gpa-bg)", fontWeight: 900, flexShrink: 0 }}>
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 1:
        if (scale.isBenha) {
          const filteredDepts = FACULTY_DATA.departments.filter((d) => {
            if (!deptSearch.trim()) return true;
            const q = deptSearch.toLowerCase();
            return d.nameAr.includes(q) || d.nameEn.toLowerCase().includes(q) || d.id.includes(q);
          });
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Faculty badge — read-only */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: "var(--gpa-surface-alpha-06)", border: "1px solid rgba(34,211,238,0.22)" }}>
                <span style={{ fontSize: 20 }}>🏛️</span>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "var(--gpa-text)" }}>
                    {ar ? FACULTY_DATA.nameAr : FACULTY_DATA.nameEn}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--gpa-accent)", fontFamily: FONT, marginTop: 1 }}>
                    {ar ? "محدد تلقائياً · لائحة 2021" : "Pre-selected · By-law 2021"}
                  </div>
                </div>
              </div>
              {/* Search */}
              <input
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder={ar ? "ابحث عن برنامجك..." : "Search programme..."}
                style={inp}
              />
              {/* Dept picker list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                {filteredDepts.map((d) => {
                  const pal = ssDeptPalette(d.id);
                  const sel = major === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setMajor(d.id); setErr(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 13px", borderRadius: 12, width: "100%",
                        border: sel ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)",
                        background: sel ? `linear-gradient(135deg,${pal.accent}16,${pal.accent}06)` : "var(--gpa-surface-alpha-06)",
                        cursor: "pointer", transition: "all 0.18s",
                        boxShadow: sel ? `0 0 0 1px ${pal.accent}25, 0 2px 10px rgba(0,0,0,.1)` : "none",
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: pal.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                        {pal.glyph}
                      </div>
                      <div style={{ flex: 1, textAlign: ar ? "right" : "left", minWidth: 0 }}>
                        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: sel ? 800 : 600, color: sel ? pal.accent : "var(--gpa-text)", lineHeight: 1.3 }}>
                          {ar ? d.nameAr : d.nameEn}
                        </div>
                      </div>
                      {sel && (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 900, flexShrink: 0 }}>✓</div>
                      )}
                    </button>
                  );
                })}
                {filteredDepts.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px", color: "var(--gpa-text-faint)", fontSize: 13 }}>
                    {ar ? "لا توجد نتائج" : "No results found"}
                  </div>
                )}
              </div>
              {err && <div style={{ color: "var(--gpa-danger)", fontSize: 12, background: "var(--gpa-danger-15)", padding: "8px 12px", borderRadius: 8 }}>⚠️ {err}</div>}
              {/* Level picker */}
              <div>
                <label style={lbl}>{ar ? "المستوى الدراسي الحالي *" : "Current Academic Year *"}</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {[1, 2, 3, 4].map((lv) => {
                    const labels = ar ? { 1: "الأولى", 2: "الثانية", 3: "الثالثة", 4: "الرابعة" } as any : { 1: "Year 1", 2: "Year 2", 3: "Year 3", 4: "Year 4" } as any;
                    const active = currentLevel === lv;
                    return (
                      <button key={lv} onClick={() => setCurrentLevel(lv)} style={{ padding: "10px 6px", fontFamily: FONT, background: active ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)", border: active ? "1px solid var(--gpa-accent-44)" : "1px solid var(--gpa-border)", borderRadius: 10, color: active ? "var(--gpa-accent)" : "var(--gpa-text-faint)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {labels[lv]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* 136cr note */}
              <div style={{ background: "var(--gpa-accent-10)", border: "1px solid #00ff8825", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--gpa-grade-b-plus)", fontWeight: 700, marginBottom: 3 }}>
                  📋 {ar ? "ساعات التخرج طبقاً للمادة 5 من اللائحة:" : "Graduation hours per Art.5 of bylaws:"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--gpa-accent)" }}>136 {ar ? "ساعة معتمدة" : "credits"}</div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>{ar ? "اسم الجامعة / الكلية" : "University / Faculty"} ({ar ? "اختياري" : "optional"})</label>
              <input value={uniName} onChange={(e) => setUniName(e.target.value)} placeholder="Cairo University · Faculty of Science" style={inp} />
            </div>
            <div>
              <label style={lbl}>{ar ? "التخصص / القسم" : "Major / Department"} ({ar ? "اختياري" : "optional"})</label>
              <input value={major} onChange={(e) => setMajor(e.target.value)} placeholder={ar ? "مثال: علوم الحاسب" : "e.g. Computer Science"} style={inp} />
            </div>
            <div>
              <label style={lbl}>{ar ? "عدد ساعات التخرج المطلوبة *" : "Total graduation credits required *"}</label>
              <input type="number" min="60" max="300" value={customTotalReq} onChange={(e) => { setCustomTotalReq(e.target.value); setErr(""); }} placeholder={ar ? "مثال: 120 أو 132 أو 150" : "e.g. 120, 132, 150"} style={inp} />
              {err && <div style={{ marginTop: 6, color: "var(--gpa-danger)", fontSize: 12 }}>⚠️ {err}</div>}
            </div>
            <div>
              <label style={lbl}>{ar ? "المستوى/السنة الدراسية الحالية *" : "Current Academic Year *"}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {[1, 2, 3, 4].map((lv) => {
                  const labels = ar ? { 1: "الأولى", 2: "الثانية", 3: "الثالثة", 4: "الرابعة" } as any : { 1: "Year 1", 2: "Year 2", 3: "Year 3", 4: "Year 4" } as any;
                  const active = currentLevel === lv;
                  return (
                    <button key={lv} onClick={() => setCurrentLevel(lv)} style={{ padding: "10px 6px", fontFamily: FONT, background: active ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)", border: active ? "1px solid var(--gpa-accent-44)" : "1px solid var(--gpa-border)", borderRadius: 10, color: active ? "var(--gpa-accent)" : "var(--gpa-text-faint)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {labels[lv]}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: "var(--gpa-text-faintest)", marginTop: 6 }}>
                {ar ? "تستخدم لدقة التنبؤات والتخطيط الأكاديمي" : "Used to fine-tune predictions and planning"}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* AI Transcript Analyzer */}
            <div
              style={{
                background: "linear-gradient(135deg,var(--gpa-accent-12),var(--gpa-accent2-18))",
                border: "1px solid var(--gpa-accent-44)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gpa-accent)" }}>
                    ✨ {ar ? "تحليل المستند بالذكاء الاصطناعي" : "AI Transcript Analyzer"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", marginTop: 3 }}>
                    {ar
                      ? "ارفع صورة أو PDF لكشف الدرجات — هنستخرج المعدل والساعات والمواد تلقائياً"
                      : "Upload an image or PDF of your transcript — we'll extract GPA, credits and courses"}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAnalyzeFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={aiBusy}
                  style={{
                    padding: "10px 14px",
                    background: "var(--gpa-accent)",
                    border: "none",
                    borderRadius: 10,
                    color: "var(--gpa-bg)",
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: FONT,
                    cursor: aiBusy ? "wait" : "pointer",
                    opacity: aiBusy ? 0.6 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {aiBusy ? (ar ? "جاري التحليل..." : "Analyzing...") : ar ? "📎 رفع المستند" : "📎 Upload"}
                </button>
              </div>
              {aiMsg && (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--gpa-text-soft)" }}>{aiMsg}</div>
              )}
            </div>
            <div
              style={{
                background: "rgba(168,85,247,.10)",
                border: "1px solid #a855f733",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--gpa-violet)",
              }}
            >
              {ar
                ? "💡 أدخل معدلك وساعاتك قبل هذا الفصل — أو استخدم التحليل التلقائي بالأعلى"
                : "💡 Enter your GPA and credits manually — or use the AI analyzer above"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>{ar ? "المعدل التراكمي الحالي *" : "Current Cumulative GPA *"}</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.001"
                  value={prevGpa}
                  onChange={(e) => setPrevGpa(e.target.value)}
                  placeholder="2.750"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>{ar ? "الساعات المكتسبة *" : "Credit Hours Earned *"}</label>
                <input
                  type="number"
                  min="0"
                  value={prevCr}
                  onChange={(e) => setPrevCr(e.target.value)}
                  placeholder="88"
                  style={inp}
                />
              </div>
            </div>
            {err && (
              <div
                style={{
                  color: "var(--gpa-danger)",
                  fontSize: 12,
                  background: "var(--gpa-danger-15)",
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                ⚠️ {err}
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ ...lbl, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {ar ? "الفصل الدراسي الحالي *" : "Current Semester *"}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {(ar
                  ? [["1", "الفصل الأول", "🍂", "سبتمبر — يناير"], ["2", "الفصل الثاني", "🌸", "فبراير — يونيو"], ["summer", "الفصل الصيفي", "☀️", "يوليو — أغسطس"]]
                  : [["1", "First", "🍂", "Sep — Jan"], ["2", "Second", "🌸", "Feb — Jun"], ["summer", "Summer", "☀️", "Jul — Aug"]]
                ).map(([v, l, icon, range]) => {
                  const sel = semester === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setSemester(v)}
                      style={{
                        padding: "14px 8px", fontFamily: FONT, textAlign: "center",
                        background: sel ? "rgba(168,85,247,.12)" : "var(--gpa-surface-alpha-06)",
                        border: sel ? "2px solid #a855f766" : "1.5px solid var(--gpa-border)",
                        borderRadius: 14,
                        color: sel ? "var(--gpa-violet)" : "var(--gpa-text-faint)",
                        cursor: "pointer", transition: "all 0.18s",
                        boxShadow: sel ? "0 2px 14px rgba(168,85,247,.15)" : "none",
                        position: "relative",
                      }}
                    >
                      {sel && <div style={{ position: "absolute", top: 6, insetInlineEnd: 7, width: 7, height: 7, borderRadius: "50%", background: "var(--gpa-violet)" }} />}
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 12, fontWeight: sel ? 800 : 600, lineHeight: 1.2, marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", lineHeight: 1.3 }}>{range}</div>
                    </button>
                  );
                })}
              </div>
              {err && <div style={{ color: "var(--gpa-danger)", fontSize: 12, marginTop: 8, background: "var(--gpa-danger-15)", padding: "8px 12px", borderRadius: 8 }}>⚠️ {err}</div>}
            </div>

            {/* GPA Target Slider */}
            <div style={{ background: "var(--gpa-surface-alpha-06)", border: "1px solid var(--gpa-border)", borderRadius: 14, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gpa-text-muted-2)", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: FONT }}>
                    {ar ? "هدف المعدل عند التخرج" : "Graduation GPA Target"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", fontFamily: FONT, marginTop: 2 }}>
                    {ar ? "المعدل التراكمي الذي تسعى للوصول إليه" : "The cumulative GPA you aim to achieve"}
                  </div>
                </div>
                <div style={{
                  background: `${gpaClr(gradTarget)}18`,
                  border: `1.5px solid ${gpaClr(gradTarget)}44`,
                  borderRadius: 10, padding: "6px 12px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: gpaClr(gradTarget), fontFamily: "'Sora','Cairo',monospace", lineHeight: 1 }}>
                    {gradTarget.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT, marginTop: 2 }}>
                    {gradTarget >= 3.667 ? (ar ? "امتياز" : "Distinction") : gradTarget >= 3.0 ? (ar ? "جيد جداً" : "Very Good") : gradTarget >= 2.0 ? (ar ? "جيد" : "Good") : (ar ? "مقبول" : "Pass")}
                  </div>
                </div>
              </div>
              <input
                type="range" min="2.0" max="4.0" step="0.05"
                value={gradTarget}
                onChange={(e) => setGradTarget(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: gpaClr(gradTarget), height: 5 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>2.00 {ar ? "مقبول" : "Pass"}</span>
                <span style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>{ar ? "امتياز" : "Distinction"} 4.00</span>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Info banner */}
            <div style={{
              background: "linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.10))",
              border: "1px solid rgba(99,102,241,.25)",
              borderRadius: 14, padding: "12px 16px",
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>🎓</span>
              <div style={{ fontFamily: FONT, fontSize: 12, color: "var(--gpa-accent-2-soft)", lineHeight: 1.6 }}>
                <strong style={{ display: "block", marginBottom: 3, fontSize: 13 }}>
                  {ar ? "معايير مرتبة الشرف — المادة 24 من اللائحة" : "Honors Criteria — Article 24 of By-laws"}
                </strong>
                {ar
                  ? "يُشترط لمرتبة الشرف: معدل تراكمي ≥ 3.4 + معدل فصلي ≥ 3.0 في كل فصل + عدم الرسوب في أي مادة."
                  : "Honors requires: CGPA ≥ 3.4 + semester GPA ≥ 3.0 every term + never failed any course."}
              </div>
            </div>

            {/* Failed course question */}
            <div>
              <label style={{ ...lbl, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {ar ? "هل رسبت في أي مادة؟" : "Have you ever failed a course?"}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([
                  [true,  ar ? "نعم، رسبت" : "Yes, I have",  "❌", "var(--gpa-danger)",  ar ? "يؤثر على أهلية الشرف" : "Affects honors eligibility"],
                  [false, ar ? "لا، لم أرسب" : "No, never",  "✅", "var(--gpa-grade-a)", ar ? "مؤهل لمرتبة الشرف" : "Eligible for honors"],
                ] as const).map(([v, l, icon, c, sub]) => {
                  const sel = hasFailed === v;
                  return (
                    <button
                      key={String(v)}
                      onClick={() => setHasFailed(v as boolean)}
                      style={{
                        padding: "14px 12px", fontFamily: FONT, textAlign: "center",
                        background: sel ? `${String(c)}18` : "var(--gpa-surface-alpha-06)",
                        border: sel ? `2px solid ${String(c)}55` : "1.5px solid var(--gpa-border)",
                        borderRadius: 14, cursor: "pointer",
                        transition: "all 0.18s", position: "relative",
                        boxShadow: sel ? `0 2px 14px ${String(c)}20` : "none",
                      }}
                    >
                      {sel && <div style={{ position: "absolute", top: 7, insetInlineEnd: 8, width: 7, height: 7, borderRadius: "50%", background: String(c) }} />}
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 13, fontWeight: sel ? 800 : 600, color: sel ? String(c) : "var(--gpa-text-muted)", lineHeight: 1.2, marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", lineHeight: 1.3 }}>{sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min semester GPA */}
            <div style={{ background: "var(--gpa-surface-alpha-06)", border: "1px solid var(--gpa-border)", borderRadius: 14, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gpa-text-muted-2)", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: FONT }}>
                    {ar ? "أدنى معدل فصلي" : "Lowest Semester GPA"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", fontFamily: FONT, marginTop: 2 }}>
                    {ar ? "اكتب 0 إذا كان هذا أول فصل دراسي لك" : "Enter 0 if this is your first semester"}
                  </div>
                </div>
                <div style={{
                  background: Number(minSemGpa) >= 3.0 ? "var(--gpa-grade-a)18" : "var(--gpa-danger)18",
                  border: `1px solid ${Number(minSemGpa) >= 3.0 ? "var(--gpa-grade-a)" : "var(--gpa-danger)"}44`,
                  borderRadius: 8, padding: "4px 10px",
                  fontSize: 11, fontWeight: 700,
                  color: Number(minSemGpa) >= 3.0 ? "var(--gpa-grade-a)" : "var(--gpa-danger)",
                  fontFamily: "'Sora','Cairo',monospace",
                }}>
                  {Number(minSemGpa) >= 3.0 ? (ar ? "✓ مؤهل" : "✓ OK") : Number(minSemGpa) === 0 ? "–" : (ar ? "✗ منخفض" : "✗ Low")}
                </div>
              </div>
              <input
                type="number" min="0" max="4" step="0.01"
                value={minSemGpa}
                onChange={(e) => setMinSemGpa(e.target.value)}
                placeholder="3.00"
                style={{ ...inp, textAlign: "center", fontSize: 22, fontWeight: 900, fontFamily: "'Sora','Cairo',monospace", padding: "12px" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>0.00 {ar ? "رسوب" : "Fail"}</span>
                <span style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>{ar ? "امتياز" : "Distinction"} 4.00</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  /* ── Welcome-back card: shown when returning guest session detected ── */
  if (showWelcomeBack && existingProfile) {
    const prevDept = FACULTY_DATA.departments.find((d) => d.id === existingProfile.major);
    const pal = ssDeptPalette(existingProfile.major ?? "");
    const gpaNum = Number(existingProfile.prev_gpa ?? 0).toFixed(2);
    const lvNum  = existingProfile.current_level ?? 1;
    const lvAr   = (["الأول", "الثاني", "الثالث", "الرابع"] as const)[lvNum - 1] ?? String(lvNum);
    const semMap: Record<string, string> = {
      "1": ar ? "الفصل الأول" : "Semester 1",
      "2": ar ? "الفصل الثاني" : "Semester 2",
      "s": ar ? "الفصل الصيفي" : "Summer Term",
    };
    const semLabel = semMap[existingProfile.semester] ?? existingProfile.semester;
    const deptName = prevDept ? (ar ? prevDept.nameAr : prevDept.nameEn) : (existingProfile.major || (ar ? "غير محدد" : "Unknown"));
    return (
      <div dir={dir} style={{ fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px 56px", position: "relative", overflowX: "hidden", overflowY: "auto" }}>
        <AppBackground theme={theme} variant="login" />
        <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>
          {/* Logo + controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <Logo height={36} />
            <PremiumControlsBar lang={globalLang} onLangChange={(l) => { setLang(l); setGlobalLang(l); }} theme={theme} onThemeChange={setTheme} />
          </div>
          {/* Card */}
          <div style={{ background: "var(--gpa-card)", border: `2px solid ${pal.accent}44`, borderRadius: 24, padding: "28px 24px", boxShadow: `0 0 48px ${pal.accent}18, var(--gpa-shadow)`, animation: "gpa-fade-in-up 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
            {/* Header: icon + greeting */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, background: pal.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: `0 6px 20px ${pal.accent}40` }}>
                {pal.glyph}
              </div>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: "var(--gpa-text-strong)", lineHeight: 1.2 }}>
                  {ar ? "مرحباً بعودتك! 👋" : "Welcome Back! 👋"}
                </div>
                <div style={{ fontSize: 12, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 4 }}>
                  {ar ? "وجدنا جلسة محفوظة لك في هذا المتصفح" : "We found a saved session in this browser"}
                </div>
              </div>
            </div>
            {/* Stats grid */}
            <div style={{ background: `linear-gradient(135deg,${pal.accent}10,${pal.accent}06)`, border: `1px solid ${pal.accent}22`, borderRadius: 14, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--gpa-text-faint)", fontFamily: FONT, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>{ar ? "البرنامج" : "Programme"}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: pal.accent, fontFamily: FONT, lineHeight: 1.4 }}>{deptName}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--gpa-text-faint)", fontFamily: FONT, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>{ar ? "المستوى" : "Level"}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text-strong)", fontFamily: FONT }}>{ar ? `المستوى ${lvAr}` : `Level ${lvNum}`}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--gpa-text-faint)", fontFamily: FONT, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>{ar ? "المعدل التراكمي" : "CGPA"}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: gpaClr(Number(gpaNum)), fontFamily: "'Sora',monospace" }}>{gpaNum}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--gpa-text-faint)", fontFamily: FONT, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>{ar ? "الفصل" : "Semester"}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text-strong)", fontFamily: FONT }}>{semLabel}</div>
              </div>
            </div>
            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => onContinue?.()}
                style={{ padding: "15px 20px", borderRadius: 14, border: `1.5px solid ${pal.accent}66`, background: `linear-gradient(135deg,${pal.accent}28,${pal.accent}14)`, color: pal.accent, fontFamily: FONT, fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${pal.accent}22` }}
              >
                ⚡ {ar ? "المتابعة من حيث توقفت" : "Continue from where I left off"}
              </button>
              <button
                onClick={() => { setShowWelcomeBack(false); onStartFresh?.(); }}
                style={{ padding: "13px 20px", borderRadius: 14, background: "transparent", border: "1.5px solid var(--gpa-danger-33)", color: "var(--gpa-danger)", fontFamily: FONT, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                🔄 {ar ? "البدء من جديد" : "Start Fresh"}
              </button>
            </div>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "var(--gpa-text-faintest)", textAlign: "center", fontFamily: FONT }}>
            🔒 {ar ? "بياناتك محفوظة في هذا المتصفح فقط — لا تُرسل لأي خادم" : "Data is stored only in this browser — never sent to any server"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    {reviewData && (
      <TranscriptReview
        initial={reviewData.sems}
        warnings={reviewData.warnings}
        grades={scale.grades}
        lang={lang}
        busy={saving}
        onConfirm={(sems) => {
          setPendingSems(sems);
          setReviewData(null);
          const n = sems.reduce((a, s) => a + s.courses.length, 0);
          setAiMsg(
            lang === "ar"
              ? `✅ ${n} مادة جاهزة — هتتحفظ مع إنهاء الإعداد.`
              : `✅ ${n} courses ready — saved when you finish setup.`,
          );
        }}
        onCancel={() => setReviewData(null)}
      />
    )}
    <div
      dir={dir}
      style={{
        fontFamily: FONT,
        background: "var(--gpa-bg)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "20px 16px 56px",
        position: "relative",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      <AppBackground theme={theme} variant="login" />
      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1 }}>

        {/* ── Header: Logo (inline-start) + ThemeSwitcher (inline-end) ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          animation: "gpa-fade-in-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          {/* Logo + tagline — sits at inline-start (right in RTL) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Logo height={38} />
            <p style={{
              margin: 0,
              fontSize: 11,
              fontFamily: FONT,
              color: theme === "dark" ? "rgba(200,210,240,0.38)" : "rgba(15,23,66,0.35)",
              letterSpacing: "0.5px",
            }}>
              {ar ? "خطط · تتبع · تفوق" : "Plan · Track · Excel"}
            </p>
          </div>

          {/* Controls row: Lang + Theme — sits at inline-end (left in RTL) */}
          <PremiumControlsBar
            lang={globalLang}
            onLangChange={setGlobalLang}
            theme={theme}
            onThemeChange={setTheme}
          />
        </div>

        {/* ── Professional Step Stepper ── */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {i > 0 && (
                    <div style={{
                      position: "absolute", top: 12, right: "50%", width: "100%", height: 2,
                      background: done ? "var(--gpa-accent)" : "var(--gpa-border)",
                      transition: "background 0.4s ease", zIndex: 0,
                    }} />
                  )}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", zIndex: 1, position: "relative",
                    background: done ? "var(--gpa-accent)" : active ? "var(--gpa-accent-20)" : "var(--gpa-bg)",
                    border: `2px solid ${done || active ? "var(--gpa-accent)" : "var(--gpa-border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800,
                    color: done ? "var(--gpa-bg)" : active ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                    transition: "all 0.35s ease",
                    boxShadow: active ? "0 0 0 4px var(--gpa-accent-12)" : "none",
                    fontFamily: "'Sora','Cairo',monospace",
                  }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span style={{
                    marginTop: 5, fontSize: 9, fontFamily: FONT,
                    color: active ? "var(--gpa-accent)" : done ? "var(--gpa-text-soft)" : "var(--gpa-text-faintest)",
                    fontWeight: active ? 700 : 400,
                    textAlign: "center", lineHeight: 1.3,
                    maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    padding: "0 2px",
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <style>{`
          @keyframes gpa-slide-in-right { from { opacity:0; transform:translateX(38px) scale(0.975); } to { opacity:1; transform:translateX(0) scale(1); } }
          @keyframes gpa-slide-in-left  { from { opacity:0; transform:translateX(-38px) scale(0.975); } to { opacity:1; transform:translateX(0) scale(1); } }
        `}</style>
        <div
          style={{
            background: "var(--gpa-card)",
            border: "1px solid var(--gpa-border)",
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "var(--gpa-shadow), 0 4px 32px rgba(0,0,0,.06)",
            animation: (() => {
              const fwd = slideDir === "fwd";
              const fromRight = ar ? !fwd : fwd;
              return `${fromRight ? "gpa-slide-in-right" : "gpa-slide-in-left"} 0.35s cubic-bezier(0.22,1,0.36,1) both`;
            })(),
          }}
          key={step}
        >
          {/* Accent top stripe */}
          <div style={{ height: 3, background: "linear-gradient(90deg,var(--gpa-accent) 0%,var(--gpa-accent-2,#6366f1) 100%)" }} />
          {/* Step header */}
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--gpa-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: "var(--gpa-accent-12)",
                border: "1.5px solid var(--gpa-accent-22,rgba(32,84,224,.22))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
                boxShadow: "0 2px 12px var(--gpa-accent-12)",
              }}>
                {STEP_META[step].icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--gpa-text-strong)", fontFamily: FONT, lineHeight: 1.2 }}>
                  {STEP_META[step].title}
                </div>
                <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 3, lineHeight: 1.45 }}>
                  {STEP_META[step].desc}
                </div>
              </div>
              <div dir="ltr" style={{
                flexShrink: 0, background: "var(--gpa-accent-12)", borderRadius: 8,
                padding: "3px 9px", fontSize: 10, fontWeight: 700,
                color: "var(--gpa-accent)", fontFamily: "'Sora','Cairo',monospace",
                border: "1px solid var(--gpa-accent-22,rgba(32,84,224,.22))",
              }}>
                {step + 1} / {STEPS.length}
              </div>
            </div>
          </div>
          {/* Step content */}
          <div style={{ padding: "20px 22px 22px" }}>
            {stepContent()}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{
                flex: 1, padding: "14px 18px",
                background: "var(--gpa-card)",
                border: "1.5px solid var(--gpa-border)",
                borderRadius: 14,
                color: "var(--gpa-text-muted-2)",
                fontSize: 13, fontWeight: 600,
                fontFamily: FONT, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              <span style={{ fontSize: 15 }}>{ar ? "→" : "←"}</span>
              {ar ? "رجوع" : "Back"}
            </button>
          )}
          <button
            onClick={next}
            disabled={saving}
            style={{
              flex: step > 0 ? 2 : 1,
              padding: "15px 20px",
              background: saving
                ? "var(--gpa-accent-25)"
                : "linear-gradient(135deg,var(--gpa-accent) 0%,var(--gpa-accent) 100%)",
              border: "none",
              borderRadius: 14,
              color: saving ? "var(--gpa-accent)" : "var(--gpa-bg)",
              fontSize: 15, fontWeight: 800,
              fontFamily: FONT,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.75 : 1,
              boxShadow: saving ? "none" : "0 6px 28px var(--gpa-accent-35),0 2px 8px rgba(0,0,0,.15)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "opacity 0.2s, box-shadow 0.2s",
              letterSpacing: "0.2px",
            }}
          >
            {saving
              ? <>{ar ? "⏳ جاري الحفظ..." : "⏳ Saving..."}</>
              : step < STEPS.length - 1
              ? <>{ar ? "التالي" : "Next"} <span style={{ fontSize: 17, fontWeight: 900 }}>{ar ? "←" : "→"}</span></>
              : <>{ar ? "🚀 ابدأ التخطيط" : "🚀 Start Planning"}</>}
          </button>
        </div>

        {/* Footer note */}
        <p style={{ margin: "14px 0 0", fontSize: 10, color: "var(--gpa-text-faintest)", textAlign: "center", fontFamily: FONT, lineHeight: 1.5 }}>
          🔒 {ar ? "بياناتك تُحفظ محلياً في المتصفح — لا تُرسل لأي خادم" : "Your data is stored locally in this browser — never sent to any server"}
        </p>
      </div>
    </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   PERCENTAGE CONVERTER MODAL
══════════════════════════════════════════════════════════ */
function PctConverter({ grades, lang, onClose }: any) {
  const [pct, setPct] = useState(75);
  const g = pctToGrade(pct, grades);
  const ar = lang === "ar";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000cc",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--gpa-card)",
          border: "1px solid var(--gpa-border)",
          borderRadius: 18,
          padding: 22,
          maxWidth: 380,
          width: "100%",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: "var(--gpa-text)", fontSize: 15 }}>
            🔢 {ar ? "محوّل النسبة المئوية" : "Percentage Converter"}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--gpa-text-faint)", fontSize: 20, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--gpa-text-muted-2)" }}>{ar ? "النسبة المئوية:" : "Percentage:"}</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: g.clr }}>{pct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={pct}
            onChange={(e) => setPct(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: g.clr }}
          />
        </div>
        <div
          style={{
            background: `${g.clr}15`,
            border: `1px solid ${g.clr}44`,
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, color: g.clr }}>{g.ar}</div>
          <div style={{ fontSize: 16, color: g.clr, opacity: 0.8, marginTop: 4 }}>
            {g.pts.toFixed(3)} {ar ? "نقطة" : "pts"}
          </div>
          <div style={{ fontSize: 12, color: "var(--gpa-text-muted-2)", marginTop: 4 }}>{g.label}</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HISTORY PANEL
══════════════════════════════════════════════════════════ */
function HistoryPanel({ history, grades, lang, onClose, onDeleteSem }: any) {
  const ar = lang === "ar";
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000cc",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--gpa-card)",
          border: "1px solid var(--gpa-border)",
          borderRadius: 18,
          padding: 20,
          maxWidth: 500,
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: "var(--gpa-text)", fontSize: 15 }}>
            📅 {ar ? "سجل الفصول الدراسية" : "Semester History"}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--gpa-text-faint)", fontSize: 20, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "var(--gpa-text-faintest)", fontSize: 13 }}>
            {ar
              ? "لا يوجد فصول محفوظة بعد — اضغط 'حفظ الفصل' بعد إدخال مواد الفصل الحالي"
              : "No saved semesters yet"}
          </div>
        ) : (
          history.map((sem: any, i: number) => {
            const st = standing(sem.cumGpa);
            const isConfirming = confirmId === sem.id;
            const isDeleting = deleting === sem.id;
            return (
              <div
                key={i}
                style={{
                  background: "var(--gpa-bg-soft)",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderRight: `3px solid ${st.clr}`,
                  opacity: isDeleting ? 0.5 : 1,
                  transition: "opacity .2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text-soft)", flex: 1 }}>
                    {sem.label}
                    {sem.isPlanned && (
                      <span style={{ marginInlineStart: 8, fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.15)", padding: "2px 8px", borderRadius: 99, letterSpacing: "0.5px", verticalAlign: "middle" }}>
                        {ar ? "📝 قيد التسجيل" : "📝 Planned"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ fontSize: 19, fontWeight: 900, color: sem.isPlanned ? "#F59E0B" : st.clr }}>
                      {sem.isPlanned ? "—" : sem.cumGpa.toFixed(3)}
                    </div>
                    {onDeleteSem && sem.id && (
                      isConfirming ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={async () => {
                              setDeleting(sem.id);
                              setConfirmId(null);
                              await onDeleteSem(sem.id);
                              setDeleting(null);
                            }}
                            disabled={isDeleting}
                            style={{
                              background: "var(--gpa-danger-15)", border: "1px solid var(--gpa-danger-33)",
                              borderRadius: 6, color: "var(--gpa-danger)", padding: "3px 8px",
                              fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                            }}
                          >
                            {ar ? "تأكيد" : "Delete"}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            style={{
                              background: "none", border: "1px solid var(--gpa-border)",
                              borderRadius: 6, color: "var(--gpa-text-faint)", padding: "3px 7px",
                              fontSize: 10, cursor: "pointer", fontFamily: FONT,
                            }}
                          >
                            {ar ? "إلغاء" : "Cancel"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(sem.id)}
                          title={ar ? "حذف الفصل" : "Delete semester"}
                          style={{
                            background: "none", border: "1px solid rgba(255,107,107,.25)",
                            borderRadius: 6, color: "var(--gpa-danger)", padding: "3px 7px",
                            fontSize: 12, cursor: "pointer", lineHeight: 1, opacity: 0.7,
                          }}
                        >
                          🗑
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--gpa-text-faint)" }}>
                  <span>
                    {ar ? "فصلي:" : "Sem:"}{" "}
                    <span style={{ color: gpaClr(sem.semGpa) }}>{sem.semGpa.toFixed(2)}</span>
                  </span>
                  <span>
                    {ar ? "ساعات:" : "Cr:"} {sem.cr}
                  </span>
                </div>
                {sem.courses?.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {sem.courses.map((c: any, j: number) => (
                      <span
                        key={j}
                        style={{
                          background: `${gc(c.grade, grades)}18`,
                          border: `1px solid ${gc(c.grade, grades)}33`,
                          borderRadius: 6,
                          padding: "2px 7px",
                          fontSize: 10,
                          color: gc(c.grade, grades),
                        }}
                      >
                        {c.name || "—"} {ga(c.grade, grades)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PLANNER
══════════════════════════════════════════════════════════ */
type Course = { id: string; name: string; cr: number; grade: number; retake?: boolean };

function Planner({ profile, onReset, history, onImport, isGuest = false, onSaveSemGuest, onDeleteSem }: { profile: Profile; onReset: () => void; history: any[]; onImport: (payload: ImportPayload) => Promise<void>; isGuest?: boolean; onSaveSemGuest?: (data: any) => void; onDeleteSem?: (semId: string) => Promise<void> }) {
  const { theme, setTheme } = useGpaTheme();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    lang,
    grades,
    totalReq,
    isBenha,
    prevGpa,
    prevCr,
    semester,
    uniName,
    major,
    hasFailed,
    minPrevSemGpa,
    gradTarget,
  } = profile;
  const currentLevel = (profile as any).currentLevel ?? 1;
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const newId = useIdGen();

  const [courses, setCourses] = useState<Course[]>([]);
  const [tab, setTab] = useState("record");
  const [cmpA, setCmpA] = useState(0);
  const [cmpB, setCmpB] = useState(1);
  const [targetGpa, setTargetGpa] = useState(gradTarget || 3.0);
  const [wiCourse, setWiCourse] = useState<string | null>(null);
  const [wiGrade, setWiGrade] = useState(grades[0]?.pts ?? 4.0);
  const [wiMode, setWiMode] = useState<"change" | "plan">("change");
  const [wiPlanCourses, setWiPlanCourses] = useState<{ id: string; name: string; cr: number; grade: number }[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorText, setAdvisorText] = useState<string>("");
  const [analysisText, setAnalysisText] = useState<string>("");
  const askAdvisorFn = useServerFn(askAdvisor);
  const advisorMut = useMutation({
    mutationFn: askAdvisorFn,
    onSuccess: (r: any) => setAdvisorText(r?.text ?? ""),
    onError: (e: any) => setAdvisorText((ar ? "❌ خطأ: " : "❌ Error: ") + (e?.message ?? "")),
  });
  const analysisMut = useMutation({
    mutationFn: askAdvisorFn,
    onSuccess: (r: any) => setAnalysisText(r?.text ?? ""),
    onError: (e: any) => setAnalysisText((ar ? "❌ خطأ: " : "❌ Error: ") + (e?.message ?? "")),
  });
  const [roadmapText, setRoadmapText] = useState<string>("");
  const roadmapFn = useServerFn(generateRoadmap);
  const [auditProgramId, setAuditProgramId] = useState<string>("");
  const roadmapMut = useMutation({
    mutationFn: roadmapFn,
    onSuccess: (r: any) => setRoadmapText(r?.text ?? ""),
    onError: (e: any) => setRoadmapText((ar ? "❌ خطأ: " : "❌ Error: ") + (e?.message ?? "")),
  });
  const queryClient = useQueryClient();
  const saveSemServer = useServerFn(saveSemester);
  const saveSemMut = useMutation({
    mutationFn: saveSemServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      showToast(ar ? "تم حفظ الفصل ✅" : "Semester saved ✅");
    },
    onError: (e: any) => showToast(e?.message || "Save failed", false),
  });

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2400);
  }, []);

  const addCourse = () => {
    const id = newId("c");
    setCourses((p) => [...p, { id, name: "", cr: 3, grade: grades[2]?.pts ?? 3.333 }]);
  };
  const delCourse = (id: string) => {
    setCourses((p) => p.filter((c) => c.id !== id));
    if (wiCourse === id) setWiCourse(null);
  };
  const upd = (id: string, f: keyof Course, v: any) =>
    setCourses((p) => p.map((c) => (c.id === id ? { ...c, [f]: v } : c)));
  const fillAll = (pts: number) => setCourses((p) => p.map((c) => ({ ...c, grade: pts })));

  const semCr = courses.reduce((s, c) => s + (c.cr || 0), 0);
  // Article 20c (Benha bylaws): retake grade is capped at B (3.0) for GPA purposes
  const effectiveGrade = (c: Course) => c.retake ? Math.min(c.grade ?? 3.0, 3.0) : (c.grade ?? 3.0);
  const semPts = courses.reduce((s, c) => s + (c.cr || 0) * effectiveGrade(c), 0);
  const semGpa = semCr ? semPts / semCr : 0;
  const prevPts = prevGpa * prevCr;
  const newPts = prevPts + semPts;
  const newCr = prevCr + semCr;
  const cumGpa = newCr ? newPts / newCr : prevGpa;
  const remCr = Math.max(0, totalReq - newCr);
  const stand = standing(cumGpa);
  const lv = levelInfo(newCr);
  const ld = loadRule(cumGpa, newCr);

  const gradPredict = remCr === 0 ? cumGpa : (newPts + remCr * (grades[2]?.pts ?? 3.333)) / totalReq;

  /* ============= AI CHAT (streaming) ============= */
  type ChatMsg = { role: "user" | "assistant"; content: string };
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatFn = useServerFn(chatWithAdvisor);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMsgs]);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    const next: ChatMsg[] = [...chatMsgs, { role: "user", content: text }];
    setChatMsgs([...next, { role: "assistant", content: "" }]);
    setChatInput("");
    setChatBusy(true);
    try {
      const summary = ar
        ? `الجامعة: ${uniName || "-"} | التخصص: ${major || "-"} | المستوى: ${currentLevel} | التراكمي: ${cumGpa.toFixed(2)} | الفصلي: ${semGpa.toFixed(2)} | الساعات المكتسبة: ${newCr}/${totalReq} | هدف التخرج: ${gradTarget} | التنبؤ: ${gradPredict.toFixed(2)}`
        : `University: ${uniName || "-"} | Major: ${major || "-"} | Level: ${currentLevel} | CGPA: ${cumGpa.toFixed(2)} | Term GPA: ${semGpa.toFixed(2)} | Earned: ${newCr}/${totalReq} | Target: ${gradTarget} | Predicted: ${gradPredict.toFixed(2)}`;
      const stream = (await chatFn({
        data: { lang: lang as "ar" | "en", contextSummary: summary, messages: next.slice(-20) },
      })) as AsyncIterable<{ delta: string }>;
      let acc = "";
      for await (const chunk of stream) {
        acc += chunk?.delta ?? "";
        setChatMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (!acc) {
        setChatMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: ar ? "لم أستلم رداً." : "No response received." };
          return copy;
        });
      }
    } catch (e: any) {
      setChatMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: (ar ? "❌ خطأ: " : "❌ Error: ") + (e?.message ?? "") };
        return copy;
      });
    } finally {
      setChatBusy(false);
    }
  }, [chatInput, chatBusy, chatMsgs, chatFn, lang, ar, uniName, major, currentLevel, cumGpa, semGpa, newCr, totalReq, gradTarget, gradPredict]);

  const honorOk = useMemo(() => {
    const cgpaOk = cumGpa >= 3.667;
    const noFail = !hasFailed;
    const semOk = (minPrevSemGpa >= 3.0 || prevCr === 0) && (semCr === 0 || semGpa >= 3.0);
    return { ok: cgpaOk && noFail && semOk, cgpaOk, noFail, semOk };
  }, [cumGpa, hasFailed, minPrevSemGpa, semGpa, semCr, prevCr]);

  const targetNeeded = useMemo(() => {
    if (!semCr) return 99;
    return (targetGpa * newCr - prevPts) / semCr;
  }, [targetGpa, semCr, newCr, prevPts]);

  const maxG = grades[0]?.pts ?? 4.0;
  const safeG = grades[2]?.pts ?? 3.333;
  const passG = grades[grades.length - 2]?.pts ?? 2.0;
  const scenBest = semCr ? (prevPts + semCr * maxG) / newCr : prevGpa;
  const scenSafe = semCr ? (prevPts + semCr * safeG) / newCr : prevGpa;
  const scenPass = semCr ? (prevPts + semCr * passG) / newCr : prevGpa;

  const wiCourseObj = courses.find((c) => c.id === wiCourse);
  const wiCumGpa = useMemo(() => {
    if (!wiCourseObj) return cumGpa;
    const old = wiCourseObj.grade ?? 3.0;
    return newCr ? (newPts - wiCourseObj.cr * old + wiCourseObj.cr * wiGrade) / newCr : cumGpa;
  }, [wiCourseObj, wiGrade, newPts, newCr, cumGpa]);

  const wiPlanSemCr = wiPlanCourses.reduce((s, c) => s + (c.cr || 0), 0);
  const wiPlanSemPts = wiPlanCourses.reduce((s, c) => s + (c.cr || 0) * c.grade, 0);
  const wiPlanCumGpa = useMemo(() => {
    const totalCr = newCr + wiPlanSemCr;
    return totalCr > 0 ? (newPts + wiPlanSemPts) / totalCr : cumGpa;
  }, [newCr, wiPlanSemCr, newPts, wiPlanSemPts, cumGpa]);

  const semLabel =
    semester === "1" ? (ar ? "الأول" : "1st") : semester === "2" ? (ar ? "الثاني" : "2nd") : ar ? "الصيفي" : "Summer";

  const saveSem = () => {
    if (courses.length === 0) {
      showToast(ar ? "لا توجد مواد لحفظها" : "No courses to save", false);
      return;
    }
    const semData = {
      label: `${semLabel} (${ar ? "فصل" : "sem"} ${history.length + 1})`,
      sem_type: semester,
      year: new Date().getFullYear(),
      courses: courses.map((c) => ({
        name: c.name || "—",
        code: "",
        credits: c.cr,
        grade_letter: ga(c.grade, grades),
        grade_pts: c.grade,
      })),
    };
    if (isGuest && onSaveSemGuest) {
      onSaveSemGuest(semData);
      showToast(ar ? "تم الحفظ مؤقتاً ✅" : "Saved locally ✅");
      setCourses([{ id: newId("c"), name: "", cr: 3, grade: grades[2]?.pts ?? 3.333 }]);
      setModal(null);
      return;
    }
    saveSemMut.mutate({ data: semData });
  };

  const exportData = () => {
    const payload: ImportPayload = {
      profile,
      semesters: history.map((h) => ({
        label: h.label,
        sem_type: "1",
        courses: h.courses.map((c: any) => ({
          name: c.name,
          credits: c.cr,
          grade_pts: c.grade,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...payload }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gpa-advisor-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(ar ? "تم تنزيل النسخة الاحتياطية" : "Backup downloaded");
  };

  const printPdf = () => {
    window.print();
  };

  const triggerImport = () => fileRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (!data.profile || !Array.isArray(data.semesters)) throw new Error("invalid");
      if (!window.confirm(ar ? "سيتم استبدال بياناتك الحالية بالكامل. متابعة؟" : "This replaces all your current data. Continue?")) return;
      await onImport({ profile: data.profile, semesters: data.semesters });
      showToast(ar ? "تم الاستيراد ✓" : "Imported ✓");
    } catch {
      showToast(ar ? "ملف غير صالح" : "Invalid file", false);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const card: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
  };
  const chip = (l: string, v: any, c: string) => (
    <div style={{
      background: `linear-gradient(145deg, var(--gpa-surface-alpha-06), var(--gpa-surface-alpha-08))`,
      border: `1px solid ${c}22`,
      borderRadius: 12,
      padding: "10px 6px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
      boxShadow: `0 0 0 1px ${c}10`,
    }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: c, letterSpacing: "-0.5px", lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 9, color: "var(--gpa-text-faint)", marginTop: 4, letterSpacing: "0.3px", textTransform: "uppercase" }}>{l}</div>
    </div>
  );

  const TABS = ar
    ? [
        ["record", "📚 سجلّي"],
        ["courses", "📋 المواد"],
        ["target", "🎯 الهدف"],
        ["whatif", "🔬 ماذا لو"],
        ["charts", "📊 الرسوم"],
        ["analysis", "⚡ التحليل"],
        ["advisor", "🤖 المستشار"],
        ["chat", "💬 محادثة"],
        ["roadmap", "🗺️ الخريطة"],
        ["scale", "🧮 السكيل"],
        ...(isBenha ? [["audit", "🎓 التدقيق"]] : []),
        ...(isBenha ? [["wizard", "📝 التسجيل"]] : []),
      ]
    : [
        ["record", "📚 My Record"],
        ["courses", "📋 Courses"],
        ["target", "🎯 Target"],
        ["whatif", "🔬 What-If"],
        ["charts", "📊 Charts"],
        ["analysis", "⚡ Analysis"],
        ["advisor", "🤖 Advisor"],
        ["chat", "💬 Chat"],
        ["roadmap", "🗺️ Roadmap"],
        ["scale", "🧮 Scale"],
        ...(isBenha ? [["audit", "🎓 Audit"]] : []),
        ...(isBenha ? [["wizard", "📝 Wizard"]] : []),
      ];

  /* ============= SMART ALERTS ============= */
  const alerts = useMemo(() => {
    const a: { kind: "danger" | "warn" | "info" | "good"; msg: string }[] = [];
    if (cumGpa > 0 && cumGpa < 2.0)
      a.push({ kind: "danger", msg: ar ? "⚠️ معدلك تحت الإنذار الأكاديمي (<2.0). الحد الأقصى للساعات 12." : "⚠️ Academic probation (<2.0). Max load 12 credits." });
    else if (cumGpa > 0 && cumGpa < 2.333)
      a.push({ kind: "warn", msg: ar ? "📉 معدلك قريب من منطقة الخطر، ركّز هذا الفصل." : "📉 Close to danger zone, focus this term." });
    if (history.length >= 2) {
      const last = history[history.length - 1] as any;
      const prev = history[history.length - 2] as any;
      if (last?.semGpa && prev?.semGpa && last.semGpa < prev.semGpa - 0.4)
        a.push({ kind: "warn", msg: ar ? `📊 الفصل الأخير أقل بـ ${(prev.semGpa - last.semGpa).toFixed(2)} نقطة من السابق.` : `📊 Last term dropped ${(prev.semGpa - last.semGpa).toFixed(2)} pts.` });
    }
    if (gradPredict > 0 && gradPredict < gradTarget - 0.1)
      a.push({ kind: "info", msg: ar ? `🎯 التنبؤ ${gradPredict.toFixed(2)} أقل من هدفك ${gradTarget}. تحتاج أداء أعلى.` : `🎯 Predicted ${gradPredict.toFixed(2)} below target ${gradTarget}.` });
    if (honorOk.ok && cumGpa >= 3.667)
      a.push({ kind: "good", msg: ar ? "🏅 ضمن مرتبة الشرف — حافظ على هذا المستوى!" : "🏅 On honors track — keep it up!" });
    if (newCr >= totalReq * 0.9 && remCr > 0)
      a.push({ kind: "info", msg: ar ? `🎓 تبقى ${remCr} ساعة فقط للتخرج!` : `🎓 Only ${remCr} credits to graduation!` });
    return a;
  }, [cumGpa, history, gradPredict, gradTarget, honorOk, newCr, totalReq, remCr, ar]);


  return (
    <TermlyAppShell
      tab={tab}
      onTabChange={setTab}
      tabs={TABS}
      lang={lang}
      dir={dir}
      theme={theme}
      onThemeChange={setTheme}
      cumGpa={cumGpa}
      prevGpa={prevGpa}
      semGpa={semGpa}
      semCr={semCr}
      newCr={newCr}
      totalReq={totalReq}
      remCr={remCr}
      currentLevel={currentLevel}
      uniName={uniName}
      major={major || ""}
      standLabel={stand.label}
      standEn={stand.en}
      standClr={stand.clr}
      standEmoji={stand.emoji}
      isGuest={isGuest}
      onLogout={handleLogout}
      onReset={onReset}
      onNavigateProfile={() => navigate({ to: "/profile" })}
      onShowHistory={() => setModal("history")}
      onShowPctConverter={() => setModal("pct")}
      onShowReminders={() => setModal("reminders")}
      onShowShare={() => setModal("share")}
      onExport={exportData}
      onPrint={printPdf}
      onImport={triggerImport}
    >
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      {modal === "history" && (
        <HistoryPanel history={history} grades={grades} lang={lang} onClose={() => setModal(null)} onDeleteSem={onDeleteSem} />
      )}
      {modal === "pct" && <PctConverter grades={grades} lang={lang} onClose={() => setModal(null)} />}
      {modal === "reminders" && <RemindersPanel lang={lang as "ar" | "en"} onClose={() => setModal(null)} />}
      {modal === "share" && (
        <AchievementCard
          lang={lang as "ar" | "en"}
          onClose={() => setModal(null)}
          cumGpa={cumGpa}
          newCr={newCr}
          totalReq={totalReq}
          uniName={uniName}
          major={major || ""}
          currentLevel={currentLevel}
          standLabel={ar ? stand.label : stand.en}
          honors={!!(isBenha && honorOk.ok)}
        />
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: "none" }} />


      {/* SMART ALERTS */}
      {alerts.length > 0 && (
        <div style={{ padding: "10px 13px 0", display: "flex", flexDirection: "column", gap: 6 }}>
          {alerts.map((a, i) => {
            const map = {
              danger: { bg: "var(--gpa-danger)", op: "22" },
              warn: { bg: "var(--gpa-grade-b-plus)", op: "22" },
              info: { bg: "var(--gpa-info)", op: "22" },
              good: { bg: "var(--gpa-accent)", op: "22" },
            } as const;
            const m = map[a.kind];
            return (
              <div
                key={i}
                style={{
                  background: `color-mix(in oklab, ${m.bg} 12%, var(--gpa-card))`,
                  border: `1px solid ${m.bg}`,
                  borderRadius: 9,
                  padding: "8px 11px",
                  fontSize: 12,
                  color: "var(--gpa-text-strong)",
                  fontFamily: FONT,
                }}
              >
                {a.msg}
              </div>
            );
          })}
        </div>
      )}

      <div key={tab} style={{ padding: "12px 13px 0", animation: "gpa-tab-in 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>
        {/* MY RECORD — saved academic transcript */}
        {tab === "record" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {chip(ar ? "التراكمي" : "CGPA", cumGpa.toFixed(2), gpaClr(cumGpa))}
              {chip(ar ? "الساعات" : "Credits", `${newCr}`, "var(--gpa-accent)")}
              {chip(ar ? "المستوى" : "Level", `${lv.maxFail ? profile.currentLevel : 1}`, "var(--gpa-accent-2)")}
              {chip(
                ar ? "المواد" : "Courses",
                `${history.reduce((a: number, h: any) => a + (h.courses?.length ?? 0), 0)}`,
                "var(--gpa-text-strong)",
              )}
            </div>

            {(() => {
              const missing = history.reduce(
                (a: number, h: any) => a + (h.courses?.filter((c: any) => !c.grade).length ?? 0),
                0,
              );
              if (missing > 0)
                return (
                  <div
                    style={{
                      background: "var(--gpa-danger-15)",
                      border: "1px solid var(--gpa-danger-33)",
                      borderRadius: 10,
                      padding: "9px 12px",
                      marginBottom: 12,
                      fontSize: 11,
                      color: "var(--gpa-danger)",
                    }}
                  >
                    ⚠️{" "}
                    {ar
                      ? `${missing} مادة بدون تقدير — افتح تبويب "المواد" وعدّل التقدير يدوياً، أو افتح "التحليل" للتحليل الشامل.`
                      : `${missing} course(s) without a grade — fix them in the "Courses" tab manually, or open "Analysis" for a full AI review.`}
                  </div>
                );
              return null;
            })()}

            {history.length === 0 ? (
              <div
                style={{
                  ...card,
                  textAlign: "center",
                  color: "var(--gpa-text-faint)",
                  fontSize: 13,
                  padding: 28,
                }}
              >
                {ar
                  ? "لا يوجد سجل بعد — أضف موادك من تبويب \"المواد\" ثم احفظ الفصل."
                  : 'No record yet — add your courses in the "Courses" tab, then save the semester.'}
              </div>
            ) : (
              history.map((sem: any, i: number) => {
                const st = standing(sem.cumGpa);
                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--gpa-card)",
                      border: "1px solid var(--gpa-border)",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 10,
                      borderInlineStart: `3px solid ${st.clr}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text-soft)" }}>
                        {sem.label}
                        {sem.isPlanned && (
                          <span style={{ marginInlineStart: 8, fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.15)", padding: "2px 7px", borderRadius: 99, verticalAlign: "middle" }}>
                            {ar ? "📝 قيد التسجيل" : "📝 Planned"}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {!sem.isPlanned && (
                          <span style={{ fontSize: 11, color: "var(--gpa-text-faint)" }}>
                            {ar ? "فصلي" : "Term"}{" "}
                            <b style={{ color: gpaClr(sem.semGpa) }}>{sem.semGpa.toFixed(2)}</b>
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "var(--gpa-text-faint)" }}>
                          {sem.cr} {ar ? "س" : "cr"}
                        </span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: sem.isPlanned ? "#F59E0B" : st.clr }}>
                          {sem.isPlanned ? "—" : sem.cumGpa.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {sem.courses?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {sem.courses.map((c: any, j: number) => (
                          <div
                            key={j}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "var(--gpa-surface-alpha-06)",
                              borderRadius: 8,
                              padding: "6px 10px",
                            }}
                          >
                            <span style={{ fontSize: 12, color: "var(--gpa-text-soft)" }}>{c.name || "—"}</span>
                            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ fontSize: 10, color: "var(--gpa-text-faintest)" }}>
                                {c.cr} {ar ? "س" : "cr"}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: c.grade ? gc(c.grade, grades) : "var(--gpa-danger)",
                                  minWidth: 34,
                                  textAlign: "center",
                                }}
                              >
                                {c.grade ? ga(c.grade, grades) : ar ? "؟" : "?"}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* COURSES */}
        {tab === "courses" && (
          <div>
            {/* Smart Course Loader */}
            <div
              style={{
                background: semCr > ld.max ? "var(--gpa-danger-15)" : "var(--gpa-surface-alpha-06)",
                border: `1px solid ${semCr > ld.max ? "var(--gpa-danger-33)" : "var(--gpa-border)"}`,
                borderRadius: 10,
                padding: "9px 12px",
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--gpa-text-faint)" }}>
                {ar ? "العبء الدراسي" : "Course load"}{" "}
                <span style={{ fontWeight: 800, color: semCr > ld.max ? "var(--gpa-danger)" : ld.clr }}>
                  {semCr}
                </span>{" "}
                / {ld.max} {ar ? "ساعة" : "cr"}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: semCr > ld.max ? "var(--gpa-danger)" : "var(--gpa-text-faintest)" }}>
                {semCr > ld.max
                  ? ar
                    ? `⚠️ تجاوزت الحد المسموح بمعدلك (${cumGpa.toFixed(2)})`
                    : `⚠️ Over your CGPA limit (${cumGpa.toFixed(2)})`
                  : ar
                  ? `✓ ضمن الحد المسموح حسب معدلك`
                  : `✓ Within your CGPA limit`}
              </div>
            </div>
            {courses.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "var(--gpa-text-faintest)" }}>{ar ? "تعبئة سريعة:" : "Fill all:"}</span>
                {grades.filter((_: any, i: number) => i <= 5).map((g: any) => (
                  <button
                    key={g.ar}
                    onClick={() => fillAll(g.pts)}
                    style={{
                      background: "var(--gpa-surface-alpha-08)",
                      border: `1px solid ${g.clr}44`,
                      borderRadius: 6,
                      padding: "3px 9px",
                      color: g.clr,
                      fontSize: 10,
                      fontFamily: FONT,
                      cursor: "pointer",
                    }}
                  >
                    {g.ar}
                  </button>
                ))}
              </div>
            )}

            {courses.length === 0 && (
              <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--gpa-text-ghost)" }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>📚</div>
                <div style={{ fontSize: 14, color: "var(--gpa-text-faintest)", marginBottom: 4 }}>
                  {ar ? "لا توجد مواد بعد" : "No courses yet"}
                </div>
                <div style={{ fontSize: 11, color: "var(--gpa-text-muted)" }}>
                  {ar ? "اضغط + لإضافة مادة" : "Press + to add a course"}
                </div>
              </div>
            )}

            {courses.map((c) => {
              const clr = gc(c.grade, grades);
              return (
                <div
                  key={c.id}
                  style={{
                    background: "var(--gpa-card)",
                    border: `1px solid ${clr}22`,
                    borderRadius: 12,
                    padding: "12px 13px",
                    marginBottom: 9,
                    borderRight: `3px solid ${clr}66`,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 9 }}>
                    <input
                      value={c.name}
                      onChange={(e) => upd(c.id, "name", e.target.value)}
                      placeholder={ar ? "اسم المادة" : "Course name"}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px dashed var(--gpa-border)",
                        color: "var(--gpa-text-strong)",
                        fontSize: 14,
                        fontFamily: FONT,
                        outline: "none",
                        padding: "2px 0",
                      }}
                    />
                    <button
                      onClick={() => delCourse(c.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--gpa-danger-55)",
                        fontSize: 17,
                        cursor: "pointer",
                        padding: "0 2px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--gpa-text-faintest)" }}>{ar ? "س:" : "cr:"}</span>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          onClick={() => upd(c.id, "cr", n)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 5,
                            fontFamily: FONT,
                            background: c.cr === n ? `${clr}22` : "var(--gpa-surface-alpha-06)",
                            border: c.cr === n ? `1px solid ${clr}77` : "1px solid var(--gpa-border)",
                            color: c.cr === n ? clr : "var(--gpa-text-faintest)",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <select
                      value={c.grade}
                      onChange={(e) => upd(c.id, "grade", parseFloat(e.target.value))}
                      style={{
                        background: `${clr}15`,
                        color: clr,
                        border: `1px solid ${clr}44`,
                        borderRadius: 7,
                        padding: "5px 8px",
                        fontSize: 12,
                        fontFamily: FONT,
                        fontWeight: 700,
                        cursor: "pointer",
                        outline: "none",
                        marginRight: "auto",
                      }}
                    >
                      {grades.map((g: any) => (
                        <option key={g.ar} value={g.pts} style={{ background: "var(--gpa-card)", color: g.clr }}>
                          {g.ar} — {g.label} ({g.pts})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => upd(c.id, "retake", !c.retake)}
                      title={ar ? "إعادة مادة راسبة" : "Retake of a failed course"}
                      style={{
                        background: c.retake ? "var(--gpa-info-15, rgba(56,189,248,.12))" : "var(--gpa-surface-alpha-06)",
                        border: c.retake ? "1px solid var(--gpa-info)" : "1px solid var(--gpa-border)",
                        borderRadius: 7,
                        padding: "5px 9px",
                        color: c.retake ? "var(--gpa-info)" : "var(--gpa-text-faintest)",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: FONT,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ♻ {ar ? "إعادة" : "Retake"}
                    </button>
                  </div>
                  {c.retake && (
                    <div style={{ fontSize: 10, color: "var(--gpa-info)", marginTop: 7 }}>
                      {ar
                        ? "ℹ️ تُحتسب كإعادة — التقدير الجديد يحل محل القديم في التراكمي."
                        : "ℹ️ Counted as a retake — the new grade replaces the old one in CGPA."}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                onClick={addCourse}
                style={{
                  flex: 2,
                  background: "var(--gpa-surface-alpha-06)",
                  border: "1px dashed var(--gpa-border)",
                  borderRadius: 12,
                  padding: "12px",
                  color: "var(--gpa-text-faint)",
                  fontSize: 13,
                  fontFamily: FONT,
                  cursor: "pointer",
                }}
              >
                {ar ? "+ إضافة مادة" : "+ Add Course"}
              </button>
              {courses.length > 0 && (
                <button
                  onClick={saveSem}
                  disabled={saveSemMut.isPending}
                  style={{
                    flex: 1,
                    background: "var(--gpa-accent-12)",
                    border: "1px solid var(--gpa-accent-33)",
                    borderRadius: 12,
                    padding: "12px",
                    color: "var(--gpa-accent)",
                    fontSize: 12,
                    fontFamily: FONT,
                    cursor: saveSemMut.isPending ? "wait" : "pointer",
                    opacity: saveSemMut.isPending ? 0.6 : 1,
                  }}
                >
                  {saveSemMut.isPending ? "..." : ar ? "💾 حفظ الفصل" : "💾 Save Sem"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* TARGET */}
        {tab === "target" && (
          <div>
            <div style={card}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "var(--gpa-text)" }}>
                🎯 {ar ? "السيناريوهات والهدف" : "Scenarios & Target"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 16 }}>
                {[
                  { l: ar ? "أفضل" : "Best", v: scenBest, clr: "var(--gpa-accent)" },
                  { l: ar ? "آمن" : "Safe", v: scenSafe, clr: "var(--gpa-grade-b)" },
                  { l: ar ? "مقبول" : "Pass", v: scenPass, clr: "var(--gpa-grade-c)" },
                ].map((s) => (
                  <div
                    key={s.l}
                    style={{
                      background: `${s.clr}0e`,
                      border: `1px solid ${s.clr}33`,
                      borderRadius: 10,
                      padding: 10,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 9, color: s.clr, marginBottom: 3, opacity: 0.8 }}>{s.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: s.clr }}>{s.v.toFixed(3)}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <label style={{ fontSize: 11, color: "var(--gpa-text-muted-2)" }}>{ar ? "الهدف:" : "Target:"}</label>
                  <span style={{ fontSize: 18, fontWeight: 800, color: gpaClr(targetGpa) }}>
                    {targetGpa.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="4.0"
                  step="0.001"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: gpaClr(targetGpa) }}
                />
              </div>

              <div
                style={{
                  background: "var(--gpa-bg-soft)",
                  padding: 14,
                  borderRadius: 12,
                  textAlign: "center",
                  border: "1px dashed var(--gpa-border)",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--gpa-text-faint)", marginBottom: 5 }}>
                  {ar ? "المعدل الفصلي المطلوب:" : "Required semester GPA:"}
                </div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: targetNeeded > 4 ? "var(--gpa-danger)" : targetNeeded < 0 ? "var(--gpa-accent)" : "var(--gpa-info)",
                  }}
                >
                  {!semCr
                    ? ar
                      ? "أضف مواداً"
                      : "Add courses"
                    : targetNeeded > 4
                      ? ar
                        ? "مستحيل ❌"
                        : "Impossible ❌"
                      : targetNeeded < 0
                        ? ar
                          ? "مضمون ✅"
                          : "Guaranteed ✅"
                        : targetNeeded.toFixed(3)}
                </div>
              </div>
            </div>

            {isBenha && (
              <div style={{ ...card, border: `1px solid ${honorOk.ok ? "var(--gpa-accent-44)" : "var(--gpa-danger-33)"}` }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--gpa-text)" }}>
                  🎖️ {ar ? "مرتبة الشرف (م.24)" : "Honors (Art.24)"}
                </h4>
                <div
                  style={{
                    padding: "9px 14px",
                    borderRadius: 8,
                    textAlign: "center",
                    marginBottom: 10,
                    background: honorOk.ok ? "var(--gpa-accent-12)" : "var(--gpa-danger-15)",
                    border: `1px solid ${honorOk.ok ? "var(--gpa-accent-44)" : "var(--gpa-danger-33)"}`,
                    fontSize: 13,
                    fontWeight: 700,
                    color: honorOk.ok ? "var(--gpa-accent)" : "var(--gpa-danger)",
                  }}
                >
                  {honorOk.ok
                    ? ar
                      ? "✅ مؤهل لمرتبة الشرف"
                      : "✅ Eligible"
                    : ar
                      ? "❌ غير مؤهل"
                      : "❌ Not Eligible"}
                </div>
                {[
                  {
                    ok: honorOk.cgpaOk,
                    t: ar ? `المعدل ≥ 3.667 (حالياً ${cumGpa.toFixed(3)})` : `CGPA ≥ 3.667`,
                  },
                  { ok: honorOk.noFail, t: ar ? "لا رسوب في أي مادة" : "No fail" },
                  {
                    ok: honorOk.semOk,
                    t: ar ? `كل فصل ≥ 3.0 (أدنى ${minPrevSemGpa.toFixed(2)})` : `Each sem ≥ 3.0`,
                  },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 11 }}>
                    <span>{r.ok ? "✅" : "❌"}</span>
                    <span style={{ color: r.ok ? "#aaa" : "var(--gpa-danger)" }}>{r.t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WHAT-IF */}
        {tab === "whatif" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 6, background: "var(--gpa-bg-soft)", borderRadius: 12, padding: 4 }}>
              {(["change", "plan"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setWiMode(m)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 9,
                    border: "none",
                    background: wiMode === m ? "var(--gpa-card)" : "transparent",
                    color: wiMode === m ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                    fontSize: 12,
                    fontWeight: wiMode === m ? 800 : 500,
                    fontFamily: FONT,
                    cursor: "pointer",
                    boxShadow: wiMode === m ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {m === "change"
                    ? (ar ? "🔄 تغيير تقدير" : "🔄 Change Grade")
                    : (ar ? "🗓️ خطط لفصل قادم" : "🗓️ Plan Next Semester")}
                </button>
              ))}
            </div>

            {/* ── MODE: CHANGE EXISTING GRADE ── */}
            {wiMode === "change" && (
              <div style={card}>
                <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  {ar ? "ماذا لو غيّرت تقدير مادة؟" : "What if you change a grade?"}
                </h3>
                {courses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 32, color: "var(--gpa-text-faintest)", fontSize: 13 }}>
                    {ar ? "أضف مواداً أولاً" : "Add courses first"}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                      {courses.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setWiCourse(c.id)}
                          style={{
                            textAlign: ar ? "right" : "left",
                            background: wiCourse === c.id ? "var(--gpa-accent2-18)" : "var(--gpa-surface-alpha-06)",
                            border: wiCourse === c.id ? "1px solid #6366f155" : "1px solid var(--gpa-border)",
                            borderRadius: 8,
                            padding: "9px 12px",
                            color: wiCourse === c.id ? "var(--gpa-accent-2-soft)" : "var(--gpa-text-muted)",
                            fontSize: 12,
                            fontFamily: FONT,
                            cursor: "pointer",
                          }}
                        >
                          {c.name || (ar ? "مادة" : "Course")} · {c.cr}{ar ? "س" : "cr"} · {ga(c.grade, grades)}
                        </button>
                      ))}
                    </div>
                    {wiCourse && (
                      <>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
                          {grades.map((g: any) => (
                            <button
                              key={g.ar}
                              onClick={() => setWiGrade(g.pts)}
                              style={{
                                background: wiGrade === g.pts ? `${g.clr}22` : "var(--gpa-surface-alpha-06)",
                                border: `1px solid ${wiGrade === g.pts ? g.clr : "var(--gpa-border)"}`,
                                borderRadius: 7,
                                padding: "6px 10px",
                                color: wiGrade === g.pts ? g.clr : "var(--gpa-text-faint)",
                                fontSize: 12,
                                fontFamily: FONT,
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              {g.ar}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" }}>
                          {[{ k: "before", v: cumGpa }, { k: "arrow", v: null }, { k: "after", v: wiCumGpa }].map((x: any) =>
                            x.k === "arrow" ? (
                              <div key="arrow" style={{ fontSize: 20, color: "var(--gpa-text-ghost)", textAlign: "center" }}>→</div>
                            ) : (
                              <div key={x.k} style={{ background: "var(--gpa-bg-soft)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                                <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginBottom: 3 }}>
                                  {x.k === "before" ? (ar ? "قبل" : "Before") : (ar ? "بعد" : "After")}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: gpaClr(x.v) }}>{x.v.toFixed(3)}</div>
                                <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginTop: 3 }}>
                                  {x.k === "after" && wiCumGpa !== cumGpa && (
                                    <span style={{ color: wiCumGpa > cumGpa ? "var(--gpa-accent)" : "var(--gpa-danger)", fontWeight: 700 }}>
                                      {wiCumGpa > cumGpa ? "▲" : "▼"} {Math.abs(wiCumGpa - cumGpa).toFixed(3)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── MODE: PLAN FUTURE SEMESTER ── */}
            {wiMode === "plan" && (
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    {ar ? "مواد الفصل القادم" : "Next Semester Courses"}
                  </h3>
                  <button
                    onClick={() => {
                      const id = `wp_${Date.now()}`;
                      setWiPlanCourses((p) => [...p, { id, name: "", cr: 3, grade: grades[2]?.pts ?? 3.333 }]);
                    }}
                    style={{
                      padding: "5px 12px",
                      background: "var(--gpa-accent-12)",
                      border: "1px solid var(--gpa-accent-44)",
                      borderRadius: 8,
                      color: "var(--gpa-accent)",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: "pointer",
                    }}
                  >
                    + {ar ? "أضف مادة" : "Add Course"}
                  </button>
                </div>

                {wiPlanCourses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--gpa-text-faintest)", fontSize: 12 }}>
                    {ar ? "أضف مواداً تنوي دراستها لترى تأثيرها على معدلك" : "Add courses you plan to take to see their GPA impact"}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {wiPlanCourses.map((c) => (
                      <div key={c.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => setWiPlanCourses((p) => p.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x))}
                          placeholder={ar ? "اسم المادة" : "Course name"}
                          style={{
                            flex: 1, padding: "7px 10px",
                            background: "var(--gpa-bg-soft)", border: "1px solid var(--gpa-border)",
                            borderRadius: 8, color: "var(--gpa-text)", fontSize: 12, fontFamily: FONT,
                          }}
                        />
                        <select
                          value={c.cr}
                          onChange={(e) => setWiPlanCourses((p) => p.map((x) => x.id === c.id ? { ...x, cr: +e.target.value } : x))}
                          style={{
                            width: 52, padding: "7px 4px",
                            background: "var(--gpa-bg-soft)", border: "1px solid var(--gpa-border)",
                            borderRadius: 8, color: "var(--gpa-text)", fontSize: 12, fontFamily: FONT,
                          }}
                        >
                          {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}{ar ? "س" : "cr"}</option>)}
                        </select>
                        <select
                          value={c.grade}
                          onChange={(e) => setWiPlanCourses((p) => p.map((x) => x.id === c.id ? { ...x, grade: +e.target.value } : x))}
                          style={{
                            width: 70, padding: "7px 4px",
                            background: "var(--gpa-bg-soft)", border: "1px solid var(--gpa-border)",
                            borderRadius: 8, color: "var(--gpa-text)", fontSize: 12, fontFamily: FONT,
                          }}
                        >
                          {grades.map((g: any) => <option key={g.pts} value={g.pts}>{g.ar}</option>)}
                        </select>
                        <button
                          onClick={() => setWiPlanCourses((p) => p.filter((x) => x.id !== c.id))}
                          style={{
                            width: 28, height: 28, borderRadius: 7,
                            background: "var(--gpa-danger-15)", border: "1px solid var(--gpa-danger-33)",
                            color: "var(--gpa-danger)", fontSize: 14, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {wiPlanCourses.length > 0 && (
                  <>
                    {/* Projected GPA result */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <div style={{ background: "var(--gpa-bg-soft)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginBottom: 3 }}>{ar ? "معدلك الآن" : "Current CGPA"}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: gpaClr(cumGpa) }}>{cumGpa.toFixed(3)}</div>
                        <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginTop: 2 }}>{newCr} {ar ? "س" : "cr"}</div>
                      </div>
                      <div style={{ fontSize: 20, color: "var(--gpa-text-ghost)", textAlign: "center" }}>→</div>
                      <div style={{ background: "var(--gpa-bg-soft)", borderRadius: 10, padding: 14, textAlign: "center", borderBottom: `3px solid ${gpaClr(wiPlanCumGpa)}` }}>
                        <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginBottom: 3 }}>{ar ? "بعد الفصل القادم" : "After Next Semester"}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: gpaClr(wiPlanCumGpa) }}>{wiPlanCumGpa.toFixed(3)}</div>
                        <div style={{ fontSize: 10, marginTop: 2 }}>
                          <span style={{ color: wiPlanCumGpa > cumGpa ? "var(--gpa-accent)" : wiPlanCumGpa < cumGpa ? "var(--gpa-danger)" : "var(--gpa-text-faintest)", fontWeight: 700 }}>
                            {wiPlanCumGpa > cumGpa ? "▲" : wiPlanCumGpa < cumGpa ? "▼" : "—"}{" "}
                            {wiPlanCumGpa !== cumGpa ? Math.abs(wiPlanCumGpa - cumGpa).toFixed(3) : ar ? "بدون تغيير" : "No change"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Next semester stats */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { l: ar ? "ساعات الفصل" : "Semester Credits", v: wiPlanSemCr },
                        { l: ar ? "إجمالي الساعات" : "Total Credits", v: newCr + wiPlanSemCr },
                        { l: ar ? "معدل الفصل" : "Semester GPA", v: wiPlanSemCr ? (wiPlanSemPts / wiPlanSemCr).toFixed(2) : "—" },
                      ].map((s, i) => (
                        <div key={i} style={{ flex: 1, textAlign: "center", background: "var(--gpa-bg-soft)", borderRadius: 9, padding: "8px 4px", border: "1px solid var(--gpa-border)" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--gpa-text)" }}>{s.v}</div>
                          <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", marginTop: 2 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* CHARTS */}
        {tab === "charts" && (
          <div>
            <div style={card}>
              <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--gpa-text-soft)" }}>
                {ar ? "منحنى المعدل التراكمي" : "GPA Trend"}
              </h4>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { name: ar ? "قبل" : "Before", gpa: +prevGpa.toFixed(3) },
                      { name: semLabel, gpa: +cumGpa.toFixed(3) },
                      { name: ar ? "تخرج" : "Grad", gpa: +gradPredict.toFixed(3) },
                    ]}
                  >
                    <defs>
                      <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gpa-accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--gpa-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gpa-card-elevated)" />
                    <XAxis dataKey="name" stroke="var(--gpa-text-faintest)" style={{ fontSize: 9 }} />
                    <YAxis domain={[0, 4]} stroke="var(--gpa-text-faintest)" style={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--gpa-card)",
                        border: "1px solid var(--gpa-border)",
                        fontSize: 11,
                        fontFamily: FONT,
                      }}
                    />
                    <ReferenceLine y={targetGpa} stroke="#ff704366" strokeDasharray="4 4" />
                    <ReferenceLine y={3.667} stroke="var(--gpa-accent-44)" strokeDasharray="3 5" />
                    <Area
                      type="monotone"
                      dataKey="gpa"
                      stroke="var(--gpa-accent)"
                      strokeWidth={2}
                      fill="url(#gg)"
                      dot={{ r: 4, fill: "var(--gpa-accent)", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {courses.length > 0 && (
              <div style={card}>
                <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--gpa-text-soft)" }}>
                  {ar ? "توزيع الدرجات" : "Grade Distribution"}
                </h4>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={courses.map((c) => ({
                        name: (c.name || "—").slice(0, 8),
                        pts: +(c.grade ?? 0).toFixed(3),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--gpa-card-elevated)" />
                      <XAxis dataKey="name" stroke="var(--gpa-text-faintest)" style={{ fontSize: 9 }} />
                      <YAxis domain={[0, 4]} stroke="var(--gpa-text-faintest)" style={{ fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--gpa-card)",
                          border: "1px solid var(--gpa-border)",
                          fontSize: 11,
                          fontFamily: FONT,
                        }}
                      />
                      <Bar dataKey="pts" radius={[4, 4, 0, 0]}>
                        {courses.map((c, i) => (
                          <Cell key={i} fill={gc(c.grade, grades)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {history.length > 1 && (
              <div style={card}>
                <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--gpa-text-soft)" }}>
                  {ar ? "تطور المعدل عبر الفصول" : "GPA across Semesters"}
                </h4>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={history.map((h: any) => ({
                        name: h.label.slice(0, 8),
                        sem: +h.semGpa.toFixed(2),
                        cum: +h.cumGpa.toFixed(3),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--gpa-card-elevated)" />
                      <XAxis dataKey="name" stroke="var(--gpa-text-faintest)" style={{ fontSize: 8 }} />
                      <YAxis domain={[0, 4]} stroke="var(--gpa-text-faintest)" style={{ fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--gpa-card)",
                          border: "1px solid var(--gpa-border)",
                          fontSize: 11,
                          fontFamily: FONT,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, color: "var(--gpa-text-muted-2)" }} />
                      <Bar dataKey="sem" name={ar ? "فصلي" : "Sem"} fill="var(--gpa-accent-2)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="cum" name={ar ? "تراكمي" : "Cum"} fill="var(--gpa-accent)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {history.length > 1 && (() => {
              const a = history[Math.min(cmpA, history.length - 1)];
              const b = history[Math.min(cmpB, history.length - 1)];
              const stat = (h: any) => {
                const cs = h?.courses ?? [];
                const gradesArr = cs.map((c: any) => c.grade ?? 0);
                const cr = cs.reduce((s: number, c: any) => s + (c.cr || 0), 0);
                return {
                  gpa: h?.semGpa ?? 0,
                  cum: h?.cumGpa ?? 0,
                  count: cs.length,
                  cr,
                  hi: gradesArr.length ? Math.max(...gradesArr) : 0,
                  lo: gradesArr.length ? Math.min(...gradesArr) : 0,
                };
              };
              const sa = stat(a);
              const sb = stat(b);
              const sel = {
                background: "var(--gpa-surface-alpha-08)",
                border: "1px solid var(--gpa-border)",
                borderRadius: 8,
                color: "var(--gpa-text-soft)",
                padding: "5px 8px",
                fontSize: 11,
                fontFamily: FONT,
                outline: "none",
                flex: 1,
              } as const;
              const rows: [string, number, number, boolean][] = [
                [ar ? "المعدل الفصلي" : "Sem GPA", sa.gpa, sb.gpa, true],
                [ar ? "التراكمي" : "Cumulative", sa.cum, sb.cum, true],
                [ar ? "عدد المواد" : "Courses", sa.count, sb.count, false],
                [ar ? "الساعات" : "Credits", sa.cr, sb.cr, false],
                [ar ? "أعلى درجة" : "Highest", sa.hi, sb.hi, true],
                [ar ? "أقل درجة" : "Lowest", sa.lo, sb.lo, true],
              ];
              const cell = (v: number, dec: boolean, win: boolean) => (
                <div style={{ fontSize: 13, fontWeight: 800, color: win ? "var(--gpa-accent)" : "var(--gpa-text-soft)" }}>
                  {dec ? v.toFixed(2) : v}
                </div>
              );
              return (
                <div style={card}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--gpa-text-soft)" }}>
                    {ar ? "مقارنة فصلين" : "Compare two semesters"}
                  </h4>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <select value={cmpA} onChange={(e) => setCmpA(+e.target.value)} style={sel}>
                      {history.map((h: any, i: number) => (
                        <option key={i} value={i} style={{ background: "var(--gpa-card)" }}>{h.label}</option>
                      ))}
                    </select>
                    <span style={{ color: "var(--gpa-text-faintest)", alignSelf: "center", fontSize: 11 }}>{ar ? "مقابل" : "vs"}</span>
                    <select value={cmpB} onChange={(e) => setCmpB(+e.target.value)} style={sel}>
                      {history.map((h: any, i: number) => (
                        <option key={i} value={i} style={{ background: "var(--gpa-card)" }}>{h.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 1, background: "var(--gpa-border)", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ background: "var(--gpa-card)", padding: "8px 10px", fontSize: 10, color: "var(--gpa-text-faintest)" }} />
                    <div style={{ background: "var(--gpa-card)", padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--gpa-text)", textAlign: "center" }}>{a.label}</div>
                    <div style={{ background: "var(--gpa-card)", padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--gpa-text)", textAlign: "center" }}>{b.label}</div>
                    {rows.map(([label, va, vb, dec], i) => {
                      const aWin = va > vb;
                      const bWin = vb > va;
                      return (
                        <Fragment key={i}>
                          <div style={{ background: "var(--gpa-card)", padding: "8px 10px", fontSize: 11, color: "var(--gpa-text-faint)" }}>{label}</div>
                          <div style={{ background: "var(--gpa-card)", padding: "8px 10px", textAlign: "center" }}>{cell(va, dec, aWin)}</div>
                          <div style={{ background: "var(--gpa-card)", padding: "8px 10px", textAlign: "center" }}>{cell(vb, dec, bWin)}</div>
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ANALYSIS */}
        {tab === "analysis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* ── GPA Trajectory ── */}
            <div style={card}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                {ar ? "مسار المعدل" : "GPA Trajectory"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { l: ar ? "قبل الفصل" : "Before Term", v: prevGpa, cr: prevCr, icon: "📌" },
                  { l: ar ? "الفصل الحالي" : "This Semester", v: semGpa, cr: semCr, icon: "📋" },
                  { l: ar ? "التراكمي الجديد" : "New CGPA", v: cumGpa, cr: newCr, icon: "🎓" },
                  { l: ar ? "توقع التخرج" : "Graduation Est.", v: gradPredict, cr: totalReq, icon: "🏁" },
                ].map((r) => (
                  <div
                    key={r.l}
                    style={{
                      padding: "14px 12px",
                      background: "var(--gpa-bg-soft)",
                      borderRadius: 12,
                      border: "1px solid var(--gpa-border)",
                      borderBottom: `3px solid ${gpaClr(r.v)}`,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>{r.icon}</span>
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.4px" }}>{r.l}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: gpaClr(r.v), lineHeight: 1 }}>
                      {isNaN(r.v) || r.v === 0 ? "—" : r.v.toFixed(3)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginTop: 4 }}>
                      {r.cr} {ar ? "ساعة" : "credits"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Status + Progress ── */}
            <div style={card}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                {ar ? "الوضع الأكاديمي" : "Academic Status"}
              </h3>

              {/* Standing badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 28 }}>{stand.emoji}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: stand.clr }}>{ar ? stand.label : stand.en}</div>
                  <div style={{ fontSize: 11, color: "var(--gpa-text-faintest)" }}>{stand.pct} · {ar ? `الحد الأقصى ${ld.max} ساعة` : `Max load ${ld.max} cr`}</div>
                </div>
                {honorOk?.ok && (
                  <div style={{ marginInlineStart: "auto", background: "var(--gpa-accent-12)", border: "1px solid var(--gpa-accent-44)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "var(--gpa-accent)", fontWeight: 700 }}>
                    🏅 {ar ? "مرتبة الشرف" : "Honors"}
                  </div>
                )}
              </div>

              {/* Credit progress bar */}
              <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--gpa-text-faint)" }}>
                <span>{ar ? `${lv.ar} · المستوى ${currentLevel}` : `${lv.en} · Level ${currentLevel}`}</span>
                <span style={{ fontWeight: 700 }}>{newCr} / {totalReq} {ar ? "س" : "cr"}</span>
              </div>
              <div style={{ height: 10, background: "var(--gpa-bg)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--gpa-border)" }}>
                <div style={{ width: `${Math.min((newCr / totalReq) * 100, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${lv.clr}, var(--gpa-accent))`, transition: "width .6s", borderRadius: 6 }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--gpa-text-faintest)" }}>
                {remCr > 0
                  ? (ar ? `تبقى ${remCr} ساعة للتخرج` : `${remCr} credits remaining to graduation`)
                  : (ar ? "✅ اكتملت ساعات التخرج" : "✅ Graduation credits complete")}
              </div>
            </div>

            {/* ── Semester History Table ── */}
            {history.length > 0 && (
              <div style={card}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                  {ar ? "مسار الفصول" : "Semester History"}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: ar ? "1fr auto auto auto" : "1fr auto auto auto", gap: 1, background: "var(--gpa-border)", borderRadius: 10, overflow: "hidden" }}>
                  {/* header */}
                  {[ar ? "الفصل" : "Semester", ar ? "فصلي" : "Term GPA", ar ? "تراكمي" : "CGPA", ar ? "ساعات" : "Cr"].map((h) => (
                    <div key={h} style={{ background: "var(--gpa-card-elevated)", padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "var(--gpa-text-faintest)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</div>
                  ))}
                  {history.map((h: any, i: number) => {
                    const prev = i > 0 ? (history[i - 1] as any).semGpa : null;
                    const trend = prev == null ? null : h.semGpa > prev + 0.05 ? "▲" : h.semGpa < prev - 0.05 ? "▼" : "—";
                    const trendClr = trend === "▲" ? "var(--gpa-accent)" : trend === "▼" ? "var(--gpa-danger)" : "var(--gpa-text-faintest)";
                    return (
                      <Fragment key={i}>
                        <div style={{ background: "var(--gpa-card)", padding: "9px 10px", fontSize: 12, color: "var(--gpa-text-soft)", fontWeight: 600 }}>{h.label}</div>
                        <div style={{ background: "var(--gpa-card)", padding: "9px 10px", fontSize: 13, fontWeight: 700, color: gpaClr(h.semGpa), display: "flex", alignItems: "center", gap: 4 }}>
                          {h.semGpa.toFixed(2)}
                          {trend && <span style={{ fontSize: 9, color: trendClr }}>{trend}</span>}
                        </div>
                        <div style={{ background: "var(--gpa-card)", padding: "9px 10px", fontSize: 13, fontWeight: 700, color: gpaClr(h.cumGpa) }}>{h.cumGpa.toFixed(3)}</div>
                        <div style={{ background: "var(--gpa-card)", padding: "9px 10px", fontSize: 11, color: "var(--gpa-text-faint)" }}>{h.cr}</div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Smart Insights ── */}
            {history.length > 0 && (() => {
              const semGpas = (history as any[]).map((h) => h.semGpa as number);
              const bestSem = (history as any[]).reduce((a, b) => a.semGpa > b.semGpa ? a : b);
              const worstSem = (history as any[]).reduce((a, b) => a.semGpa < b.semGpa ? a : b);
              const avgSemGpa = semGpas.reduce((s, g) => s + g, 0) / semGpas.length;
              const variance = semGpas.reduce((s, g) => s + Math.pow(g - avgSemGpa, 2), 0) / semGpas.length;
              const stdDev = Math.sqrt(variance);
              const consistency = Math.max(0, Math.round((1 - stdDev / 2) * 100));
              const improvements = semGpas.slice(1).map((g, i) => g - semGpas[i]);
              const trend = improvements.length > 0
                ? improvements.reduce((s, v) => s + v, 0) / improvements.length
                : 0;
              const trendLabel = trend > 0.05
                ? (ar ? "📈 في تحسن" : "📈 Improving")
                : trend < -0.05
                  ? (ar ? "📉 في تراجع" : "📉 Declining")
                  : (ar ? "➡️ مستقر" : "➡️ Stable");
              const trendClr = trend > 0.05 ? "var(--gpa-accent)" : trend < -0.05 ? "var(--gpa-danger)" : "var(--gpa-text-faint)";
              const creditsPerSem = newCr / Math.max(1, (history as any[]).length + 1);
              const semsLeft = remCr > 0 ? Math.ceil(remCr / Math.max(1, creditsPerSem)) : 0;
              return (
                <div style={card}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                    ✨ {ar ? "رؤى ذكية" : "Smart Insights"}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {[
                      {
                        icon: "🏆",
                        l: ar ? "أفضل فصل" : "Best Semester",
                        v: bestSem.semGpa.toFixed(2),
                        sub: bestSem.label,
                        clr: "var(--gpa-accent)",
                      },
                      {
                        icon: "📉",
                        l: ar ? "أضعف فصل" : "Weakest Semester",
                        v: worstSem.semGpa.toFixed(2),
                        sub: worstSem.label,
                        clr: semGpas.length > 1 ? gpaClr(worstSem.semGpa) : "var(--gpa-text-faint)",
                      },
                      {
                        icon: "🎯",
                        l: ar ? "اتجاه الأداء" : "Performance Trend",
                        v: trendLabel,
                        sub: trend !== 0 ? `${trend > 0 ? "+" : ""}${trend.toFixed(2)} ${ar ? "نقطة/فصل" : "pts/term"}` : "",
                        clr: trendClr,
                      },
                      {
                        icon: "🔄",
                        l: ar ? "الاتساق" : "Consistency",
                        v: `${consistency}%`,
                        sub: stdDev < 0.2 ? (ar ? "ممتاز" : "Excellent") : stdDev < 0.4 ? (ar ? "جيد" : "Good") : (ar ? "متذبذب" : "Variable"),
                        clr: consistency >= 80 ? "var(--gpa-accent)" : consistency >= 60 ? "var(--gpa-grade-b)" : "var(--gpa-grade-c)",
                      },
                    ].map((item, i) => (
                      <div key={i} style={{
                        padding: "12px 12px",
                        background: "var(--gpa-bg-soft)",
                        borderRadius: 12,
                        border: "1px solid var(--gpa-border)",
                      }}>
                        <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                          <span>{item.icon}</span><span>{item.l}</span>
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: item.clr, lineHeight: 1 }}>{item.v}</div>
                        {item.sub && <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", marginTop: 4 }}>{item.sub}</div>}
                      </div>
                    ))}
                  </div>
                  {semsLeft > 0 && (
                    <div style={{ padding: "10px 14px", background: "var(--gpa-accent-12)", border: "1px solid var(--gpa-accent-44)", borderRadius: 10, fontSize: 12, color: "var(--gpa-accent)", display: "flex", justifyContent: "space-between" }}>
                      <span>🎓 {ar ? "وتيرة الساعات الحالية" : "At your current pace"}</span>
                      <span style={{ fontWeight: 800 }}>~{semsLeft} {ar ? "فصل للتخرج" : "semesters left"}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── AI Full Analysis ── */}
            <div style={card}>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                {ar ? "التحليل الذكي الشامل" : "AI Full Analysis"}
              </h3>
              <p style={{ fontSize: 11, color: "var(--gpa-text-faint)", margin: "0 0 14px", lineHeight: 1.75 }}>
                {ar
                  ? "تحليل كامل لأدائك الأكاديمي — نقاط القوة، المخاطر، الاتجاهات، وتوصيات فصل قادم."
                  : "Full breakdown of your academic performance — strengths, risks, trends, and next-semester recommendations."}
              </p>
              <button
                onClick={() => {
                  if (isGuest) { showToast(ar ? "سجّل دخولك لاستخدام الذكاء الاصطناعي 🔒" : "Sign in to use AI features 🔒", false); return; }
                  setAnalysisText("");
                  analysisMut.mutate({
                    data: {
                      lang: lang as "ar" | "en",
                      context: {
                        uniName: uniName || "",
                        major: major || "",
                        level: currentLevel,
                        semester,
                        prevGpa,
                        prevCr,
                        cumGpa,
                        semGpa,
                        newCr,
                        totalReq,
                        gradTarget,
                        gradPredict,
                        hasFailed,
                        honorOk: honorOk?.ok ?? false,
                        courses: courses.map((c) => ({ name: c.name || "—", cr: c.cr, grade: c.grade })),
                        history: history.map((h: any) => ({ label: h.label, gpa: h.cumGpa, cr: h.cumCr ?? newCr })),
                      },
                    },
                  });
                }}
                disabled={analysisMut.isPending}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: analysisMut.isPending
                    ? "var(--gpa-card-elevated)"
                    : "linear-gradient(135deg, var(--gpa-accent), var(--gpa-accent-2))",
                  color: analysisMut.isPending ? "var(--gpa-text-faint)" : "var(--gpa-bg)",
                  border: "none",
                  borderRadius: 12,
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: analysisMut.isPending ? "wait" : "pointer",
                  letterSpacing: "0.2px",
                  transition: "all 0.2s",
                }}
              >
                {analysisMut.isPending
                  ? (ar ? "⏳ جاري التحليل..." : "⏳ Analyzing...")
                  : (ar ? "🔬 شغّل التحليل الشامل" : "🔬 Run Full Analysis")}
              </button>

              {analysisText && (
                <div style={{ marginTop: 14 }}>
                  {/* Render markdown-like output with sections */}
                  {analysisText.split("\n").map((line, i) => {
                    if (line.startsWith("## ") || line.startsWith("### "))
                      return <div key={i} style={{ fontSize: 13, fontWeight: 800, color: "var(--gpa-accent)", margin: "14px 0 6px", fontFamily: FONT_HEAD }}>{line.replace(/^#+\s*/, "")}</div>;
                    if (line.startsWith("**") && line.endsWith("**"))
                      return <div key={i} style={{ fontSize: 12, fontWeight: 700, color: "var(--gpa-text-strong)", margin: "10px 0 4px" }}>{line.replace(/\*\*/g, "")}</div>;
                    if (line.startsWith("- ") || line.startsWith("• "))
                      return <div key={i} style={{ fontSize: 12, color: "var(--gpa-text-strong)", padding: "3px 0 3px 14px", borderInlineStart: "2px solid var(--gpa-accent-44)", marginBottom: 3, lineHeight: 1.65 }}>{"• "}{line.replace(/^[-•]\s*/, "")}</div>;
                    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
                    return <div key={i} style={{ fontSize: 12, color: "var(--gpa-text-strong)", lineHeight: 1.7, marginBottom: 2 }}>{line}</div>;
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ADVISOR */}
        {tab === "advisor" && (
          <div style={card}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--gpa-text)" }}>
              🤖 {ar ? "المستشار الذكي" : "AI Advisor"}
            </h3>
            <p style={{ fontSize: 11, color: "var(--gpa-text-faint)", margin: "0 0 12px" }}>
              {ar
                ? "يحلل وضعك الأكاديمي ويعطيك نصائح عملية مبنية على بياناتك."
                : "Analyzes your academic data and gives actionable advice."}
            </p>
            <button
              onClick={() => {
                if (isGuest) { showToast(ar ? "سجّل دخولك لاستخدام الذكاء الاصطناعي 🔒" : "Sign in to use AI features 🔒", false); return; }
                advisorMut.mutate({
                  data: {
                    lang: lang as "ar" | "en",
                    context: {
                      uniName: uniName || "",
                      major: major || "",
                      level: currentLevel,
                      semester,
                      prevGpa,
                      prevCr,
                      cumGpa,
                      semGpa,
                      newCr,
                      totalReq,
                      gradTarget,
                      gradPredict,
                      hasFailed,
                      honorOk: honorOk.ok,
                      courses: courses.map((c) => ({ name: c.name || "—", cr: c.cr, grade: c.grade })),
                      history: history.map((h: any) => ({ label: h.label, gpa: h.cumGpa, cr: h.cumCr ?? newCr })),
                    },
                  },
                });
              }}
              disabled={advisorMut.isPending}
              style={{
                width: "100%",
                padding: "12px",
                background: advisorMut.isPending ? "var(--gpa-card-elevated)" : "linear-gradient(135deg,var(--gpa-accent),var(--gpa-accent-2))",
                color: "var(--gpa-bg)",
                border: "none",
                borderRadius: 10,
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 13,
                cursor: advisorMut.isPending ? "wait" : "pointer",
              }}
            >
              {advisorMut.isPending
                ? ar
                  ? "جاري التحليل..."
                  : "Analyzing..."
                : ar
                  ? "✨ احصل على نصيحة ذكية"
                  : "✨ Get smart advice"}
            </button>
            {advisorText && (
              <div style={{ marginTop: 14 }}>
                {advisorText.split("\n").map((line, i) => {
                  if (line.startsWith("## ") || line.startsWith("### "))
                    return <div key={i} style={{ fontSize: 13, fontWeight: 800, color: "var(--gpa-accent)", margin: "14px 0 6px", fontFamily: FONT_HEAD }}>{line.replace(/^#+\s*/, "")}</div>;
                  if (line.startsWith("**") && line.endsWith("**"))
                    return <div key={i} style={{ fontSize: 12, fontWeight: 700, color: "var(--gpa-text-strong)", margin: "10px 0 4px" }}>{line.replace(/\*\*/g, "")}</div>;
                  if (line.startsWith("- ") || line.startsWith("• "))
                    return <div key={i} style={{ fontSize: 12, color: "var(--gpa-text-strong)", padding: "3px 0 3px 14px", borderInlineStart: "2px solid var(--gpa-accent-44)", marginBottom: 3, lineHeight: 1.65 }}>{"• "}{line.replace(/^[-•]\s*/, "")}</div>;
                  if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
                  return <div key={i} style={{ fontSize: 12, color: "var(--gpa-text-strong)", lineHeight: 1.7, marginBottom: 2 }}>{line}</div>;
                })}
              </div>
            )}
          </div>
        )}

        {/* AI CHAT */}
        {tab === "chat" && (
          <div style={{ ...card, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--gpa-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "var(--gpa-text)", fontFamily: FONT_HEAD }}>
                💬 {ar ? "محادثة مع المستشار" : "Chat with Advisor"}
              </h3>
              {chatMsgs.length > 0 && (
                <button
                  onClick={() => setChatMsgs([])}
                  style={{ background: "none", border: "none", color: "var(--gpa-text-faint)", fontSize: 11, cursor: "pointer", fontFamily: FONT }}
                >
                  {ar ? "مسح" : "Clear"}
                </button>
              )}
            </div>

            <div
              ref={chatScrollRef}
              style={{ flex: 1, minHeight: 320, maxHeight: 460, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}
            >
              {chatMsgs.length === 0 && (
                <div style={{ margin: "auto", textAlign: "center", color: "var(--gpa-text-faint)", fontSize: 12, lineHeight: 1.8 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>
                  {ar
                    ? "اسأل المستشار أي سؤال عن خطتك الدراسية، الإعادة، رفع المعدل، أو الحمل الدراسي."
                    : "Ask the advisor anything about your study plan, retakes, raising GPA, or course load."}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 14 }}>
                    {(ar
                      ? ["كيف أرفع معدلي؟", "هل أعيد مادة؟", "كم ساعة آخذ هذا الفصل؟"]
                      : ["How do I raise my GPA?", "Should I retake a course?", "How many credits this term?"]
                    ).map((q) => (
                      <button
                        key={q}
                        onClick={() => setChatInput(q)}
                        style={{ background: "var(--gpa-accent-08)", border: "1px solid var(--gpa-border)", borderRadius: 999, padding: "6px 12px", fontSize: 11, color: "var(--gpa-accent)", cursor: "pointer", fontFamily: FONT }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMsgs.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    background: m.role === "user" ? "linear-gradient(135deg,var(--gpa-accent),var(--gpa-accent-2))" : "var(--gpa-bg-soft)",
                    color: m.role === "user" ? "#fff" : "var(--gpa-text-strong)",
                    border: m.role === "user" ? "none" : "1px solid var(--gpa-border)",
                    borderRadius: 14,
                    padding: "10px 13px",
                    fontSize: 13,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    fontFamily: FONT,
                  }}
                >
                  {m.content || (chatBusy && i === chatMsgs.length - 1 ? "…" : "")}
                </div>
              ))}
            </div>

            <div style={{ padding: 10, borderTop: "1px solid var(--gpa-border)", display: "flex", gap: 8 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder={ar ? "اكتب سؤالك..." : "Type your question..."}
                disabled={chatBusy}
                style={{
                  flex: 1,
                  background: "var(--gpa-card)",
                  border: "1px solid var(--gpa-border)",
                  borderRadius: 10,
                  color: "var(--gpa-text-strong)",
                  padding: "11px 13px",
                  fontSize: 13,
                  fontFamily: FONT,
                  outline: "none",
                }}
              />
              <button
                onClick={sendChat}
                disabled={chatBusy || !chatInput.trim()}
                style={{
                  background: chatBusy || !chatInput.trim() ? "var(--gpa-card-elevated)" : "linear-gradient(135deg,var(--gpa-accent),var(--gpa-accent-2))",
                  color: chatBusy || !chatInput.trim() ? "var(--gpa-text-faint)" : "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "0 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  fontFamily: FONT,
                  cursor: chatBusy || !chatInput.trim() ? "default" : "pointer",
                }}
              >
                {chatBusy ? "…" : ar ? "إرسال" : "Send"}
              </button>
            </div>
          </div>
        )}



        {tab === "roadmap" && (
          <div style={card}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--gpa-text)" }}>
              🗺️ {ar ? "خريطة الطريق للتخرج" : "Graduation Roadmap"}
            </h3>
            <p style={{ fontSize: 11, color: "var(--gpa-text-faint)", margin: "0 0 12px" }}>
              {ar ? "خطة فصلية ذكية بناءً على مستواك ومعدلك للوصول لهدف التخرج." : "Smart semester-by-semester plan based on your level and GPA."}
            </p>
            <button
              onClick={() => {
                if (isGuest) { showToast(ar ? "سجّل دخولك لاستخدام الذكاء الاصطناعي 🔒" : "Sign in to use AI features 🔒", false); return; }
                roadmapMut.mutate({ data: {
                  lang: lang as "ar" | "en",
                  uniName: uniName || "",
                  major: major || "",
                  currentLevel,
                  prevGpa: cumGpa,
                  newCr,
                  totalReq,
                  gradTarget,
                  hasFailed,
                } });
              }}
              disabled={roadmapMut.isPending}
              style={{ width: "100%", padding: 12, background: roadmapMut.isPending ? "var(--gpa-card-elevated)" : "linear-gradient(135deg,var(--gpa-accent),var(--gpa-accent-2))", color: "var(--gpa-bg)", border: "none", borderRadius: 10, fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: roadmapMut.isPending ? "wait" : "pointer" }}
            >
              {roadmapMut.isPending ? (ar ? "جاري التخطيط..." : "Planning...") : (ar ? "🚀 ولّد الخطة" : "🚀 Generate plan")}
            </button>
            {roadmapText && (
              <div style={{ marginTop: 14 }}>
                {roadmapText.split("\n").map((line, i) => {
                  if (line.startsWith("## ") || line.startsWith("### "))
                    return <div key={i} style={{ fontSize: 13, fontWeight: 800, color: "var(--gpa-accent)", margin: "14px 0 6px", fontFamily: FONT_HEAD }}>{line.replace(/^#+\s*/, "")}</div>;
                  if (line.startsWith("**") && line.endsWith("**"))
                    return <div key={i} style={{ fontSize: 12, fontWeight: 700, color: "var(--gpa-text-strong)", margin: "10px 0 4px" }}>{line.replace(/\*\*/g, "")}</div>;
                  if (line.startsWith("- ") || line.startsWith("• "))
                    return <div key={i} style={{ fontSize: 12, color: "var(--gpa-text-strong)", padding: "3px 0 3px 14px", borderInlineStart: "2px solid var(--gpa-accent-44)", marginBottom: 3, lineHeight: 1.65 }}>{"• "}{line.replace(/^[-•]\s*/, "")}</div>;
                  if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
                  return <div key={i} style={{ fontSize: 12, color: "var(--gpa-text-strong)", lineHeight: 1.7, marginBottom: 2 }}>{line}</div>;
                })}
              </div>
            )}
          </div>
        )}

        {tab === "scale" && (
          <div style={card}>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--gpa-text)" }}>
              {isBenha ? (ar ? "لائحة بنها 2021" : "Benha 2021") : ar ? "جدول التقديرات" : "Grading Scale"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {grades.map((g: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "var(--gpa-bg-soft)",
                    borderRadius: 8,
                    borderRight: `4px solid ${g.clr}`,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 900, color: g.clr, minWidth: 28 }}>{g.ar}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--gpa-text-soft)" }}>
                      {g.label} · {g.pts.toFixed(3)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--gpa-text-faint)" }}>≥ {g.minPct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "audit" && isBenha && (() => {
          const programList = BENHA_PROGRAMS.map((p) => ({ id: p.id, name: ar ? p.nameAr : p.nameEn, dept: p.department }));
          const selectedProg = BENHA_PROGRAMS.find((p) => p.id === auditProgramId) ?? null;

          const allCodes: string[] = [];
          const creditMap: Record<string, number> = {};
          for (const h of history as any[]) {
            for (const c of h.courses ?? []) {
              if (c.code) { allCodes.push(c.code); creditMap[c.code] = c.cr ?? c.credits ?? 0; }
              if (c.name) { allCodes.push(c.name); creditMap[c.name] = c.cr ?? c.credits ?? 0; }
            }
          }

          const audit = selectedProg ? computeDegreeAudit(selectedProg, allCodes, creditMap) : null;

          const pctBar = (pct: number, clr: string) => (
            <div style={{ height: 8, background: "var(--gpa-surface-alpha-06)", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
              <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: clr, borderRadius: 99, transition: "width 0.5s ease" }} />
            </div>
          );

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={card}>
                <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  {ar ? "🎓 تدقيق درجة التخرج" : "🎓 Degree Audit"}
                </h3>
                <p style={{ fontSize: 11, color: "var(--gpa-text-faint)", margin: "0 0 12px" }}>
                  {ar ? "اختر تخصصك لرؤية مدى تقدمك نحو متطلبات التخرج وفق لائحة 2021." : "Select your program to see progress toward graduation requirements under the 2021 bylaws."}
                </p>
                <select
                  value={auditProgramId}
                  onChange={(e) => setAuditProgramId(e.target.value)}
                  style={{ width: "100%", background: "var(--gpa-surface-alpha-08)", border: "1px solid var(--gpa-border)", borderRadius: 9, color: "var(--gpa-text)", padding: "9px 12px", fontSize: 12, fontFamily: FONT, outline: "none", cursor: "pointer" }}
                >
                  <option value="">{ar ? "— اختر التخصص —" : "— Select program —"}</option>
                  {programList.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: "var(--gpa-card)" }}>{p.name} ({p.dept})</option>
                  ))}
                </select>
              </div>

              {audit && selectedProg && (
                <>
                  <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gpa-text)" }}>
                        {ar ? selectedProg.nameAr : selectedProg.nameEn}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: audit.progressPercent >= 80 ? "var(--gpa-accent)" : audit.progressPercent >= 50 ? "var(--gpa-grade-b)" : "var(--gpa-grade-c)" }}>
                        {audit.progressPercent}%
                      </span>
                    </div>
                    {pctBar(audit.progressPercent, audit.progressPercent >= 80 ? "var(--gpa-accent)" : audit.progressPercent >= 50 ? "var(--gpa-grade-b)" : "var(--gpa-grade-c)")}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                      {[
                        { l: ar ? "مكتمل" : "Done", v: audit.totalCompleted, clr: "var(--gpa-accent)" },
                        { l: ar ? "متبقي" : "Left", v: audit.totalRemaining, clr: "var(--gpa-grade-c)" },
                        { l: ar ? "المطلوب" : "Required", v: audit.totalRequired, clr: "var(--gpa-text-soft)" },
                      ].map((item, i) => (
                        <div key={i} style={{ background: "var(--gpa-bg-soft)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: item.clr }}>{item.v}</div>
                          <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", textTransform: "uppercase", marginTop: 3 }}>{item.l} {ar ? "ساعة" : "cr"}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={card}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 12, color: "var(--gpa-text-soft)", fontWeight: 700 }}>
                      {ar ? "المتطلبات الإلزامية" : "Compulsory Requirements"}
                    </h4>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--gpa-text-faint)", marginBottom: 4 }}>
                      <span>{audit.compulsoryCompleted}/{audit.compulsoryRequired} {ar ? "ساعة" : "cr"}</span>
                      <span>{audit.compulsoryRequired > 0 ? Math.round((audit.compulsoryCompleted / audit.compulsoryRequired) * 100) : 0}%</span>
                    </div>
                    {pctBar(audit.compulsoryRequired > 0 ? (audit.compulsoryCompleted / audit.compulsoryRequired) * 100 : 0, "var(--gpa-accent)")}
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                      {audit.completedCourses.filter((a) => a.type === "compulsory").map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, padding: "5px 8px", background: "rgba(79,255,176,0.06)", borderRadius: 6, border: "1px solid rgba(79,255,176,0.15)" }}>
                          <span style={{ color: "var(--gpa-accent)" }}>✓</span>
                          <span style={{ flex: 1, color: "var(--gpa-text-soft)" }}>{a.course.name}</span>
                          <span style={{ color: "var(--gpa-text-faintest)" }}>{a.course.credits} {ar ? "س" : "cr"}</span>
                        </div>
                      ))}
                      {audit.pendingCourses.filter((a) => a.type === "compulsory").slice(0, 8).map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, padding: "5px 8px", background: "var(--gpa-surface-alpha-06)", borderRadius: 6, border: "1px solid var(--gpa-border)" }}>
                          <span style={{ color: "var(--gpa-text-faintest)" }}>○</span>
                          <span style={{ flex: 1, color: "var(--gpa-text-faint)" }}>{a.course.name}</span>
                          <span style={{ color: "var(--gpa-text-faintest)" }}>{a.course.credits} {ar ? "س" : "cr"}</span>
                        </div>
                      ))}
                      {audit.pendingCourses.filter((a) => a.type === "compulsory").length > 8 && (
                        <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", textAlign: "center", paddingTop: 4 }}>
                          +{audit.pendingCourses.filter((a) => a.type === "compulsory").length - 8} {ar ? "مادة أخرى متبقية" : "more pending"}
                        </div>
                      )}
                    </div>
                  </div>

                  {audit.electiveRequired > 0 && (
                    <div style={card}>
                      <h4 style={{ margin: "0 0 10px", fontSize: 12, color: "var(--gpa-text-soft)", fontWeight: 700 }}>
                        {ar ? "المتطلبات الاختيارية" : "Elective Requirements"}
                      </h4>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--gpa-text-faint)", marginBottom: 4 }}>
                        <span>{audit.electiveCompleted}/{audit.electiveRequired} {ar ? "ساعة" : "cr"}</span>
                        <span>{audit.electiveRequired > 0 ? Math.round((audit.electiveCompleted / audit.electiveRequired) * 100) : 0}%</span>
                      </div>
                      {pctBar(audit.electiveRequired > 0 ? (audit.electiveCompleted / audit.electiveRequired) * 100 : 0, "var(--gpa-accent-2)")}
                    </div>
                  )}

                  <div style={card}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 12, color: "var(--gpa-text-soft)", fontWeight: 700 }}>
                      {ar ? "المتطلبات الخاصة" : "Special Requirements"}
                    </h4>
                    {audit.specialRequirements.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 6, background: r.met ? "rgba(79,255,176,0.06)" : "var(--gpa-surface-alpha-06)", borderRadius: 8, border: `1px solid ${r.met ? "rgba(79,255,176,0.2)" : "var(--gpa-border)"}` }}>
                        <span style={{ fontSize: 16 }}>{r.met ? "✅" : "⭕"}</span>
                        <div>
                          <div style={{ fontSize: 12, color: r.met ? "var(--gpa-accent)" : "var(--gpa-text-soft)", fontWeight: 600 }}>{r.label}</div>
                          <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)" }}>{r.details}</div>
                        </div>
                      </div>
                    ))}
                    {allCodes.length === 0 && (
                      <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", marginTop: 8 }}>
                        {ar ? "⚠️ لم يتم العثور على رموز المواد في سجلك — تأكد من أن المواد محفوظة برمز صحيح." : "⚠️ No course codes found in your record — ensure saved courses have codes."}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {tab === "wizard" && isBenha && (
          <div style={{ padding: "0 0 24px" }}>
            <CourseWizard
              lang={lang as "ar" | "en"}
              cumGpa={cumGpa}
              earnedCr={newCr}
              totalReq={totalReq}
              isGuest={isGuest}
              initialDeptId={major || undefined}
              initialLevelId={currentLevel >= 1 ? currentLevel : undefined}
              initialSemesterId={
                semester === "s" ? "summer" :
                semester === "1" ? 1 :
                semester === "2" ? 2 :
                undefined
              }
              history={(history as any[]).map((h) => ({
                courses: (h.courses ?? []).map((c: any) => ({
                  code: c.code ?? "",
                  name: c.name,
                  grade: Number(c.grade ?? 0),
                  cr: c.cr,
                })),
              }))}
              onSavePlan={isGuest && onSaveSemGuest
                ? async (planData) => {
                    if (onSaveSemGuest) onSaveSemGuest(planData);
                    showToast(ar ? "خطة محفوظة مؤقتاً ✅" : "Plan saved locally ✅");
                  }
                : !isGuest
                  ? async (planData) => {
                      await saveSemServer({ data: planData });
                      queryClient.invalidateQueries({ queryKey: ["semesters"] });
                      showToast(ar ? "تم حفظ الخطة في سجلك ✅" : "Plan saved to your record ✅");
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlide{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes gpa-slide-toast{from{opacity:0;transform:translateX(-50%) translateY(-16px) scale(0.92)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
        *{box-sizing:border-box}
        input[type=range]{width:100%}
        select option{background:var(--gpa-card)}
        .gpa-tab-hide-scroll::-webkit-scrollbar{display:none}
      `}</style>
    </TermlyAppShell>
  );
}

const iconBtn: React.CSSProperties = {
  background: "linear-gradient(135deg, var(--gpa-surface-alpha-08), var(--gpa-surface-alpha-06))",
  border: "1px solid var(--gpa-border)",
  borderRadius: 10,
  color: "var(--gpa-text-soft)",
  padding: "7px 12px",
  fontSize: 11,
  fontFamily: FONT,
  cursor: "pointer",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  transition: "all 0.2s ease",
};

const menuItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  textAlign: "start",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 10,
  color: "var(--gpa-text-soft)",
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

/* ══════════════════════════════════════════════════════════
   GUEST BANNER
══════════════════════════════════════════════════════════ */
function GuestBanner({ lang }: { lang: string }) {
  const ar = lang === "ar";
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 9000,
        background: "linear-gradient(90deg,rgba(8,11,22,0.97) 0%,rgba(14,18,40,0.97) 100%)",
        backdropFilter: "blur(22px) saturate(1.5)",
        WebkitBackdropFilter: "blur(22px) saturate(1.5)",
        borderBottom: "1px solid rgba(79,255,176,0.18)",
        padding: "9px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontFamily: FONT,
        animation: "gpa-slide-in-right 0.45s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {/* Left icon */}
      <span style={{ fontSize: 15, flexShrink: 0 }}>🔓</span>

      {/* Message */}
      <span style={{ fontSize: 11.5, color: "rgba(200,210,240,0.6)", flexShrink: 1, minWidth: 0 }}>
        {ar
          ? "وضع الزائر — سجّل دخولك لحفظ بياناتك بشكل دائم عبر جميع أجهزتك"
          : "Guest mode — sign in to permanently save your data across all your devices"}
      </span>

      {/* CTA */}
      <a
        href="/login"
        style={{
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 800,
          color: "rgba(8,11,22,0.95)",
          textDecoration: "none",
          background: "var(--gpa-accent)",
          borderRadius: 20,
          padding: "4px 14px",
          letterSpacing: "0.3px",
          boxShadow: "0 2px 12px var(--gpa-accent-35)",
          transition: "opacity 0.2s",
        }}
      >
        {ar ? "حفظ بياناتي ←" : "Save my data →"}
      </a>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "rgba(200,210,240,0.35)", fontSize: 16, padding: "0 2px", lineHeight: 1 }}
        title={ar ? "إغلاق" : "Dismiss"}
      >×</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function GPAAdvisorApp({ isGuest = false, forceSetup = false }: { isGuest?: boolean; forceSetup?: boolean } = {}) {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const listSemestersFn = useServerFn(listSemesters);
  const saveProfileFn = useServerFn(saveProfile);
  const saveSemesterFn = useServerFn(saveSemester);
  const deleteProfileFn = useServerFn(deleteProfile);
  const deleteSemesterFn = useServerFn(deleteSemester);
  const queryClient = useQueryClient();
  // Initialise theme attribute on mount
  useGpaTheme();

  // Guest mode: localStorage-backed state
  const [guestRawProfile, setGuestRawProfile] = useState<any>(() => {
    if (!isGuest || typeof window === "undefined") return undefined;
    try { return JSON.parse(localStorage.getItem("termly_guest_profile") ?? "null"); } catch { return null; }
  });
  const [guestSemsData, setGuestSemsData] = useState<{ semesters: any[]; courses: any[] }>(() => {
    if (typeof window === "undefined") return { semesters: [], courses: [] };
    try { return JSON.parse(localStorage.getItem("termly_guest_sems") ?? "null") ?? { semesters: [], courses: [] }; } catch { return { semesters: [], courses: [] }; }
  });
  const [skipSetup, setSkipSetup] = useState(false);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
    enabled: !isGuest,
  });
  const semestersQ = useQuery({
    queryKey: ["semesters"],
    queryFn: () => listSemestersFn(),
    enabled: !isGuest && !!profileQ.data,
  });

  const saveProfileMut = useMutation({
    mutationFn: saveProfileFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
  const deleteProfileMut = useMutation({
    mutationFn: deleteProfileFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
  const deleteSemMut = useMutation({
    mutationFn: (id: string) => deleteSemesterFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["semesters"] }),
  });

  useEffect(() => {
    if (profileQ.error) {
      const msg = profileQ.error instanceof Error ? profileQ.error.message : String(profileQ.error);
      if (/unauthorized|401|forbidden|session.*expir/i.test(msg)) {
        navigate({ to: "/login", search: { redirect: "/app", error: undefined } });
      } else if (msg && msg !== "[object Object]") {
        console.error("Profile load error:", msg);
      }
    }
  }, [profileQ.error, navigate]);

  if (!isGuest && profileQ.isLoading) {
    return (
      <div
        style={{
          background: "var(--gpa-bg)",
          minHeight: "100vh",
          fontFamily: FONT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div style={{ position: "relative" }}>
          <Logo height={44} />
          <div style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: "2px solid var(--gpa-accent)",
            borderTopColor: "transparent",
            animation: "gpa-spin-load 0.9s linear infinite",
          }} />
        </div>
        <div style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}>
          {[0, 0.15, 0.3].map((delay, i) => (
            <div key={i} style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--gpa-accent)",
              opacity: 0.7,
              animation: `gpa-dot-bounce 1.2s ease-in-out ${delay}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes gpa-spin-load { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes gpa-dot-bounce {
            0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
            40% { transform: scale(1.1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  const dbProfile = isGuest ? ((forceSetup && !skipSetup) ? null : guestRawProfile) : profileQ.data;

  const guestSaveSem = (semData: any) => {
    const semId = crypto.randomUUID();
    const newSem = { id: semId, label: semData.label, sem_type: semData.sem_type, year: semData.year ?? null, user_id: "guest", created_at: new Date().toISOString(), sort_order: guestSemsData.semesters.length };
    const newCourses = (semData.courses || []).map((c: any) => ({ id: crypto.randomUUID(), semester_id: semId, user_id: "guest", name: c.name, code: c.code ?? "", credits: c.credits, grade_letter: c.grade_letter ?? null, grade_pts: c.grade_pts ?? null, created_at: new Date().toISOString(), is_failed: false, percentage: null, retake_of: null }));
    const updated = { semesters: [...guestSemsData.semesters, newSem], courses: [...guestSemsData.courses, ...newCourses] };
    localStorage.setItem("termly_guest_sems", JSON.stringify(updated));
    setGuestSemsData(updated);
  };

  if (!dbProfile) {
    // Authenticated users → dedicated onboarding wizard
    if (!isGuest) {
      navigate({ to: "/onboarding" });
      return null;
    }

    // Guest users → inline setup screen (no server account)
    return (
      <SetupScreen
        existingProfile={forceSetup && !skipSetup ? guestRawProfile : null}
        onContinue={() => setSkipSetup(true)}
        onStartFresh={() => {
          localStorage.removeItem("termly_guest_profile");
          localStorage.removeItem("termly_guest_sems");
          setGuestRawProfile(null);
          setGuestSemsData({ semesters: [], courses: [] });
        }}
        onDone={async (p, sems) => {
          const rawProfile = { lang: p.lang, scale_id: p.scaleId, is_benha: p.isBenha, total_req: p.totalReq, uni_name: p.uniName, major: p.major, prev_gpa: p.prevGpa, prev_cr: p.prevCr, semester: p.semester, has_failed: p.hasFailed, min_prev_sem_gpa: p.minPrevSemGpa, grad_target: p.gradTarget, current_level: p.currentLevel };
          let newSemsData: { semesters: any[]; courses: any[] } = { semesters: [], courses: [] };
          if (sems?.length) {
            for (const s of sems) {
              if (!s.courses?.length) continue;
              const semId = crypto.randomUUID();
              newSemsData.semesters.push({ id: semId, label: s.label, sem_type: s.sem_type || "1", year: s.year ?? null, user_id: "guest", created_at: new Date().toISOString(), sort_order: newSemsData.semesters.length });
              for (const c of s.courses) {
                newSemsData.courses.push({ id: crypto.randomUUID(), semester_id: semId, user_id: "guest", name: c.name || "—", code: c.code ?? "", credits: c.credits, grade_letter: c.grade_letter ?? null, grade_pts: c.grade_pts ?? null, created_at: new Date().toISOString(), is_failed: false, percentage: null, retake_of: null });
              }
            }
          }
          localStorage.setItem("termly_guest_profile", JSON.stringify(rawProfile));
          localStorage.setItem("termly_guest_sems", JSON.stringify(newSemsData));
          setGuestRawProfile(rawProfile);
          setGuestSemsData(newSemsData);
        }}
      />
    );
  }

  // Rebuild Profile object for Planner
  const scale = SCALE_SYSTEMS.find((s) => s.id === dbProfile.scale_id) ?? SCALE_SYSTEMS[0];
  const profile: Profile = {
    lang: dbProfile.lang,
    scaleId: dbProfile.scale_id,
    grades: scale.grades,
    totalReq: dbProfile.total_req,
    isBenha: dbProfile.is_benha,
    uniName: dbProfile.uni_name ?? "",
    major: dbProfile.major ?? "",
    prevGpa: Number(dbProfile.prev_gpa),
    prevCr: dbProfile.prev_cr,
    semester: dbProfile.semester,
    hasFailed: dbProfile.has_failed,
    minPrevSemGpa: Number(dbProfile.min_prev_sem_gpa),
    gradTarget: Number(dbProfile.grad_target),
    currentLevel: (dbProfile as any).current_level ?? 1,
  };

  // Build history from DB or localStorage (guest)
  const semsData = isGuest ? guestSemsData : semestersQ.data;
  const history: any[] = [];
  if (semsData) {
    const baseCr = profile.prevCr;
    const basePts = profile.prevGpa * profile.prevCr;
    let cumCr = baseCr;
    let cumPts = basePts;
    for (const sem of semsData.semesters) {
      const semCourses = semsData.courses.filter((c) => c.semester_id === sem.id);
      // A semester is "planned" (wizard-drafted) when sem_type is "wizard"
      // OR all its courses have no grade yet — exclude these from CGPA accumulation
      const isPlanned =
        sem.sem_type === "wizard" ||
        semCourses.every((c) => c.grade_pts === null || c.grade_pts === undefined);
      const gradedCourses = semCourses.filter(
        (c) => c.grade_pts !== null && c.grade_pts !== undefined,
      );
      const cr = semCourses.reduce((s, c) => s + c.credits, 0);
      const gradedCr = gradedCourses.reduce((s, c) => s + c.credits, 0);
      const pts = gradedCourses.reduce((s, c) => s + c.credits * Number(c.grade_pts), 0);
      if (!isPlanned) {
        cumCr += gradedCr;
        cumPts += pts;
      }
      history.push({
        id: sem.id,
        label: sem.label,
        isPlanned,
        semGpa: gradedCr ? pts / gradedCr : 0,
        cumGpa: cumCr ? cumPts / cumCr : 0,
        cr,
        cumCr,
        courses: semCourses.map((c) => ({ name: c.name, code: c.code ?? "", grade: Number(c.grade_pts ?? 0), cr: c.credits })),
      });
    }
  }

  return (
    <>
      {isGuest && <GuestBanner lang={profile.lang} />}
      <div style={isGuest ? { paddingTop: 38 } : undefined}>
        <Planner
          profile={profile}
          history={history}
          isGuest={isGuest}
          onSaveSemGuest={isGuest ? guestSaveSem : undefined}
          onDeleteSem={isGuest ? undefined : async (id: string) => { await deleteSemMut.mutateAsync(id); }}
          onReset={async () => {
            if (typeof window !== "undefined" && !window.confirm(profile.lang === "ar" ? "متأكد من إعادة التعيين؟" : "Reset?")) return;
            if (isGuest) {
              localStorage.removeItem("termly_guest_profile");
              localStorage.removeItem("termly_guest_sems");
              setGuestRawProfile(null);
              setGuestSemsData({ semesters: [], courses: [] });
              return;
            }
            await deleteProfileMut.mutateAsync({});
          }}
          onImport={async (payload) => {
            if (isGuest) {
              const p = payload.profile;
              const rawProfile = { lang: p.lang, scale_id: p.scaleId, is_benha: p.isBenha, total_req: p.totalReq, uni_name: p.uniName ?? "", major: p.major ?? "", prev_gpa: p.prevGpa, prev_cr: p.prevCr, semester: p.semester, has_failed: p.hasFailed, min_prev_sem_gpa: p.minPrevSemGpa, grad_target: p.gradTarget, current_level: (p as any).currentLevel ?? 1 };
              const importedSems: { semesters: any[]; courses: any[] } = { semesters: [], courses: [] };
              for (const sem of payload.semesters) {
                if (!sem.courses?.length) continue;
                const semId = crypto.randomUUID();
                importedSems.semesters.push({ id: semId, label: sem.label, sem_type: sem.sem_type || "1", year: sem.year ?? null, user_id: "guest", created_at: new Date().toISOString(), sort_order: importedSems.semesters.length });
                for (const c of sem.courses) {
                  importedSems.courses.push({ id: crypto.randomUUID(), semester_id: semId, user_id: "guest", name: c.name || "—", code: c.code ?? "", credits: c.credits, grade_letter: c.grade_letter ?? null, grade_pts: c.grade_pts ?? null, created_at: new Date().toISOString(), is_failed: false, percentage: null, retake_of: null });
                }
              }
              localStorage.setItem("termly_guest_profile", JSON.stringify(rawProfile));
              localStorage.setItem("termly_guest_sems", JSON.stringify(importedSems));
              setGuestRawProfile(rawProfile);
              setGuestSemsData(importedSems);
              return;
            }
            await deleteProfileMut.mutateAsync({});
            const p = payload.profile;
            await saveProfileMut.mutateAsync({
              data: {
                lang: p.lang,
                scale_id: p.scaleId,
                is_benha: p.isBenha,
                total_req: p.totalReq,
                uni_name: p.uniName ?? "",
                major: p.major ?? "",
                prev_gpa: p.prevGpa,
                prev_cr: p.prevCr,
                semester: p.semester,
                has_failed: p.hasFailed,
                min_prev_sem_gpa: p.minPrevSemGpa,
                grad_target: p.gradTarget,
                current_level: (p as any).currentLevel ?? 1,
              },
            });
            for (const sem of payload.semesters) {
              if (!sem.courses?.length) continue;
              await saveSemesterFn({
                data: {
                  label: sem.label,
                  sem_type: sem.sem_type || "1",
                  year: sem.year ?? null,
                  courses: sem.courses.map((c) => ({
                    name: c.name || "—",
                    code: c.code ?? "",
                    credits: c.credits,
                    grade_letter: c.grade_letter ?? null,
                    grade_pts: c.grade_pts ?? null,
                  })),
                },
              });
            }
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["semesters"] });
          }}
        />
      </div>
    </>
  );
}
