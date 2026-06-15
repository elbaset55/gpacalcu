import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, saveProfile, deleteAccount } from "@/lib/profile.functions";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";
import { Logo } from "@/components/gpa/Logo";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const FONT = "'Cairo','Manrope','Noto Sans Arabic',sans-serif";

const SCALE_SYSTEMS = [
  { id: "benha", labelAr: "جامعة بنها — لائحة 2021", labelEn: "Benha Univ. — 2021 Scale", isBenha: true },
  { id: "generic", labelAr: "جامعات أخرى (نظام 4.0)", labelEn: "Other Universities (4.0 Scale)", isBenha: false },
];
const SEMESTERS_AR = ["الفصل الأول", "الفصل الثاني", "الفصل الصيفي"];
const SEMESTERS_EN = ["First Semester", "Second Semester", "Summer Term"];
const SEMESTER_VALS = ["1", "2", "s"];
const LEVELS_AR = ["المستوى الأول (1-30 ساعة)", "المستوى الثاني (31-64 ساعة)", "المستوى الثالث (65-100 ساعة)", "المستوى الرابع (101+ ساعة)"];
const LEVELS_EN = ["Freshman (1–30 cr)", "Sophomore (31–64 cr)", "Junior (65–100 cr)", "Senior (101+ cr)"];
const GRAD_TARGETS = [2.0, 2.5, 3.0, 3.5, 3.667];
const GRAD_LABELS_AR = ["مقبول (2.0)", "جيد (2.5)", "جيد جداً (3.0)", "ممتاز (3.5)", "ممتاز+ (3.667+)"];
const GRAD_LABELS_EN = ["Pass (2.0)", "Good (2.5)", "Very Good (3.0)", "Excellent (3.5)", "Excellent+ (3.667+)"];

const T = {
  ar: {
    title: "الإعدادات",
    back: "العودة",
    langSection: "اللغة",
    scaleLabel: "نظام التقدير",
    academic: "المعلومات الأكاديمية",
    uniLabel: "اسم الجامعة / الكلية",
    uniPlaceholder: "مثال: جامعة بنها · كلية العلوم",
    majorLabel: "التخصص / القسم",
    majorPlaceholder: "مثال: التقنية الحيوية",
    optional: "اختياري",
    totalReqLabel: "عدد ساعات التخرج",
    totalReqPlaceholder: "مثال: 128",
    benhaNote: "عدد الساعات محدد تلقائياً بـ 136 ساعة (لائحة بنها)",
    standing: "وضعك الأكاديمي",
    gpaLabel: "المعدل التراكمي الحالي",
    crLabel: "الساعات المعتمدة المكتسبة",
    levelLabel: "مستواك الأكاديمي",
    semLabel: "الفصل الدراسي القادم",
    gradTargetLabel: "المعدل المستهدف للتخرج",
    hasFailed: "سبق لي الرسوب في مادة",
    save: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    saved: "✓ تم الحفظ بنجاح",
    errGpa: "المعدل يجب أن يكون بين 0 و4",
    errCr: "أدخل رقماً صحيحاً موجباً",
    errTotalReq: "أدخل عدد الساعات (60–300)",
    account: "الحساب",
    logout: "تسجيل الخروج",
    danger: "منطقة خطر",
    deleteWarn: "سيتم حذف جميع بياناتك (الفصول، المواد، التاريخ) ولا يمكن التراجع.",
    confirmText: "اكتب DELETE للتأكيد",
    deleteBtn: "حذف نهائي",
    deleted: "✓ تم حذف الحساب",
    err: "حدث خطأ",
    loading: "جاري...",
  },
  en: {
    title: "Settings",
    back: "Back",
    langSection: "Language",
    scaleLabel: "Grading scale",
    academic: "University info",
    uniLabel: "University / Faculty",
    uniPlaceholder: "e.g. Benha University · Faculty of Science",
    majorLabel: "Major / Department",
    majorPlaceholder: "e.g. Biotechnology",
    optional: "optional",
    totalReqLabel: "Credits to graduate",
    totalReqPlaceholder: "e.g. 128",
    benhaNote: "Graduation credits auto-set to 136 (Benha regulation)",
    standing: "Academic standing",
    gpaLabel: "Current cumulative GPA",
    crLabel: "Credits earned so far",
    levelLabel: "Academic level",
    semLabel: "Upcoming semester",
    gradTargetLabel: "Target graduation GPA",
    hasFailed: "I've previously failed a course",
    save: "Save changes",
    saving: "Saving...",
    saved: "✓ Saved successfully",
    errGpa: "GPA must be between 0 and 4",
    errCr: "Enter a valid positive number",
    errTotalReq: "Enter credits required (60–300)",
    account: "Account",
    logout: "Sign out",
    danger: "Danger zone",
    deleteWarn: "All your data (semesters, courses, history) will be permanently deleted.",
    confirmText: "Type DELETE to confirm",
    deleteBtn: "Delete forever",
    deleted: "✓ Account deleted",
    err: "An error occurred",
    loading: "Loading...",
  },
} as const;

