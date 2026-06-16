/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Termly — seedData Structural Integrity Validator               ║
 * ║  Benha University 2021 By-law · Faculty of Science              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Run validateDatabase() once at app startup (dev mode) to verify:
 *   1. No orphaned course codes in semester arrays
 *   2. No broken prerequisite references
 *   3. Missing programs vs. expected by-law programs
 *   4. Summary dashboard (console.table)
 *
 * Returns a ValidationReport object with full details.
 */

import { COURSES_DB, FACULTY_DATA } from './seedData';

/* ──────────────────────────────────────────────────
   Known Level-1 prerequisite courses that are
   intentionally absent from COURSES_DB.
   Students complete them BEFORE reaching Level 2.
──────────────────────────────────────────────────── */
const KNOWN_EXTERNAL_PREREQS = new Set([
  'Zoo 101', 'Zoo 102',   // First-year Zoology
  'Bot 100',              // First-year Botany
  'Chm 105',              // First-year Chemistry
  'Mat 101',              // First-year Mathematics
  'Com 102',              // First-year Computer Science
  'Phy 101', 'Phy 102',  // First-year Physics
]);

/* ──────────────────────────────────────────────────
   All programs that SHOULD exist per Benha
   Faculty of Science 2021 By-law PDF.
   Flag any not yet in FACULTY_DATA.
──────────────────────────────────────────────────── */
const EXPECTED_PROGRAMS: Array<{ id: string; nameAr: string; nameEn: string }> = [
  { id: 'biotech',          nameAr: 'برنامج التكنولوجيا الحيوية',          nameEn: 'Biotechnology Program' },
  { id: 'zoology_ecology',  nameAr: 'برنامج علم الحيوان والبيئة',          nameEn: 'Zoology & Ecology Program' },
  { id: 'chemistry',        nameAr: 'برنامج الكيمياء',                       nameEn: 'Chemistry Program' },
  { id: 'physics',          nameAr: 'برنامج الفيزياء',                       nameEn: 'Physics Program' },
  { id: 'mathematics',      nameAr: 'برنامج الرياضيات',                      nameEn: 'Mathematics Program' },
  { id: 'computer_science', nameAr: 'برنامج علوم الحاسب',                   nameEn: 'Computer Science Program' },
  { id: 'botany_micro',     nameAr: 'برنامج النبات والميكروبيولوجي',         nameEn: 'Botany & Microbiology Program' },
  { id: 'geology',          nameAr: 'برنامج الجيولوجيا',                     nameEn: 'Geology Program' },
  { id: 'biophysics',       nameAr: 'برنامج الفيزياء الحيوية',               nameEn: 'Biophysics Program' },
];

/* ──────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────── */
export interface OrphanedCodeIssue {
  dept: string;
  level: number;
  semester: number;
  slotType: 'compulsory' | 'elective' | 'free';
  code: string;
}

export interface BrokenPrereqIssue {
  courseCode: string;
  prerequisite: string;
  isKnownExternal: boolean;
}

