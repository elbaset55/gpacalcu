import { useState, useEffect, useRef } from "react";
import {
  BookOpen, Layers, Brain, Target, TrendingUp, BarChart3,
  Zap, MessageSquare, Map, Calculator, GraduationCap,
  Sun, Moon, Monitor, User, LogOut, RotateCcw, Bell,
  CalendarDays, Percent, Share2, Download, Upload, Printer,
  Menu, X, ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import type { GpaTheme } from "./use-theme";

const FONT = "'Cairo','Sora','Manrope','Noto Sans Arabic',sans-serif";
const FONT_NUM = "'Sora','Cairo',sans-serif";

const TAB_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  record: BookOpen,
  courses: Layers,
  target: Target,
  whatif: Zap,
  charts: BarChart3,
  analysis: TrendingUp,
  advisor: Brain,
  chat: MessageSquare,
  roadmap: Map,
  scale: Calculator,
};

function gpaColor(g: number, isDark: boolean): string {
  if (g >= 3.667) return isDark ? "#4fffb0" : "#2054e0";
  if (g >= 3.0) return isDark ? "#69f0ae" : "#047a60";
  if (g >= 2.667) return isDark ? "#ffe066" : "#b57e04";
  if (g >= 2.0) return isDark ? "#ffaa40" : "#d45a0a";
  return isDark ? "#ff6b6b" : "#d42020";
}

function AnimatedCounter({ target, decimals = 3 }: { target: number; decimals?: number }) {
  const [val, setVal] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) { setVal(target); return; }
    let start: number | null = null;
    const dur = 900;
    const raf = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - prog, 4);
      setVal(from + (target - from) * ease);
      if (prog < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target]);
  return <>{val.toFixed(decimals)}</>;
}

function CircularRing({
  pct, size = 96, strokeWidth = 7, color, isDark,
}: { pct: number; size?: number; strokeWidth?: number; color: string; isDark: boolean }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isDark ? "#2563EB" : "#2054e0"} />
          <stop offset="100%" stopColor={isDark ? "#22D3EE" : "#5b60e8"} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,66,0.07)"}
        strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="url(#ringGrad)" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

export interface TermlyAppShellProps {
  tab: string;
  onTabChange: (id: string) => void;
  tabs: string[][];
  lang: string;
  dir: "rtl" | "ltr";
  theme: GpaTheme;
  onThemeChange: (t: GpaTheme) => void;
  cumGpa: number;
  prevGpa: number;
  semGpa: number;
  semCr: number;
  newCr: number;
  totalReq: number;
  remCr: number;
  currentLevel: number;
  uniName: string;
  major: string;
  standLabel: string;
  standEn: string;
  standClr: string;
  standEmoji: string;
  isGuest: boolean;
  onLogout: () => void;
  onReset: () => void;
  onNavigateProfile: () => void;
  onShowHistory: () => void;
  onShowPctConverter: () => void;
  onShowReminders: () => void;
  onShowShare: () => void;
  onExport: () => void;
  onPrint: () => void;
  onImport: () => void;
  children: React.ReactNode;
}

