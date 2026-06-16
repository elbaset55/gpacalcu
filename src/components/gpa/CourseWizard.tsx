/* ═══════════════════════════════════════════════════════════════
   CourseWizard — Benha University 2021 By-law (Seed Data Edition)
   Features:
     • Step 1: Faculty label + Department dropdown (FACULTY_DATA)
     • Step 2: Cascading Level + Semester dropdowns (locked until Step 1)
     • Step 3: Auto-preloaded compulsory courses (locked) +
               Context-aware autocomplete (elective + free IDs only)
     • AI Copilot (streaming) · Save Plan · Export PDF
   Termly Aurora Design System · RTL/LTR
═══════════════════════════════════════════════════════════════ */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  FACULTY_DATA,
  COURSES_DB,
  getSemesterData,
  resolveMany,
} from "@/data/seedData";
import type { Course, Department, LevelData, SemesterData } from "@/data/seedData";
import { reviewWizardPlan } from "@/lib/wizard.functions";

/* ─── Palette ─── */
const DEPT_PALETTE: Record<string, { grad: string; accent: string; glyph: string }> = {
  biotech:         { grad: "linear-gradient(135deg,#10B981,#059669)", accent: "#34D399", glyph: "🧬" },
  zoology_ecology: { grad: "linear-gradient(135deg,#F59E0B,#D97706)", accent: "#FBBF24", glyph: "🦎" },
};
const defaultPalette = { grad: "linear-gradient(135deg,#6366F1,#8B5CF6)", accent: "#A5B4FC", glyph: "★" };
const deptPalette = (id: string) => DEPT_PALETTE[id] ?? defaultPalette;

const FONT     = "'Cairo','Sora','Manrope','Noto Sans Arabic',sans-serif";
const FONT_NUM = "'Sora','Cairo',sans-serif";

/* ─── Load-rule ─── */
function maxCredits(cumGpa: number, earnedCr: number): number {
  if (cumGpa < 2.0 && cumGpa > 0) return 12;
  if (earnedCr >= 100 && cumGpa >= 2.0) return 22;
  if (cumGpa >= 3.333) return 20;
  return 18;
}
function predictGpa(currentGpa: number, currentCr: number, newCr: number, estimate: number): number {
  if (currentCr + newCr === 0) return currentGpa;
  return (currentGpa * currentCr + estimate * newCr) / (currentCr + newCr);
}
function renderMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

/* ═══════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════ */
type CourseType = "compulsory" | "elective" | "free";

interface SelectableCourse extends Course {
  slotType: CourseType;
  chosen: boolean;
  prereqMet: boolean;
  alreadyPassed: boolean;
}

export interface SavePlanData {
  label: string;
  sem_type: string;
  year: null;
  courses: Array<{
    name: string;
    code: string;
    credits: number;
    grade_letter: null;
    grade_pts: null;
  }>;
}

interface CourseWizardProps {
  lang: "ar" | "en";
  cumGpa: number;
  earnedCr: number;
  totalReq: number;
  history: Array<{
    courses: Array<{ code?: string; name: string; grade: number; cr: number }>;
  }>;
  onSavePlan?: (data: SavePlanData) => Promise<void>;
  isGuest?: boolean;
  /** Pre-populate from profile — skips Steps 1+2 if all three are provided */
  initialDeptId?: string;
  initialLevelId?: number;
  initialSemesterId?: 1 | 2 | "summer";
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
export function CourseWizard({
  lang, cumGpa, earnedCr, totalReq, history,
  onSavePlan, isGuest = false,
  initialDeptId, initialLevelId, initialSemesterId,
}: CourseWizardProps) {
  const ar = lang === "ar";

  const hasAllInitial = !!(initialDeptId && initialLevelId != null && initialSemesterId != null);

  /* ── wizard step ── */
  const [step, setStep] = useState<1 | 2 | 3>(hasAllInitial ? 3 : 1);

  /* ── Step 1: department selection ── */
  const [deptId, setDeptId] = useState<string>(initialDeptId ?? "");

  /* ── Step 2: level + semester (cascading) ── */
  const [levelId,    setLevelId]    = useState<number | null>(initialLevelId ?? null);
  const [semesterId, setSemesterId] = useState<1 | 2 | "summer" | null>(initialSemesterId ?? null);

  /* ── Step 3: chosen elective/free course codes ── */
  const [chosen,       setChosen]      = useState<Set<string>>(new Set());
  const [searchQuery,  setSearchQuery] = useState("");
  const [estimateGpa,  setEstimateGpa] = useState(3.0);
  const [copied,       setCopied]      = useState(false);

  /* ── AI copilot ── */
  const [copilotText,     setCopilotText]     = useState("");
  const [copilotLoading,  setCopilotLoading]  = useState(false);
  const [copilotExpanded, setCopilotExpanded] = useState(true);

  /* ── save state ── */
  const [savePending, setSavePending] = useState(false);
  const [saveDone,    setSaveDone]    = useState(false);
  const [saveError,   setSaveError]   = useState("");

  /* ── refs ── */
  const reviewFn    = useServerFn(reviewWizardPlan);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevKeyRef  = useRef("");
  const searchRef   = useRef<HTMLInputElement>(null);

  /* ── derived: department object ── */
  const dept: Department | null = useMemo(
    () => FACULTY_DATA.departments.find((d) => d.id === deptId) ?? null,
    [deptId],
  );

  /* ── derived: available levels for selected dept ── */
  const availableLevels: LevelData[] = useMemo(
    () => dept?.levels ?? [],
    [dept],
  );

  /* ── derived: available semesters for selected level ── */
  const availableSemesters: SemesterData[] = useMemo(() => {
    if (!dept || levelId === null) return [];
    return dept.levels.find((l) => l.levelId === levelId)?.semesters ?? [];
  }, [dept, levelId]);

  /* ── derived: current semester data (null for summer) ── */
  const semData: SemesterData | null = useMemo(() => {
    if (!deptId || levelId === null || semesterId === null) return null;
    if (semesterId === "summer") return null;
    return getSemesterData(deptId, levelId, semesterId as 1 | 2) ?? null;
  }, [deptId, levelId, semesterId]);

  /* ── derived: is summer mode ── */
  const isSummer = semesterId === "summer";

  /* ── passed / failed codes from history ── */
  const { passedCodes, failedCodes } = useMemo(() => {
    const passed = new Set<string>();
    const failed = new Set<string>();
    for (const sem of history) {
      for (const c of sem.courses) {
        const key = c.code?.trim() || c.name.trim();
        if (c.grade >= 2.0) passed.add(key);
        else if (c.grade > 0) failed.add(key);
      }
    }
    return { passedCodes: passed, failedCodes: failed };
  }, [history]);

  /* ── compulsory courses (auto-preloaded, locked) ── */
  const compulsoryCourses: SelectableCourse[] = useMemo(() => {
    if (!semData) return [];
    return resolveMany(semData.compulsoryCourseIds).map((c) => ({
      ...c,
      slotType: "compulsory" as const,
      chosen: true,
      prereqMet: !c.prerequisite || passedCodes.has(c.prerequisite),
      alreadyPassed: passedCodes.has(c.code),
    }));
  }, [semData, passedCodes]);

  /* ── summer: full COURSES_DB as searchable pool ── */
  const summerPool: SelectableCourse[] = useMemo(() => {
    if (!isSummer) return [];
    return Object.values(COURSES_DB).map((c) => ({
      ...c,
      slotType: "elective" as const,
      chosen: chosen.has(c.code),
      prereqMet: !c.prerequisite || passedCodes.has(c.prerequisite),
      alreadyPassed: passedCodes.has(c.code),
    }));
  }, [isSummer, chosen, passedCodes]);

  /* ── eligible pool for search (elective + free) ── */
  const searchPool: SelectableCourse[] = useMemo(() => {
    if (isSummer) return summerPool;
    if (!semData) return [];
    const electiveIds   = semData.electiveCourseIds;
    const freeIds       = semData.freeOptionalCourseIds;
    const electives = resolveMany(electiveIds).map((c) => ({
      ...c,
      slotType: "elective" as const,
      chosen: chosen.has(c.code),
      prereqMet: !c.prerequisite || passedCodes.has(c.prerequisite),
      alreadyPassed: passedCodes.has(c.code),
    }));
    const free = resolveMany(freeIds).map((c) => ({
      ...c,
      slotType: "free" as const,
      chosen: chosen.has(c.code),
      prereqMet: !c.prerequisite || passedCodes.has(c.prerequisite),
      alreadyPassed: passedCodes.has(c.code),
    }));
    return [...electives, ...free];
  }, [isSummer, summerPool, semData, chosen, passedCodes]);

  /* ── filtered search results ── */
  const searchResults: SelectableCourse[] = useMemo(() => {
    if (!searchQuery.trim()) return isSummer ? [] : searchPool;
    const q = searchQuery.toLowerCase();
    return searchPool.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.nameAr.includes(q),
    );
  }, [searchPool, searchQuery, isSummer]);

