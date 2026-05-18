// Ported from user's original GPAAdvisorApp_2.jsx
// Inline styles preserved to keep the original neon dark aesthetic intact.
// Persistence layer (was in-memory SESSION) replaced with Supabase via server fns.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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

import { supabase } from "@/integrations/supabase/client";
import {
  deleteProfile,
  getProfile,
  listSemesters,
  saveProfile,
  saveSemester,
} from "@/lib/profile.functions";
import { analyzeTranscript } from "@/lib/transcript.functions";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "./use-theme";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LangSwitcher } from "./LangSwitcher";

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
const FONT = "'Cairo','Noto Sans Arabic',sans-serif";
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
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        background: ok ? "var(--gpa-accent-15)" : "var(--gpa-danger-15)",
        border: `1px solid ${ok ? "var(--gpa-accent-55)" : "var(--gpa-danger-55)"}`,
        color: ok ? "var(--gpa-accent)" : "var(--gpa-danger)",
        padding: "9px 24px",
        borderRadius: 22,
        fontSize: 13,
        zIndex: 9999,
        fontFamily: FONT,
        boxShadow: "0 4px 24px #00000088",
        animation: "fadeSlide .2s ease",
        whiteSpace: "nowrap",
      }}
    >
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

function SetupScreen({ onDone }: { onDone: (p: Profile) => void }) {
  const { lang: globalLang, setLang: setGlobalLang } = useLang();
  const [step, setStep] = useState(0);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const analyzeFn = useServerFn(analyzeTranscript);
  const scale = SCALE_SYSTEMS.find((s) => s.id === scaleId)!;
  const resolvedTotalReq = scale.isBenha ? 136 : parseInt(customTotalReq) || 120;

  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  const STEPS = ar
    ? ["اللغة والنظام", "بيانات الجامعة", "المعدل والساعات", "الفصل والهدف", "مرتبة الشرف"]
    : ["Language & Scale", "University Info", "GPA & Credits", "Semester & Goal", "Honors Check"];

  const inp: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid #1e1e3f",
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
      if (step < STEPS.length - 1) setStep((s) => s + 1);
      else submit();
    }
  };
  const back = () => setStep((s) => s - 1);

  const submit = () => {
    const g = parseFloat(prevGpa), c = parseInt(prevCr), ms = parseFloat(minSemGpa);
    if (isNaN(g) || isNaN(c)) return;
    onDone({
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
    });
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
      setAiMsg(
        lang === "ar"
          ? `✅ تم استخراج ${filled} حقل + ${result.courses?.length ?? 0} مادة. راجع البيانات.`
          : `✅ Extracted ${filled} fields + ${result.courses?.length ?? 0} courses. Please review.`,
      );
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>{ar ? "اللغة" : "Language"}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["ar", "العربية 🇪🇬"], ["en", "English 🇬🇧"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setLang(v)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontFamily: FONT,
                      background: lang === v ? "var(--gpa-accent2-18)" : "var(--gpa-surface-alpha-06)",
                      border: lang === v ? "1px solid #6366f166" : "1px solid #1e1e3f",
                      borderRadius: 10,
                      color: lang === v ? "var(--gpa-accent-2-soft)" : "var(--gpa-text-faint)",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>{ar ? "نظام التقدير" : "Grading Scale"}</label>
              {SCALE_SYSTEMS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScaleId(s.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: ar ? "right" : "left",
                    marginBottom: 8,
                    padding: "12px 14px",
                    fontFamily: FONT,
                    background: scaleId === s.id ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                    border: scaleId === s.id ? "1px solid var(--gpa-accent-44)" : "1px solid #1e1e3f",
                    borderRadius: 10,
                    color: scaleId === s.id ? "var(--gpa-accent)" : "var(--gpa-text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {scaleId === s.id ? "✓ " : ""}
                  {s.label}
                  <span style={{ color: "var(--gpa-text-faint)", fontSize: 11, display: "block", marginTop: 2 }}>
                    {s.isBenha
                      ? ar
                        ? "136 ساعة للتخرج · مادة 22 + 24"
                        : "136cr graduation · Art.22+24"
                      : ar
                        ? `${s.totalReq} ساعة`
                        : `${s.totalReq}cr`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>
                {ar ? "اسم الجامعة / الكلية" : "University / Faculty"} (
                {ar ? "اختياري" : "optional"})
              </label>
              <input
                value={uniName}
                onChange={(e) => setUniName(e.target.value)}
                placeholder={
                  scaleId === "benha" ? "جامعة بنها · كلية العلوم" : "Cairo University · Faculty of Science"
                }
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>
                {ar ? "التخصص / القسم" : "Major / Department"} ({ar ? "اختياري" : "optional"})
              </label>
              <input
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder={ar ? "مثال: التقنية الحيوية" : "e.g. Biotechnology"}
                style={inp}
              />
            </div>
            {scale.isBenha ? (
              <div
                style={{
                  background: "var(--gpa-accent-10)",
                  border: "1px solid #00ff8825",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 12, color: "var(--gpa-grade-b-plus)", fontWeight: 700, marginBottom: 4 }}>
                  📋 {ar ? "ساعات التخرج طبقاً للمادة 5 من اللائحة:" : "Graduation hours per Art.5 of bylaws:"}
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--gpa-accent)" }}>
                  136 {ar ? "ساعة معتمدة" : "credits"}
                </div>
                <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", marginTop: 4 }}>
                  {ar ? "ثابتة — لا يمكن تغييرها" : "Fixed — cannot be changed"}
                </div>
              </div>
            ) : (
              <div>
                <label style={lbl}>
                  {ar ? "عدد ساعات التخرج المطلوبة في جامعتك *" : "Total graduation credits required *"}
                </label>
                <input
                  type="number"
                  min="60"
                  max="300"
                  value={customTotalReq}
                  onChange={(e) => {
                    setCustomTotalReq(e.target.value);
                    setErr("");
                  }}
                  placeholder={ar ? "مثال: 120 أو 132 أو 150" : "e.g. 120, 132, 150"}
                  style={inp}
                />
                {err && <div style={{ marginTop: 6, color: "var(--gpa-danger)", fontSize: 12 }}>⚠️ {err}</div>}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                ? "💡 أدخل معدلك وساعاتك قبل هذا الفصل — سنضيف مواد الفصل الجديد في الخطوة التالية"
                : "💡 Enter your GPA and credits BEFORE this semester"}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>{ar ? "الفصل الدراسي الحالي *" : "Current Semester *"}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(ar
                  ? [["1", "الأول"], ["2", "الثاني"], ["summer", "الصيفي"]]
                  : [["1", "First"], ["2", "Second"], ["summer", "Summer"]]
                ).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setSemester(v)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontFamily: FONT,
                      background: semester === v ? "rgba(168,85,247,.12)" : "var(--gpa-surface-alpha-06)",
                      border: semester === v ? "1px solid #a855f766" : "1px solid #1e1e3f",
                      borderRadius: 10,
                      color: semester === v ? "var(--gpa-violet)" : "var(--gpa-text-faint)",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {err && <div style={{ color: "var(--gpa-danger)", fontSize: 12, marginTop: 6 }}>⚠️ {err}</div>}
            </div>
            <div>
              <label style={lbl}>{ar ? "هدف المعدل التراكمي عند التخرج" : "Target GPA at Graduation"}</label>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "var(--gpa-text-muted-2)" }}>{ar ? "الهدف:" : "Target:"}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: gpaClr(gradTarget) }}>
                  {gradTarget.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="4.0"
                step="0.05"
                value={gradTarget}
                onChange={(e) => setGradTarget(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: gpaClr(gradTarget) }}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                background: "var(--gpa-accent2-18)",
                border: "1px solid #6366f133",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 12,
                color: "var(--gpa-accent-2-soft)",
              }}
            >
              {ar
                ? "هذه المعلومات لحساب مرتبة الشرف بدقة طبقاً للمادة 24 من اللائحة."
                : "Honors info per Art.24."}
            </div>
            <div>
              <label style={lbl}>{ar ? "هل رسبت في أي مادة طوال دراستك؟" : "Have you ever failed any course?"}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {([[true, ar ? "نعم ❌" : "Yes ❌", "var(--gpa-danger)"], [false, ar ? "لا ✅" : "No ✅", "var(--gpa-accent)"]] as const).map(
                  ([v, l, c]) => (
                    <button
                      key={String(v)}
                      onClick={() => setHasFailed(v as boolean)}
                      style={{
                        flex: 1,
                        padding: "12px",
                        fontFamily: FONT,
                        background: hasFailed === v ? `${c}18` : "var(--gpa-surface-alpha-06)",
                        border: hasFailed === v ? `1px solid ${c}66` : "1px solid #1e1e3f",
                        borderRadius: 10,
                        color: hasFailed === v ? c : "var(--gpa-text-faint)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {l}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div>
              <label style={lbl}>
                {ar ? "أدنى معدل فصلي حصلت عليه (0 إذا أول فصل):" : "Lowest semester GPA (0 if first):"}
              </label>
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={minSemGpa}
                onChange={(e) => setMinSemGpa(e.target.value)}
                placeholder="3.00"
                style={inp}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      dir={dir}
      style={{
        fontFamily: FONT,
        background: "var(--gpa-bg)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%,var(--gpa-accent-08),transparent 50%),radial-gradient(ellipse at 80% 80%,#6366f108,transparent 50%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg,var(--gpa-accent-20),var(--gpa-accent2-20))",
              border: "1px solid var(--gpa-accent-33)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 12px",
            }}
          >
            🎓
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--gpa-text)", letterSpacing: -0.5 }}>
            {ar ? "المستشار الأكاديمي" : "Academic Advisor"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--gpa-text-faintest)" }}>
            {ar ? "خطط · تتبع · تفوق" : "Plan · Track · Excel"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? "var(--gpa-accent)" : "var(--gpa-border)",
                transition: "background .3s",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", textAlign: "center", marginBottom: 16 }}>
          {ar ? `الخطوة ${step + 1} من ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`} — {STEPS[step]}
        </div>

        <div
          style={{
            background: "var(--gpa-card)",
            border: "1px solid #1e1e3f",
            borderRadius: 20,
            padding: 22,
            boxShadow: "0 24px 60px #00000066",
          }}
        >
          {stepContent()}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{
                flex: 1,
                padding: 13,
                background: "var(--gpa-surface-alpha-08)",
                border: "1px solid #1e1e3f",
                borderRadius: 12,
                color: "var(--gpa-text-muted-2)",
                fontSize: 14,
                fontFamily: FONT,
                cursor: "pointer",
              }}
            >
              {ar ? "← رجوع" : "← Back"}
            </button>
          )}
          <button
            onClick={next}
            style={{
              flex: 2,
              padding: 13,
              background: "linear-gradient(135deg,var(--gpa-accent-25),var(--gpa-accent2-20))",
              border: "1px solid var(--gpa-accent-55)",
              borderRadius: 12,
              color: "var(--gpa-accent)",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: FONT,
              cursor: "pointer",
              boxShadow: "0 0 20px var(--gpa-accent-20)",
            }}
          >
            {step < STEPS.length - 1 ? (ar ? "التالي →" : "Next →") : ar ? "ابدأ التخطيط 🚀" : "Start Planning 🚀"}
          </button>
        </div>
      </div>
    </div>
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
          border: "1px solid #1e1e3f",
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
function HistoryPanel({ history, grades, lang, onClose }: any) {
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
          border: "1px solid #1e1e3f",
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
            return (
              <div
                key={i}
                style={{
                  background: "var(--gpa-bg-soft)",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderRight: `3px solid ${st.clr}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text-soft)" }}>{sem.label}</div>
                  <div style={{ fontSize: 19, fontWeight: 900, color: st.clr }}>
                    {sem.cumGpa.toFixed(3)}
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
type Course = { id: string; name: string; cr: number; grade: number };

function Planner({ profile, onReset, history, onImport }: { profile: Profile; onReset: () => void; history: any[]; onImport: (payload: ImportPayload) => Promise<void> }) {
  const { theme, setTheme } = useGpaTheme();
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
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const newId = useIdGen();

  const [courses, setCourses] = useState<Course[]>([]);
  const [tab, setTab] = useState("courses");
  const [targetGpa, setTargetGpa] = useState(gradTarget || 3.0);
  const [wiCourse, setWiCourse] = useState<string | null>(null);
  const [wiGrade, setWiGrade] = useState(grades[0]?.pts ?? 4.0);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal, setModal] = useState<string | null>(null);

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
  const semPts = courses.reduce((s, c) => s + (c.cr || 0) * (c.grade ?? 3.0), 0);
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

  const semLabel =
    semester === "1" ? (ar ? "الأول" : "1st") : semester === "2" ? (ar ? "الثاني" : "2nd") : ar ? "الصيفي" : "Summer";

  const saveSem = () => {
    if (courses.length === 0) {
      showToast(ar ? "لا توجد مواد لحفظها" : "No courses to save", false);
      return;
    }
    saveSemMut.mutate({
      data: {
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
      },
    });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const card: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  };
  const chip = (l: string, v: any, c: string) => (
    <div style={{ background: "var(--gpa-surface-alpha-08)", borderRadius: 10, padding: "9px 6px", textAlign: "center" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: c }}>{v}</div>
      <div style={{ fontSize: 9, color: "var(--gpa-text-faint)", marginTop: 2 }}>{l}</div>
    </div>
  );

  const TABS = ar
    ? [
        ["courses", "📋 المواد"],
        ["target", "🎯 الهدف"],
        ["whatif", "🔬 ماذا لو"],
        ["charts", "📊 الرسوم"],
        ["analysis", "⚡ التحليل"],
        ["scale", "🧮 السكيل"],
      ]
    : [
        ["courses", "📋 Courses"],
        ["target", "🎯 Target"],
        ["whatif", "🔬 What-If"],
        ["charts", "📊 Charts"],
        ["analysis", "⚡ Analysis"],
        ["scale", "🧮 Scale"],
      ];

  return (
    <div
      dir={dir}
      style={{
        fontFamily: FONT,
        background: "var(--gpa-bg)",
        minHeight: "100vh",
        color: "var(--gpa-text-strong)",
        paddingBottom: 70,
      }}
    >
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      {modal === "history" && (
        <HistoryPanel history={history} grades={grades} lang={lang} onClose={() => setModal(null)} />
      )}
      {modal === "pct" && <PctConverter grades={grades} lang={lang} onClose={() => setModal(null)} />}

      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(160deg,var(--gpa-bg),var(--gpa-bg-soft),var(--gpa-bg))",
          padding: "16px 14px 12px",
          borderBottom: "1px solid var(--gpa-border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg,var(--gpa-accent-20),var(--gpa-accent2-20))",
                border: "1px solid var(--gpa-accent-33)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              🎓
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gpa-text-soft)" }}>{uniName || (ar ? "جامعة" : "University")}</div>
              {major && <div style={{ fontSize: 10, color: "var(--gpa-text-faint)" }}>{major}</div>}
            </div>
          </div>
          <div className="gpa-no-print" style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
            <ThemeSwitcher theme={theme} onChange={setTheme} />
            <button onClick={() => setModal("history")} title={ar ? "السجل" : "History"} aria-label={ar ? "السجل" : "History"} style={iconBtn}>
              📅
            </button>
            <button onClick={() => setModal("pct")} title={ar ? "محوّل النسبة" : "%"} aria-label={ar ? "محوّل النسبة" : "Percent converter"} style={iconBtn}>
              🔢
            </button>
            <button onClick={exportData} title={ar ? "تنزيل JSON" : "Export JSON"} aria-label={ar ? "تنزيل JSON" : "Export JSON"} style={iconBtn}>
              💾
            </button>
            <button onClick={triggerImport} title={ar ? "استيراد" : "Import"} aria-label={ar ? "استيراد" : "Import"} style={iconBtn}>
              📂
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: "none" }} />
            <button onClick={printPdf} title={ar ? "طباعة / PDF" : "Print / PDF"} aria-label={ar ? "طباعة" : "Print"} style={iconBtn}>
              🖨️
            </button>
            <button onClick={onReset} title={ar ? "إعادة" : "Reset"} aria-label={ar ? "إعادة" : "Reset"} style={{ ...iconBtn, background: "var(--gpa-danger-15)", color: "var(--gpa-danger)", border: "1px solid var(--gpa-danger-33)" }}>
              ↩
            </button>
            <button onClick={handleLogout} title={ar ? "خروج" : "Logout"} aria-label={ar ? "خروج" : "Logout"} style={iconBtn}>
              🚪
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 8 }}>
          {chip(ar ? "السابق" : "Prev", prevGpa.toFixed(3), gpaClr(prevGpa))}
          {chip(ar ? "الفصل" : "Sem", semCr ? semGpa.toFixed(3) : "—", semCr ? gpaClr(semGpa) : "var(--gpa-text-faint)")}
          {chip(ar ? "التراكمي" : "CGPA", cumGpa.toFixed(3), gpaClr(cumGpa))}
        </div>

        <div
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            textAlign: "center",
            background: `${stand.clr}12`,
            border: `1px solid ${stand.clr}33`,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: stand.clr }}>
            {stand.emoji} {ar ? stand.label : stand.en}
            {isBenha && honorOk.ok ? " 🏆 " + (ar ? "مرتبة الشرف" : "Honors") : ""}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 8 }}>
          <div style={{ background: "var(--gpa-surface-alpha-06)", borderRadius: 8, padding: "7px 10px" }}>
            <div style={{ fontSize: 9, color: "var(--gpa-text-faint)" }}>{ar ? "المستوى" : "Level"}</div>
            <div style={{ fontSize: 11, color: lv.clr, fontWeight: 700, marginTop: 2 }}>
              {ar ? lv.ar : lv.en}
            </div>
          </div>
          <div style={{ background: "var(--gpa-surface-alpha-06)", borderRadius: 8, padding: "7px 10px" }}>
            <div style={{ fontSize: 9, color: "var(--gpa-text-faint)" }}>{ar ? "الحد الأقصى" : "Max Load"}</div>
            <div style={{ fontSize: 11, color: ld.clr, fontWeight: 700, marginTop: 2 }}>
              ≤ {ld.max} {ar ? "ساعة" : "cr"}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--gpa-text-faintest)", marginBottom: 3 }}>
            <span>
              {ar ? "مكتسب" : "Earned"}: {prevCr} + {semCr} = {newCr}
            </span>
            <span>
              {remCr}
              {ar ? "س متبقية" : "cr left"} / {totalReq}
            </span>
          </div>
          <div style={{ height: 6, background: "#141420", borderRadius: 4, overflow: "hidden", display: "flex" }}>
            <div
              style={{
                width: `${Math.min((prevCr / totalReq) * 100, 100)}%`,
                background: "#334155",
                transition: "width .5s",
              }}
            />
            <div
              style={{
                width: `${Math.min((semCr / totalReq) * 100, 100 - (prevCr / totalReq) * 100)}%`,
                background: gpaClr(cumGpa),
                boxShadow: `0 0 8px ${gpaClr(cumGpa)}88`,
                transition: "width .5s",
              }}
            />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          background: "var(--gpa-bg-soft)",
          borderBottom: "1px solid #1e1e3f",
          overflowX: "auto",
        }}
      >
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: "11px 3px",
              background: "none",
              border: "none",
              borderBottom: tab === id ? "2px solid var(--gpa-accent)" : "2px solid transparent",
              color: tab === id ? "var(--gpa-accent)" : "var(--gpa-text-faintest)",
              fontSize: 10,
              fontFamily: FONT,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 13px 0" }}>
        {/* COURSES */}
        {tab === "courses" && (
          <div>
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
                <div style={{ fontSize: 11, color: "#2a2a3a" }}>
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
                        borderBottom: "1px dashed #252535",
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
                            border: c.cr === n ? `1px solid ${clr}77` : "1px solid #1e1e3f",
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
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                onClick={addCourse}
                style={{
                  flex: 2,
                  background: "var(--gpa-surface-alpha-06)",
                  border: "1px dashed #252535",
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
                  background: "#05050f",
                  padding: 14,
                  borderRadius: 12,
                  textAlign: "center",
                  border: "1px dashed #1e1e3f",
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
          <div style={card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--gpa-text)" }}>
              🔬 {ar ? "محاكاة تغيير تقدير" : "Simulate"}
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
                        border: wiCourse === c.id ? "1px solid #6366f155" : "1px solid #1e1e3f",
                        borderRadius: 8,
                        padding: "9px 12px",
                        color: wiCourse === c.id ? "var(--gpa-accent-2-soft)" : "var(--gpa-text-muted)",
                        fontSize: 12,
                        fontFamily: FONT,
                        cursor: "pointer",
                      }}
                    >
                      {c.name || (ar ? "مادة" : "Course")} · {c.cr}
                      {ar ? "س" : "cr"} · {ga(c.grade, grades)}
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
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      {[
                        { k: "before", v: cumGpa },
                        { k: "arrow", v: null },
                        { k: "after", v: wiCumGpa },
                      ].map((x: any) =>
                        x.k === "arrow" ? (
                          <div key="arrow" style={{ fontSize: 20, color: "var(--gpa-text-ghost)", textAlign: "center" }}>→</div>
                        ) : (
                          <div
                            key={x.k}
                            style={{
                              background: "var(--gpa-bg-soft)",
                              borderRadius: 10,
                              padding: 14,
                              textAlign: "center",
                            }}
                          >
                            <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginBottom: 3 }}>
                              {x.k === "before" ? (ar ? "قبل" : "Before") : ar ? "بعد" : "After"}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: gpaClr(x.v) }}>
                              {x.v.toFixed(3)}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </>
                )}
              </>
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
                        border: "1px solid #1e1e3f",
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
                          border: "1px solid #1e1e3f",
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
                          border: "1px solid #1e1e3f",
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
          </div>
        )}

        {/* ANALYSIS */}
        {tab === "analysis" && (
          <div style={card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--gpa-text)" }}>
              ⚡ {ar ? "تحليل مفصل" : "Detailed Analysis"}
            </h3>
            {[
              { l: ar ? "قبل الفصل" : "Before", v: prevGpa, cr: prevCr },
              { l: ar ? "الفصل الحالي" : "This Sem", v: semGpa, cr: semCr },
              { l: ar ? "التراكمي الجديد" : "New CGPA", v: cumGpa, cr: newCr },
              { l: ar ? "عند التخرج" : "At Graduation", v: gradPredict, cr: totalReq },
            ].map((r) => (
              <div
                key={r.l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 11px",
                  background: "var(--gpa-bg-soft)",
                  borderRadius: 8,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--gpa-text-muted)" }}>
                  {r.l}
                  <span style={{ color: "var(--gpa-text-faintest)", fontSize: 10 }}>
                    {" "}
                    ({r.cr}
                    {ar ? "س" : "cr"})
                  </span>
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: gpaClr(r.v) }}>
                  {isNaN(r.v) || r.v === 0 ? "—" : r.v.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* SCALE */}
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
                    <div style={{ fontSize: 12, color: "#ccc" }}>
                      {g.label} · {g.pts.toFixed(3)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--gpa-text-faint)" }}>≥ {g.minPct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlide{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        *{box-sizing:border-box}
        input[type=range]{width:100%}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#070712}
        ::-webkit-scrollbar-thumb{background:#1e1e3f;border-radius:2px}
        select option{background:#0d0d1a}
      `}</style>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "var(--gpa-surface-alpha-08)",
  border: "1px solid var(--gpa-border)",
  borderRadius: 8,
  color: "var(--gpa-text-muted-2)",
  padding: "6px 9px",
  fontSize: 11,
  fontFamily: FONT,
  cursor: "pointer",
};

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function GPAAdvisorApp() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const listSemestersFn = useServerFn(listSemesters);
  const saveProfileFn = useServerFn(saveProfile);
  const saveSemesterFn = useServerFn(saveSemester);
  const deleteProfileFn = useServerFn(deleteProfile);
  const queryClient = useQueryClient();
  // Initialise theme attribute on mount
  useGpaTheme();

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
  });
  const semestersQ = useQuery({
    queryKey: ["semesters"],
    queryFn: () => listSemestersFn(),
    enabled: !!profileQ.data,
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

  useEffect(() => {
    if (profileQ.error) {
      // surfaced via React Query error
      console.error(profileQ.error);
    }
  }, [profileQ.error]);

  if (profileQ.isLoading) {
    return (
      <div
        style={{
          background: "var(--gpa-bg)",
          minHeight: "100vh",
          color: "var(--gpa-text-muted-2)",
          fontFamily: FONT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ⏳ ...
      </div>
    );
  }

  const dbProfile = profileQ.data;

  if (!dbProfile) {
    return (
      <SetupScreen
        onDone={async (p) => {
          await saveProfileMut.mutateAsync({
            data: {
              lang: p.lang,
              scale_id: p.scaleId,
              is_benha: p.isBenha,
              total_req: p.totalReq,
              uni_name: p.uniName,
              major: p.major,
              prev_gpa: p.prevGpa,
              prev_cr: p.prevCr,
              semester: p.semester,
              has_failed: p.hasFailed,
              min_prev_sem_gpa: p.minPrevSemGpa,
              grad_target: p.gradTarget,
              current_level: p.currentLevel,
            },
          });
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

  // Build history from DB
  const semsData = semestersQ.data;
  const history: any[] = [];
  if (semsData) {
    const baseCr = profile.prevCr;
    const basePts = profile.prevGpa * profile.prevCr;
    let cumCr = baseCr;
    let cumPts = basePts;
    for (const sem of semsData.semesters) {
      const semCourses = semsData.courses.filter((c) => c.semester_id === sem.id);
      const cr = semCourses.reduce((s, c) => s + c.credits, 0);
      const pts = semCourses.reduce((s, c) => s + c.credits * Number(c.grade_pts ?? 0), 0);
      cumCr += cr;
      cumPts += pts;
      history.push({
        label: sem.label,
        semGpa: cr ? pts / cr : 0,
        cumGpa: cumCr ? cumPts / cumCr : 0,
        cr,
        cumCr,
        courses: semCourses.map((c) => ({ name: c.name, grade: Number(c.grade_pts ?? 0), cr: c.credits })),
      });
    }
  }

  return (
    <Planner
      profile={profile}
      history={history}
      onReset={async () => {
        if (typeof window !== "undefined" && !window.confirm(profile.lang === "ar" ? "متأكد من إعادة التعيين؟" : "Reset?")) return;
        await deleteProfileMut.mutateAsync({});
      }}
      onImport={async (payload) => {
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
  );
}
