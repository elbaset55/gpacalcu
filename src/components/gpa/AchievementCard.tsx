import { useRef, useState } from "react";
import { toPng } from "html-to-image";

const FONT = "'Cairo','Noto Sans Arabic',sans-serif";

export function AchievementCard({
  lang, onClose, cumGpa, newCr, totalReq, uniName, major, currentLevel, standLabel, honors,
}: {
  lang: "ar" | "en";
  onClose: () => void;
  cumGpa: number;
  newCr: number;
  totalReq: number;
  uniName: string;
  major: string;
  currentLevel: number;
  standLabel: string;
  honors: boolean;
}) {
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pct = totalReq ? Math.round((newCr / totalReq) * 100) : 0;

  const generate = async () => {
    if (!ref.current) return null;
    return toPng(ref.current, { pixelRatio: 2, cacheBust: true });
  };

  const download = async () => {
    setBusy(true);
    try {
      const url = await generate();
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.download = `gpa-achievement-${Date.now()}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      const url = await generate();
      if (!url) return;
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "achievement.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: any) => boolean; share?: (d: any) => Promise<void> };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: ar ? "إنجازي الأكاديمي" : "My Academic Achievement",
          text: ar ? `معدلي التراكمي: ${cumGpa.toFixed(2)}` : `My GPA: ${cumGpa.toFixed(2)}`,
        });
      } else {
        download();
      }
    } catch {
      /* user cancelled */
    } finally {
      setBusy(false);
    }
  };

  const T = ar ? {
    title: "🏆 شارك إنجازك",
    cum: "المعدل التراكمي",
    level: "المستوى",
    prog: "التقدم نحو التخرج",
    honors: "مرتبة الشرف",
    foot: "GPA Advisor · gpacalcu.lovable.app",
    download: "تحميل",
    share: "مشاركة",
    close: "إغلاق",
  } : {
    title: "🏆 Share Achievement",
    cum: "Cumulative GPA",
    level: "Level",
    prog: "Graduation Progress",
    honors: "Honors",
    foot: "GPA Advisor · gpacalcu.lovable.app",
    download: "Download",
    share: "Share",
    close: "Close",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--gpa-card)", borderRadius: 16, border: "1px solid var(--gpa-border)", padding: 18, maxWidth: 460, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "var(--gpa-text)" }}>{T.title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--gpa-border)", color: "var(--gpa-text-faint)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: FONT }}>✕</button>
        </div>

        {/* The actual shareable card */}
        <div ref={ref} dir={dir} style={{
          background: "linear-gradient(135deg, #0a0a14 0%, #1a1a3e 50%, #2d1b4e 100%)",
          borderRadius: 20,
          padding: 26,
          color: "#fff",
          fontFamily: FONT,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,229,255,0.25), transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -50, left: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, position: "relative" }}>
            <div style={{ fontSize: 30 }}>🎓</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{uniName || (ar ? "جامعة" : "University")}</div>
              {major && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{major}</div>}
            </div>
          </div>

          <div style={{ textAlign: "center", margin: "18px 0", position: "relative" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{T.cum}</div>
            <div style={{ fontSize: 56, fontWeight: 900, background: "linear-gradient(135deg,#00e5ff,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
              {cumGpa.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>/ 4.00</div>
          </div>

          {honors && (
            <div style={{ textAlign: "center", padding: "6px 12px", background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#ffd700", marginBottom: 12 }}>
              🏆 {T.honors}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, position: "relative" }}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{T.level}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 3 }}>{currentLevel}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{standLabel}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{newCr}/{totalReq} {ar ? "س" : "cr"}</div>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
              <span>{T.prog}</span><span>{pct}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#00e5ff,#a855f7)" }} />
            </div>
          </div>

          <div style={{ marginTop: 18, textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>
            {T.foot}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={download} disabled={busy} style={{ flex: 1, padding: 11, background: "var(--gpa-surface-alpha-08)", border: "1px solid var(--gpa-border)", color: "var(--gpa-text-soft)", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
            ⬇ {T.download}
          </button>
          <button onClick={share} disabled={busy} style={{ flex: 1, padding: 11, background: "var(--gpa-accent-12)", border: "1px solid var(--gpa-accent-44)", color: "var(--gpa-accent)", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
            🔗 {T.share}
          </button>
        </div>
      </div>
    </div>
  );
}
