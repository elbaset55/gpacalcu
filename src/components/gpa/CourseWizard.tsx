/* ═══════════════════════════════════════════════════════════════
   CourseWizard — Benha University 2021 By-law
   Termly Aurora Design System · RTL/LTR · Inline Styles
   Steps: 1. Specialisation → 2. Level/Semester → 3. Course Cards
═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react";
import {
  BENHA_PROGRAMS,
  UNIVERSITY_COURSES,
  COLLEGE_L1_NATURAL,
} from "@/data/benha-programs";
import type { BenhaProgram, BenhaCourse } from "@/data/benha-programs";

/* ─── Department colour palette ─── */
const DEPT_PALETTE: Record<string, { grad: string; accent: string; glyph: string }> = {
  Mathematics:    { grad: "linear-gradient(135deg,#2563EB,#7C3AED)", accent: "#818CF8", glyph: "∑" },
  "Computer Science": { grad: "linear-gradient(135deg,#0EA5E9,#22D3EE)", accent: "#22D3EE", glyph: "⌘" },
  Statistics:     { grad: "linear-gradient(135deg,#10B981,#059669)", accent: "#34D399", glyph: "σ" },
  Physics:        { grad: "linear-gradient(135deg,#F59E0B,#EF4444)", accent: "#FBBF24", glyph: "⚛" },
  Chemistry:      { grad: "linear-gradient(135deg,#8B5CF6,#EC4899)", accent: "#C084FC", glyph: "⚗" },
  Biology:        { grad: "linear-gradient(135deg,#22C55E,#16A34A)", accent: "#4ADE80", glyph: "🌿" },
  Geology:        { grad: "linear-gradient(135deg,#A16207,#CA8A04)", accent: "#EAB308", glyph: "🪨" },
  Geophysics:     { grad: "linear-gradient(135deg,#0369A1,#0EA5E9)", accent: "#38BDF8", glyph: "🌊" },
};

const deptPalette = (dept: string) =>
  DEPT_PALETTE[dept] ?? { grad: "linear-gradient(135deg,#6366F1,#8B5CF6)", accent: "#A5B4FC", glyph: "★" };

const FONT = "'Cairo','Sora','Manrope','Noto Sans Arabic',sans-serif";
const FONT_NUM = "'Sora','Cairo',sans-serif";

/* ─── Load-rule: max credits per semester ─── */
function maxCredits(cumGpa: number, earnedCr: number): number {
  if (cumGpa < 2.0 && cumGpa > 0) return 12;
  if (earnedCr >= 100 && cumGpa >= 2.0) return 22;
  if (cumGpa >= 3.333) return 20;
  return 18;
}

/* ─── GPA impact prediction ─── */
function predictGpa(
  currentGpa: number,
  currentCr: number,
  newCr: number,
  newGpaEstimate: number
): number {
  if (currentCr + newCr === 0) return currentGpa;
  return (currentGpa * currentCr + newGpaEstimate * newCr) / (currentCr + newCr);
}

/* ─── Types ─── */
interface SelectableCourse extends BenhaCourse {
  type: "compulsory" | "elective" | "free" | "retake" | "future";
  chosen: boolean;
  prereqMet: boolean;
  alreadyPassed: boolean;
}

