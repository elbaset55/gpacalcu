---
name: Termly Course Wizard
description: Architecture and constraints for the Course Selection & Registration Wizard feature
---

# Course Wizard

## Location
`src/components/gpa/CourseWizard.tsx` — standalone component, no server calls.

## Integration points
- Added as tab `"wizard"` in `GPAAdvisorApp.tsx` Planner function (TABS array, tab render)
- Tab only appears when `isBenha === true` (Benha University scale selected)
- Tab icon `ClipboardList` added to `TermlyAppShell.tsx` TAB_ICONS
- Nav label `wizard: { ar: "تسجيل المقررات", en: "Course Wizard" }` in NAV_LABELS

## Data source
Uses `BENHA_PROGRAMS` from `src/data/benha-programs.ts` — no server calls, pure client-side.
Level 1 courses hard-coded from `UNIVERSITY_COURSES` + `COLLEGE_L1_NATURAL`.

## CSS variable constraints
Only use CSS vars defined in styles.css:
- `--gpa-surface-alpha-06`, `--gpa-surface-alpha-08` (NOT 04)
- `--gpa-danger-15`, `--gpa-danger-33`, `--gpa-danger-55` (NOT 12 or 40)
- `--gpa-accent-15` through `--gpa-accent-55` (all exist)
- `--gpa-bg-glass` does NOT exist — use `--gpa-card` instead

## Business rules
- Load limit: GPA < 2.0 → 12 cr; earned ≥ 100 + GPA ≥ 2.0 → 22 cr; GPA ≥ 3.333 → 20 cr; else 18 cr
- Summer: max 9 cr; retakes from history (grade < 2.0) + future electives from next level
- Compulsory courses auto-selected and locked (cannot uncheck)
- Soft credit overload allowed up to +3 cr with warning displayed