export function TermlyAppShell({
  tab, onTabChange, tabs, lang, dir, theme, onThemeChange,
  cumGpa, prevGpa, semGpa, semCr, newCr, totalReq, remCr,
  currentLevel, uniName, major, standLabel, standEn, standClr, standEmoji,
  isGuest, onLogout, onReset, onNavigateProfile,
  onShowHistory, onShowPctConverter, onShowReminders, onShowShare,
  onExport, onPrint, onImport,
  children,
}: TermlyAppShellProps) {
  const isDark = theme === "dark";
  const isHC = theme === "hc";
  const ar = lang === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const creditPct = Math.min((newCr / totalReq) * 100, 100);
  const gpaPct = (cumGpa / 4) * 100;
  const color = isHC ? "#ffff00" : gpaColor(cumGpa, isDark);

  const standingText = ar ? standLabel : standEn;

  const levelLabels: Record<number, { ar: string; en: string }> = {
    1: { ar: "المستوى الأول", en: "Freshman" },
    2: { ar: "المستوى الثاني", en: "Sophomore" },
    3: { ar: "المستوى الثالث", en: "Junior" },
    4: { ar: "المستوى الرابع", en: "Senior" },
  };
  const levelStr = ar
    ? (levelLabels[currentLevel]?.ar ?? `المستوى ${currentLevel}`)
    : (levelLabels[currentLevel]?.en ?? `Level ${currentLevel}`);

  const BG = isHC
    ? "#000"
    : isDark
    ? "#050914"
    : "#f4f6fb";

  const SIDEBAR_BG = isHC
    ? "#000"
    : isDark
    ? "rgba(5,9,20,0.88)"
    : "rgba(255,255,255,0.75)";

  const SIDEBAR_BORDER = isHC
    ? "#fff"
    : isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(15,23,66,0.09)";

  const CARD_BG = isHC
    ? "#000"
    : isDark
    ? "rgba(255,255,255,0.035)"
    : "rgba(255,255,255,0.72)";

  const CARD_BORDER = isHC
    ? "#fff"
    : isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.9)";

  const TEXT = isHC ? "#fff" : isDark ? "#f0f2ff" : "#0d1240";
  const MUTED = isHC ? "#fff" : isDark ? "#7880aa" : "#4a5480";
  const ELECTRIC = isDark ? "#2563EB" : "#2054e0";
  const CYAN = isDark ? "#22D3EE" : "#5b60e8";

  const chevron = dir === "rtl"
    ? <ChevronLeft size={16} />
    : <ChevronRight size={16} />;

  const NAV_LABELS: Record<string, { ar: string; en: string }> = {
    record: { ar: "سجلّي", en: "My Record" },
    courses: { ar: "المواد", en: "Courses" },
    target: { ar: "الهدف", en: "Target" },
    whatif: { ar: "ماذا لو", en: "What-If" },
    charts: { ar: "الرسوم البيانية", en: "Charts" },
    analysis: { ar: "التحليل", en: "Analysis" },
    advisor: { ar: "المستشار الذكي", en: "AI Advisor" },
    chat: { ar: "محادثة AI", en: "AI Chat" },
    roadmap: { ar: "خريطة الطريق", en: "Roadmap" },
    scale: { ar: "السلّم التقديري", en: "Grade Scale" },
  };

  const menuItems = [
    { icon: CalendarDays, label: ar ? "السجل" : "History", run: onShowHistory },
    { icon: Percent, label: ar ? "محوّل النسبة" : "% Converter", run: onShowPctConverter },
    { icon: Bell, label: ar ? "التذكيرات" : "Reminders", run: onShowReminders },
    { icon: Share2, label: ar ? "مشاركة الإنجاز" : "Share", run: onShowShare },
    { icon: Printer, label: ar ? "طباعة" : "Print", run: onPrint },
    { icon: Download, label: ar ? "تنزيل JSON" : "Export JSON", run: onExport },
    { icon: Upload, label: ar ? "استيراد" : "Import", run: onImport },
    { icon: User, label: ar ? "حسابي" : "Account", run: onNavigateProfile },
  ];

  const SidebarContent = () => (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "0",
    }}>
      {/* Logo */}
      <div style={{ padding: "22px 18px 20px", borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: "linear-gradient(135deg, #2563EB, #22D3EE)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 18px rgba(37,99,235,0.45)",
          }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <div style={{
              fontFamily: FONT_NUM, fontWeight: 800, fontSize: 19, letterSpacing: -0.5,
              background: "linear-gradient(90deg, #60A5FA, #22D3EE)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
            }}>Termly</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 1, fontFamily: FONT, letterSpacing: "0.5px" }}>
              {ar ? "المستشار الأكاديمي" : "Academic Advisor"}
            </div>
          </div>
        </div>
      </div>

      {/* Mini GPA Hero */}
      <div style={{
        margin: "14px 12px",
        padding: "16px 14px",
        background: CARD_BG,
        border: `0.5px solid ${CARD_BORDER}`,
        borderRadius: 16,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: isDark
          ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.3)"
          : "0 4px 20px rgba(15,23,66,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <CircularRing pct={gpaPct} size={72} strokeWidth={6} color={color} isDark={isDark} />
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                fontFamily: FONT_NUM, fontSize: 16, fontWeight: 900, color, lineHeight: 1,
              }}>
                <AnimatedCounter target={cumGpa} decimals={2} />
              </div>
              <div style={{ fontSize: 8, color: MUTED, marginTop: 1, fontFamily: FONT }}>/ 4.00</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: standClr, fontFamily: FONT,
              marginBottom: 4, display: "flex", alignItems: "center", gap: 4,
            }}>
              <span>{standEmoji}</span>
              <span>{standingText}</span>
            </div>
            <div style={{ fontSize: 10, color: MUTED, fontFamily: FONT, marginBottom: 8 }}>
              {levelStr}
            </div>
            {/* Credits progress */}
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 9, color: MUTED, fontFamily: FONT, marginBottom: 4,
              }}>
                <span>{ar ? "الساعات" : "Credits"}</span>
                <span style={{ color, fontWeight: 700 }}>{newCr} / {totalReq}</span>
              </div>
              <div style={{
                height: 5, borderRadius: 99,
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,66,0.07)",
                overflow: "hidden", position: "relative",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  width: `${creditPct}%`,
                  background: `linear-gradient(90deg, ${ELECTRIC}, ${CYAN})`,
                  borderRadius: 99,
                  boxShadow: isDark ? `0 0 8px rgba(34,211,238,0.5)` : "none",
                  transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
                }} />
              </div>
              <div style={{ fontSize: 9, color: MUTED, fontFamily: FONT, marginTop: 3 }}>
                {ar ? `متبقي ${remCr} ساعة` : `${remCr} credits left`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        <div style={{ fontSize: 9, color: MUTED, fontFamily: FONT, letterSpacing: "1px", textTransform: "uppercase", padding: "4px 10px 8px", opacity: 0.7 }}>
          {ar ? "التنقل" : "Navigation"}
        </div>
        {tabs.map(([id]) => {
          const Icon = TAB_ICONS[id] ?? BookOpen;
          const label = NAV_LABELS[id];
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => { onTabChange(id); setSidebarOpen(false); }}
              style={{
                display: "flex", alignItems: "center",
                gap: 10, width: "100%", textAlign: "start",
                padding: "10px 12px", borderRadius: 10, marginBottom: 1,
                cursor: "pointer", border: "none", position: "relative",
                fontFamily: FONT, fontSize: 13,
                transition: "all 0.18s cubic-bezier(0.22,1,0.36,1)",
                background: active
                  ? isDark ? "rgba(37,99,235,0.10)" : "rgba(32,84,224,0.07)"
                  : "transparent",
                color: active
                  ? isDark ? "#e2e8f0" : "#0d1240"
                  : MUTED,
                fontWeight: active ? 700 : 400,
                borderInlineStart: active
                  ? `2px solid ${ELECTRIC}`
                  : "2px solid transparent",
              }}
            >
              {active && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 10,
                  boxShadow: `inset 0 0 0 1px ${ELECTRIC}18`,
                  pointerEvents: "none",
                }} />
              )}
              <Icon size={15} color={active ? ELECTRIC : MUTED} />
              <span style={{ flex: 1 }}>
                {ar ? label?.ar : label?.en}
              </span>
              {active && (
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: ELECTRIC,
                  boxShadow: isDark ? `0 0 6px ${ELECTRIC}` : "none",
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: "12px", borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
        {/* Theme toggle */}
        <div style={{
          display: "flex", gap: 3, marginBottom: 10,
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,66,0.05)",
          borderRadius: 10, padding: 3,
        }}>
          {([
            { v: "light" as GpaTheme, Icon: Sun, label: ar ? "فاتح" : "Light" },
            { v: "dark" as GpaTheme, Icon: Moon, label: ar ? "داكن" : "Dark" },
            { v: "hc" as GpaTheme, Icon: Monitor, label: ar ? "HC" : "HC" },
          ] as const).map(({ v, Icon: Ico, label }) => {
            const active = theme === v;
            return (
              <button key={v} onClick={() => onThemeChange(v)} title={label}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 4, padding: "6px 0", border: "none", cursor: "pointer",
                  borderRadius: 8, fontFamily: FONT, fontSize: 11, fontWeight: active ? 700 : 400,
                  background: active
                    ? isDark ? "rgba(37,99,235,0.18)" : "rgba(255,255,255,0.85)"
                    : "transparent",
                  color: active ? (isDark ? "#60A5FA" : ELECTRIC) : MUTED,
                  boxShadow: active && !isDark ? "0 1px 4px rgba(15,23,66,0.12)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <Ico size={12} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 11px", borderRadius: 12,
          background: CARD_BG,
          border: `0.5px solid ${CARD_BORDER}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #2563EB, #22D3EE)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#fff",
          }}>
            {(uniName || "T").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {uniName || (ar ? "مستخدم" : "User")}
            </div>
            <div style={{ fontSize: 10, color: MUTED, fontFamily: FONT }}>
              {major || levelStr}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={onNavigateProfile} title={ar ? "الملف الشخصي" : "Profile"}
              style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 3, borderRadius: 6 }}>
              <User size={13} />
            </button>
            <button onClick={() => { window.location.href = "/admin"; }} title={ar ? "لوحة الإدارة" : "Admin"}
              style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 3, borderRadius: 6 }}>
              <ShieldCheck size={13} />
            </button>
            <button onClick={onLogout} title={ar ? "خروج" : "Logout"}
              style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 3, borderRadius: 6 }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div dir={dir} style={{
      minHeight: "100vh",
      fontFamily: FONT,
      color: TEXT,
      display: "flex",
      position: "relative",
      overflow: "hidden",
      background: BG,
    }}>
      <style>{`
        @keyframes termly-orb1 {
          0%,100% { transform:translate(0,0) scale(1); opacity:0.7; }
          25% { transform:translate(30px,-40px) scale(1.1); opacity:0.9; }
          50% { transform:translate(-20px,-20px) scale(0.88); opacity:0.6; }
          75% { transform:translate(10px,30px) scale(1.05); opacity:0.85; }
        }
        @keyframes termly-orb2 {
          0%,100% { transform:translate(0,0) scale(1); opacity:0.5; }
          25% { transform:translate(-40px,20px) scale(0.9); opacity:0.7; }
          50% { transform:translate(20px,40px) scale(1.1); opacity:0.4; }
          75% { transform:translate(-10px,-30px) scale(0.95); opacity:0.65; }
        }
        @keyframes termly-orb3 {
          0%,100% { transform:translate(0,0) scale(1); opacity:0.4; }
          33% { transform:translate(50px,-10px) scale(1.12); opacity:0.65; }
          66% { transform:translate(-30px,40px) scale(0.85); opacity:0.3; }
        }
        @keyframes termly-light-pulse {
          0%,100% { opacity:0.5; transform:scale(1); }
          50% { opacity:0.8; transform:scale(1.04); }
        }
        .termly-nav-btn:hover { background: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,66,0.04)"} !important; }
        .termly-menu-btn:hover { background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,66,0.06)"} !important; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,66,0.12)"}; border-radius:2px; }
      `}</style>

      {/* ── Animated Background ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        {/* Dot/micro-grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: isDark
            ? "radial-gradient(circle, rgba(255,255,255,0.038) 1px, transparent 1px)"
            : "radial-gradient(circle, rgba(37,99,235,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 90% 90% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 90% at 50% 50%, black 40%, transparent 100%)",
        }} />

        {isDark ? (
          <>
            {/* Dark: electric blue orb top-end */}
            <div style={{
              position: "absolute", top: "-15%", insetInlineEnd: "5%",
              width: 640, height: 640, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(37,99,235,0.20) 0%, transparent 68%)",
              filter: "blur(40px)",
              animation: "termly-orb1 18s ease-in-out infinite",
            }} />
            {/* Dark: cyan orb bottom-start */}
            <div style={{
              position: "absolute", bottom: "-10%", insetInlineStart: "3%",
              width: 560, height: 560, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(34,211,238,0.14) 0%, transparent 68%)",
              filter: "blur(50px)",
              animation: "termly-orb2 24s ease-in-out 3s infinite",
            }} />
            {/* Dark: purple center orb */}
            <div style={{
              position: "absolute", top: "30%", left: "35%",
              width: 420, height: 420, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 65%)",
              filter: "blur(60px)",
              animation: "termly-orb3 30s ease-in-out 6s infinite",
            }} />
          </>
        ) : (
          <>
            {/* Light: soft blue top-end */}
            <div style={{
              position: "absolute", top: "-20%", insetInlineEnd: "0%",
              width: 700, height: 700, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 65%)",
              filter: "blur(60px)",
              animation: "termly-light-pulse 14s ease-in-out infinite",
            }} />
            {/* Light: indigo bottom-start */}
            <div style={{
              position: "absolute", bottom: "-15%", insetInlineStart: "0%",
              width: 600, height: 600, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(91,96,232,0.07) 0%, transparent 65%)",
              filter: "blur(70px)",
              animation: "termly-light-pulse 18s ease-in-out 4s infinite",
            }} />
            {/* Light: sky center */}
            <div style={{
              position: "absolute", top: "40%", left: "30%",
              width: 400, height: 400, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 65%)",
              filter: "blur(80px)",
              animation: "termly-light-pulse 22s ease-in-out 8s infinite",
            }} />
          </>
        )}

        {/* Corner ring decorations */}
        <svg style={{ position: "absolute", top: 0, insetInlineEnd: 0, width: 320, height: 320, opacity: isDark ? 0.055 : 0.04 }} viewBox="0 0 320 320" fill="none">
          <circle cx={dir === "rtl" ? 20 : 300} cy="20" r="180" stroke={isDark ? "#2563EB" : "#2054e0"} strokeWidth="1" />
          <circle cx={dir === "rtl" ? 20 : 300} cy="20" r="120" stroke={isDark ? "#22D3EE" : "#5b60e8"} strokeWidth="0.7" />
          <circle cx={dir === "rtl" ? 20 : 300} cy="20" r="70" stroke={isDark ? "#2563EB" : "#2054e0"} strokeWidth="0.5" />
        </svg>
      </div>

      {/* ── Sidebar (desktop) ── */}
      <aside style={{
        width: 240,
        minHeight: "100vh",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        background: SIDEBAR_BG,
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        borderInlineEnd: `0.5px solid ${SIDEBAR_BORDER}`,
        boxShadow: isDark
          ? "4px 0 40px rgba(0,0,0,0.4)"
          : "4px 0 32px rgba(15,23,66,0.08)",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : (dir === "rtl" ? "translateX(20px)" : "translateX(-20px)"),
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          />
          <aside style={{
            position: "fixed", top: 0, insetInlineStart: 0, bottom: 0,
            width: 260, zIndex: 91,
            background: isDark ? "rgba(5,9,20,0.97)" : "rgba(255,255,255,0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderInlineEnd: `0.5px solid ${SIDEBAR_BORDER}`,
            display: "flex", flexDirection: "column",
            animation: "gpa-menu-in 0.3s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            <button onClick={() => setSidebarOpen(false)} style={{
              position: "absolute", top: 12, insetInlineEnd: 12,
              background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 6,
            }}>
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main Content Area ── */}
      <main style={{
        flex: 1, minWidth: 0, position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.5s ease 0.1s",
        overflowX: "hidden",
      }}>
        {/* Top bar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: `0.5px solid ${SIDEBAR_BORDER}`,
          background: isDark ? "rgba(5,9,20,0.6)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          position: "sticky", top: 0, zIndex: 20,
        }}>
          {/* Mobile hamburger + page title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: MUTED, padding: "6px", borderRadius: 8,
                display: "flex",
              }}
              aria-label={ar ? "فتح القائمة" : "Open menu"}
            >
              <Menu size={18} />
            </button>
            <div>
              <div style={{
                fontFamily: FONT, fontSize: 14, fontWeight: 800, color: TEXT, lineHeight: 1,
              }}>
                {ar
                  ? (NAV_LABELS[tab]?.ar ?? tab)
                  : (NAV_LABELS[tab]?.en ?? tab)}
              </div>
              {uniName && (
                <div style={{ fontSize: 10, color: MUTED, fontFamily: FONT, marginTop: 1 }}>
                  {uniName}{major ? ` · ${major}` : ""}
                </div>
              )}
            </div>
          </div>

          {/* Header actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Overflow menu */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="termly-menu-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 13px", borderRadius: 10,
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,66,0.05)",
                  border: `0.5px solid ${SIDEBAR_BORDER}`,
                  color: MUTED, fontFamily: FONT, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", backdropFilter: "blur(8px)",
                  transition: "all 0.18s ease",
                }}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={15} /> : <Menu size={15} />}
                <span>{ar ? "القائمة" : "Menu"}</span>
              </button>

              {menuOpen && (
                <>
                  <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)",
                    insetInlineEnd: 0, zIndex: 41,
                    minWidth: 200,
                    background: isDark ? "rgba(8,11,22,0.97)" : "rgba(255,255,255,0.97)",
                    border: `0.5px solid ${SIDEBAR_BORDER}`,
                    borderRadius: 14, padding: 6,
                    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    boxShadow: isDark
                      ? "0 16px 48px rgba(0,0,0,0.6)"
                      : "0 16px 48px rgba(15,23,66,0.15)",
                    animation: "gpa-menu-in 0.22s cubic-bezier(0.22,1,0.36,1) both",
                  }}>
                    {menuItems.map(({ icon: Ico, label, run }) => (
                      <button key={label} onClick={() => { setMenuOpen(false); run(); }}
                        className="termly-menu-btn"
                        style={{
                          display: "flex", alignItems: "center", gap: 9,
                          width: "100%", textAlign: "start",
                          background: "transparent", border: "none",
                          borderRadius: 9, color: isDark ? "#c8cfee" : "#1e2a5e",
                          padding: "9px 11px", fontSize: 13, fontWeight: 600,
                          fontFamily: FONT, cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}>
                        <Ico size={16} style={{ flexShrink: 0, color: MUTED }} />
                        <span>{label}</span>
                      </button>
                    ))}
                    <div style={{ height: 1, background: SIDEBAR_BORDER, margin: "4px 2px" }} />
                    <button onClick={() => { setMenuOpen(false); onReset(); }}
                      className="termly-menu-btn"
                      style={{
                        display: "flex", alignItems: "center", gap: 9,
                        width: "100%", textAlign: "start",
                        background: "transparent", border: "none",
                        borderRadius: 9, color: isDark ? "#ff6b6b" : "#d42020",
                        padding: "9px 11px", fontSize: 13, fontWeight: 600,
                        fontFamily: FONT, cursor: "pointer", transition: "all 0.15s ease",
                      }}>
                      <RotateCcw size={16} style={{ flexShrink: 0 }} />
                      <span>{ar ? "إعادة تعيين" : "Reset"}</span>
                    </button>
                    <button onClick={() => { setMenuOpen(false); onLogout(); }}
                      className="termly-menu-btn"
                      style={{
                        display: "flex", alignItems: "center", gap: 9,
                        width: "100%", textAlign: "start",
                        background: "transparent", border: "none",
                        borderRadius: 9, color: isDark ? "#ff6b6b" : "#d42020",
                        padding: "9px 11px", fontSize: 13, fontWeight: 600,
                        fontFamily: FONT, cursor: "pointer", transition: "all 0.15s ease",
                      }}>
                      <LogOut size={16} style={{ flexShrink: 0 }} />
                      <span>{ar ? "تسجيل الخروج" : "Logout"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
