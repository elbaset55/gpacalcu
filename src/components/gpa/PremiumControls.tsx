/**
 * PremiumControls — shared glassmorphism Lang + Theme switchers
 * Used on: SetupScreen, LoginPage
 *
 * Audit-hardened:
 *  • a11y    — role, aria-checked/aria-pressed, title, focus-visible ring (.gpa-pill-btn)
 *  • CLS     — both lang buttons fixed at width:46px, pill container never shifts
 *  • mobile  — .gpa-pill-container scales via CSS media query in styles.css
 *  • hydration — pure CSS/inline, zero useEffect needed here
 */
import React from "react";
import { Globe, Sun, Moon, Monitor, type LucideProps } from "lucide-react";
import type { GpaTheme } from "./use-theme";
import type { Lang } from "@/lib/use-lang";

const FONT = "'Plus Jakarta Sans','Manrope','Cairo','Noto Sans Arabic',sans-serif";

/* ── shared pill container styles ──────────────────────────────────────── */
function pillStyle(isDark: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: 3,
    borderRadius: 14,
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,66,0.05)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.11)" : "rgba(15,23,66,0.09)"}`,
    backdropFilter: "blur(18px) saturate(1.4)",
    WebkitBackdropFilter: "blur(18px) saturate(1.4)",
    boxShadow: isDark
      ? "0 2px 20px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.07)"
      : "0 2px 14px rgba(15,23,66,0.09), inset 0 1px 0 rgba(255,255,255,0.90)",
    transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
  };
}

/* ── Theme Switcher ─────────────────────────────────────────────────────── */
type ThemeOpt = { id: GpaTheme; Icon: React.FC<LucideProps>; labelEn: string; labelAr: string };
const THEME_OPTS: ThemeOpt[] = [
  { id: "light", Icon: Sun,     labelEn: "Light",  labelAr: "فاتح"  },
  { id: "dark",  Icon: Moon,    labelEn: "Dark",   labelAr: "داكن"  },
  { id: "hc",    Icon: Monitor, labelEn: "System", labelAr: "تباين" },
];

export function PremiumThemeSwitcher({
  theme,
  onThemeChange,
}: {
  theme: GpaTheme;
  onThemeChange: (t: GpaTheme) => void;
}) {
  const isDark = theme === "dark";
  return (
    <div
      role="radiogroup"
      aria-label="Theme / الثيم"
      className="gpa-pill-container"
      style={pillStyle(isDark)}
    >
      {THEME_OPTS.map(({ id, Icon, labelEn, labelAr }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${labelEn} / ${labelAr}`}
            className="gpa-pill-btn"
            onClick={() => onThemeChange(id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              border: "none",
              borderRadius: 11,
              cursor: "pointer",
              fontFamily: FONT,
              transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
              background: active
                ? isDark
                  ? "linear-gradient(135deg, rgba(79,255,176,0.20) 0%, rgba(124,131,245,0.16) 100%)"
                  : "white"
                : "transparent",
              color: active
                ? isDark ? "#4fffb0" : "#2054e0"
                : isDark ? "rgba(255,255,255,0.32)" : "rgba(15,23,66,0.30)",
              boxShadow: active
                ? isDark
                  ? "0 2px 12px rgba(79,255,176,0.18), 0 1px 0 rgba(255,255,255,0.06)"
                  : "0 2px 10px rgba(32,84,224,0.14), 0 1px 0 rgba(255,255,255,1)"
                : "none",
              transform: active ? "scale(1.08)" : "scale(1)",
            }}
          >
            <Icon size={15} strokeWidth={active ? 2.3 : 1.7} />
          </button>
        );
      })}
    </div>
  );
}

/* ── Lang Switcher ──────────────────────────────────────────────────────── */
export function PremiumLangSwitcher({
  lang,
  onLangChange,
  isDark,
}: {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  isDark: boolean;
}) {
  const isAr = lang === "ar";
  // dir="ltr" locked so the slide is always predictable regardless of page direction
  const pillTranslate = isAr ? "0%" : "100%";

  return (
    <div
      dir="ltr"
      role="group"
      aria-label="Language / اللغة"
      className="gpa-pill-container"
      style={{ ...pillStyle(isDark), gap: 4 }}
    >
      {/* Globe icon — decorative */}
      <Globe
        size={13}
        strokeWidth={1.8}
        aria-hidden
        style={{
          marginLeft: 6,
          color: isDark ? "rgba(255,255,255,0.32)" : "rgba(15,23,66,0.28)",
          flexShrink: 0,
          transition: "color 0.3s",
        }}
      />

      {/* Pill track */}
      <div style={{ position: "relative", display: "flex" }}>
        {/* Sliding indicator — animates behind buttons */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            // CLS: width is exactly 50% of the fixed-width button pair (46px × 2 = 92px → 46px)
            width: "50%",
            height: "100%",
            borderRadius: 11,
            background: isDark
              ? "linear-gradient(135deg, rgba(79,255,176,0.22) 0%, rgba(124,131,245,0.17) 100%)"
              : "white",
            boxShadow: isDark
              ? "0 2px 12px rgba(79,255,176,0.20), 0 1px 0 rgba(255,255,255,0.07)"
              : "0 2px 10px rgba(32,84,224,0.15), 0 1px 0 rgba(255,255,255,1)",
            transform: `translateX(${pillTranslate})`,
            // Spring easing: slight overshoot for tactile feel
            transition: "transform 0.30s cubic-bezier(0.34,1.56,0.64,1), background 0.3s, box-shadow 0.3s",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {([
          { id: "ar" as Lang, label: "عربي", fs: 12.5 },
          { id: "en" as Lang, label: "EN",   fs: 11.5 },
        ] as const).map(({ id, label, fs }) => {
          const active = lang === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onLangChange(id)}
              aria-pressed={active}
              title={id === "ar" ? "Arabic / العربية" : "English"}
              className="gpa-pill-btn"
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // CLS fix: BOTH buttons fixed at 46 px — pill never shifts layout
                width: 46,
                height: 36,
                padding: 0,
                border: "none",
                borderRadius: 11,
                cursor: "pointer",
                background: "transparent",
                fontFamily: FONT,
                fontSize: fs,
                fontWeight: 700,
                letterSpacing: id === "en" ? "0.4px" : "0",
                color: active
                  ? isDark ? "#4fffb0" : "#2054e0"
                  : isDark ? "rgba(255,255,255,0.30)" : "rgba(15,23,66,0.28)",
                transition: "color 0.22s ease",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Unified Controls Bar ───────────────────────────────────────────────── */
/**
 * Renders [🌐 عربي|EN] [☀️🌙🖥] side by side with consistent 8px gap.
 * On screens ≤ 360px both pills shrink via .gpa-pill-container media query.
 */
export function PremiumControlsBar({
  lang,
  onLangChange,
  theme,
  onThemeChange,
}: {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  theme: GpaTheme;
  onThemeChange: (t: GpaTheme) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <PremiumLangSwitcher
        lang={lang}
        onLangChange={onLangChange}
        isDark={theme === "dark"}
      />
      <PremiumThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
    </div>
  );
}
