import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { deleteAccount } from "@/lib/profile.functions";
import { useLang } from "@/lib/use-lang";
import { useGpaTheme } from "@/components/gpa/use-theme";
import { ThemeSwitcher } from "@/components/gpa/ThemeSwitcher";
import { LangSwitcher } from "@/components/gpa/LangSwitcher";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

const T = {
  ar: {
    title: "حسابي",
    back: "← العودة للتطبيق",
    email: "البريد الإلكتروني",
    logout: "تسجيل الخروج",
    danger: "منطقة خطر",
    deleteAcc: "حذف الحساب نهائياً",
    deleteWarn: "سيتم حذف جميع بياناتك (الكلية، الفصول، المواد، التاريخ) ولا يمكن التراجع.",
    confirmText: "اكتب DELETE للتأكيد",
    deleteBtn: "حذف نهائي",
    deleted: "✓ تم حذف الحساب",
    err: "حدث خطأ",
    loading: "جاري...",
    managedByReplit: "يُدار حسابك عبر Replit. لتغيير بريدك أو كلمة مرورك، افتح إعدادات Replit.",
  },
  en: {
    title: "My Account",
    back: "← Back to app",
    email: "Email",
    logout: "Sign out",
    danger: "Danger zone",
    deleteAcc: "Permanently delete account",
    deleteWarn: "All your data (university, semesters, courses, history) will be deleted. Cannot be undone.",
    confirmText: "Type DELETE to confirm",
    deleteBtn: "Delete forever",
    deleted: "✓ Account deleted",
    err: "An error occurred",
    loading: "Loading...",
    managedByReplit: "Your account is managed via Replit. To change your email or password, visit Replit settings.",
  },
} as const;

function ProfilePage() {
  const navigate = useNavigate();
  const deleteAccountFn = useServerFn(deleteAccount);
  const { theme, setTheme } = useGpaTheme();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const flash = (text: string, kind: "ok" | "err" = "ok") => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const handleDelete = async () => {
    if (confirm !== "DELETE") return;
    setLoading("delete");
    try {
      await deleteAccountFn();
      flash(t.deleted);
      setTimeout(() => { window.location.href = "/api/auth/logout"; }, 800);
    } catch (e: any) {
      flash(e.message || t.err, "err");
    } finally {
      setLoading(null);
    }
  };

  const inp: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 10,
    color: "var(--gpa-text-strong)",
    padding: "10px 14px",
    fontSize: 13,
    fontFamily: FONT,
    width: "100%",
    boxSizing: "border-box",
  };
  const btn: React.CSSProperties = {
    padding: "10px 16px",
    background: "var(--gpa-accent-12)",
    border: "1px solid var(--gpa-accent-44)",
    color: "var(--gpa-accent)",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
  };
  const card: React.CSSProperties = {
    background: "var(--gpa-card)",
    border: "1px solid var(--gpa-border)",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  };

  return (
    <div dir={dir} style={{ fontFamily: FONT, background: "var(--gpa-bg)", minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <Link to="/app" style={{ fontSize: 13, color: "var(--gpa-text-faint)", textDecoration: "none" }}>
            {t.back}
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <LangSwitcher lang={lang} onChange={setLang} />
            <ThemeSwitcher theme={theme} onChange={setTheme} />
          </div>
        </div>

        <h1 style={{ margin: "0 0 18px", fontSize: 24, fontWeight: 900, color: "var(--gpa-text)" }}>{t.title}</h1>

        {msg && (
          <div style={{
            padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 14, fontFamily: FONT,
            background: msg.kind === "ok" ? "var(--gpa-accent-12)" : "var(--gpa-danger-15)",
            border: msg.kind === "ok" ? "1px solid var(--gpa-accent-44)" : "1px solid var(--gpa-danger-33)",
            color: msg.kind === "ok" ? "var(--gpa-accent)" : "var(--gpa-danger)",
          }}>
            {msg.text}
          </div>
        )}

        <div style={card}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--gpa-text-faint)", lineHeight: 1.6 }}>
            ℹ️ {t.managedByReplit}
          </p>
        </div>

        <div style={card}>
          <button onClick={handleLogout} style={{ ...btn, width: "100%" }}>🚪 {t.logout}</button>
        </div>

        <div style={{ ...card, borderColor: "var(--gpa-danger-33)" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 16, color: "var(--gpa-danger)" }}>⚠️ {t.danger}</h2>
          <p style={{ fontSize: 12, color: "var(--gpa-text-faint)", margin: "0 0 12px", lineHeight: 1.6 }}>{t.deleteWarn}</p>
          <input type="text" placeholder={t.confirmText} value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ ...inp, marginBottom: 8 }} />
          <button onClick={handleDelete} disabled={confirm !== "DELETE" || loading === "delete"}
            style={{
              ...btn, width: "100%",
              background: confirm === "DELETE" ? "var(--gpa-danger-15)" : "var(--gpa-surface-alpha-06)",
              border: confirm === "DELETE" ? "1px solid var(--gpa-danger)" : "1px solid var(--gpa-border)",
              color: confirm === "DELETE" ? "var(--gpa-danger)" : "var(--gpa-text-faint)",
              cursor: confirm === "DELETE" ? "pointer" : "not-allowed",
            }}>
            {loading === "delete" ? t.loading : "🗑 " + t.deleteBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
