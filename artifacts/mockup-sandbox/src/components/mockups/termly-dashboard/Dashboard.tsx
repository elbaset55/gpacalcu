import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, BookOpen, Layers, Brain, Target,
  TrendingUp, Award, Clock, Zap, ChevronRight,
  Bell, Settings, Search, Sparkles, GraduationCap,
  Star, ArrowUpRight, BarChart3, CheckCircle2
} from "lucide-react";

const COLORS = {
  bg: "#050914",
  electric1: "#2563EB",
  electric2: "#06B6D4",
  cyan: "#22D3EE",
  emerald: "#10B981",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.12)",
  text: "#F1F5F9",
  muted: "#64748B",
  subtle: "rgba(255,255,255,0.5)",
};

const gpaData = [
  { sem: "١", gpa: 2.7 }, { sem: "٢", gpa: 2.85 }, { sem: "٣", gpa: 2.95 },
  { sem: "٤", gpa: 2.8 }, { sem: "٥", gpa: 3.0 }, { sem: "٦", gpa: 3.15 },
  { sem: "٧", gpa: 3.0 }, { sem: "٨", gpa: 3.2 },
];

const navItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", active: true },
  { icon: BookOpen, label: "السجل الأكاديمي" },
  { icon: Layers, label: "المواد" },
  { icon: Brain, label: "المستشار الذكي" },
  { icon: Target, label: "الأهداف" },
];

