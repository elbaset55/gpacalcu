import { useEffect, useRef } from "react";

interface Props {
  theme: string;
  variant?: "login" | "app";
}

export function AppBackground({ theme, variant = "app" }: Props) {
  if (theme === "hc") return null;
  const isDark = theme === "dark";
  const isLogin = variant === "login";

  const accentPrimary = isDark ? "#4fffb0" : "#2054e0";
  const accentSecondary = isDark ? "#7c83f5" : "#5b60e8";

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Dot / grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: isDark
            ? "radial-gradient(circle, rgba(79,255,176,0.07) 1px, transparent 1px)"
            : "radial-gradient(circle, rgba(32,84,224,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Primary orb — top-right */}
      <div
        style={{
          position: "absolute",
          top: isLogin ? "-15%" : "-12%",
          right: isLogin ? "-10%" : "-8%",
          width: "65vw",
          height: "65vw",
          maxWidth: isLogin ? 700 : 560,
          maxHeight: isLogin ? 700 : 560,
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(79,255,176,0.18) 0%, rgba(124,131,245,0.10) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(32,84,224,0.14) 0%, rgba(91,96,232,0.08) 45%, transparent 70%)",
          filter: "blur(50px)",
          animation: "gpa-orb-drift 20s ease-in-out infinite",
        }}
      />

      {/* Secondary orb — bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: isLogin ? "-18%" : "-15%",
          left: isLogin ? "-12%" : "-10%",
          width: "58vw",
          height: "58vw",
          maxWidth: isLogin ? 640 : 520,
          maxHeight: isLogin ? 640 : 520,
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(168,85,247,0.16) 0%, rgba(56,217,245,0.09) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(109,40,217,0.12) 0%, rgba(6,145,200,0.08) 45%, transparent 70%)",
          filter: "blur(60px)",
          animation: "gpa-orb-drift2 26s ease-in-out infinite",
        }}
      />

      {/* Tertiary orb — center-ish */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "25%",
          width: "48vw",
          height: "48vw",
          maxWidth: 420,
          maxHeight: 420,
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(124,131,245,0.10) 0%, transparent 60%)"
            : "radial-gradient(circle, rgba(32,84,224,0.08) 0%, transparent 60%)",
          filter: "blur(65px)",
          animation: "gpa-orb-drift3 32s ease-in-out infinite",
        }}
      />

      {/* Decorative concentric rings — top-right corner */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 360,
          height: 360,
          opacity: isDark ? 0.10 : 0.08,
        }}
        viewBox="0 0 340 340"
        fill="none"
        aria-hidden
      >
        <circle cx="320" cy="20" r="180" stroke={accentPrimary} strokeWidth="1" />
        <circle cx="320" cy="20" r="130" stroke={accentSecondary} strokeWidth="0.7" />
        <circle cx="320" cy="20" r="84" stroke={accentPrimary} strokeWidth="0.5" />
        <circle cx="320" cy="20" r="42" stroke={accentSecondary} strokeWidth="0.4" />
      </svg>

      {/* Decorative concentric rings — bottom-left corner */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 300,
          height: 300,
          opacity: isDark ? 0.08 : 0.065,
        }}
        viewBox="0 0 280 280"
        fill="none"
        aria-hidden
      >
        <circle cx="20" cy="260" r="150" stroke={accentSecondary} strokeWidth="1" />
        <circle cx="20" cy="260" r="100" stroke={accentPrimary} strokeWidth="0.6" />
        <circle cx="20" cy="260" r="56" stroke={accentSecondary} strokeWidth="0.4" />
      </svg>

      {/* Top edge gradient shine line */}
      {isLogin && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: 1,
            background: isDark
              ? "linear-gradient(90deg, transparent, rgba(79,255,176,0.45), rgba(124,131,245,0.30), transparent)"
              : "linear-gradient(90deg, transparent, rgba(32,84,224,0.35), rgba(91,96,232,0.22), transparent)",
          }}
        />
      )}

      {/* Bottom edge gradient shine line */}
      {isLogin && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "20%",
            right: "20%",
            height: 1,
            background: isDark
              ? "linear-gradient(90deg, transparent, rgba(168,85,247,0.30), transparent)"
              : "linear-gradient(90deg, transparent, rgba(109,40,217,0.22), transparent)",
          }}
        />
      )}
    </div>
  );
}
