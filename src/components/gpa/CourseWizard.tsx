/* ═══════════════════════════════════════════════════════════════
   CourseWizard — Benha University 2021 By-law
   Features: 3-step wizard · AI Copilot (streaming) · Save Plan · Export PDF
   Termly Aurora Design System · RTL/LTR · Inline Styles
═══════════════════════════════════════════════════════════════ */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  BENHA_PROGRAMS,
  UNIVERSITY_COURSES,
  COLLEGE_L1_NATURAL,
} from "@/data/benha-programs";
import type { BenhaCourse } from "@/data/benha-programs";
import { reviewWizardPlan } from "@/lib/wizard.functions";

/* ─── Department colour palette ─── */
const DEPT_PALETTE: Record<string, { grad: string; accent: string; glyph: string }> = {
  Mathematics:        { grad: "linear-gradient(135deg,#2563EB,#7C3AED)", accent: "#818CF8", glyph: "∑" },
  "Computer Science": { grad: "linear-gradient(135deg,#0EA5E9,#22D3EE)", accent: "#22D3EE", glyph: "⌘" },
  Statistics:         { grad: "linear-gradient(135deg,#10B981,#059669)", accent: "#34D399", glyph: "σ" },
  Physics:            { grad: "linear-gradient(135deg,#F59E0B,#EF4444)", accent: "#FBBF24", glyph: "⚛" },
  Chemistry:          { grad: "linear-gradient(135deg,#8B5CF6,#EC4899)", accent: "#C084FC", glyph: "⚗" },
  Biology:            { grad: "linear-gradient(135deg,#22C55E,#16A34A)", accent: "#4ADE80", glyph: "🌿" },
  Geology:            { grad: "linear-gradient(135deg,#A16207,#CA8A04)", accent: "#EAB308", glyph: "🪨" },
  Geophysics:         { grad: "linear-gradient(135deg,#0369A1,#0EA5E9)", accent: "#38BDF8", glyph: "🌊" },
};
const deptPalette = (dept: string) =>
  DEPT_PALETTE[dept] ?? { grad: "linear-gradient(135deg,#6366F1,#8B5CF6)", accent: "#A5B4FC", glyph: "★" };

const FONT     = "'Cairo','Sora','Manrope','Noto Sans Arabic',sans-serif";
const FONT_NUM = "'Sora','Cairo',sans-serif";

/* ─── Load-rule: max credits per semester ─── */
function maxCredits(cumGpa: number, earnedCr: number): number {
  if (cumGpa < 2.0 && cumGpa > 0) return 12;
  if (earnedCr >= 100 && cumGpa >= 2.0) return 22;
  if (cumGpa >= 3.333) return 20;
  return 18;
}

/* ─── GPA impact prediction ─── */
function predictGpa(currentGpa: number, currentCr: number, newCr: number, estimate: number): number {
  if (currentCr + newCr === 0) return currentGpa;
  return (currentGpa * currentCr + estimate * newCr) / (currentCr + newCr);
}

/* ─── Tiny markdown-lite renderer (bold + line-breaks) ─── */
function renderMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