function SplineChart() {
  const max = 4.0, min = 2.5;
  const w = 480, h = 160;
  const pad = { t: 20, r: 20, b: 30, l: 10 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const pts = gpaData.map((d, i) => ({
    x: pad.l + (i / (gpaData.length - 1)) * iw,
    y: pad.t + ih - ((d.gpa - min) / (max - min)) * ih,
  }));

  const smooth = (points: { x: number; y: number }[]) => {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  };

  const pathD = smooth(pts);
  const lastPt = pts[pts.length - 1];
  const gradientFill = `M ${pts[0].x} ${h} L ${pts[0].x} ${pts[0].y} ${pathD.slice(1)} L ${lastPt.x} ${h} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i}
          x1={pad.l} y1={pad.t + ih * (1 - t)} x2={w - pad.r} y2={pad.t + ih * (1 - t)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={gradientFill} fill="url(#fillGrad)" />
      <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" filter="url(#glow)" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#050914" stroke="url(#lineGrad)" strokeWidth="2" />
          {i === pts.length - 1 && (
            <>
              <circle cx={p.x} cy={p.y} r="7" fill="#22D3EE" fillOpacity="0.15" />
              <circle cx={p.x} cy={p.y} r="4" fill="#22D3EE" />
            </>
          )}
        </g>
      ))}
      {gpaData.map((d, i) => (
        <text key={i} x={pts[i].x} y={h - 4} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="Cairo, sans-serif">{d.sem}</text>
      ))}
    </svg>
  );
}

function AnimatedCounter({ target, decimals = 3 }: { target: number; decimals?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{val.toFixed(decimals)}</>;
}

function PulsingDot() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#22D3EE",
          boxShadow: "0 0 8px #22D3EE",
          display: "inline-block",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}

export function Dashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const fadeIn = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  });

  const stats = [
    { icon: TrendingUp, label: "المعدل التراكمي", value: "3.000", unit: "/ 4.00", color: "#22D3EE", glow: "#22D3EE" },
    { icon: Award, label: "الساعات المعتمدة", value: "88", unit: "/ 136", color: "#10B981", glow: "#10B981" },
    { icon: GraduationCap, label: "المستوى الدراسي", value: "الثالثة", unit: "", color: "#A78BFA", glow: "#A78BFA" },
    { icon: BookOpen, label: "المواد الحالية", value: "6", unit: "مواد", color: "#F59E0B", glow: "#F59E0B" },
  ];

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: COLORS.bg,
      fontFamily: "'Cairo', 'Sora', sans-serif",
      color: COLORS.text, display: "flex", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700&display=swap');
        @keyframes bounce { 0%,80%,100% { transform:translateY(0) } 40% { transform:translateY(-6px) } }
        @keyframes pulse-slow { 0%,100% { opacity:0.6; transform:scale(1) } 50% { opacity:1; transform:scale(1.04) } }
        @keyframes spin-slow { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes gradient-shift { 0%,100% { opacity:0.5 } 50% { opacity:0.9 } }
        .stat-card:hover { transform: perspective(800px) rotateX(-2deg) rotateY(2deg) scale(1.02); }
        .stat-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .nav-item:hover { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes border-glow { 0%,100% { opacity:0.6 } 50% { opacity:1 } }
      `}</style>

      {/* Background radial glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-20%", right: "10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
          animation: "pulse-slow 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "0%", left: "5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)",
          animation: "pulse-slow 8s ease-in-out 2s infinite",
        }} />
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
      </div>

      {/* Sidebar */}
      <aside style={{
        ...fadeIn(0),
        width: 230, minHeight: "100vh", position: "relative", zIndex: 10,
        borderLeft: `1px solid ${COLORS.border}`,
        background: "rgba(5,9,20,0.8)",
        backdropFilter: "blur(24px)",
        display: "flex", flexDirection: "column", padding: "24px 0",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "0 20px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(37,99,235,0.5)",
              flexShrink: 0,
            }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <div style={{
                fontWeight: 800, fontSize: 20, letterSpacing: -0.5,
                background: "linear-gradient(90deg, #60A5FA, #22D3EE)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Termly</div>
              <div style={{ fontSize: 10, color: COLORS.muted, marginTop: -2 }}>ترملي</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navItems.map((item, i) => (
            <div key={i} className="nav-item" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 12px", borderRadius: 10, marginBottom: 2,
              cursor: "pointer", position: "relative",
              background: item.active ? "rgba(37,99,235,0.12)" : "transparent",
              borderRight: item.active ? "3px solid #2563EB" : "3px solid transparent",
            }}>
              {item.active && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 10,
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
                }} />
              )}
              <item.icon size={17} color={item.active ? "#60A5FA" : COLORS.muted} />
              <span style={{
                fontSize: 13, fontWeight: item.active ? 600 : 400,
                color: item.active ? "#E2E8F0" : COLORS.muted,
              }}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "0 16px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 12,
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #2563EB, #22D3EE)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "white",
            }}>ع</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>عبدالباسط</div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>المستوى الثالث</div>
            </div>
            <Settings size={14} color={COLORS.muted} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 32px", position: "relative", zIndex: 1, overflowY: "auto" }}>

        {/* Topbar */}
        <div style={{ ...fadeIn(80), display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>مرحبًا عبدالباسط 👋</div>
            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>الفصل الدراسي الثامن — ٢٠٢٥/٢٠٢٦</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 10,
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              fontSize: 12, color: COLORS.muted, cursor: "pointer",
            }}>
              <Search size={14} />
              <span>بحث سريع...</span>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative",
            }}>
              <Bell size={15} color={COLORS.muted} />
              <div style={{
                position: "absolute", top: 6, right: 7, width: 7, height: 7,
                borderRadius: "50%", background: "#EF4444",
                border: "1.5px solid #050914",
              }} />
            </div>
          </div>
        </div>

        {/* Hero — GPA Command Center */}
        <div style={{
          ...fadeIn(160),
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20, padding: "28px 32px", marginBottom: 20,
          backdropFilter: "blur(16px)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 40px rgba(37,99,235,0.08)",
          position: "relative", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{
            position: "absolute", top: -60, left: -60, width: 260, height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div>
            <div style={{ fontSize: 12, color: COLORS.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>المعدل التراكمي الحالي</div>
            <div style={{
              fontSize: 76, fontWeight: 900, lineHeight: 1,
              background: "linear-gradient(135deg, #60A5FA 0%, #22D3EE 50%, #10B981 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 30px rgba(34,211,238,0.3))",
            }}>
              <AnimatedCounter target={3.000} />
            </div>
            <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 6 }}>من إجمالي 4.00 نقطة</div>

            {/* Progress bar — hours */}
            <div style={{ marginTop: 22, maxWidth: 340 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: COLORS.muted }}>الساعات المعتمدة</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#22D3EE" }}>88 / 136</span>
              </div>
              <div style={{
                height: 8, borderRadius: 99, background: "rgba(255,255,255,0.06)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, right: 0, bottom: 0,
                  width: `${(88 / 136) * 100}%`,
                  background: "linear-gradient(90deg, #2563EB, #22D3EE)",
                  borderRadius: 99,
                  boxShadow: "0 0 12px rgba(34,211,238,0.6)",
                }} />
                {/* Glowing leading dot */}
                <div style={{
                  position: "absolute", top: "50%", transform: "translateY(-50%)",
                  right: `${100 - (88 / 136) * 100}%`,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#22D3EE",
                  boxShadow: "0 0 10px #22D3EE, 0 0 20px rgba(34,211,238,0.6)",
                  marginRight: -7,
                }} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 5 }}>متبقي 48 ساعة للتخرج • 64.7% مكتمل</div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 140, height: 140, borderRadius: "50%", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 140 140" width="140" height="140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                <circle cx="70" cy="70" r="58" fill="none"
                  stroke="url(#circGrad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(3 / 4) * 2 * Math.PI * 58} ${2 * Math.PI * 58}`}
                  style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.7))" }}
                />
                <defs>
                  <linearGradient id="circGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: "relative", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#22D3EE", lineHeight: 1 }}>75%</div>
                <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 3 }}>نحو 4.0</div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: COLORS.muted }}>التقدم الإجمالي</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ ...fadeIn(260), display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card" style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16, padding: "18px 20px",
              backdropFilter: "blur(16px)",
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.05), 0 0 0 0 ${s.glow}`,
              cursor: "default",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, marginBottom: 14,
                background: `rgba(${s.color === "#22D3EE" ? "34,211,238" : s.color === "#10B981" ? "16,185,129" : s.color === "#A78BFA" ? "167,139,250" : "245,158,11"}, 0.1)`,
                border: `1px solid ${s.color}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</span>
                {s.unit && <span style={{ fontSize: 11, color: COLORS.muted }}>{s.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: Chart + AI */}
        <div style={{ ...fadeIn(360), display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>

          {/* Chart */}
          <div style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 18, padding: "22px 24px",
            backdropFilter: "blur(16px)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>مسار الأداء</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Termly Insights</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22D3EE", boxShadow: "0 0 6px #22D3EE" }} />
                <span style={{ fontSize: 11, color: COLORS.muted }}>المعدل الفصلي</span>
              </div>
            </div>
            <SplineChart />
            <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
              {[
                { label: "أفضل فصل", value: "3.20 — الثامن", color: "#10B981" },
                { label: "الاتجاه", value: "↑ تصاعدي", color: "#22D3EE" },
                { label: "المتوسط", value: "2.96", color: "#A78BFA" },
              ].map((m, i) => (
                <div key={i} style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Copilot */}
          <div style={{
            borderRadius: 18, padding: 2,
            background: "linear-gradient(135deg, #2563EB44, #22D3EE44, #2563EB44)",
            backgroundSize: "200% 200%",
            animation: "gradient-shift 3s ease infinite",
            position: "relative",
          }}>
            <div style={{
              height: "100%", borderRadius: 16,
              background: "#060B18",
              padding: "22px 22px",
              display: "flex", flexDirection: "column",
              backdropFilter: "blur(16px)",
            }}>
              {/* Terminal header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#EF4444", "#F59E0B", "#10B981"].map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.8 }} />
                  ))}
                </div>
                <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: COLORS.muted, fontFamily: "monospace" }}>termly-ai-copilot</span>
              </div>

              {/* AI Thinking */}
              <div style={{
                fontFamily: "monospace", fontSize: 11, color: "#22D3EE",
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
              }}>
                <PulsingDot />
                <span style={{ opacity: 0.8 }}>AI يحلل بياناتك...</span>
              </div>

              {/* Prompt line */}
              <div style={{
                fontFamily: "monospace", fontSize: 11,
                color: "rgba(255,255,255,0.3)", marginBottom: 14,
              }}>
                <span style={{ color: "#10B981" }}>❯ </span>
                <span>analyze --gpa=3.000 --target=3.50</span>
              </div>

              {/* AI Output */}
              <div style={{
                flex: 1, background: "rgba(34,211,238,0.04)",
                border: "1px solid rgba(34,211,238,0.1)",
                borderRadius: 10, padding: "14px",
                fontFamily: "Cairo, sans-serif",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
                }}>
                  <Sparkles size={13} color="#22D3EE" />
                  <span style={{ fontSize: 11, color: "#22D3EE", fontWeight: 700 }}>توصية Termly AI</span>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.75)", margin: 0 }}>
                  معدلك <strong style={{ color: "#22D3EE" }}>3.000</strong> ضمن النطاق الجيد جداً. للوصول إلى <strong style={{ color: "#10B981" }}>3.50</strong> في الفصل القادم، يُوصى بالتركيز على مواد التخصص المتبقية.
                </p>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { text: "رفع مادتَي الخوارزميات وقواعد البيانات", icon: CheckCircle2 },
                    { text: "استهداف 3.70+ في الفصل الثامن", icon: Target },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <r.icon size={11} color="#10B981" />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{r.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div style={{
                marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 10,
                background: "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(34,211,238,0.1))",
                border: "1px solid rgba(34,211,238,0.2)",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Brain size={13} color="#22D3EE" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#60A5FA" }}>خطة مفصّلة للتحسين</span>
                </div>
                <ChevronRight size={14} color="#22D3EE" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