  /* ── all active courses (for credit / AI / save) ── */
  const activeCourses: SelectableCourse[] = useMemo(() => {
    if (isSummer) return searchPool.filter((c) => c.chosen);
    const chosenElective = searchPool.filter((c) => c.chosen);
    return [...compulsoryCourses, ...chosenElective];
  }, [isSummer, compulsoryCourses, searchPool]);

  /* ── credits ── */
  const selectedCr = useMemo(
    () => activeCourses.reduce((s, c) => s + c.credits, 0),
    [activeCourses],
  );
  const maxCr       = maxCredits(cumGpa, earnedCr);
  const crOverload  = selectedCr > maxCr;
  const predictedGpa = predictGpa(cumGpa, earnedCr, selectedCr, estimateGpa);
  const gpaDelta     = predictedGpa - cumGpa;

  /* ── toggle elective/free ── */
  const toggle = useCallback((code: string, credits: number) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(code)) { next.delete(code); return next; }
      if (selectedCr + credits > maxCr + 3) return prev;
      next.add(code);
      return next;
    });
  }, [selectedCr, maxCr]);

  /* ── reset downstream when dept changes ── */
  useEffect(() => {
    setLevelId(null);
    setSemesterId(null);
    setChosen(new Set());
    setCopilotText("");
    prevKeyRef.current = "";
  }, [deptId]);

  /* ── reset semester when level changes ── */
  useEffect(() => {
    setSemesterId(null);
    setChosen(new Set());
    setCopilotText("");
    prevKeyRef.current = "";
  }, [levelId]);

  /* ── reset chosen when semester changes ── */
  useEffect(() => {
    setChosen(new Set());
    setCopilotText("");
    prevKeyRef.current = "";
    setSearchQuery("");
  }, [semesterId]);

  /* ── AI Copilot ── */
  const triggerReview = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (params: any) => {
      setCopilotLoading(true);
      setCopilotText("");
      try {
        const stream = (await reviewFn({ data: params })) as AsyncIterable<{ delta: string }>;
        let acc = "";
        for await (const chunk of stream) {
          acc += chunk?.delta ?? "";
          setCopilotText(acc);
        }
      } catch {
        setCopilotText(
          ar
            ? "⚠️ تعذّر الاتصال بالمستشار. تأكد من إعداد مفتاح AI."
            : "⚠️ Cannot reach advisor. Check AI key setup.",
        );
      } finally {
        setCopilotLoading(false);
      }
    },
    [reviewFn, ar],
  );

  useEffect(() => {
    if (step !== 3 || selectedCr === 0 || isGuest || !dept || !semData) return;
    const key = [...chosen].sort().join(",") + "|" + estimateGpa.toFixed(2);
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!activeCourses.length) return;
      triggerReview({
        lang,
        programName: ar ? dept.nameAr : dept.nameEn,
        level: levelId,
        semester: semesterId,
        selectedCourses: activeCourses.map((c) => ({
          code: c.code, name: ar ? c.nameAr : c.nameEn, credits: c.credits, type: c.slotType,
        })),
        totalCredits: selectedCr,
        maxCredits: maxCr,
        cumGpa,
        earnedCr,
        predictedGpa,
      });
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [chosen, estimateGpa, step, selectedCr]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── save plan ── */
  const handleSavePlan = async () => {
    if (!dept || (!semData && !isSummer) || !onSavePlan || savePending) return;
    if (!activeCourses.length) return;
    const semStr = isSummer
      ? (ar ? "الفصل الصيفي" : "Summer")
      : semesterId === 1
        ? (ar ? "الفصل الأول" : "S1")
        : (ar ? "الفصل الثاني" : "S2");
    const label = ar
      ? `📝 ${dept.nameAr} — المستوى ${levelId} / ${semStr}`
      : `📝 ${dept.nameEn} — L${levelId}/${semStr}`;
    setSavePending(true);
    setSaveError("");
    try {
      await onSavePlan({
        label, sem_type: "wizard", year: null,
        courses: activeCourses.map((c) => ({
          name: ar ? c.nameAr : c.nameEn,
          code: c.code,
          credits: c.credits,
          grade_letter: null,
          grade_pts: null,
        })),
      });
      setSaveDone(true);
      setTimeout(() => setSaveDone(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSaveError(msg || "Save failed");
      setTimeout(() => setSaveError(""), 4000);
    } finally {
      setSavePending(false);
    }
  };

  /* ── export PDF ── */
  const exportPDF = () => {
    if (!dept || !semData) return;
    const pal = deptPalette(deptId);
    const semLabel = semesterId === 1 ? (ar ? "الفصل الأول" : "Semester 1") : (ar ? "الفصل الثاني" : "Semester 2");
    const TYPE_COLORS: Record<string, string> = { compulsory: "#22D3EE", elective: "#F59E0B", free: "#10B981" };
    const TYPE_LABELS_AR: Record<string, string> = { compulsory: "إلزامي", elective: "اختياري", free: "حر" };
    const TYPE_LABELS_EN: Record<string, string> = { compulsory: "Compulsory", elective: "Elective", free: "Free" };
    const rows = activeCourses.map((c) => {
      const tc = TYPE_COLORS[c.slotType] || "#7880aa";
      const tl = ar ? (TYPE_LABELS_AR[c.slotType] || c.slotType) : (TYPE_LABELS_EN[c.slotType] || c.slotType);
      return `<tr>
        <td style="color:#94a3b8;font-size:11px;font-family:'Sora',monospace">${c.code}</td>
        <td style="font-weight:600">${ar ? c.nameAr : c.nameEn}</td>
        <td style="text-align:center;font-weight:900;color:#22D3EE;font-size:16px">${c.credits}</td>
        <td><span style="background:${tc}22;color:${tc};padding:3px 12px;border-radius:99px;font-size:10px;font-weight:700">${tl}</span></td>
        <td style="color:#64748b;font-size:11px">${c.prerequisite || "—"}</td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html dir="${ar ? "rtl" : "ltr"}" lang="${ar ? "ar" : "en"}">
<head><meta charset="UTF-8">
<title>${ar ? "خطة التسجيل" : "Registration Plan"} — ${ar ? dept.nameAr : dept.nameEn}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Cairo','Sora',sans-serif;background:#050914;color:#e2e8f0;padding:44px 48px;direction:${ar ? "rtl" : "ltr"}}
.print-btn{position:fixed;top:20px;${ar ? "left" : "right"}:20px;background:linear-gradient(135deg,#2563EB,#22D3EE);color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.08)}
.logo{font-size:30px;font-weight:900;background:linear-gradient(90deg,#60A5FA,#22D3EE);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.logo-sub{font-size:11px;color:#7880aa;margin-top:5px}
.plan-title{font-size:20px;font-weight:800;color:#e2e8f0;margin-bottom:6px;text-align:${ar ? "left" : "right"}}
.plan-meta{font-size:12px;color:#7880aa;line-height:1.8;text-align:${ar ? "left" : "right"}}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
.sum-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:22px;text-align:center}
.sum-val{font-size:34px;font-weight:900;line-height:1;margin-bottom:6px}
.sum-lbl{font-size:10px;color:#7880aa;text-transform:uppercase;letter-spacing:1.5px}
table{width:100%;border-collapse:collapse;margin-bottom:36px}
th{background:rgba(255,255,255,.04);color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;padding:13px 16px;text-align:${ar ? "right" : "left"};font-weight:700;border-bottom:1px solid rgba(255,255,255,.08)}
td{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;vertical-align:middle}
tr:nth-child(even) td{background:rgba(255,255,255,.015)}
.footer{text-align:center;font-size:11px;color:#374151;padding-top:24px;border-top:1px solid rgba(255,255,255,.05)}
@media print{.print-btn{display:none}body{background:#fff!important;color:#0d1240!important;padding:28px}th{background:#f8fafc!important;color:#64748b!important}td{border-bottom:1px solid #f0f2fb!important;color:#0d1240!important}tr:nth-child(even) td{background:#fafbff!important}.sum-card{background:#f8fafc!important;border:1px solid #e5e7eb!important}.sum-val{color:#0d1240!important}.logo{-webkit-text-fill-color:#2563EB!important}.footer{color:#94a3b8!important}}</style></head>
<body>
<button class="print-btn" onclick="window.print()">${ar ? "🖨️ طباعة / PDF" : "🖨️ Print / PDF"}</button>
<div class="header">
  <div><div class="logo">Termly</div><div class="logo-sub">${ar ? "المستشار الأكاديمي الذكي · جامعة بنها · لائحة 2021" : "Smart Academic Advisor · Benha University · 2021 By-law"}</div></div>
  <div>
    <div class="plan-title">${ar ? "خطة التسجيل المقترحة" : "Proposed Registration Plan"}</div>
    <div class="plan-meta">${ar ? dept.nameAr : dept.nameEn}<br>${ar ? `المستوى ${levelId}` : `Level ${levelId}`} · ${semLabel}<br>${new Date().toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>
</div>
<div style="height:6px;border-radius:99px;background:${pal.grad};margin-bottom:28px;opacity:.8"></div>
<div class="summary">
  <div class="sum-card"><div class="sum-val" style="color:#22D3EE">${activeCourses.length}</div><div class="sum-lbl">${ar ? "عدد المقررات" : "Courses"}</div></div>
  <div class="sum-card"><div class="sum-val" style="color:#4ADE80">${selectedCr}</div><div class="sum-lbl">${ar ? "ساعات معتمدة" : "Credit Hours"}</div></div>
  <div class="sum-card"><div class="sum-val" style="color:#FBBF24">${predictedGpa.toFixed(2)}</div><div class="sum-lbl">${ar ? "معدل متوقع" : "Predicted GPA"}</div></div>
</div>
<table>
  <thead><tr>
    <th>${ar ? "الرمز" : "Code"}</th>
    <th>${ar ? "اسم المقرر" : "Course Name"}</th>
    <th style="text-align:center">${ar ? "الساعات" : "Credits"}</th>
    <th>${ar ? "النوع" : "Type"}</th>
    <th>${ar ? "الشرط السابق" : "Prerequisite"}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">${ar ? `تم إنشاء هذه الخطة عبر تطبيق Termly — جامعة بنها ${new Date().getFullYear()} — جميع الحقوق محفوظة` : `Generated by Termly — Benha University ${new Date().getFullYear()} — All rights reserved`}</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.open(); win.document.write(html); win.document.close(); }
  };

  /* ── copy to clipboard ── */
  const copySelection = () => {
    if (!dept) return;
    const header = ar
      ? `خطة التسجيل — ${dept.nameAr} — المستوى ${levelId} / الفصل ${semesterId}\n`
      : `Registration Plan — ${dept.nameEn} — L${levelId}/S${semesterId}\n`;
    const lines = activeCourses.map((c) => `${c.code} — ${ar ? c.nameAr : c.nameEn} (${c.credits} cr)`).join("\n");
    navigator.clipboard.writeText(header + lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ─────────────────────────────────────────────────────────
     Shared sub-components
  ───────────────────────────────────────────────────────── */
  const TYPE_COLORS: Record<CourseType, string> = {
    compulsory: "#22D3EE",
    elective:   "#F59E0B",
    free:       "#10B981",
  };
  const TYPE_LABELS_AR: Record<CourseType, string> = { compulsory: "إلزامي", elective: "اختياري", free: "حر" };
  const TYPE_LABELS_EN: Record<CourseType, string> = { compulsory: "Compulsory", elective: "Elective", free: "Free" };

  const CourseCard = ({ course, locked }: { course: SelectableCourse; locked?: boolean }) => {
    const isLocked  = locked || course.slotType === "compulsory";
    const on        = isLocked || course.chosen;
    const typeColor = TYPE_COLORS[course.slotType];
    const typeLabel = ar ? TYPE_LABELS_AR[course.slotType] : TYPE_LABELS_EN[course.slotType];
    const disabled  = !on && crOverload;
    return (
      <button
        onClick={() => !isLocked && toggle(course.code, course.credits)}
        disabled={disabled}
        style={{
          display: "flex", alignItems: "flex-start", gap: 12, width: "100%",
          textAlign: "start", padding: "14px 16px", borderRadius: 14,
          border: on ? `1.5px solid ${typeColor}55` : "1px solid var(--gpa-border)",
          background: on ? `linear-gradient(135deg, ${typeColor}0d, ${typeColor}06)` : "var(--gpa-surface-alpha-06)",
          cursor: isLocked ? "default" : disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
          opacity: disabled ? 0.45 : 1,
          boxShadow: on ? `0 0 0 1px ${typeColor}18` : "none",
        }}>
        <div style={{
          width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
          border: on ? `2px solid ${typeColor}` : "2px solid var(--gpa-border)",
          background: on ? typeColor : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease", boxShadow: on ? `0 0 8px ${typeColor}50` : "none",
        }}>
          {on && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontFamily: FONT_NUM, fontSize: 10, fontWeight: 700, color: typeColor, background: `${typeColor}18`, padding: "2px 8px", borderRadius: 99, letterSpacing: "0.5px" }}>{typeLabel}</span>
            {isLocked && <span style={{ fontSize: 10, color: "var(--gpa-text-faintest)", background: "var(--gpa-surface-alpha-08)", padding: "2px 8px", borderRadius: 99 }}>{ar ? "🔒 إلزامي" : "🔒 Fixed"}</span>}
            {course.alreadyPassed && <span style={{ fontSize: 10, color: "var(--gpa-accent)", background: "var(--gpa-accent-15)", padding: "2px 8px", borderRadius: 99 }}>{ar ? "✓ مجتاز" : "✓ Passed"}</span>}
            {!course.prereqMet && <span style={{ fontSize: 10, color: "var(--gpa-danger)", background: "var(--gpa-danger-15)", padding: "2px 8px", borderRadius: 99 }}>{ar ? "⚠ شرط سابق" : "⚠ Prereq"}</span>}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "var(--gpa-text)", lineHeight: 1.4 }}>
            {ar ? course.nameAr : course.nameEn}
          </div>
          <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT_NUM, marginTop: 3 }}>
            {course.code}
            {course.prerequisite && (
              <span style={{ marginInlineStart: 8, color: course.prereqMet ? "var(--gpa-accent)" : "var(--gpa-danger)" }}>
                {ar ? `• شرط: ${course.prerequisite}` : `• Prereq: ${course.prerequisite}`}
              </span>
            )}
          </div>
        </div>
        <div style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 12,
          background: on ? typeColor : "var(--gpa-surface-alpha-08)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease", boxShadow: on ? `0 2px 8px ${typeColor}40` : "none",
        }}>
          <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 900, color: on ? "#fff" : "var(--gpa-text-faint)", lineHeight: 1 }}>{course.credits}</div>
          <div style={{ fontSize: 8, color: on ? "rgba(255,255,255,0.75)" : "var(--gpa-text-faintest)", letterSpacing: "0.5px" }}>{ar ? "ساعة" : "cr"}</div>
        </div>
      </button>
    );
  };

  const SectionHeader = ({ title, count, color }: { title: string; count: number; color: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, marginTop: 20 }}>
      <div style={{ flex: 1, height: 1, background: `${color}30` }} />
      <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color, background: `${color}12`, padding: "4px 14px", borderRadius: 99, letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {title} <span style={{ opacity: 0.7 }}>({count})</span>
      </div>
      <div style={{ flex: 1, height: 1, background: `${color}30` }} />
    </div>
  );

  /* ═══════════════════════════════════
     Sticky bottom bar (shared Step 3)
  ═══════════════════════════════════ */
  const pal = deptPalette(deptId);

  const StickyBar = () => {
    const crPct    = Math.min((selectedCr / maxCr) * 100, 100);
    const crColor  = crOverload ? "var(--gpa-danger)" : selectedCr >= maxCr * 0.85 ? "#F59E0B" : pal.accent;
    const gpaColor = gpaDelta > 0.05 ? "var(--gpa-accent)" : gpaDelta < -0.05 ? "var(--gpa-danger)" : "var(--gpa-text-faint)";
    return (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, padding: "0 12px 16px", pointerEvents: "none" }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          background: "var(--gpa-card)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${crOverload ? "var(--gpa-danger)" : "var(--gpa-border)"}`,
          borderRadius: 20, padding: "14px 18px",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
          pointerEvents: "auto", transition: "border-color 0.3s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {/* Credit meter */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontFamily: FONT, color: "var(--gpa-text-faint)" }}>{ar ? "الساعات المعتمدة" : "Credit Hours"}</span>
                <span style={{ fontFamily: FONT_NUM, fontSize: 14, fontWeight: 900, color: crColor, transition: "color 0.3s ease" }}>
                  {selectedCr}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--gpa-text-faint)" }}> / {maxCr}</span>
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "var(--gpa-surface-alpha-08)", overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, width: `${crPct}%`, background: crOverload ? "var(--gpa-danger)" : `linear-gradient(90deg, ${pal.accent}, #22D3EE)`, borderRadius: 99, transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)", boxShadow: crOverload ? "0 0 8px var(--gpa-danger)" : `0 0 8px ${pal.accent}80` }} />
              </div>
              {crOverload && <div style={{ fontSize: 10, color: "var(--gpa-danger)", fontFamily: FONT, marginTop: 4 }}>{ar ? `⚠ تجاوز الحد بـ ${selectedCr - maxCr} ساعة` : `⚠ ${selectedCr - maxCr} cr over limit`}</div>}
            </div>

            <div style={{ width: 1, height: 44, background: "var(--gpa-border)", flexShrink: 0 }} />

            {/* GPA impact */}
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", marginBottom: 4 }}>{ar ? "تأثير المعدل" : "GPA Impact"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: FONT_NUM, fontSize: 18, fontWeight: 900, color: gpaColor, transition: "color 0.3s ease" }}>{predictedGpa.toFixed(2)}</span>
                <span style={{ fontFamily: FONT_NUM, fontSize: 11, color: gpaDelta > 0.01 ? "#4ADE80" : gpaDelta < -0.01 ? "#F87171" : "var(--gpa-text-faint)" }}>
                  {gpaDelta > 0.01 ? `▲${gpaDelta.toFixed(2)}` : gpaDelta < -0.01 ? `▼${Math.abs(gpaDelta).toFixed(2)}` : "→"}
                </span>
              </div>
            </div>

            <div style={{ width: 1, height: 44, background: "var(--gpa-border)", flexShrink: 0 }} />

            {/* GPA estimate slider */}
            <div style={{ flexShrink: 0, minWidth: 100 }}>
              <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", marginBottom: 4 }}>{ar ? "تقدير درجاتك" : "Estimate Grade"}</div>
              <input type="range" min={0} max={4} step={0.1} value={estimateGpa}
                onChange={(e) => setEstimateGpa(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: pal.accent }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT_NUM }}>
                <span>0</span>
                <span style={{ color: pal.accent, fontWeight: 700 }}>{estimateGpa.toFixed(1)}</span>
                <span>4</span>
              </div>
            </div>

            <div style={{ width: 1, height: 44, background: "var(--gpa-border)", flexShrink: 0 }} />

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
              <button onClick={exportPDF} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--gpa-border)", background: "var(--gpa-surface-alpha-06)", cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600, color: "var(--gpa-text-faint)", display: "flex", alignItems: "center", gap: 5 }}>
                📄 {ar ? "PDF" : "PDF"}
              </button>
              {onSavePlan && !isGuest && (
                <button onClick={handleSavePlan} disabled={savePending || !activeCourses.length} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: saveDone ? "#16A34A" : pal.grad, color: "#fff", cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, opacity: (savePending || !activeCourses.length) ? 0.6 : 1 }}>
                  {savePending ? "⏳" : saveDone ? "✓" : "💾"} {saveDone ? (ar ? "تم الحفظ!" : "Saved!") : (ar ? "حفظ الخطة" : "Save Plan")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════
     STEP 1 — SELECT DEPARTMENT
  ═══════════════════════════════════ */
  if (step === 1) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 4px" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(34,211,238,0.08))",
          border: "1px solid rgba(37,99,235,0.2)", borderRadius: 20,
          padding: "28px 28px 24px", marginBottom: 24, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ fontFamily: FONT_NUM, fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--gpa-accent)", marginBottom: 8 }}>
            {ar ? "خطوة ١ من ٣" : "STEP 1 OF 3"}
          </div>
          <h2 style={{ margin: 0, fontFamily: FONT_NUM, fontSize: 22, fontWeight: 900, color: "var(--gpa-text)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            🎓 {ar ? "اختر برنامجك الدراسي" : "Select Your Programme"}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--gpa-text-faint)", fontFamily: FONT }}>
            {ar ? "اختر برنامجك من الكلية وفق لائحة جامعة بنها 2021" : "Choose your programme under Benha University By-law 2021"}
          </p>
        </div>

        {/* Faculty label (read-only) */}
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "var(--gpa-text-faint)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            {ar ? "الكلية" : "Faculty"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "var(--gpa-surface-alpha-06)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <span style={{ fontSize: 20 }}>🏛️</span>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "var(--gpa-text)" }}>
                {ar ? FACULTY_DATA.nameAr : FACULTY_DATA.nameEn}
              </div>
              <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 2 }}>
                {ar ? "محدد تلقائياً" : "Pre-selected"}
              </div>
            </div>
          </div>
        </div>

        {/* Department dropdown */}
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "var(--gpa-text-faint)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
            {ar ? "البرنامج / التخصص" : "Department / Programme"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FACULTY_DATA.departments.map((d) => {
              const p   = deptPalette(d.id);
              const sel = deptId === d.id;
              return (
                <button key={d.id} onClick={() => setDeptId(d.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px", borderRadius: 14, textAlign: "start",
                    border: sel ? `2px solid ${p.accent}` : "1px solid var(--gpa-border)",
                    background: sel ? `linear-gradient(135deg, ${p.accent}14, ${p.accent}06)` : "var(--gpa-surface-alpha-06)",
                    cursor: "pointer", transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: sel ? `0 0 0 1px ${p.accent}28, 0 6px 24px rgba(0,0,0,0.18)` : "none",
                  }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: p.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, boxShadow: sel ? `0 4px 16px ${p.accent}40` : "none" }}>
                    {p.glyph}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: sel ? 800 : 600, color: sel ? p.accent : "var(--gpa-text)", lineHeight: 1.3 }}>
                      {ar ? d.nameAr : d.nameEn}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT_NUM, marginTop: 3 }}>
                      {d.levels.length} {ar ? "مستويات" : "levels"} · {d.levels.reduce((s, l) => s + l.semesters.length, 0)} {ar ? "فصل" : "semesters"}
                    </div>
                  </div>
                  {sel && <div style={{ width: 22, height: 22, borderRadius: "50%", background: p.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#000", fontWeight: 900, flexShrink: 0 }}>✓</div>}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => { if (deptId) setStep(2); }}
          disabled={!deptId}
          style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", background: deptId ? pal.grad : "var(--gpa-surface-alpha-08)", color: deptId ? "#fff" : "var(--gpa-text-faintest)", fontFamily: FONT_NUM, fontSize: 14, fontWeight: 700, cursor: deptId ? "pointer" : "not-allowed", letterSpacing: "0.3px", boxShadow: deptId ? `0 4px 24px ${pal.accent}40` : "none", transition: "all 0.25s ease" }}>
          {ar ? "اختر المستوى والفصل ←" : "Choose Level & Semester →"}
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════
     STEP 2 — LEVEL & SEMESTER (locked until Step 1 done)
  ═══════════════════════════════════ */
  if (step === 2 && dept) {
    const canProceed = deptId && levelId !== null && semesterId !== null;

    return (
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Breadcrumb back */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "16px 20px" }}>
          <button onClick={() => setStep(1)} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--gpa-border)", background: "var(--gpa-surface-alpha-06)", cursor: "pointer", color: "var(--gpa-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
            {ar ? "→" : "←"}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>{ar ? "خطوة ٢ من ٣" : "STEP 2 OF 3"}</div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 16, fontWeight: 800, color: "var(--gpa-text)" }}>{ar ? dept.nameAr : dept.nameEn}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: pal.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 4px 16px ${pal.accent}40` }}>{pal.glyph}</div>
        </div>

        {/* Level picker — only levels available in dept */}
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "var(--gpa-text-soft)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{ar ? "المستوى الدراسي" : "Academic Level"}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${availableLevels.length}, 1fr)`, gap: 10 }}>
            {availableLevels.map((lvl) => {
              const icons: Record<number, string> = { 1: "①", 2: "②", 3: "③", 4: "④" };
              const active = levelId === lvl.levelId;
              return (
                <button key={lvl.levelId} onClick={() => setLevelId(lvl.levelId)}
                  style={{ padding: "14px 8px", borderRadius: 14, border: active ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)", background: active ? `${pal.accent}14` : "var(--gpa-surface-alpha-06)", cursor: "pointer", fontFamily: FONT_NUM, fontSize: 13, fontWeight: active ? 800 : 500, color: active ? pal.accent : "var(--gpa-text-faint)", transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)", boxShadow: active ? `0 0 0 1px ${pal.accent}20, 0 4px 12px rgba(0,0,0,0.15)` : "none", textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icons[lvl.levelId] ?? "○"}</div>
                  <div>{lvl.levelNameAr}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Semester picker — only semesters available in chosen level */}
        <div style={{ background: "var(--gpa-card)", border: `1px solid ${levelId === null ? "var(--gpa-border)" : "var(--gpa-border)"}`, borderRadius: 18, padding: "20px", marginBottom: 20, opacity: levelId === null ? 0.45 : 1, transition: "opacity 0.3s ease" }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "var(--gpa-text-soft)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {ar ? "الفصل الدراسي" : "Semester"}
            {levelId === null && <span style={{ fontSize: 10, fontWeight: 400, color: "var(--gpa-text-faintest)", marginInlineStart: 8 }}>({ar ? "اختر المستوى أولاً" : "choose level first"})</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {availableSemesters.length === 0
              ? <div style={{ padding: "20px 0", textAlign: "center", color: "var(--gpa-text-faintest)", fontSize: 12, fontFamily: FONT }}>{ar ? "اختر مستوى لعرض الفصول" : "Select a level to see semesters"}</div>
              : availableSemesters.map((sem) => {
                const active = semesterId === sem.semesterId;
                const emoji  = sem.semesterId === 1 ? "🌙" : "☀️";
                const semName = ar ? sem.semesterNameAr : (sem.semesterId === 1 ? "Semester 1" : "Semester 2");
                const info: string[] = [];
                if (sem.compulsoryCourseIds.length) info.push(ar ? `${sem.compulsoryCourseIds.length} إلزامي` : `${sem.compulsoryCourseIds.length} compulsory`);
                if (sem.electiveCourseIds.length)   info.push(ar ? `${sem.electiveCourseIds.length} اختياري` : `${sem.electiveCourseIds.length} elective`);
                if (sem.freeOptionalCourseIds.length) info.push(ar ? `${sem.freeOptionalCourseIds.length} حر` : `${sem.freeOptionalCourseIds.length} free`);
                if (sem.hasTraining)  info.push(ar ? "🏋️ تدريب" : "🏋️ Training");
                if (sem.hasResearch)  info.push(ar ? "📝 بحث" : "📝 Research");
                return (
                  <button key={sem.semesterId} onClick={() => levelId !== null && setSemesterId(sem.semesterId)} disabled={levelId === null}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, border: active ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)", background: active ? `${pal.accent}10` : "var(--gpa-surface-alpha-06)", cursor: levelId === null ? "not-allowed" : "pointer", textAlign: "start", transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)", boxShadow: active ? `0 0 0 1px ${pal.accent}20` : "none" }}>
                    <div style={{ fontSize: 24 }}>{emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? pal.accent : "var(--gpa-text)" }}>{semName}</div>
                      <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 2 }}>{info.join(" · ")}</div>
                    </div>
                    {active && <div style={{ width: 20, height: 20, borderRadius: "50%", background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 900 }}>✓</div>}
                  </button>
                );
              })
            }
          </div>
        </div>

        <button
          onClick={() => { if (canProceed) { setChosen(new Set()); prevKeyRef.current = ""; setCopilotText(""); setStep(3); } }}
          disabled={!canProceed}
          style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", background: canProceed ? pal.grad : "var(--gpa-surface-alpha-08)", color: canProceed ? "#fff" : "var(--gpa-text-faintest)", fontFamily: FONT_NUM, fontSize: 14, fontWeight: 700, cursor: canProceed ? "pointer" : "not-allowed", letterSpacing: "0.3px", boxShadow: canProceed ? `0 4px 24px ${pal.accent}40` : "none", transition: "all 0.25s ease" }}>
          {canProceed ? (ar ? "تصفّح المقررات ←" : "Browse Courses →") : (ar ? "⬆ أكمل الاختيارات أعلاه" : "⬆ Complete selections above")}
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════
     STEP 3 — COURSE SELECTION
     (locked if no semData — redirect to step 1)
  ═══════════════════════════════════ */
  if (step === 3 && dept && (semData || isSummer)) {
    const semLabel = isSummer
      ? (ar ? "الفصل الصيفي" : "Summer Term")
      : semesterId === 1
        ? (ar ? "الفصل الأول" : "Semester 1")
        : (ar ? "الفصل الثاني" : "Semester 2");
    const chosenElectives = searchPool.filter((c) => c.chosen);

    return (
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 180 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setStep(2)} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--gpa-border)", background: "var(--gpa-surface-alpha-06)", cursor: "pointer", color: "var(--gpa-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
            {ar ? "→" : "←"}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", letterSpacing: "1px", textTransform: "uppercase" }}>{ar ? "خطوة ٣ — اختيار المقررات" : "STEP 3 — COURSE SELECTION"}</div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 800, color: "var(--gpa-text)", marginTop: 2 }}>
              {ar ? dept.nameAr : dept.nameEn}
              <span style={{ fontSize: 12, color: "var(--gpa-text-faint)", fontWeight: 400, marginInlineStart: 8 }}>
                {ar ? `المستوى ${levelId}` : `Level ${levelId}`} · {semLabel}
              </span>
            </div>
          </div>
          <button onClick={copySelection} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--gpa-border)", background: copied ? "var(--gpa-accent-15)" : "var(--gpa-surface-alpha-06)", cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600, color: copied ? "var(--gpa-accent)" : "var(--gpa-text-faint)", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 5 }}>
            {copied ? "✓" : "📋"} {copied ? (ar ? "تم!" : "Done!") : (ar ? "نسخ" : "Copy")}
          </button>
        </div>

        {/* ── Summer banner OR Compulsory courses ── */}
        {isSummer ? (
          <div style={{
            marginBottom: 8, padding: "18px 20px", borderRadius: 16,
            background: "linear-gradient(135deg,rgba(250,204,21,0.10),rgba(249,115,22,0.07))",
            border: "1px solid rgba(250,204,21,0.25)",
            display: "flex", alignItems: "flex-start", gap: 14,
          }}>
            <span style={{ fontSize: 28 }}>☀️</span>
            <div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 14, fontWeight: 800, color: "#FBBF24", marginBottom: 4 }}>
                {ar ? "الفصل الصيفي — لوحة حرة" : "Summer Term — Free Canvas"}
              </div>
              <div style={{ fontSize: 12, color: "var(--gpa-text-faint)", fontFamily: FONT, lineHeight: 1.6 }}>
                {ar
                  ? "لا توجد مقررات إلزامية محددة للفصل الصيفي. ابحث عن أي مقرر وأضفه إلى خطتك."
                  : "No compulsory courses for Summer Term. Search any course and add it to your plan."}
              </div>
            </div>
          </div>
        ) : (
          <>
            <SectionHeader title={ar ? "مقررات إلزامية — محملة تلقائياً" : "Compulsory Courses — Auto-loaded"} count={compulsoryCourses.length} color={pal.accent} />
            {compulsoryCourses.length > 0
              ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{compulsoryCourses.map((c) => <CourseCard key={c.code} course={c} locked />)}</div>
              : <div style={{ textAlign: "center", padding: "20px 0", color: "var(--gpa-text-faintest)", fontSize: 12, fontFamily: FONT }}>{ar ? "لا توجد مقررات إلزامية" : "No compulsory courses"}</div>
            }
          </>
        )}

        {/* ── Smart search for elective / free / summer ── */}
        {(isSummer || searchPool.length > 0) && (
          <>
            <div style={{ marginTop: 24, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: "#F59E0B30" }} />
                <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#F59E0B", background: "#F59E0B12", padding: "4px 14px", borderRadius: 99, letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {isSummer
                    ? (ar ? `بحث حر — كل المقررات (${searchPool.length})` : `Free Search — All Courses (${searchPool.length})`)
                    : (ar ? "بحث ذكي — اختياري + حر" : "Smart Search — Elective + Free")} {!isSummer && `(${searchPool.length})`}
                </div>
                <div style={{ flex: 1, height: 1, background: "#F59E0B30" }} />
              </div>
              {/* Search input */}
              <div style={{ position: "relative" }}>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isSummer
                    ? (ar ? "ابحث عن أي مقرر بالكود أو الاسم..." : "Search any course by code or name...")
                    : (ar ? "ابحث بالكود أو الاسم..." : "Search by code or name...")}
                  style={{
                    width: "100%", padding: "12px 44px 12px 16px", borderRadius: 12,
                    border: "1px solid var(--gpa-border)", background: "var(--gpa-surface-alpha-06)",
                    color: "var(--gpa-text)", fontFamily: FONT, fontSize: 13, outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = pal.accent; }}
                  onBlur={(e)  => { e.target.style.borderColor = "var(--gpa-border)"; }}
                />
                <div style={{ position: "absolute", top: "50%", insetInlineEnd: 14, transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none", color: "var(--gpa-text-faint)" }}>🔍</div>
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ position: "absolute", top: "50%", insetInlineEnd: 40, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gpa-text-faint)", fontSize: 16, lineHeight: 1 }}>×</button>
                )}
              </div>
              {/* Search result count / hint */}
              {isSummer && !searchQuery && (
                <div style={{ fontSize: 11, color: "var(--gpa-text-faintest)", fontFamily: FONT, marginTop: 6, textAlign: "center" }}>
                  {ar ? "ابدأ الكتابة للبحث في قاعدة بيانات المقررات" : "Start typing to search the course database"}
                </div>
              )}
              {searchQuery && (
                <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 6 }}>
                  {ar ? `${searchResults.length} نتيجة من أصل ${searchPool.length}` : `${searchResults.length} of ${searchPool.length} results`}
                </div>
              )}
            </div>

            {/* Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {searchResults.length > 0
                ? searchResults.map((c) => <CourseCard key={c.code} course={c} />)
                : <div style={{ textAlign: "center", padding: "24px 0", color: "var(--gpa-text-faintest)", fontSize: 12, fontFamily: FONT }}>{ar ? "لا توجد نتائج — جرّب بحثاً آخر" : "No results — try a different search"}</div>
              }
            </div>
          </>
        )}

        {/* ── Chosen elective/free summary ── */}
        {chosenElectives.length > 0 && (
          <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 14, background: "var(--gpa-surface-alpha-06)", border: "1px solid var(--gpa-border)" }}>
            <div style={{ fontSize: 11, fontFamily: FONT, color: "var(--gpa-text-faint)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{ar ? "المقررات الاختيارية المختارة" : "Selected Elective / Free Courses"}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {chosenElectives.map((c) => (
                <button key={c.code} onClick={() => toggle(c.code, c.credits)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, border: `1px solid ${TYPE_COLORS[c.slotType]}55`, background: `${TYPE_COLORS[c.slotType]}14`, cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600, color: TYPE_COLORS[c.slotType] }}>
                  {ar ? c.nameAr : c.nameEn} <span style={{ opacity: 0.7 }}>({c.credits}cr)</span> <span>×</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════════ AI COPILOT PANEL ════════ */}
        {!isGuest && (
          <div style={{ marginTop: 24, border: "1px solid rgba(34,211,238,0.20)", borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg, rgba(34,211,238,0.04), rgba(37,99,235,0.03))" }}>
            <button onClick={() => setCopilotExpanded((v) => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", borderBottom: copilotExpanded ? "1px solid rgba(34,211,238,0.12)" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#2563EB,#22D3EE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, boxShadow: "0 0 16px rgba(34,211,238,0.3)" }}>🤖</div>
              <div style={{ flex: 1, textAlign: "start" }}>
                <div style={{ fontFamily: FONT_NUM, fontSize: 13, fontWeight: 800, color: "#22D3EE" }}>{ar ? "المستشار AI — مراجعة فورية" : "AI Copilot — Live Plan Review"}</div>
                <div style={{ fontSize: 10, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 1 }}>
                  {copilotLoading ? (ar ? "⚡ يحلّل الخطة..." : "⚡ Analysing...") : copilotText ? (ar ? "تحديث تلقائي عند تغيير الاختيارات" : "Auto-updates on selection change") : (ar ? "يبدأ بعد اختيار المواد" : "Starts after course selection")}
                </div>
              </div>
              {copilotLoading && (
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[0, 120, 240].map((d) => (
                    <div key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "#22D3EE", animation: `copilot-pulse 1.2s ease-in-out ${d}ms infinite` }} />
                  ))}
                </div>
              )}
              <div style={{ color: "var(--gpa-text-faint)", fontSize: 12 }}>{copilotExpanded ? "▲" : "▼"}</div>
            </button>
            {copilotExpanded && (
              <div style={{ padding: "16px 18px", minHeight: 80 }}>
                {!copilotText && !copilotLoading && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--gpa-text-faintest)", fontSize: 12, fontFamily: FONT }}>
                    {ar ? "🎓 اختر مقررات اختيارية وسيبدأ المستشار بالتحليل..." : "🎓 Select elective courses and the advisor will analyse..."}
                  </div>
                )}
                {(copilotText || copilotLoading) && (
                  <div
                    style={{ fontFamily: FONT, fontSize: 13, color: "var(--gpa-text)", lineHeight: 1.75 }}
                    dangerouslySetInnerHTML={{ __html: renderMd(copilotText) + (copilotLoading ? '<span style="display:inline-block;width:2px;height:14px;background:#22D3EE;margin-inline-start:2px;vertical-align:middle;animation:copilot-cursor 1s step-end infinite"></span>' : "") }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div style={{ marginTop: 12, padding: "10px 16px", borderRadius: 12, background: "var(--gpa-danger-15)", border: "1px solid var(--gpa-danger-33)", fontSize: 12, color: "var(--gpa-danger)", fontFamily: FONT }}>
            ⚠️ {saveError}
          </div>
        )}

        <StickyBar />
      </div>
    );
  }

  /* Fallback — shouldn't reach here */
  return (
    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--gpa-text-faint)", fontFamily: FONT }}>
      {ar ? "حدث خطأ غير متوقع. يرجى تحديث الصفحة." : "Unexpected state. Please refresh."}
      <br />
      <button onClick={() => setStep(1)} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, border: "1px solid var(--gpa-border)", background: "var(--gpa-surface-alpha-06)", cursor: "pointer", color: "var(--gpa-text-faint)", fontFamily: FONT, fontSize: 13 }}>
        {ar ? "العودة للبداية" : "Go Back to Start"}
      </button>
    </div>
  );
}
