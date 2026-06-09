// Two-phase transcript pipeline (pure, client-safe).
// PHASE 1 — structureTranscript: turn raw AI output into the app's template
//           (semesters -> courses) with grades resolved to the active scale.
// PHASE 2 — normalizeTranscript: clean & validate the structured data
//           (dedupe, retakes, levels, failed flags, totals check).
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Grade = { ar: string; en: string; label: string; pts: number; minPct: number; clr: string };

export type AiCourse = {
  name: string;
  code?: string;
  credits: number;
  grade_letter?: string;
  grade_pts?: number;
  percentage?: number;
  semester_label?: string;
};

export type AiTranscript = {
  cumulative_gpa: number | null;
  total_credits_earned: number | null;
  current_level: number | null;
  university: string | null;
  major: string | null;
  courses: AiCourse[];
  notes?: string;
};

export type ReviewCourse = {
  id: string;
  name: string;
  code: string;
  credits: number;
  grade_letter: string | null;
  grade_pts: number | null;
  percentage: number | null;
  is_failed: boolean;
  retake: boolean;
};

export type ReviewSem = {
  id: string;
  label: string;
  sem_type: string; // "1" | "2" | "3"(summer)
  year: number | null;
  level: number; // 1..4
  courses: ReviewCourse[];
};

export type NormalizeResult = {
  sems: ReviewSem[];
  warnings: string[];
  computed: { credits: number; cgpa: number; count: number };
};

let _seq = 0;
const uid = (p = "x") => `${p}${Date.now().toString(36)}${(_seq++).toString(36)}`;

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "") // arabic diacritics
    .replace(/\s+/g, " ")
    .trim();

// nearest scale grade by points
function letterFromPts(pts: number, grades: Grade[], ar: boolean): string {
  if (!grades.length) return "—";
  const g = grades.reduce((p, c) => (Math.abs(c.pts - pts) < Math.abs(p.pts - pts) ? c : p));
  return ar ? g.ar : g.en;
}

// % -> scale grade
function gradeFromPct(pct: number, grades: Grade[]): Grade {
  for (const g of [...grades].sort((a, b) => b.minPct - a.minPct)) {
    if (pct >= g.minPct) return g;
  }
  return grades[grades.length - 1];
}

// match a free-text letter to a scale grade
function gradeFromLetter(letter: string, grades: Grade[]): Grade | null {
  const n = norm(letter);
  if (!n) return null;
  // direct ar/en match
  for (const g of grades) {
    if (norm(g.ar) === n || norm(g.en) === n) return g;
  }
  // fail keywords
  if (/(^f$|fail|راسب|^ر$|ضعيف)/i.test(n)) return grades.find((g) => g.pts === 0) ?? null;
  // startsWith match (e.g. "a plus" vs "a+")
  for (const g of grades) {
    if (n.startsWith(norm(g.en)) || n.startsWith(norm(g.ar))) return g;
  }
  return null;
}

function detectSemType(label: string): string {
  const n = norm(label);
  if (/(صيف|summer|صيفي)/.test(n)) return "3";
  if (/(2|ثان|spring|ربيع|الثاني)/.test(n)) return "2";
  return "1";
}