interface CourseWizardProps {
  lang: "ar" | "en";
  cumGpa: number;
  earnedCr: number;
  totalReq: number;
  history: Array<{
    courses: Array<{ code?: string; name: string; grade: number; cr: number }>;
  }>;
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
export function CourseWizard({ lang, cumGpa, earnedCr, totalReq, history }: CourseWizardProps) {
  const ar = lang === "ar";

  /* ── step state ── */
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [programId, setProgramId] = useState<string>("");
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(2);
  const [semester, setSemester] = useState<1 | 2 | "summer">(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [estimateGpa, setEstimateGpa] = useState(3.0);
  const [copied, setCopied] = useState(false);

  const program = useMemo(() => BENHA_PROGRAMS.find((p) => p.id === programId) ?? null, [programId]);

  /* ── completed / failed courses from history ── */
  const { passedCodes, failedCourses } = useMemo(() => {
    const passed = new Set<string>();
    const failed: Array<{ code: string; name: string; cr: number }> = [];
    for (const sem of history) {
      for (const c of sem.courses) {
        const key = c.code?.trim() || c.name.trim();
        if (c.grade >= 2.0) passed.add(key);
        else if (c.grade > 0) {
          if (!failed.find((f) => f.code === key))
            failed.push({ code: key, name: c.name, cr: c.cr });
        }
      }
    }
    return { passedCodes: passed, failedCourses: failed };
  }, [history]);

  /* ── build course list for current level/semester ── */
  const courseList: SelectableCourse[] = useMemo(() => {
    if (!program) return [];

    const prereqMet = (prereq?: string): boolean => {
      if (!prereq) return true;
      return passedCodes.has(prereq);
    };

    if (level === 1) {
      const sem1: BenhaCourse[] = [UNIVERSITY_COURSES[0], UNIVERSITY_COURSES[1], ...COLLEGE_L1_NATURAL.slice(0, 5)];
      const sem2: BenhaCourse[] = [UNIVERSITY_COURSES[2], UNIVERSITY_COURSES[3], ...COLLEGE_L1_NATURAL.slice(5)];
      const pool = semester === 1 ? sem1 : semester === 2 ? sem2 : [];
      return pool.map((c) => ({
        ...c,
        type: "compulsory" as const,
        chosen: true,
        prereqMet: prereqMet(c.prerequisite),
        alreadyPassed: passedCodes.has(c.code),
      }));
    }

    if (semester === "summer") {
      const retakes: SelectableCourse[] = failedCourses.map((c) => ({
        code: c.code,
        name: c.name,
        credits: c.cr,
        type: "retake" as const,
        chosen: selected.has(c.code),
        prereqMet: true,
        alreadyPassed: false,
      }));

      /* future courses = next semester's electives from the program */
      const nextLevel = level < 4 ? (level + 1) as 2 | 3 | 4 : level;
      const futureSched = program.schedule.find((s) => s.level === nextLevel && s.semester === 1);
      const future: SelectableCourse[] = (futureSched?.elective ?? []).map((c) => ({
        ...c,
        type: "future" as const,
        chosen: selected.has(c.code),
        prereqMet: prereqMet(c.prerequisite),
        alreadyPassed: passedCodes.has(c.code),
      }));

      return [...retakes, ...future];
    }

    const sched = program.schedule.find((s) => s.level === level && s.semester === semester);
    if (!sched) return [];

    const compulsory: SelectableCourse[] = sched.compulsory.map((c) => ({
      ...c,
      type: "compulsory" as const,
      chosen: true,
      prereqMet: prereqMet(c.prerequisite),
      alreadyPassed: passedCodes.has(c.code),
    }));

    const elective: SelectableCourse[] = sched.elective.map((c) => ({
      ...c,
      type: "elective" as const,
      chosen: selected.has(c.code),
      prereqMet: prereqMet(c.prerequisite),
      alreadyPassed: passedCodes.has(c.code),
    }));

    const free: SelectableCourse[] = (sched.freeOptional ?? []).map((c) => ({
      ...c,
      type: "free" as const,
      chosen: selected.has(c.code),
      prereqMet: prereqMet(c.prerequisite),
      alreadyPassed: passedCodes.has(c.code),
    }));

    return [...compulsory, ...elective, ...free];
  }, [program, level, semester, selected, passedCodes, failedCourses]);

  /* ── credit totals ── */
  const selectedCr = useMemo(() => {
    return courseList
      .filter((c) => c.type === "compulsory" || c.chosen)
      .reduce((s, c) => s + c.credits, 0);
  }, [courseList]);

  const maxCr = semester === "summer" ? 9 : maxCredits(cumGpa, earnedCr);
  const crOverload = selectedCr > maxCr;

  const predictedGpa = predictGpa(cumGpa, earnedCr, selectedCr, estimateGpa);
  const gpaDelta = predictedGpa - cumGpa;

  /* ── toggle elective/free/retake/future ── */
  const toggle = (code: string, credits: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        const wouldAdd = selectedCr + credits;
        if (wouldAdd > maxCr + 3) return prev; // soft block
        next.add(code);
      }
      return next;
    });
  };

  /* ── copy selection as text ── */
  const copySelection = () => {
    const active = courseList.filter((c) => c.type === "compulsory" || c.chosen);
    const lines = active.map((c) => `${c.code} — ${c.name} (${c.credits} cr)`).join("\n");
    const header = ar
      ? `خطة التسجيل — ${program?.nameAr ?? ""} — المستوى ${level} / الفصل ${semester === "summer" ? "الصيفي" : semester}\n`
      : `Registration Plan — ${program?.nameEn ?? ""} — L${level}/S${semester === "summer" ? "Sum" : semester}\n`;
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
        {/* Hero header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(34,211,238,0.08))",
          border: "1px solid rgba(37,99,235,0.2)",
          borderRadius: 20,
          padding: "28px 28px 24px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -40, right: -40, width: 200, height: 200,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ fontFamily: FONT_NUM, fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--gpa-accent)", marginBottom: 8 }}>
            {ar ? "خطوة ١ من ٣" : "STEP 1 OF 3"}
          </div>
          <h2 style={{ margin: 0, fontFamily: FONT_NUM, fontSize: 22, fontWeight: 900, color: "var(--gpa-text)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            {ar ? "🎓 اختر تخصصك" : "🎓 Select Your Specialisation"}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--gpa-text-faint)", fontFamily: FONT }}>
            {ar
              ? "اختر برنامجك الدراسي وفق لائحة كلية العلوم جامعة بنها 2021 لعرض المقررات المتاحة"
              : "Select your programme under Benha Faculty of Science By-law 2021 to see available courses"}
          </p>
        </div>

        {/* Program grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {BENHA_PROGRAMS.map((prog) => {
            const pal = deptPalette(prog.department);
            const active = programId === prog.id;
            return (
              <button
                key={prog.id}
                onClick={() => { setProgramId(prog.id); setStep(2); }}
                style={{
                  border: active ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)",
                  borderRadius: 18,
                  background: active
                    ? `linear-gradient(135deg, ${pal.accent}12, ${pal.accent}06)`
                    : "var(--gpa-card)",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "start",
                  transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                  boxShadow: active
                    ? `0 0 0 1px ${pal.accent}30, 0 8px 32px rgba(0,0,0,0.2)`
                    : "0 2px 8px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Top gradient bar */}
                <div style={{ height: 5, background: pal.grad, opacity: 0.9 }} />

                <div style={{ padding: "18px 20px 20px" }}>
                  {/* Glyph */}
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: pal.grad,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 14,
                    boxShadow: `0 4px 16px ${pal.accent}40`,
                    fontFamily: FONT_NUM,
                  }}>
                    {pal.glyph}
                  </div>

                  <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 800, color: "var(--gpa-text)", lineHeight: 1.2, marginBottom: 4 }}>
                    {ar ? prog.nameAr : prog.nameEn}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, marginBottom: 10 }}>
                    {ar ? prog.departmentAr : prog.department}
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { label: ar ? "ساعة" : "cr", value: prog.creditReq.total },
                      { label: ar ? "فصل" : "sem", value: prog.schedule.length },
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: `${pal.accent}12`,
                        borderRadius: 8, padding: "4px 10px",
                        fontSize: 11, fontFamily: FONT_NUM, fontWeight: 700, color: pal.accent,
                      }}>
                        {s.value} {s.label}
                      </div>
                    ))}
                  </div>
                </div>

                {active && (
                  <div style={{
                    position: "absolute", top: 12, insetInlineEnd: 12,
                    width: 20, height: 20, borderRadius: "50%",
                    background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "#000", fontWeight: 900,
                  }}>✓</div>
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
    const levels: Array<{ v: 1 | 2 | 3 | 4; ar: string; en: string }> = [
      { v: 1, ar: "الأول", en: "Level 1" },
      { v: 2, ar: "الثاني", en: "Level 2" },
      { v: 3, ar: "الثالث", en: "Level 3" },
      { v: 4, ar: "الرابع", en: "Level 4" },
    ];
    const semesters: Array<{ v: 1 | 2 | "summer"; ar: string; en: string; emoji: string; note?: string }> = [
      { v: 1, ar: "الفصل الأول", en: "Semester 1", emoji: "🌙" },
      { v: 2, ar: "الفصل الثاني", en: "Semester 2", emoji: "☀️" },
      {
        v: "summer",
        ar: "الفصل الصيفي",
        en: "Summer Semester",
        emoji: "🏖️",
        note: ar ? "إعادة + تقدّم (حد أقصى 9 ساعات)" : "Retakes + advance (max 9 cr)",
      },
    ];

    return (
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Back + header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
          background: "var(--gpa-card)", border: "1px solid var(--gpa-border)",
          borderRadius: 18, padding: "16px 20px",
        }}>
          <button
            onClick={() => setStep(1)}
            style={{
              width: 36, height: 36, borderRadius: 10, border: "1px solid var(--gpa-border)",
              background: "var(--gpa-surface-alpha-06)", cursor: "pointer", color: "var(--gpa-text)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              fontSize: 16, transition: "all 0.2s",
            }}
          >
            {ar ? "→" : "←"}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>
              {ar ? "خطوة ٢ من ٣" : "STEP 2 OF 3"}
            </div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 16, fontWeight: 800, color: "var(--gpa-text)" }}>
              {ar ? program.nameAr : program.nameEn}
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 13, background: pal.grad,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: `0 4px 16px ${pal.accent}40`,
          }}>
            {pal.glyph}
          </div>
        </div>

        {/* Level picker */}
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "var(--gpa-text-soft)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {ar ? "المستوى الدراسي" : "Academic Level"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {levels.map(({ v, ar: arLabel, en }) => {
              const active = level === v;
              return (
                <button
                  key={v}
                  onClick={() => setLevel(v)}
                  style={{
                    padding: "14px 8px",
                    borderRadius: 14,
                    border: active ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)",
                    background: active ? `${pal.accent}14` : "var(--gpa-surface-alpha-06)",
                    cursor: "pointer",
                    fontFamily: FONT_NUM,
                    fontSize: 13,
                    fontWeight: active ? 800 : 500,
                    color: active ? pal.accent : "var(--gpa-text-faint)",
                    transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: active ? `0 0 0 1px ${pal.accent}20, 0 4px 12px rgba(0,0,0,0.15)` : "none",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>
                    {v === 1 ? "①" : v === 2 ? "②" : v === 3 ? "③" : "④"}
                  </div>
                  <div>{ar ? arLabel : en}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Semester picker */}
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: "20px", marginBottom: 20 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "var(--gpa-text-soft)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {ar ? "الفصل الدراسي" : "Semester"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {semesters.map(({ v, ar: arLabel, en, emoji, note }) => {
              const active = semester === v;
              return (
                <button
                  key={String(v)}
                  onClick={() => setSemester(v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: active ? `2px solid ${pal.accent}` : "1px solid var(--gpa-border)",
                    background: active ? `${pal.accent}10` : "var(--gpa-surface-alpha-06)",
                    cursor: "pointer",
                    textAlign: "start",
                    transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: active ? `0 0 0 1px ${pal.accent}20` : "none",
                  }}
                >
                  <div style={{ fontSize: 24 }}>{emoji}</div>
                  <div>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? pal.accent : "var(--gpa-text)" }}>
                      {ar ? arLabel : en}
                    </div>
                    {note && <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, marginTop: 2 }}>{note}</div>}
                  </div>
                  {active && (
                    <div style={{ marginInlineStart: "auto", width: 20, height: 20, borderRadius: "50%", background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 900 }}>
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue */}
        <button
          onClick={() => { setSelected(new Set()); setStep(3); }}
          style={{
            width: "100%", padding: "15px",
            borderRadius: 16, border: "none",
            background: pal.grad,
            color: "#fff", fontFamily: FONT_NUM, fontSize: 14, fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.3px",
            boxShadow: `0 4px 24px ${pal.accent}40`,
            transition: "all 0.25s ease",
          }}
        >
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
    const semLabel = semester === "summer"
      ? (ar ? "صيفي" : "Summer")
      : semester === 1
        ? (ar ? "الفصل الأول" : "Semester 1")
        : (ar ? "الفصل الثاني" : "Semester 2");

    const compulsory = courseList.filter((c) => c.type === "compulsory");
    const elective = courseList.filter((c) => c.type === "elective");
    const free = courseList.filter((c) => c.type === "free");
    const retake = courseList.filter((c) => c.type === "retake");
    const future = courseList.filter((c) => c.type === "future");

    const crPct = Math.min((selectedCr / maxCr) * 100, 100);
    const crColor = crOverload ? "var(--gpa-danger)" : selectedCr >= maxCr * 0.85 ? "var(--gpa-grade-b)" : pal.accent;

    const gpaColor = gpaDelta > 0.05
      ? "var(--gpa-accent)"
      : gpaDelta < -0.05
        ? "var(--gpa-danger)"
        : "var(--gpa-text-faint)";

    /* ── Course card ── */
    const CourseCard = ({
      course,
      forceOn,
    }: {
      course: SelectableCourse;
      forceOn?: boolean;
    }) => {
      const on = forceOn || course.chosen;
      const locked = course.type === "compulsory";
      const disabled = !on && crOverload && !locked;
      const typeLabel = {
        compulsory: ar ? "إلزامي" : "Compulsory",
        elective: ar ? "اختياري" : "Elective",
        free: ar ? "حر" : "Free",
        retake: ar ? "إعادة" : "Retake",
        future: ar ? "مستقبلي" : "Future",
      }[course.type];
      const typeColor = {
        compulsory: pal.accent,
        elective: "#F59E0B",
        free: "#10B981",
        retake: "#EF4444",
        future: "#8B5CF6",
      }[course.type];

      return (
        <button
          onClick={() => !locked && toggle(course.code, course.credits)}
          disabled={disabled}
          style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            width: "100%", textAlign: "start",
            padding: "14px 16px",
            borderRadius: 14,
            border: on
              ? `1.5px solid ${typeColor}55`
              : "1px solid var(--gpa-border)",
            background: on
              ? `linear-gradient(135deg, ${typeColor}0d, ${typeColor}06)`
              : "var(--gpa-surface-alpha-06)",
            cursor: locked ? "default" : disabled ? "not-allowed" : "pointer",
            transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
            opacity: disabled ? 0.45 : 1,
            boxShadow: on ? `0 0 0 1px ${typeColor}18` : "none",
          }}
        >
          {/* Toggle box */}
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
            border: on ? `2px solid ${typeColor}` : "2px solid var(--gpa-border)",
            background: on ? typeColor : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: on ? `0 0 8px ${typeColor}50` : "none",
          }}>
            {on && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{
                fontFamily: FONT_NUM, fontSize: 10, fontWeight: 700,
                color: typeColor, background: `${typeColor}18`,
                padding: "2px 8px", borderRadius: 99, letterSpacing: "0.5px",
              }}>{typeLabel}</span>
              {course.alreadyPassed && (
                <span style={{ fontSize: 10, color: "var(--gpa-accent)", background: "var(--gpa-accent-15)", padding: "2px 8px", borderRadius: 99 }}>
                  {ar ? "✓ مجتاز" : "✓ Passed"}
                </span>
              )}
              {!course.prereqMet && (
                <span style={{ fontSize: 10, color: "var(--gpa-danger)", background: "var(--gpa-danger-15)", padding: "2px 8px", borderRadius: 99 }}>
                  {ar ? "⚠ شرط سابق" : "⚠ Prereq missing"}
                </span>
              )}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "var(--gpa-text)", lineHeight: 1.4 }}>
              {course.name}
            </div>
            {course.code && (
              <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT_NUM, marginTop: 3 }}>
                {course.code}
                {course.prerequisite && (
                  <span style={{ marginInlineStart: 8, color: course.prereqMet ? "var(--gpa-accent)" : "var(--gpa-danger)" }}>
                    {ar ? `• شرط: ${course.prerequisite}` : `• Prereq: ${course.prerequisite}`}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Credits badge */}
          <div style={{
            flexShrink: 0,
            width: 40, height: 40, borderRadius: 12,
            background: on ? typeColor : "var(--gpa-surface-alpha-08)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: on ? `0 2px 8px ${typeColor}40` : "none",
          }}>
            <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 900, color: on ? "#fff" : "var(--gpa-text-faint)", lineHeight: 1 }}>
              {course.credits}
            </div>
            <div style={{ fontSize: 8, color: on ? "rgba(255,255,255,0.75)" : "var(--gpa-text-faintest)", letterSpacing: "0.5px" }}>
              {ar ? "ساعة" : "cr"}
            </div>
          </div>
        </button>
      );
    };

    /* ── Section header ── */
    const SectionHeader = ({ title, count, total, color }: { title: string; count: number; total?: number; color: string }) => (
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 10, marginTop: 20,
      }}>
        <div style={{ flex: 1, height: 1, background: `${color}30` }} />
        <div style={{
          fontFamily: FONT, fontSize: 11, fontWeight: 700, color,
          background: `${color}12`, padding: "4px 14px", borderRadius: 99,
          letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap",
        }}>
          {title}
          {total !== undefined && <span style={{ opacity: 0.7, marginInlineStart: 4 }}>({count}/{total})</span>}
        </div>
        <div style={{ flex: 1, height: 1, background: `${color}30` }} />
      </div>
    );

    const emptyState = (msg: string) => (
      <div style={{ textAlign: "center", padding: "24px 0", color: "var(--gpa-text-faintest)", fontSize: 12, fontFamily: FONT }}>
        {msg}
      </div>
    );

    return (
      <div style={{ maxWidth: 780, margin: "0 auto", paddingBottom: 140 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setStep(2)}
            style={{
              width: 36, height: 36, borderRadius: 10, border: "1px solid var(--gpa-border)",
              background: "var(--gpa-surface-alpha-06)", cursor: "pointer", color: "var(--gpa-text)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16,
            }}
          >
            {ar ? "→" : "←"}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", letterSpacing: "1px", textTransform: "uppercase" }}>
              {ar ? "خطوة ٣ — اختيار المقررات" : "STEP 3 — COURSE SELECTION"}
            </div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 800, color: "var(--gpa-text)", marginTop: 2 }}>
              {ar ? program.nameAr : program.nameEn}
              <span style={{ fontSize: 12, color: "var(--gpa-text-faint)", fontWeight: 400, marginInlineStart: 8 }}>
                {ar ? `المستوى ${level}` : `Level ${level}`} · {semLabel}
              </span>
            </div>
          </div>
          <button
            onClick={copySelection}
            title={ar ? "نسخ الخطة" : "Copy plan"}
            style={{
              padding: "8px 14px", borderRadius: 10,
              border: "1px solid var(--gpa-border)",
              background: copied ? "var(--gpa-accent-15)" : "var(--gpa-surface-alpha-06)",
              cursor: "pointer", fontFamily: FONT, fontSize: 11, fontWeight: 600,
              color: copied ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
              transition: "all 0.2s ease",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            {copied ? "✓" : "📋"} {copied ? (ar ? "تم!" : "Done!") : (ar ? "نسخ" : "Copy")}
          </button>
        </div>

        {/* ─── Summer special ─── */}
        {semester === "summer" && (
          <>
            {/* Summer info card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(239,68,68,0.06))",
              border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: 16, padding: "14px 18px", marginBottom: 16,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>🏖️</div>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#FBBF24", marginBottom: 4 }}>
                  {ar ? "قوّة الفصل الصيفي" : "Summer Semester Superpowers"}
                </div>
                <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", fontFamily: FONT, lineHeight: 1.6 }}>
                  {ar
                    ? "يمكنك إعادة مقررات الرسوب لتحسين معدلك، واختيار مقررات اختيارية من المستوى التالي. الحد الأقصى 9 ساعات."
                    : "Retake failed courses to boost your GPA, or take electives from the next level. Max 9 credit hours."}
                </div>
              </div>
            </div>

            {retake.length > 0
              ? (<>
                  <SectionHeader title={ar ? "إعادة مقررات الرسوب" : "Retake Failed Courses"} count={retake.filter((c) => c.chosen).length} total={retake.length} color="#EF4444" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {retake.map((c) => <CourseCard key={c.code} course={c} />)}
                  </div>
                </>)
              : emptyState(ar ? "لا توجد مقررات راسب فيها — أحسنت! 🎉" : "No failed courses found — great work! 🎉")}

            {future.length > 0 && (<>
              <SectionHeader title={ar ? "مقررات مستقبلية (اختياري)" : "Future Electives (Optional)"} count={future.filter((c) => c.chosen).length} total={future.length} color="#8B5CF6" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {future.map((c) => <CourseCard key={c.code} course={c} />)}
              </div>
            </>)}
          </>
        )}

        {/* ─── Regular semester ─── */}
        {semester !== "summer" && (
          <>
            {/* Compulsory */}
            {compulsory.length > 0 && (<>
              <SectionHeader title={ar ? "مقررات إلزامية" : "Compulsory Courses"} count={compulsory.length} total={compulsory.length} color={pal.accent} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {compulsory.map((c) => <CourseCard key={c.code} course={c} forceOn />)}
              </div>
            </>)}

            {/* Elective */}
            {elective.length > 0 && (<>
              <SectionHeader title={ar ? "مقررات اختيارية" : "Elective Courses"} count={elective.filter((c) => c.chosen).length} color="#F59E0B" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {elective.map((c) => <CourseCard key={c.code} course={c} />)}
              </div>
            </>)}

            {/* Free optional */}
            {free.length > 0 && (<>
              <SectionHeader title={ar ? "اختيار حر" : "Free Optional"} count={free.filter((c) => c.chosen).length} color="#10B981" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {free.map((c) => <CourseCard key={c.code} course={c} />)}
              </div>
            </>)}

            {courseList.length === 0 && emptyState(
              ar ? "لا توجد مقررات لهذا الفصل في البيانات الحالية." : "No courses found for this level/semester combination."
            )}
          </>
        )}

        {/* ═══════ STICKY BOTTOM BAR ═══════ */}
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          padding: "0 12px 16px",
          pointerEvents: "none",
        }}>
          <div style={{
            maxWidth: 780,
            margin: "0 auto",
            background: "var(--gpa-card)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: `1px solid ${crOverload ? "var(--gpa-danger)" : "var(--gpa-border)"}`,
            borderRadius: 20,
            padding: "14px 18px",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
            pointerEvents: "auto",
            transition: "border-color 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

              {/* Credit meter */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: FONT, color: "var(--gpa-text-faint)" }}>
                    {ar ? "الساعات المعتمدة" : "Credit Hours"}
                  </span>
                  <span style={{
                    fontFamily: FONT_NUM, fontSize: 14, fontWeight: 900,
                    color: crColor,
                    transition: "color 0.3s ease",
                  }}>
                    {selectedCr}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--gpa-text-faint)" }}> / {maxCr}</span>
                  </span>
                </div>
                <div style={{
                  height: 8, borderRadius: 99,
                  background: "var(--gpa-surface-alpha-08)",
                  overflow: "hidden", position: "relative",
                }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    width: `${crPct}%`,
                    background: crOverload
                      ? "var(--gpa-danger)"
                      : `linear-gradient(90deg, ${pal.accent}, ${pal.grad.includes("22D3EE") ? "#22D3EE" : pal.accent})`,
                    borderRadius: 99,
                    transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: crOverload ? "0 0 8px var(--gpa-danger)" : `0 0 8px ${pal.accent}80`,
                  }} />
                </div>
                {crOverload && (
                  <div style={{ fontSize: 10, color: "var(--gpa-danger)", fontFamily: FONT, marginTop: 4 }}>
                    {ar ? `⚠ تجاوزت الحد الأقصى بـ ${selectedCr - maxCr} ساعة` : `⚠ ${selectedCr - maxCr} cr over limit`}
                  </div>
                )}
              </div>

              {/* Separator */}
              <div style={{ width: 1, height: 48, background: "var(--gpa-border)", flexShrink: 0 }} />

              {/* GPA Impact */}
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", marginBottom: 4 }}>
                  {ar ? "تأثير المعدل" : "GPA Impact"}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: FONT_NUM, fontSize: 18, fontWeight: 900, color: gpaColor, transition: "color 0.3s ease" }}>
                    {predictedGpa.toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: FONT_NUM,
                    color: gpaDelta > 0.01 ? "var(--gpa-accent)" : gpaDelta < -0.01 ? "var(--gpa-danger)" : "var(--gpa-text-faint)",
                  }}>
                    {gpaDelta > 0.01 ? `▲${gpaDelta.toFixed(2)}` : gpaDelta < -0.01 ? `▼${Math.abs(gpaDelta).toFixed(2)}` : "→"}
                  </span>
                </div>
                {/* Grade estimate slider */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>F</span>
                  <input
                    type="range" min={0} max={4} step={0.333}
                    value={estimateGpa}
                    onChange={(e) => setEstimateGpa(Number(e.target.value))}
                    style={{ width: 80, accentColor: pal.accent, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>A+</span>
                </div>
                <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT, marginTop: 2 }}>
                  {ar ? `بتقدير ${estimateGpa.toFixed(2)}` : `If avg ${estimateGpa.toFixed(2)}`}
                </div>
              </div>

              {/* Separator */}
              <div style={{ width: 1, height: 48, background: "var(--gpa-border)", flexShrink: 0 }} />

              {/* Courses count */}
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontFamily: FONT, color: "var(--gpa-text-faint)", marginBottom: 4 }}>
                  {ar ? "عدد المقررات" : "Courses"}
                </div>
                <div style={{ fontFamily: FONT_NUM, fontSize: 18, fontWeight: 900, color: pal.accent }}>
                  {courseList.filter((c) => c.type === "compulsory" || c.chosen).length}
                </div>
                <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", fontFamily: FONT }}>
                  {ar ? "مادة" : "selected"}
                </div>
              </div>

            </div>

            {/* Warning if overload */}
            {crOverload && (
              <div style={{
                marginTop: 10, padding: "8px 14px", borderRadius: 10,
                background: "var(--gpa-danger-15)", border: "1px solid var(--gpa-danger-33)",
                fontSize: 11, color: "var(--gpa-danger)", fontFamily: FONT,
              }}>
                {ar
                  ? "⚠️ تجاوز الحد المسموح. يُنصح بإزالة بعض المقررات الاختيارية. الحد الأقصى القابل للتجاوز هو 3 ساعات فقط بقرار من الكلية."
                  : "⚠️ Over the allowed credit limit. Remove some electives. Overloads beyond 3 cr require faculty approval."}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