export interface MissingProgramIssue {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface TermSummaryRow {
  dept: string;
  level: number;
  semester: number;
  compulsory: number;
  electives: number;
  free: number;
  totalCodes: number;
  compulsoryCr: number;
}

export interface ValidationReport {
  orphanedCodes: OrphanedCodeIssue[];
  brokenPrereqs: BrokenPrereqIssue[];
  externalPrereqs: BrokenPrereqIssue[];
  missingPrograms: MissingProgramIssue[];
  termSummary: TermSummaryRow[];
  stats: {
    totalPrograms: number;
    totalCourses: number;
    totalTermSlots: number;
    totalCompulsoryCr: number;
    passed: boolean;
  };
}

/* ──────────────────────────────────────────────────
   Main validator
──────────────────────────────────────────────────── */
export function validateDatabase(): ValidationReport {
  const orphanedCodes: OrphanedCodeIssue[] = [];
  const brokenPrereqs: BrokenPrereqIssue[] = [];
  const externalPrereqs: BrokenPrereqIssue[] = [];
  const termSummary: TermSummaryRow[] = [];

  /* ── 1. Orphaned code check ────────────────────── */
  for (const dept of FACULTY_DATA.departments) {
    for (const level of dept.levels) {
      for (const sem of level.semesters) {
        const checkIds = (ids: string[], slotType: 'compulsory' | 'elective' | 'free') => {
          for (const code of ids) {
            if (!COURSES_DB[code]) {
              orphanedCodes.push({
                dept: dept.id,
                level: level.levelId,
                semester: sem.semesterId,
                slotType,
                code,
              });
            }
          }
        };
        checkIds(sem.compulsoryCourseIds, 'compulsory');
        checkIds(sem.electiveCourseIds, 'elective');
        checkIds(sem.freeOptionalCourseIds, 'free');

        /* ── 4. Term summary row ── */
        const resolvedCompulsory = sem.compulsoryCourseIds.filter((id) => COURSES_DB[id]);
        const compulsoryCr = resolvedCompulsory.reduce((s, id) => s + (COURSES_DB[id]?.credits ?? 0), 0);
        termSummary.push({
          dept: dept.id,
          level: level.levelId,
          semester: sem.semesterId,
          compulsory: sem.compulsoryCourseIds.length,
          electives: sem.electiveCourseIds.length,
          free: sem.freeOptionalCourseIds.length,
          totalCodes: sem.compulsoryCourseIds.length + sem.electiveCourseIds.length + sem.freeOptionalCourseIds.length,
          compulsoryCr,
        });
      }
    }
  }

  /* ── 2. Prerequisite check ─────────────────────── */
  for (const [_key, course] of Object.entries(COURSES_DB)) {
    if (!course.prerequisite) continue;
    const prereq = course.prerequisite;
    if (!COURSES_DB[prereq]) {
      const isExternal = KNOWN_EXTERNAL_PREREQS.has(prereq);
      const issue: BrokenPrereqIssue = { courseCode: course.code, prerequisite: prereq, isKnownExternal: isExternal };
      if (isExternal) {
        externalPrereqs.push(issue);
      } else {
        brokenPrereqs.push(issue);
      }
    }
  }

  /* ── 3. Missing programs ───────────────────────── */
  const presentIds = new Set(FACULTY_DATA.departments.map((d) => d.id));
  const missingPrograms: MissingProgramIssue[] = EXPECTED_PROGRAMS
    .filter((p) => !presentIds.has(p.id))
    .map((p) => ({ id: p.id, nameAr: p.nameAr, nameEn: p.nameEn }));

  /* ── 5. Stats ──────────────────────────────────── */
  const totalCourses = Object.keys(COURSES_DB).length;
  const totalTermSlots = termSummary.reduce((s, r) => s + r.totalCodes, 0);
  const totalCompulsoryCr = termSummary.reduce((s, r) => s + r.compulsoryCr, 0);
  const passed = orphanedCodes.length === 0 && brokenPrereqs.length === 0;

  const stats = {
    totalPrograms: FACULTY_DATA.departments.length,
    totalCourses,
    totalTermSlots,
    totalCompulsoryCr,
    passed,
  };

  /* ── Console output ────────────────────────────── */
  _printReport({ orphanedCodes, brokenPrereqs, externalPrereqs, missingPrograms, termSummary, stats });

  return { orphanedCodes, brokenPrereqs, externalPrereqs, missingPrograms, termSummary, stats };
}

/* ──────────────────────────────────────────────────
   Pretty-print the report to the browser console
──────────────────────────────────────────────────── */
function _printReport(r: ValidationReport) {
  const PASS  = '✅';
  const FAIL  = '❌';
  const WARN  = '⚠️';
  const INFO  = '🔷';

  const banner = [
    '╔════════════════════════════════════════════════════════╗',
    '║   Termly · seedData Integrity Validator                ║',
    '║   Benha University 2021 By-law · Faculty of Science    ║',
    '╚════════════════════════════════════════════════════════╝',
  ].join('\n');

  console.group('%cTermly DB Validator', 'font-size:14px;font-weight:900;color:#22D3EE');
  console.log(`%c${banner}`, 'color:#60A5FA;font-family:monospace');

  /* ── 1. Orphaned codes ── */
  console.group(`${r.orphanedCodes.length === 0 ? PASS : FAIL} Check 1 — Orphaned Course Codes`);
  if (r.orphanedCodes.length === 0) {
    console.log('%c  All semester course IDs resolve to valid COURSES_DB entries.', 'color:#4ADE80');
  } else {
    console.error(`  ${FAIL} ${r.orphanedCodes.length} orphaned code(s) found!`);
    console.table(r.orphanedCodes);
  }
  console.groupEnd();

  /* ── 2. Broken prerequisites ── */
  const hasBroken = r.brokenPrereqs.length > 0;
  console.group(`${hasBroken ? FAIL : PASS} Check 2 — Prerequisite Integrity`);
  if (hasBroken) {
    console.error(`  ${FAIL} ${r.brokenPrereqs.length} UNKNOWN prerequisite reference(s) — these are NOT Level-1 courses:`);
    console.table(r.brokenPrereqs.map((b) => ({ course: b.courseCode, missingPrereq: b.prerequisite })));
  } else {
    console.log('%c  No unknown broken prerequisites.', 'color:#4ADE80');
  }
  console.log(
    `%c  ${INFO} ${r.externalPrereqs.length} Level-1 external prerequisites (expected — students complete before Level 2):`,
    'color:#94a3b8',
  );
  const uniqueExternal = [...new Set(r.externalPrereqs.map((e) => e.prerequisite))].join(', ');
  console.log(`%c     ${uniqueExternal}`, 'color:#64748b;font-style:italic');
  console.groupEnd();

  /* ── 3. Missing programs ── */
  console.group(`${r.missingPrograms.length === 0 ? PASS : WARN} Check 3 — By-law Programme Coverage`);
  const presentCount = EXPECTED_PROGRAMS.length - r.missingPrograms.length;
  console.log(`  Programs present: ${presentCount} / ${EXPECTED_PROGRAMS.length}`);
  if (r.missingPrograms.length > 0) {
    console.warn(`  ${WARN} ${r.missingPrograms.length} program(s) from the PDF bylaws are NOT YET in the database:`);
    console.table(r.missingPrograms.map((m) => ({
      id: m.id,
      'Name (EN)': m.nameEn,
      'Name (AR)': m.nameAr,
      Status: '🚧 Pending — append seedData',
    })));
  } else {
    console.log('%c  Full programme coverage achieved!', 'color:#4ADE80');
  }
  console.groupEnd();

  /* ── 4. Term-by-term summary ── */
  console.group(`${INFO} Check 4 — Term-by-Term Course Load Summary`);
  console.table(
    r.termSummary.map((row) => ({
      Program: row.dept,
      'Level': `L${row.level}`,
      'Sem': `S${row.semester}`,
      'Compulsory (#)': row.compulsory,
      'Compulsory Cr': row.compulsoryCr,
      'Electives (#)': row.electives,
      'Free (#)': row.free,
      'Total Codes': row.totalCodes,
    })),
  );
  console.groupEnd();

  /* ── Final verdict ── */
  const verdictStyle = r.stats.passed
    ? 'background:#052e16;color:#4ADE80;font-weight:900;font-size:13px;padding:6px 14px;border-radius:6px'
    : 'background:#450a0a;color:#F87171;font-weight:900;font-size:13px;padding:6px 14px;border-radius:6px';
  const verdictMsg = r.stats.passed
    ? `${PASS} DATABASE INTEGRITY: 100% PASSED`
    : `${FAIL} DATABASE INTEGRITY: ISSUES FOUND — see errors above`;

  console.log('');
  console.log('%c' + verdictMsg, verdictStyle);
  console.log('');
  console.table({
    'Total Programs (in DB)':  r.stats.totalPrograms,
    'Total Courses (COURSES_DB)': r.stats.totalCourses,
    'Total Semester Slots':    r.stats.totalTermSlots,
    'Total Compulsory Cr Hours': r.stats.totalCompulsoryCr,
    'Orphaned Codes':          r.orphanedCodes.length,
    'Unknown Prereqs':         r.brokenPrereqs.length,
    'Missing Programs':        r.missingPrograms.length,
    'External (L1) Prereqs':   r.externalPrereqs.length,
  });

  console.groupEnd();
}