/* ─────────────── PHASE 1 — STRUCTURE ─────────────── */
export function structureTranscript(ai: AiTranscript, grades: Grade[], lang: string): ReviewSem[] {
  const ar = lang !== "en";
  const courses = Array.isArray(ai.courses) ? ai.courses : [];
  const groups = new Map<string, AiCourse[]>();
  let unnamed = 0;
  for (const c of courses) {
    const key = (c.semester_label && c.semester_label.trim()) || `__auto_${Math.floor(unnamed++ / 6)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  const sems: ReviewSem[] = [];
  let idx = 0;
  for (const [key, list] of groups) {
    idx++;
    const auto = key.startsWith("__auto_");
    const label = auto ? (ar ? `فصل ${idx}` : `Semester ${idx}`) : key;
    const rc: ReviewCourse[] = list.map((c) => {
      let pts: number | null = null;
      let letter: string | null = null;
      const pct = typeof c.percentage === "number" ? c.percentage : null;

      if (typeof c.grade_pts === "number" && c.grade_pts >= 0 && c.grade_pts <= 4) {
        pts = c.grade_pts;
        letter = c.grade_letter ? c.grade_letter : letterFromPts(pts, grades, ar);
      } else if (c.grade_letter) {
        const g = gradeFromLetter(c.grade_letter, grades);
        if (g) {
          pts = g.pts;
          letter = ar ? g.ar : g.en;
        } else {
          letter = c.grade_letter;
        }
      }
      // % overrides/fills when still missing
      if (pts == null && pct != null) {
        const g = gradeFromPct(pct, grades);
        pts = g.pts;
        letter = ar ? g.ar : g.en;
      }

      const credits = Number.isFinite(c.credits) ? Math.max(0, Math.min(12, Math.round(c.credits))) : 3;
      return {
        id: uid("c"),
        name: (c.name || "—").trim(),
        code: (c.code || "").trim(),
        credits,
        grade_letter: letter,
        grade_pts: pts,
        percentage: pct,
        is_failed: pts != null && pts === 0,
        retake: false,
      };
    });
    sems.push({
      id: uid("s"),
      label,
      sem_type: detectSemType(label),
      year: null,
      level: 1,
      courses: rc,
    });
  }
  return sems;
}

/* ─────────────── PHASE 2 — NORMALIZE & VALIDATE ─────────────── */
export function normalizeTranscript(
  input: ReviewSem[],
  grades: Grade[],
  ai: AiTranscript,
  lang: string,
): NormalizeResult {
  const ar = lang !== "en";
  const warnings: string[] = [];
  const sems: ReviewSem[] = input.map((s) => ({ ...s, courses: [...s.courses] }));

  // 1) dedupe identical courses within the same semester
  for (const s of sems) {
    const seen = new Set<string>();
    s.courses = s.courses.filter((c) => {
      const k = `${norm(c.name)}|${c.credits}|${c.grade_pts ?? "x"}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  // 2) credits sanity + normalize letters to scale display + failed flag
  for (const s of sems) {
    for (const c of s.courses) {
      if (!Number.isFinite(c.credits) || c.credits <= 0) c.credits = 3;
      if (c.grade_pts != null) {
        c.grade_letter = letterFromPts(c.grade_pts, grades, ar);
        c.is_failed = c.grade_pts === 0;
      }
    }
  }

  // 3) levels by cumulative credits (Benha thresholds: 30/64/100/136)
  let cum = 0;
  for (const s of sems) {
    const cr = s.courses.reduce((a, c) => a + c.credits, 0);
    cum += cr;
    s.level = cum <= 30 ? 1 : cum <= 64 ? 2 : cum <= 100 ? 3 : 4;
  }

  // 4) retake detection across semesters (same course name repeated)
  const firstSeen = new Map<string, ReviewCourse>();
  for (const s of sems) {
    for (const c of s.courses) {
      const k = norm(c.name);
      if (!k || k === "—") continue;
      if (firstSeen.has(k)) {
        c.retake = true;
        const prev = firstSeen.get(k)!;
        if (prev.is_failed) prev.retake = false; // keep latest as the valid attempt
      } else {
        firstSeen.set(k, c);
      }
    }
  }
  const retakeCount = sems.reduce((a, s) => a + s.courses.filter((c) => c.retake).length, 0);
  if (retakeCount > 0)
    warnings.push(
      ar
        ? `تم اكتشاف ${retakeCount} مادة معادة — التقدير الأحدث هو اللي بيتحسب.`
        : `${retakeCount} retake course(s) detected — newest grade counts.`,
    );

  // 5) totals & GPA validation (graded, non-retake-old courses only)
  let credits = 0;
  let pts = 0;
  for (const s of sems) {
    for (const c of s.courses) {
      if (c.grade_pts == null) continue;
      credits += c.credits;
      pts += c.credits * c.grade_pts;
    }
  }
  const cgpa = credits > 0 ? +(pts / credits).toFixed(3) : 0;
  const count = sems.reduce((a, s) => a + s.courses.length, 0);

  if (ai.total_credits_earned != null && Math.abs(ai.total_credits_earned - credits) > 3) {
    warnings.push(
      ar
        ? `إجمالي الساعات المحسوب (${credits}) مختلف عن المستند (${ai.total_credits_earned}). راجع المواد.`
        : `Computed credits (${credits}) differ from document (${ai.total_credits_earned}). Review courses.`,
    );
  }
  if (ai.cumulative_gpa != null && Math.abs(ai.cumulative_gpa - cgpa) > 0.15) {
    warnings.push(
      ar
        ? `المعدل المحسوب (${cgpa}) مختلف عن المستند (${ai.cumulative_gpa}). راجع التقديرات.`
        : `Computed GPA (${cgpa}) differs from document (${ai.cumulative_gpa}). Review grades.`,
    );
  }
  if (count === 0)
    warnings.push(ar ? "لم يتم استخراج أي مواد من المستند." : "No courses were extracted from the document.");

  return { sems, warnings, computed: { credits, cgpa, count } };
}