/* ═══════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════ */
interface SelectableCourse extends BenhaCourse {
  type: "compulsory" | "elective" | "free" | "retake" | "future";
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
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
export function CourseWizard({
  lang, cumGpa, earnedCr, totalReq, history,
  onSavePlan, isGuest = false,
}: CourseWizardProps) {
  const ar = lang === "ar";

  /* ── wizard state ── */
  const [step,      setStep]     = useState<1 | 2 | 3>(1);
  const [programId, setProgramId] = useState<string>("");
  const [level,     setLevel]    = useState<1 | 2 | 3 | 4>(2);
  const [semester,  setSemester] = useState<1 | 2 | "summer">(1);
  const [selected,  setSelected] = useState<Set<string>>(new Set());
  const [estimateGpa, setEstimateGpa] = useState(3.0);
  const [copied, setCopied] = useState(false);

  /* ── AI copilot state ── */
  const [copilotText,     setCopilotText]     = useState("");
  const [copilotLoading,  setCopilotLoading]  = useState(false);
  const [copilotExpanded, setCopilotExpanded] = useState(true);

  /* ── save state ── */
  const [savePending, setSavePending] = useState(false);
  const [saveDone,    setSaveDone]    = useState(false);
  const [saveError,   setSaveError]   = useState("");

  /* ── streaming refs ── */
  const reviewFn    = useServerFn(reviewWizardPlan);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevKeyRef  = useRef("");

  const program = useMemo(
    () => BENHA_PROGRAMS.find((p) => p.id === programId) ?? null,
    [programId],
  );

  /* ── completed / failed courses from history ── */
  const { passedCodes, failedCourses } = useMemo(() => {
    const passed = new Set<string>();
    const failed: Array<{ code: string; name: string; cr: number }> = [];
    for (const sem of history) {
      for (const c of sem.courses) {
        const key = c.code?.trim() || c.name.trim();
        if (c.grade >= 2.0) passed.add(key);
        else if (c.grade > 0 && !failed.find((f) => f.code === key))
          failed.push({ code: key, name: c.name, cr: c.cr });
      }
    }
    return { passedCodes: passed, failedCourses: failed };
  }, [history]);

  /* ── build course list for current level/semester ── */
  const courseList: SelectableCourse[] = useMemo(() => {
    if (!program) return [];
    const prereqMet = (prereq?: string) => (!prereq ? true : passedCodes.has(prereq));

    if (level === 1) {
      const sem1 = [UNIVERSITY_COURSES[0], UNIVERSITY_COURSES[1], ...COLLEGE_L1_NATURAL.slice(0, 5)];
      const sem2 = [UNIVERSITY_COURSES[2], UNIVERSITY_COURSES[3], ...COLLEGE_L1_NATURAL.slice(5)];
      const pool = semester === 1 ? sem1 : semester === 2 ? sem2 : [];
      return pool.map((c) => ({ ...c, type: "compulsory" as const, chosen: true, prereqMet: prereqMet(c.prerequisite), alreadyPassed: passedCodes.has(c.code) }));
    }

    if (semester === "summer") {
      const retakes: SelectableCourse[] = failedCourses.map((c) => ({
        code: c.code, name: c.name, credits: c.cr,
        type: "retake" as const, chosen: selected.has(c.code), prereqMet: true, alreadyPassed: false,
      }));
      const nextLevel = (level < 4 ? level + 1 : level) as 2 | 3 | 4;
      const futureSched = program.schedule.find((s) => s.level === nextLevel && s.semester === 1);
      const future: SelectableCourse[] = (futureSched?.elective ?? []).map((c) => ({
        ...c, type: "future" as const, chosen: selected.has(c.code),
        prereqMet: prereqMet(c.prerequisite), alreadyPassed: passedCodes.has(c.code),
      }));
      return [...retakes, ...future];
    }

    const sched = program.schedule.find((s) => s.level === level && s.semester === semester);
    if (!sched) return [];
    return [
      ...sched.compulsory.map((c) => ({ ...c, type: "compulsory" as const, chosen: true, prereqMet: prereqMet(c.prerequisite), alreadyPassed: passedCodes.has(c.code) })),
      ...sched.elective.map((c)   => ({ ...c, type: "elective"  as const, chosen: selected.has(c.code), prereqMet: prereqMet(c.prerequisite), alreadyPassed: passedCodes.has(c.code) })),
      ...(sched.freeOptional ?? []).map((c) => ({ ...c, type: "free" as const, chosen: selected.has(c.code), prereqMet: prereqMet(c.prerequisite), alreadyPassed: passedCodes.has(c.code) })),
    ];
  }, [program, level, semester, selected, passedCodes, failedCourses]);

  /* ── credit totals ── */
  const selectedCr = useMemo(
    () => courseList.filter((c) => c.type === "compulsory" || c.chosen).reduce((s, c) => s + c.credits, 0),
    [courseList],
  );
  const maxCr       = semester === "summer" ? 9 : maxCredits(cumGpa, earnedCr);
  const crOverload   = selectedCr > maxCr;
  const predictedGpa = predictGpa(cumGpa, earnedCr, selectedCr, estimateGpa);
  const gpaDelta     = predictedGpa - cumGpa;

  /* ── toggle ── */
  const toggle = (code: string, credits: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) { next.delete(code); return next; }
      if (selectedCr + credits > maxCr + 3) return prev;
      next.add(code);
      return next;
    });
  };

  /* ── AI Copilot streaming ── */
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

  /* ── debounced review trigger ── */
  useEffect(() => {
    if (step !== 3 || selectedCr === 0 || isGuest || !program) return;
    const key = [...selected].sort().join(",") + "|" + estimateGpa.toFixed(2);
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const activeCourses = courseList.filter((c) => c.type === "compulsory" || c.chosen);
      if (!activeCourses.length) return;
      triggerReview({
        lang,
        programName: ar ? program.nameAr : program.nameEn,
        level,
        semester,
        selectedCourses: activeCourses.map((c) => ({ code: c.code, name: c.name, credits: c.credits, type: c.type })),
        totalCredits: selectedCr,
        maxCredits: maxCr,
        cumGpa,
        earnedCr,
        predictedGpa,
      });
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [selected, estimateGpa, step, selectedCr]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── save plan ── */
  const handleSavePlan = async () => {
    if (!program || !onSavePlan || savePending) return;
    const activeCourses = courseList.filter((c) => c.type === "compulsory" || c.chosen);
    if (!activeCourses.length) return;
    const semStr = semester === "summer"
      ? (ar ? "صيفي" : "Sum")
      : (ar ? `الفصل ${semester}` : `S${semester}`);
    const label = ar
      ? `📝 ${program.nameAr} — المستوى ${level} / ${semStr}`
      : `📝 ${program.nameEn} — L${level}/${semStr}`;
    setSavePending(true);
    setSaveError("");
    try {
      await onSavePlan({
        label,
        sem_type: "wizard",
        year: null,
        courses: activeCourses.map((c) => ({
          name: c.name, code: c.code ?? "", credits: c.credits,
          grade_letter: null, grade_pts: null,
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

  /* ── export PDF (new window) ── */
  const exportPDF = () => {
    if (!program) return;
    const activeCourses = courseList.filter((c) => c.type === "compulsory" || c.chosen);
    const semLabel = semester === "summer"
      ? (ar ? "الفصل الصيفي" : "Summer Semester")
      : ar ? `الفصل ${semester}` : `Semester ${semester}`;
    const pal = deptPalette(program.department);
    const TYPE_COLORS: Record<string, string> = { compulsory: "#22D3EE", elective: "#F59E0B", free: "#10B981", retake: "#EF4444", future: "#8B5CF6" };
    const TYPE_LABELS_AR: Record<string, string> = { compulsory: "إلزامي", elective: "اختياري", free: "حر", retake: "إعادة", future: "مستقبلي" };
    const TYPE_LABELS_EN: Record<string, string> = { compulsory: "Compulsory", elective: "Elective", free: "Free", retake: "Retake", future: "Future" };

    const rows = activeCourses.map((c) => {
      const tc  = TYPE_COLORS[c.type]  || "#7880aa";
      const tl  = ar ? (TYPE_LABELS_AR[c.type] || c.type) : (TYPE_LABELS_EN[c.type] || c.type);
      return [
        `<tr>`,
        `<td style="color:#94a3b8;font-size:11px;font-family:'Sora',monospace">${c.code || "—"}</td>`,
        `<td style="font-weight:600">${c.name}</td>`,
        `<td style="text-align:center;font-weight:900;color:#22D3EE;font-size:16px">${c.credits}</td>`,
        `<td><span style="background:${tc}22;color:${tc};padding:3px 12px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.5px">${tl}</span></td>`,
        `<td style="color:#64748b;font-size:11px">${c.prerequisite || "—"}</td>`,
        `</tr>`,
      ].join("");
    }).join("");

    const parts: string[] = [
      `<!DOCTYPE html><html dir="${ar ? "rtl" : "ltr"}" lang="${ar ? "ar" : "en"}">`,
      `<head><meta charset="UTF-8">`,
      `<title>${ar ? "خطة التسجيل" : "Registration Plan"} — ${ar ? program.nameAr : program.nameEn}</title>`,
      `<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">`,
      `<style>`,
      `*{box-sizing:border-box;margin:0;padding:0}`,
      `body{font-family:'Cairo','Sora',sans-serif;background:#050914;color:#e2e8f0;padding:44px 48px;min-height:100vh;direction:${ar ? "rtl" : "ltr"}}`,
      `.print-btn{position:fixed;top:20px;${ar ? "left" : "right"}:20px;background:linear-gradient(135deg,#2563EB,#22D3EE);color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 24px rgba(37,99,235,.4);letter-spacing:.3px}`,
      `.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.08)}`,
      `.logo{font-size:30px;font-weight:900;background:linear-gradient(90deg,#60A5FA,#22D3EE);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}`,
      `.logo-sub{font-size:11px;color:#7880aa;margin-top:5px;letter-spacing:.5px}`,
      `.plan-title{font-size:20px;font-weight:800;color:#e2e8f0;margin-bottom:6px;text-align:${ar ? "left" : "right"}}`,
      `.plan-meta{font-size:12px;color:#7880aa;line-height:1.8;text-align:${ar ? "left" : "right"}}`,
      `.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}`,
      `.sum-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:22px;text-align:center}`,
      `.sum-val{font-size:34px;font-weight:900;line-height:1;margin-bottom:6px}`,
      `.sum-lbl{font-size:10px;color:#7880aa;text-transform:uppercase;letter-spacing:1.5px}`,
      `.glyph-bar{height:6px;border-radius:99px;margin-bottom:32px;opacity:.7}`,
      `table{width:100%;border-collapse:collapse;margin-bottom:36px}`,
      `th{background:rgba(255,255,255,.04);color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;padding:13px 16px;text-align:${ar ? "right" : "left"};font-weight:700;border-bottom:1px solid rgba(255,255,255,.08)}`,
      `td{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;vertical-align:middle}`,
      `tr:nth-child(even) td{background:rgba(255,255,255,.015)}`,
      `.footer{text-align:center;font-size:11px;color:#374151;padding-top:24px;border-top:1px solid rgba(255,255,255,.05);letter-spacing:.3px}`,
      `@media print{`,
      `.print-btn{display:none}`,
      `body{background:#fff !important;color:#0d1240 !important;padding:28px}`,
      `th{background:#f8fafc !important;color:#64748b !important}`,
      `td{border-bottom:1px solid #f0f2fb !important;color:#0d1240 !important}`,
      `tr:nth-child(even) td{background:#fafbff !important}`,
      `.sum-card{background:#f8fafc !important;border:1px solid #e5e7eb !important}`,
      `.sum-val{color:#0d1240 !important}`,
      `.logo{-webkit-text-fill-color:#2563EB !important}`,
      `.footer{color:#94a3b8 !important}`,
      `}`,
      `</style></head><body>`,
      `<button class="print-btn" onclick="window.print()">${ar ? "🖨️ طباعة / PDF" : "🖨️ Print / PDF"}</button>`,
      `<div class="header">`,
      `  <div><div class="logo">Termly</div><div class="logo-sub">${ar ? "المستشار الأكاديمي الذكي · جامعة بنها · لائحة 2021" : "Smart Academic Advisor · Benha University · 2021 By-law"}</div></div>`,
      `  <div><div class="plan-title">${ar ? "خطة التسجيل المقترحة" : "Proposed Registration Plan"}</div>`,
      `  <div class="plan-meta">`,
      `    ${ar ? program.nameAr : program.nameEn}<br>`,
      `    ${ar ? `المستوى ${level}` : `Level ${level}`} · ${semLabel}<br>`,
      `    ${new Date().toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      `  </div></div>`,
      `</div>`,
      `<div style="height:6px;border-radius:99px;background:${pal.grad};margin-bottom:28px;opacity:.8"></div>`,
      `<div class="summary">`,
      `  <div class="sum-card"><div class="sum-val" style="color:#22D3EE">${activeCourses.length}</div><div class="sum-lbl">${ar ? "عدد المقررات" : "Courses"}</div></div>`,
      `  <div class="sum-card"><div class="sum-val" style="color:#4ADE80">${selectedCr}</div><div class="sum-lbl">${ar ? "ساعات معتمدة" : "Credit Hours"}</div></div>`,
      `  <div class="sum-card"><div class="sum-val" style="color:#FBBF24">${predictedGpa.toFixed(2)}</div><div class="sum-lbl">${ar ? "معدل متوقع" : "Predicted GPA"}</div></div>`,
      `</div>`,
      `<table>`,
      `<thead><tr>`,
      `<th>${ar ? "الرمز" : "Code"}</th>`,
      `<th>${ar ? "اسم المقرر" : "Course Name"}</th>`,
      `<th style="text-align:center">${ar ? "الساعات" : "Credits"}</th>`,
      `<th>${ar ? "النوع" : "Type"}</th>`,
      `<th>${ar ? "الشرط السابق" : "Prerequisite"}</th>`,
      `</tr></thead>`,
      `<tbody>${rows}</tbody>`,
      `</table>`,
      `<div class="footer">${ar ? `تم إنشاء هذه الخطة عبر تطبيق Termly — جامعة بنها ${new Date().getFullYear()} — جميع الحقوق محفوظة` : `Generated by Termly — Benha University ${new Date().getFullYear()} — All rights reserved`}</div>`,
      `</body></html>`,
    ];

    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(parts.join(""));
      win.document.close();
    }
  };

  /* ── copy to clipboard ── */
  const copySelection = () => {
    const active = courseList.filter((c) => c.type === "compulsory" || c.chosen);
    const header = ar
      ? `خطة التسجيل — ${program?.nameAr ?? ""} — المستوى ${level} / الفصل ${semester === "summer" ? "صيفي" : semester}\n`
      : `Registration Plan — ${program?.nameEn ?? ""} — L${level}/S${semester === "summer" ? "Sum" : semester}\n`;
    const lines = active.map((c) => `${c.code} — ${c.name} (${c.credits} cr)`).join("\n");
    navigator.clipboard.writeText(header + lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ═══════════════════════════════════
     STEP 1 — SPECIALISATION GRID
  ═══════════════════════════════════ */
  if (step === 1) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 4px" }}>
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
            {ar ? "🎓 اختر تخصصك" : "🎓 Select Your Specialisation"}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--gpa-text-faint)", fontFamily: FONT }}>
            {ar ? "اختر برنامجك الدراسي وفق لائحة كلية العلوم جامعة بنها 2021 لعرض المقررات المتاحة" : "Select your programme under Benha Faculty of Science By-law 2021 to see available courses"}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {BENHA_PROGRAMS.map((prog) => {
            const pal = deptPalette(prog.department);
            const active = programId === prog.id;
            return (
              <button key={prog.id} onClick={() => { setProgramId(prog.id); setStep(2); }}
                style={{
                  border: active ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)",
                  borderRadius: 18, background: active ? `linear-gradient(135deg, ${pal.accent}12, ${pal.accent}06)` : "var(--gpa-card)",
                  padding: 0, cursor: "pointer", textAlign: "start",
                  transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                  boxShadow: active ? `0 0 0 1px ${pal.accent}30, 0 8px 32px rgba(0,0,0,0.2)` : "0 2px 8px rgba(0,0,0,0.12)",
                  overflow: "hidden", position: "relative",
                }}>
                <div style={{ height: 5, background: pal.grad, opacity: 0.9 }} />
                <div style={{ padding: "18px 20px 20px" }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14, background: pal.grad,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 14,
                    boxShadow: `0 4px 16px ${pal.accent}40`, fontFamily: FONT_NUM,
                  }}>{pal.glyph}</div>
                  <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 800, color: "var(--gpa-text)", lineHeight: 1.2, marginBottom: 4 }}>
                    {ar ? prog.nameAr : prog.nameEn}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, marginBottom: 10 }}>
                    {ar ? prog.departmentAr : prog.department}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ label: ar ? "ساعة" : "cr", value: prog.creditReq.total }, { label: ar ? "فصل" : "sem", value: prog.schedule.length }].map((s, i) => (
                      <div key={i} style={{ background: `${pal.accent}12`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontFamily: FONT_NUM, fontWeight: 700, color: pal.accent }}>
                        {s.value} {s.label}
                      </div>
                    ))}
                  </div>
                </div>
                {active && (
                  <div style={{ position: "absolute", top: 12, insetInlineEnd: 12, width: 20, height: 20, borderRadius: "50%", background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 900 }}>✓</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════
     STEP 2 — LEVEL & SEMESTER
  ═══════════════════════════════════ */
  if (step === 2 && program) {
    const pal = deptPalette(program.department);
    const levels: Array<{ v: 1 | 2 | 3 | 4; ar: string; en: string; icon: string }> = [
      { v: 1, ar: "الأول",  en: "Level 1", icon: "①" },
      { v: 2, ar: "الثاني", en: "Level 2", icon: "②" },
      { v: 3, ar: "الثالث", en: "Level 3", icon: "③" },
      { v: 4, ar: "الرابع", en: "Level 4", icon: "④" },
    ];
    const semesters = [
      { v: 1 as const,        emoji: "🌙", ar: "الفصل الأول",   en: "Semester 1",      note: "" },
      { v: 2 as const,        emoji: "☀️", ar: "الفصل الثاني",  en: "Semester 2",      note: "" },
      { v: "summer" as const, emoji: "🏖️", ar: "الفصل الصيفي", en: "Summer Semester",
        note: ar ? "إعادة مقررات الرسوب + تقدّم (حد أقصى 9 ساعات)" : "Retakes + advance courses (max 9 cr)" },
    ];

    return (
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "16px 20px" }}>
          <button onClick={() => setStep(1)} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--gpa-border)", background: "var(--gpa-surface-alpha-06)", cursor: "pointer", color: "var(--gpa-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
            {ar ? "→" : "←"}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>{ar ? "خطوة ٢ من ٣" : "STEP 2 OF 3"}</div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 16, fontWeight: 800, color: "var(--gpa-text)" }}>{ar ? program.nameAr : program.nameEn}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: pal.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 4px 16px ${pal.accent}40` }}>{pal.glyph}</div>
        </div>

        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "var(--gpa-text-soft)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{ar ? "المستوى الدراسي" : "Academic Level"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {levels.map(({ v, ar: arL, en, icon }) => {
              const active = level === v;
              return (
                <button key={v} onClick={() => setLevel(v)} style={{ padding: "14px 8px", borderRadius: 14, border: active ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)", background: active ? `${pal.accent}14` : "var(--gpa-surface-alpha-06)", cursor: "pointer", fontFamily: FONT_NUM, fontSize: 13, fontWeight: active ? 800 : 500, color: active ? pal.accent : "var(--gpa-text-faint)", transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)", boxShadow: active ? `0 0 0 1px ${pal.accent}20, 0 4px 12px rgba(0,0,0,0.15)` : "none", textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div>{ar ? arL : en}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "20px", marginBottom: 20 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "var(--gpa-text-soft)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{ar ? "الفصل الدراسي" : "Semester"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {semesters.map(({ v, emoji, ar: arL, en, note }) => {
              const active = semester === v;
              return (
                <button key={String(v)} onClick={() => setSemester(v)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, border: active ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)", background: active ? `${pal.accent}10` : "var(--gpa-surface-alpha-06)", cursor: "pointer", textAlign: "start", transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)", boxShadow: active ? `0 0 0 1px ${pal.accent}20` : "none" }}>
                  <div style={{ fontSize: 24 }}>{emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? pal.accent : "var(--gpa-text)" }}>{ar ? arL : en}</div>
                    {note && <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 2 }}>{note}</div>}
                  </div>
                  {active && <div style={{ width: 20, height: 20, borderRadius: "50%", background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 900 }}>✓</div>}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => { setSelected(new Set()); prevKeyRef.current = ""; setCopilotText(""); setStep(3); }}
          style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", background: pal.grad, color: "#fff", fontFamily: FONT_NUM, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.3px", boxShadow: `0 4px 24px ${pal.accent}40`, transition: "all 0.25s ease" }}>
          {ar ? "تصفّح المقررات ←" : "Browse Courses →"}
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════
     STEP 3 — COURSE SELECTION
  ═══════════════════════════════════ */
  if (step === 3 && program) {
    const pal = deptPalette(program.department);
    const semLabel = semester === "summer" ? (ar ? "صيفي" : "Summer") : semester === 1 ? (ar ? "الفصل الأول" : "Semester 1") : (ar ? "الفصل الثاني" : "Semester 2");
    const crPct    = Math.min((selectedCr / maxCr) * 100, 100);
    const crColor  = crOverload ? "var(--gpa-danger)" : selectedCr >= maxCr * 0.85 ? "#F59E0B" : pal.accent;
    const gpaColor = gpaDelta > 0.05 ? "var(--gpa-accent)" : gpaDelta < -0.05 ? "var(--gpa-danger)" : "var(--gpa-text-faint)";

    const compulsory = courseList.filter((c) => c.type === "compulsory");
    const elective   = courseList.filter((c) => c.type === "elective");
    const free       = courseList.filter((c) => c.type === "free");
    const retake     = courseList.filter((c) => c.type === "retake");
    const future     = courseList.filter((c) => c.type === "future");
    const activeCr   = courseList.filter((c) => c.type === "compulsory" || c.chosen).length;

    /* ── Inner: Course Card ── */
    const CourseCard = ({ course, forceOn }: { course: SelectableCourse; forceOn?: boolean }) => {
      const on     = forceOn || course.chosen;
      const locked = course.type === "compulsory";
      const disabled = !on && crOverload && !locked;
      const TC: Record<string, string> = { compulsory: pal.accent, elective: "#F59E0B", free: "#10B981", retake: "#EF4444", future: "#8B5CF6" };
      const TL_AR: Record<string, string> = { compulsory: "إلزامي", elective: "اختياري", free: "حر", retake: "إعادة", future: "مستقبلي" };
      const TL_EN: Record<string, string> = { compulsory: "Compulsory", elective: "Elective", free: "Free", retake: "Retake", future: "Future" };
      const typeColor = TC[course.type] || pal.accent;
      const typeLabel = ar ? (TL_AR[course.type] || course.type) : (TL_EN[course.type] || course.type);
      return (
        <button onClick={() => !locked && toggle(course.code, course.credits)} disabled={disabled}
          style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "start", padding: "14px 16px", borderRadius: 14, border: on ? `1.5px solid ${typeColor}55` : "1px solid var(--gpa-border)", background: on ? `linear-gradient(135deg, ${typeColor}0d, ${typeColor}06)` : "var(--gpa-surface-alpha-06)", cursor: locked ? "default" : disabled ? "not-allowed" : "pointer", transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)", opacity: disabled ? 0.45 : 1, boxShadow: on ? `0 0 0 1px ${typeColor}18` : "none" }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, border: on ? `2px solid ${typeColor}` : "2px solid var(--gpa-border)", background: on ? typeColor : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", boxShadow: on ? `0 0 8px ${typeColor}50` : "none" }}>
            {on && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontFamily: FONT_NUM, fontSize: 10, fontWeight: 700, color: typeColor, background: `${typeColor}18`, padding: "2px 8px", borderRadius: 99, letterSpacing: "0.5px" }}>{typeLabel}</span>
              {course.alreadyPassed && <span style={{ fontSize: 10, color: "var(--gpa-accent)", background: "var(--gpa-accent-15)", padding: "2px 8px", borderRadius: 99 }}>{ar ? "✓ مجتاز" : "✓ Passed"}</span>}
              {!course.prereqMet && <span style={{ fontSize: 10, color: "var(--gpa-danger)", background: "var(--gpa-danger-15)", padding: "2px 8px", borderRadius: 99 }}>{ar ? "⚠ شرط سابق" : "⚠ Prereq missing"}</span>}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "var(--gpa-text)", lineHeight: 1.4 }}>{course.name}</div>
            {course.code && (
              <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT_NUM, marginTop: 3 }}>
                {course.code}
                {course.prerequisite && <span style={{ marginInlineStart: 8, color: course.prereqMet ? "var(--gpa-accent)" : "var(--gpa-danger)" }}>{ar ? `• شرط: ${course.prerequisite}` : `• Prereq: ${course.prerequisite}`}</span>}
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: on ? typeColor : "var(--gpa-surface-alpha-08)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", boxShadow: on ? `0 2px 8px ${typeColor}40` : "none" }}>
            <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 900, color: on ? "#fff" : "var(--gpa-text-faint)", lineHeight: 1 }}>{course.credits}</div>
            <div style={{ fontSize: 8, color: on ? "rgba(255,255,255,0.75)" : "var(--gpa-text-faintest)", letterSpacing: "0.5px" }}>{ar ? "ساعة" : "cr"}</div>
          </div>
        </button>
      );
    };

    /* ── Inner: Section Header ── */
    const SectionHeader = ({ title, color }: { title: string; color: string }) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, marginTop: 20 }}>
        <div style={{ flex: 1, height: 1, background: `${color}30` }} />
        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color, background: `${color}12`, padding: "4px 14px", borderRadius: 99, letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ flex: 1, height: 1, background: `${color}30` }} />
      </div>
    );

    const empty = (msg: string) => <div style={{ textAlign: "center", padding: "24px 0", color: "var(--gpa-text-faintest)", fontSize: 12, fontFamily: FONT }}>{msg}</div>;

    return (
      <div style={{ maxWidth: 780, margin: "0 auto", paddingBottom: 164 }}>
        {/* ── Step 3 header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setStep(2)} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--gpa-border)", background: "var(--gpa-surface-alpha-06)", cursor: "pointer", color: "var(--gpa-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{ar ? "→" : "←"}</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", letterSpacing: "1px", textTransform: "uppercase" }}>{ar ? "خطوة ٣ — اختيار المقررات" : "STEP 3 — COURSE SELECTION"}</div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 800, color: "var(--gpa-text)", marginTop: 2 }}>
              {ar ? program.nameAr : program.nameEn}
              <span style={{ fontSize: 12, color: "var(--gpa-text-faint)", fontWeight: 400, marginInlineStart: 8 }}>
                {ar ? `المستوى ${level}` : `Level ${level}`} · {semLabel}
              </span>
            </div>
          </div>
          <button onClick={copySelection} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--gpa-border)", background: copied ? "var(--gpa-accent-15)" : "var(--gpa-surface-alpha-06)", cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600, color: copied ? "var(--gpa-accent)" : "var(--gpa-text-faint)", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 5 }}>
            {copied ? "✓" : "📋"} {copied ? (ar ? "تم!" : "Done!") : (ar ? "نسخ" : "Copy")}
          </button>
        </div>

        {/* ── Summer info ── */}
        {semester === "summer" && (
          <div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(239,68,68,0.06))", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 16, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>🏖️</div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#FBBF24", marginBottom: 4 }}>{ar ? "قوّة الفصل الصيفي" : "Summer Semester Superpowers"}</div>
              <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, lineHeight: 1.6 }}>
                {ar ? "يمكنك إعادة مقررات الرسوب لتحسين معدلك، واختيار مقررات اختيارية من المستوى التالي. الحد الأقصى 9 ساعات." : "Retake failed courses to boost your GPA, or take electives from the next level. Max 9 credit hours."}
              </div>
            </div>
          </div>
        )}

        {/* ── Course lists ── */}
        {semester === "summer" ? (
          <>
            {retake.length > 0
              ? (<><SectionHeader title={ar ? "إعادة مقررات الرسوب" : "Retake Failed Courses"} color="#EF4444" /><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{retake.map((c) => <CourseCard key={c.code} course={c} />)}</div></>)
              : empty(ar ? "لا توجد مقررات رسوب — أحسنت! 🎉" : "No failed courses — great work! 🎉")}
            {future.length > 0 && (<><SectionHeader title={ar ? "مقررات مستقبلية (اختياري)" : "Future Electives (Optional)"} color="#8B5CF6" /><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{future.map((c) => <CourseCard key={c.code} course={c} />)}</div></>)}
          </>
        ) : (
          <>
            {compulsory.length > 0 && (<><SectionHeader title={ar ? "مقررات إلزامية" : "Compulsory Courses"} color={pal.accent} /><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{compulsory.map((c) => <CourseCard key={c.code} course={c} forceOn />)}</div></>)}
            {elective.length > 0  && (<><SectionHeader title={ar ? "مقررات اختيارية" : "Elective Courses"}  color="#F59E0B" /><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{elective.map((c) => <CourseCard key={c.code} course={c} />)}</div></>)}
            {free.length > 0      && (<><SectionHeader title={ar ? "اختيار حر" : "Free Optional"}           color="#10B981" /><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{free.map((c) => <CourseCard key={c.code} course={c} />)}</div></>)}
            {courseList.length === 0 && empty(ar ? "لا توجد مقررات لهذا الفصل في البيانات الحالية." : "No courses found for this level/semester combination.")}
          </>
        )}

        {/* ════════ AI COPILOT PANEL ════════ */}
        {!isGuest && (
          <div style={{ marginTop: 24, border: "1px solid rgba(34,211,238,0.20)", borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg, rgba(34,211,238,0.04), rgba(37,99,235,0.03))" }}>
            {/* Header bar */}
            <button
              onClick={() => setCopilotExpanded((v) => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", borderBottom: copilotExpanded ? "1px solid rgba(34,211,238,0.12)" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#2563EB,#22D3EE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, boxShadow: "0 0 16px rgba(34,211,238,0.3)" }}>🤖</div>
              <div style={{ flex: 1, textAlign: "start" }}>
                <div style={{ fontFamily: FONT_NUM, fontSize: 13, fontWeight: 800, color: "#22D3EE" }}>{ar ? "المستشار AI — مراجعة فورية" : "AI Copilot — Live Plan Review"}</div>
                <div style={{ fontSize: 10, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 1 }}>
                  {copilotLoading ? (ar ? "⚡ يحلّل الخطة..." : "⚡ Analysing your plan...") : copilotText ? (ar ? "تحديث تلقائي عند تغيير الاختيارات" : "Auto-updates as you select") : (ar ? "يبدأ تلقائياً بعد اختيار المواد" : "Triggers automatically after selection")}
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
                    {ar ? "🎓 اختر مقررات في الأعلى وسيبدأ المستشار بالتحليل خلال ثانية..." : "🎓 Select courses above and the advisor will analyse in a moment..."}
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

        {/* save error banner */}
        {saveError && (
          <div style={{ marginTop: 12, padding: "10px 16px", borderRadius: 12, background: "var(--gpa-danger-15)", border: "1px solid var(--gpa-danger-33)", fontSize: 12, color: "var(--gpa-danger)", fontFamily: FONT }}>
            ⚠️ {saveError}
          </div>
        )}

        {/* ════════ STICKY BOTTOM BAR ════════ */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, padding: "0 12px 16px", pointerEvents: "none" }}>
          <div style={{
            maxWidth: 780, margin: "0 auto",
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
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_NUM, color: gpaDelta > 0.01 ? "var(--gpa-accent)" : gpaDelta < -0.01 ? "var(--gpa-danger)" : "var(--gpa-text-faint)" }}>
                    {gpaDelta > 0.01 ? `▲${gpaDelta.toFixed(2)}` : gpaDelta < -0.01 ? `▼${Math.abs(gpaDelta).toFixed(2)}` : "→"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                  <span style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>F</span>
                  <input type="range" min={0} max={4} step={0.333} value={estimateGpa} onChange={(e) => setEstimateGpa(Number(e.target.value))} style={{ width: 72, accentColor: pal.accent, cursor: "pointer" }} />
                  <span style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>A+</span>
                </div>
                <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>{ar ? `بتقدير ${estimateGpa.toFixed(2)}` : `If avg ${estimateGpa.toFixed(2)}`}</div>
              </div>

              <div style={{ width: 1, height: 44, background: "var(--gpa-border)", flexShrink: 0 }} />

              {/* Course count */}
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", marginBottom: 4 }}>{ar ? "المقررات" : "Courses"}</div>
                <div style={{ fontFamily: FONT_NUM, fontSize: 18, fontWeight: 900, color: pal.accent }}>{activeCr}</div>
                <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>{ar ? "مادة" : "selected"}</div>
              </div>

              <div style={{ width: 1, height: 44, background: "var(--gpa-border)", flexShrink: 0 }} />

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                {/* Export PDF */}
                <button onClick={exportPDF}
                  title={ar ? "تصدير الجدول كـ PDF" : "Export as PDF"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)", cursor: "pointer", fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#818CF8", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
                  📄 {ar ? "PDF" : "PDF"}
                </button>

                {/* Save Plan */}
                {onSavePlan && (
                  <button onClick={handleSavePlan} disabled={savePending || saveDone || activeCr === 0}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "none",
                      background: saveDone
                        ? "linear-gradient(135deg, #10B981, #059669)"
                        : saveError
                          ? "linear-gradient(135deg, #EF4444, #DC2626)"
                          : `linear-gradient(135deg, ${pal.accent}cc, ${pal.grad.includes("22D3EE") ? "#2563EB" : "#6366F1"})`,
                      cursor: (savePending || saveDone || activeCr === 0) ? "not-allowed" : "pointer",
                      opacity: activeCr === 0 ? 0.5 : 1,
                      fontFamily: FONT_NUM, fontSize: 12, fontWeight: 800, color: "#fff",
                      boxShadow: saveDone ? "0 0 16px rgba(16,185,129,0.4)" : `0 4px 16px ${pal.accent}40`,
                      transition: "all 0.3s ease", whiteSpace: "nowrap",
                    }}>
                    {savePending ? "⏳" : saveDone ? "✓" : "💾"}{" "}
                    {savePending ? (ar ? "جاري..." : "Saving...") : saveDone ? (ar ? "تم الحفظ!" : "Saved!") : (ar ? "حفظ الخطة" : "Save Plan")}
                  </button>
                )}
              </div>
            </div>

            {/* Overload warning */}
            {crOverload && (
              <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 10, background: "var(--gpa-danger-15)", border: "1px solid var(--gpa-danger-33)", fontSize: 11, color: "var(--gpa-danger)", fontFamily: FONT }}>
                {ar ? "⚠️ تجاوز الحد المسموح. يُنصح بإزالة بعض المقررات الاختيارية. التجاوز فوق 3 ساعات يستلزم موافقة الكلية." : "⚠️ Over credit limit. Remove some electives. Overloads beyond 3 cr require faculty approval."}
              </div>
            )}
          </div>
        </div>

        {/* CSS for animations */}
        <style>{`
          @keyframes copilot-pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
          @keyframes copilot-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
        `}</style>
      </div>
    );
  }

  return null;
}