function closestGradIdx(val: number) {
  let best = 0, bestDist = Math.abs(GRAD_TARGETS[0] - val);
  for (let i = 1; i < GRAD_TARGETS.length; i++) {
    const d = Math.abs(GRAD_TARGETS[i] - val);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

function ProfilePage() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const saveProfileFn = useServerFn(saveProfile);
  const deleteAccountFn = useServerFn(deleteAccount);
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const t = T[lang];

  const [loaded, setLoaded] = useState(false);
  const [scaleId, setScaleId] = useState("benha");
  const [uniName, setUniName] = useState("");
  const [major, setMajor] = useState("");
  const [customTotalReq, setCustomTotalReq] = useState("");
  const [prevGpa, setPrevGpa] = useState("");
  const [prevCr, setPrevCr] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [semester, setSemester] = useState("1");
  const [hasFailed, setHasFailed] = useState(false);
  const [gradTargetIdx, setGradTargetIdx] = useState(2);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getProfileFn().then((p) => {
      setLoaded(true);
      if (!p) return;
      setScaleId(p.scale_id ?? "benha");
      setUniName(p.uni_name ?? "");
      setMajor(p.major ?? "");
      setCustomTotalReq(p.is_benha ? "" : String(p.total_req ?? ""));
      setPrevGpa(p.prev_gpa != null ? String(p.prev_gpa) : "");
      setPrevCr(p.prev_cr != null ? String(p.prev_cr) : "");
      setCurrentLevel(p.current_level ?? 1);
      setSemester(p.semester ?? "1");
      setHasFailed(p.has_failed ?? false);
      setGradTargetIdx(closestGradIdx(p.grad_target ?? 3.0));
    }).catch(() => setLoaded(true));
  }, []);

  const flash = (text: string, kind: "ok" | "err" = "ok") => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const scale = SCALE_SYSTEMS.find((s) => s.id === scaleId)!;
    const g = parseFloat(prevGpa);
    if (isNaN(g) || g < 0 || g > 4) { flash(t.errGpa, "err"); return; }
    const c = parseInt(prevCr);
    if (isNaN(c) || c < 0) { flash(t.errCr, "err"); return; }
    const totalReq = scale.isBenha ? 136 : parseInt(customTotalReq);
    if (!scale.isBenha && (isNaN(totalReq) || totalReq < 60 || totalReq > 300)) {
      flash(t.errTotalReq, "err"); return;
    }
    setSaving(true);
    try {
      await saveProfileFn({
        data: {
          lang,
          scale_id: scaleId,
          is_benha: scale.isBenha,
          total_req: scale.isBenha ? 136 : totalReq,
          uni_name: uniName,
          major,
          prev_gpa: g,
          prev_cr: c,
          semester: semester || "1",
          has_failed: hasFailed,
          min_prev_sem_gpa: g,
          grad_target: GRAD_TARGETS[gradTargetIdx],
          current_level: currentLevel,
        },
      });
      flash(t.saved);
    } catch (e: any) {
      flash(e?.message ?? t.err, "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAccountFn();
      flash(t.deleted);
      setTimeout(() => { window.location.href = "/api/auth/logout"; }, 900);
    } catch (e: any) {
      flash(e?.message ?? t.err, "err");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Shared styles ───────────────────────────────── */
  const inp: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 10,
    color: "var(--gpa-text-strong)",
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: FONT,
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s",
  };
  const lbl: React.CSSProperties = {
    fontSize: 11,
    color: "var(--gpa-text-faint)",
    marginBottom: 5,
    display: "block",
    letterSpacing: ".4px",
    textTransform: "uppercase",
  };
  const card: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 16,
    padding: "18px 18px",
    marginBottom: 14,
  };
  const secTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    color: "var(--gpa-text-faint)",
    letterSpacing: ".6px",
    textTransform: "uppercase",
    margin: "0 0 14px",
  };

  const chip = (active: boolean, danger = false): React.CSSProperties => ({
    padding: "9px 14px",
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    background: active
      ? (danger ? "var(--gpa-danger-15)" : "var(--gpa-accent-12)")
      : "var(--gpa-surface-alpha-06)",
    border: `1.5px solid ${active
      ? (danger ? "var(--gpa-danger-33)" : "var(--gpa-accent-55)")
      : "var(--gpa-border)"}`,
    borderRadius: 10,
    color: active
      ? (danger ? "var(--gpa-danger)" : "var(--gpa-accent)")
      : "var(--gpa-text-faint)",
    cursor: "pointer",
    transition: "all 0.14s",
    flexShrink: 0,
  });

  const scale = SCALE_SYSTEMS.find((s) => s.id === scaleId)!;

  return (
    <div dir={dir} style={{ fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh", paddingBottom: 60 }}>

      {/* Sticky header */}
      <div style={{
        background: "var(--gpa-card)",
        borderBottom: "1px solid var(--gpa-border)",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}>
        <button
          onClick={() => navigate({ to: "/app" })}
          style={{ background: "none", border: "none", color: "var(--gpa-text-faint)", fontSize: 13, fontFamily: FONT, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: 5 }}
        >
          {ar ? "→" : "←"} {t.back}
        </button>
        <Logo height={24} />
        <div style={{ display: "flex", gap: 8 }}>
          <LangSwitcher lang={lang} onChange={setLang} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "22px 16px" }}>
        <h1 style={{ margin: "0 0 22px", fontSize: 21, fontWeight: 900, color: "var(--gpa-text-strong)" }}>
          ⚙️ {t.title}
        </h1>

        {/* Flash */}
        {msg && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16,
            background: msg.kind === "ok" ? "var(--gpa-accent-12)" : "var(--gpa-danger-15)",
            border: `1px solid ${msg.kind === "ok" ? "var(--gpa-accent-44)" : "var(--gpa-danger-33)"}`,
            color: msg.kind === "ok" ? "var(--gpa-accent)" : "var(--gpa-danger)",
          }}>
            {msg.text}
          </div>
        )}

        {!loaded && (
          <div style={{ textAlign: "center", padding: 48, color: "var(--gpa-text-faint)", fontSize: 13, opacity: .6 }}>
            ···
          </div>
        )}

        {loaded && (
          <form onSubmit={handleSave}>

            {/* ── Language ──────────────────────────────── */}
            <div style={card}>
              <p style={secTitle}>{t.langSection}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {(["ar", "en"] as const).map((l) => (
                  <button key={l} type="button" onClick={() => setLang(l)} style={chip(lang === l)}>
                    {l === "ar" ? "العربية 🇪🇬" : "English 🇬🇧"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Grading scale ─────────────────────────── */}
            <div style={card}>
              <p style={secTitle}>{t.scaleLabel}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SCALE_SYSTEMS.map((s) => {
                  const active = scaleId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScaleId(s.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 11,
                        padding: "11px 14px",
                        fontFamily: FONT, fontSize: 13,
                        background: active ? "var(--gpa-accent-12)" : "var(--gpa-surface-alpha-06)",
                        border: `2px solid ${active ? "var(--gpa-accent-55)" : "var(--gpa-border)"}`,
                        borderRadius: 11,
                        color: active ? "var(--gpa-accent)" : "var(--gpa-text-faint)",
                        cursor: "pointer", textAlign: "start", width: "100%",
                        fontWeight: active ? 700 : 500, transition: "all 0.14s",
                      }}
                    >
                      <span style={{
                        width: 15, height: 15, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${active ? "var(--gpa-accent)" : "var(--gpa-border)"}`,
                        background: active ? "var(--gpa-accent)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gpa-bg)", display: "block" }} />}
                      </span>
                      {ar ? s.labelAr : s.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── University info ───────────────────────── */}
            <div style={card}>
              <p style={secTitle}>{t.academic}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div>
                  <label style={lbl}>
                    {t.uniLabel}{" "}
                    <span style={{ textTransform: "none", fontWeight: 400 }}>({t.optional})</span>
                  </label>
                  <input value={uniName} onChange={(e) => setUniName(e.target.value)}
                    placeholder={t.uniPlaceholder} style={inp} maxLength={200} />
                </div>
                <div>
                  <label style={lbl}>
                    {t.majorLabel}{" "}
                    <span style={{ textTransform: "none", fontWeight: 400 }}>({t.optional})</span>
                  </label>
                  <input value={major} onChange={(e) => setMajor(e.target.value)}
                    placeholder={t.majorPlaceholder} style={inp} maxLength={200} />
                </div>
                {scale.isBenha ? (
                  <div style={{
                    background: "var(--gpa-accent-10)", border: "1px solid var(--gpa-accent-25)",
                    borderRadius: 9, padding: "9px 13px", fontSize: 12,
                    color: "var(--gpa-accent)", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    🎓 {t.benhaNote}
                  </div>
                ) : (
                  <div>
                    <label style={lbl}>{t.totalReqLabel}</label>
                    <input type="number" min={60} max={300}
                      value={customTotalReq} onChange={(e) => setCustomTotalReq(e.target.value)}
                      placeholder={t.totalReqPlaceholder} style={inp} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Academic standing ─────────────────────── */}
            <div style={card}>
              <p style={secTitle}>{t.standing}</p>

              {/* GPA + credits */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>{t.gpaLabel}</label>
                  <input type="number" step="0.001" min={0} max={4}
                    value={prevGpa} onChange={(e) => setPrevGpa(e.target.value)}
                    placeholder="0.00 – 4.00" style={inp} />
                </div>
                <div>
                  <label style={lbl}>{t.crLabel}</label>
                  <input type="number" min={0} max={500}
                    value={prevCr} onChange={(e) => setPrevCr(e.target.value)}
                    placeholder={ar ? "مثال: 48" : "e.g. 48"} style={inp} />
                </div>
              </div>

              {/* Level */}
              <label style={{ ...lbl, marginBottom: 8 }}>{t.levelLabel}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 13 }}>
                {[1, 2, 3, 4].map((lvl) => (
                  <button key={lvl} type="button" onClick={() => setCurrentLevel(lvl)}
                    style={{ ...chip(currentLevel === lvl), fontSize: 12 }}>
                    {ar ? LEVELS_AR[lvl - 1] : LEVELS_EN[lvl - 1]}
                  </button>
                ))}
              </div>

              {/* Semester */}
              <label style={{ ...lbl, marginBottom: 8 }}>{t.semLabel}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 13 }}>
                {SEMESTER_VALS.map((v, i) => (
                  <button key={v} type="button" onClick={() => setSemester(v)}
                    style={{ ...chip(semester === v), fontSize: 12 }}>
                    {ar ? SEMESTERS_AR[i] : SEMESTERS_EN[i]}
                  </button>
                ))}
              </div>

              {/* Grad target */}
              <label style={{ ...lbl, marginBottom: 8 }}>{t.gradTargetLabel}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 13 }}>
                {GRAD_TARGETS.map((_, i) => (
                  <button key={i} type="button" onClick={() => setGradTargetIdx(i)}
                    style={{
                      ...chip(gradTargetIdx === i),
                      display: "flex", alignItems: "center", gap: 10,
                      textAlign: "start", width: "100%",
                    }}>
                    <span style={{ fontSize: 15 }}>
                      {["⚠️", "👍", "⭐", "🏅", "🏆"][i]}
                    </span>
                    {ar ? GRAD_LABELS_AR[i] : GRAD_LABELS_EN[i]}
                  </button>
                ))}
              </div>

              {/* Has failed */}
              <button type="button" onClick={() => setHasFailed((v) => !v)}
                style={{
                  ...chip(hasFailed, true),
                  display: "flex", alignItems: "center", gap: 10,
                  textAlign: "start", width: "100%",
                }}>
                <span style={{
                  width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                  border: `2px solid ${hasFailed ? "var(--gpa-danger)" : "var(--gpa-border)"}`,
                  background: hasFailed ? "var(--gpa-danger)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {hasFailed && <span style={{ color: "white", fontSize: 9, fontWeight: 900 }}>✓</span>}
                </span>
                {t.hasFailed}
              </button>
            </div>

            {/* Save */}
            <button type="submit" disabled={saving}
              style={{
                display: "block", width: "100%",
                padding: 14,
                background: "var(--gpa-accent)",
                border: "none", borderRadius: 12,
                color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: FONT,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                marginBottom: 24, transition: "opacity 0.14s",
              }}>
              {saving ? t.saving : t.save}
            </button>
          </form>
        )}

        {/* ── Account ───────────────────────────────────── */}
        <div style={card}>
          <p style={secTitle}>{t.account}</p>
          <button
            onClick={() => { window.location.href = "/api/auth/logout"; }}
            style={{
              display: "block", width: "100%", padding: "11px 14px",
              background: "var(--gpa-surface-alpha-06)",
              border: "1px solid var(--gpa-border)", borderRadius: 10,
              color: "var(--gpa-text-faint)", fontSize: 14, fontWeight: 600,
              fontFamily: FONT, cursor: "pointer", transition: "all 0.14s",
            }}>
            🚪 {t.logout}
          </button>
        </div>

        {/* ── Danger zone ───────────────────────────────── */}
        <div style={{ ...card, borderColor: "var(--gpa-danger-33)" }}>
          <p style={{ ...secTitle, color: "var(--gpa-danger)" }}>⚠️ {t.danger}</p>
          <p style={{ fontSize: 12, color: "var(--gpa-text-faint)", margin: "0 0 12px", lineHeight: 1.7 }}>
            {t.deleteWarn}
          </p>
          <input type="text" placeholder={t.confirmText}
            value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
            style={{ ...inp, marginBottom: 8 }} />
          <button
            onClick={handleDelete}
            disabled={deleteConfirm !== "DELETE" || deleting}
            style={{
              display: "block", width: "100%", padding: 12,
              background: deleteConfirm === "DELETE" ? "var(--gpa-danger-15)" : "var(--gpa-surface-alpha-06)",
              border: `1px solid ${deleteConfirm === "DELETE" ? "var(--gpa-danger)" : "var(--gpa-border)"}`,
              borderRadius: 10,
              color: deleteConfirm === "DELETE" ? "var(--gpa-danger)" : "var(--gpa-text-faint)",
              fontSize: 14, fontWeight: 700, fontFamily: FONT,
              cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
              transition: "all 0.14s",
            }}>
            {deleting ? t.loading : `🗑 ${t.deleteBtn}`}
          </button>
        </div>
      </div>
    </div>
  );
}
