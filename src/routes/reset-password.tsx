import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    title: "تعيين كلمة مرور جديدة",
    sub: "اختر كلمة مرور آمنة (٦ أحرف على الأقل)",
    pw: "كلمة المرور الجديدة",
    pw2: "تأكيد كلمة المرور",
    submit: "حفظ كلمة المرور",
    loading: "جاري الحفظ...",
    done: "✓ تم تحديث كلمة المرور — جاري التحويل...",
    err: "حدث خطأ",
    mismatch: "كلمتا المرور غير متطابقتين",
    notAuthed: "الرابط منتهي أو غير صحيح. اطلب رابطاً جديداً.",
    back: "← العودة لتسجيل الدخول",
  },
  en: {
    title: "Set a new password",
    sub: "Choose a secure password (min. 6 chars)",
    pw: "New password",
    pw2: "Confirm password",
    submit: "Save password",
    loading: "Saving...",
    done: "✓ Password updated — redirecting...",
    err: "An error occurred",
    mismatch: "Passwords do not match",
    notAuthed: "Link expired or invalid. Request a new one.",
    back: "← Back to sign in",
  },
} as const;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setErr("");
    if (pw !== pw2) {
      setErr(t.mismatch);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setDone(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/login", search: { redirect: "/app" } }), 1200);
    } catch (e: any) {
      setErr(e.message || t.err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} style={{ fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <LangSwitcher lang={lang} onChange={setLang} />
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>
        <div style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 18, padding: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--gpa-text)" }}>{t.title}</h1>
          <p style={{ fontSize: 12, color: "var(--gpa-text-faint)", margin: "8px 0 18px" }}>{t.sub}</p>

          {!ready && (
            <div style={{ background: "var(--gpa-danger-15)", border: "1px solid var(--gpa-danger-33)", color: "var(--gpa-danger)", padding: 12, borderRadius: 10, fontSize: 13 }}>
              {t.notAuthed}
            </div>
          )}

          {ready && !done && (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t.pw}
                style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 10, color: "var(--gpa-text-strong)", padding: "12px 14px", fontSize: 14, fontFamily: FONT, width: "100%", boxSizing: "border-box" }}
              />
              <input type="password" required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={t.pw2}
                style={{ background: "var(--gpa-card)", border: "1px solid var(--gpa-border)", borderRadius: 10, color: "var(--gpa-text-strong)", padding: "12px 14px", fontSize: 14, fontFamily: FONT, width: "100%", boxSizing: "border-box" }}
              />
              {err && (
                <div style={{ background: "var(--gpa-danger-15)", border: "1px solid var(--gpa-danger-33)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--gpa-danger)" }}>
                  ⚠️ {err}
                </div>
              )}
              <button type="submit" disabled={loading} style={{ padding: 13, background: "linear-gradient(135deg,var(--gpa-accent-25),var(--gpa-accent2-20))", border: "1px solid var(--gpa-accent-55)", borderRadius: 12, color: "var(--gpa-accent)", fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? t.loading : t.submit}
              </button>
            </form>
          )}

          {done && (
            <div style={{ background: "var(--gpa-accent-12)", border: "1px solid var(--gpa-accent-44)", color: "var(--gpa-accent)", padding: 12, borderRadius: 10, fontSize: 13 }}>
              {t.done}
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Link to="/login" search={{ redirect: "/app" }} style={{ fontSize: 12, color: "var(--gpa-text-faint)", textDecoration: "none" }}>
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
