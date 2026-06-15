// Editable review screen for AI-extracted transcript (Phase 1 + Phase 2 output).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import type { Grade, ReviewSem, ReviewCourse } from "@/lib/transcript-normalize";

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

export function TranscriptReview({
  initial,
  warnings,
  grades,
  lang,
  busy,
  onConfirm,
  onCancel,
}: {
  initial: ReviewSem[];
  warnings: string[];
  grades: Grade[];
  lang: string;
  busy: boolean;
  onConfirm: (sems: ReviewSem[]) => void;
  onCancel: () => void;
}) {
  const ar = lang !== "en";
  const dir = ar ? "rtl" : "ltr";
  const [sems, setSems] = useState<ReviewSem[]>(initial);

  const computed = useMemo(() => {
    let credits = 0,
      pts = 0,
      count = 0;
    for (const s of sems)
      for (const c of s.courses) {
        count++;
        if (c.grade_pts == null) continue;
        credits += c.credits;
        pts += c.credits * c.grade_pts;
      }
    return { credits, cgpa: credits ? +(pts / credits).toFixed(3) : 0, count };
  }, [sems]);

  const mutate = (semId: string, cId: string, patch: Partial<ReviewCourse>) =>
    setSems((prev) =>
      prev.map((s) =>
        s.id !== semId ? s : { ...s, courses: s.courses.map((c) => (c.id === cId ? { ...c, ...patch } : c)) },
      ),
    );

  const setGrade = (semId: string, cId: string, val: string) => {
    if (val === "__none") return mutate(semId, cId, { grade_letter: null, grade_pts: null, is_failed: false });
    const g = grades.find((x) => x.en === val);
    if (g) mutate(semId, cId, { grade_letter: ar ? g.ar : g.en, grade_pts: g.pts, is_failed: g.pts === 0 });
  };

  const removeCourse = (semId: string, cId: string) =>
    setSems((prev) => prev.map((s) => (s.id !== semId ? s : { ...s, courses: s.courses.filter((c) => c.id !== cId) })));

  const removeSem = (semId: string) => setSems((prev) => prev.filter((s) => s.id !== semId));

  const setSemLabel = (semId: string, label: string) =>
    setSems((prev) => prev.map((s) => (s.id === semId ? { ...s, label } : s)));

  const card: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  };
  const inp: React.CSSProperties = {
    background: "var(--gpa-surface-alpha-06)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 8,
    color: "var(--gpa-text-strong)",
    padding: "7px 9px",
    fontSize: 12,
    fontFamily: FONT,
    outline: "none",
    boxSizing: "border-box",
  };

  const finalSems = sems.filter((s) => s.courses.length > 0);

  return (
    <div
      dir={dir}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--gpa-overlay-bg, rgba(5,5,18,.86))",
        zIndex: 9998,
        overflowY: "auto",
        padding: "20px 12px",
        fontFamily: FONT,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ ...card, position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--gpa-accent)" }}>
                📝 {ar ? "مراجعة المواد المستخرَجة" : "Review Extracted Courses"}
              </div>
              <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", marginTop: 3 }}>
                {ar
                  ? "عدّل الأسماء والساعات والتقديرات قبل الحفظ"
                  : "Edit names, credits and grades before saving"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <span style={{ color: "var(--gpa-text-muted)" }}>
                {ar ? "مواد" : "Courses"}: <b style={{ color: "var(--gpa-text-strong)" }}>{computed.count}</b>
              </span>
              <span style={{ color: "var(--gpa-text-muted)" }}>
                {ar ? "ساعات" : "Credits"}: <b style={{ color: "var(--gpa-text-strong)" }}>{computed.credits}</b>
              </span>
              <span style={{ color: "var(--gpa-text-muted)" }}>
                GPA: <b style={{ color: "var(--gpa-accent)" }}>{computed.cgpa.toFixed(2)}</b>
              </span>
            </div>
          </div>
        </div>

        {warnings.length > 0 && (
          <div
            style={{
              background: "var(--gpa-danger-15)",
              border: "1px solid var(--gpa-danger-55)",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            {warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--gpa-danger)", marginBottom: i < warnings.length - 1 ? 4 : 0 }}>
                ⚠️ {w}
              </div>
            ))}
          </div>
        )}

        {finalSems.length === 0 && (
          <div style={{ ...card, textAlign: "center", color: "var(--gpa-text-faint)", fontSize: 13 }}>
            {ar ? "لا توجد مواد. ارجع وارفع مستند أوضح." : "No courses. Go back and upload a clearer document."}
          </div>
        )}

        {sems.map((s) => (
          <div key={s.id} style={card}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <input value={s.label} onChange={(e) => setSemLabel(s.id, e.target.value)} style={{ ...inp, flex: 1, fontWeight: 700 }} />
              <span style={{ fontSize: 10, color: "var(--gpa-text-faintest)", whiteSpace: "nowrap" }}>
                {ar ? `المستوى ${s.level}` : `Level ${s.level}`}
              </span>
              <button
                onClick={() => removeSem(s.id)}
                style={{ background: "transparent", border: "none", color: "var(--gpa-danger)", cursor: "pointer", fontSize: 16 }}
              >
                🗑
              </button>
            </div>
            {s.courses.map((c) => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 52px 78px 26px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input
                  value={c.name}
                  onChange={(e) => mutate(s.id, c.id, { name: e.target.value })}
                  style={{ ...inp, borderColor: c.retake ? "var(--gpa-accent2-44, #6366f166)" : "var(--gpa-border)" }}
                  title={c.retake ? (ar ? "مادة معادة ♻" : "Retake ♻") : ""}
                />
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={c.credits}
                  onChange={(e) => mutate(s.id, c.id, { credits: parseInt(e.target.value) || 0 })}
                  style={{ ...inp, textAlign: "center" }}
                />
                <select value={grades.find((g) => g.pts === c.grade_pts)?.en ?? "__none"} onChange={(e) => setGrade(s.id, c.id, e.target.value)} style={inp}>
                  <option value="__none">—</option>
                  {grades.map((g) => (
                    <option key={g.en} value={g.en}>
                      {ar ? g.ar : g.en} ({g.pts.toFixed(2)})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeCourse(s.id, c.id)}
                  style={{ background: "transparent", border: "none", color: "var(--gpa-text-faint)", cursor: "pointer", fontSize: 14 }}
                >
                  ✕
                </button>
              </div>
            ))}
            {s.courses.some((c) => c.retake) && (
              <div style={{ fontSize: 10, color: "var(--gpa-accent-2-soft)", marginTop: 4 }}>
                ♻ {ar ? "مواد بإطار ملوّن = معادة (التقدير الأحدث يُحتسب)" : "Colored border = retake (newest grade counts)"}
              </div>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, position: "sticky", bottom: 0, paddingTop: 4, paddingBottom: 8 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px",
              background: "var(--gpa-surface-alpha-06)",
              border: "1px solid var(--gpa-border)",
              borderRadius: 10,
              color: "var(--gpa-text-muted)",
              fontSize: 13,
              fontFamily: FONT,
              cursor: "pointer",
            }}
          >
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={() => onConfirm(finalSems)}
            disabled={busy || finalSems.length === 0}
            style={{
              flex: 2,
              padding: "12px",
              background: "var(--gpa-accent)",
              border: "none",
              borderRadius: 10,
              color: "var(--gpa-bg)",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: FONT,
              cursor: busy ? "wait" : "pointer",
              opacity: busy || finalSems.length === 0 ? 0.6 : 1,
            }}
          >
            {busy ? (ar ? "جاري الحفظ..." : "Saving...") : ar ? "✅ حفظ المواد في التطبيق" : "✅ Save courses to app"}
          </button>
        </div>
      </div>
    </div>
  );
}
