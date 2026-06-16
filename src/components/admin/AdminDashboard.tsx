import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { getAdminOverview, getAdminUsers } from "@/lib/admin.functions";

const FONT = "'Manrope','Cairo','Noto Sans Arabic',sans-serif";
const FONT_HEAD = "'Sora','Cairo','Noto Sans Arabic',sans-serif";

const PALETTE = {
  accent: "#4fffb0",
  purple: "#a78bfa",
  blue: "#38d9f5",
  orange: "#fbbf24",
  red: "#ff6b6b",
  pink: "#f472b6",
  green: "#34d399",
};

/* ─── tiny helpers ─── */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });

const gpaClr = (g: number | null) => {
  if (g == null) return "var(--gpa-text-faint)";
  if (g >= 3.667) return PALETTE.accent;
  if (g >= 3.0) return PALETTE.purple;
  if (g >= 2.0) return PALETTE.blue;
  return PALETTE.red;
};

function StatCard({
  icon, label, value, sub, clr, note,
}: {
  icon: string; label: string; value: string | number; sub?: string; clr: string; note?: string;
}) {
  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.01) 100%)",
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 16,
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 6,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80,
        background: `radial-gradient(circle, ${clr}18, transparent 70%)`,
        borderRadius: "50%",
        pointerEvents: "none",
      }} />
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ fontSize: 28, fontWeight: 800, color: clr, fontFamily: FONT_HEAD, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--gpa-text-muted)", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--gpa-text-faint)" }}>{sub}</div>}
      {note && (
        <div style={{
          marginTop: 4, fontSize: 10,
          color: clr, background: `${clr}18`,
          border: `1px solid ${clr}33`, borderRadius: 6,
          padding: "2px 8px", alignSelf: "flex-start",
        }}>{note}</div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,18,28,0.96)", border: "1px solid rgba(255,255,255,.1)",
      borderRadius: 10, padding: "8px 14px", fontSize: 12, fontFamily: FONT,
    }}>
      <div style={{ color: "var(--gpa-text-muted)", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

/* ─── Section: Overview ─── */
function OverviewSection({ data }: { data: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 14 }}>
        <StatCard icon="👥" label="إجمالي المستخدمين" value={data.totalUsers} clr={PALETTE.accent}
          note={`+${data.newUsersToday} اليوم`} />
        <StatCard icon="✅" label="أكملوا الإعداد" value={data.usersWithProfile}
          sub={`معدل التفعيل: ${data.activationRate}%`} clr={PALETTE.purple} />
        <StatCard icon="📈" label="مستخدمون جدد" value={data.newUsersWeek}
          sub="الأسبوع الماضي" clr={PALETTE.blue} />
        <StatCard icon="📚" label="إجمالي الفصول" value={data.totalSemesters}
          sub={`${data.totalCourses} مادة مسجلة`} clr={PALETTE.orange} />
        <StatCard icon="🎓" label="متوسط المعدل" value={data.avgGpa.toFixed(2)}
          sub="عبر جميع المستخدمين" clr={gpaClr(data.avgGpa)} />
        <StatCard icon="🔔" label="إجمالي التذكيرات" value={data.totalReminders}
          sub="مهام مسجلة" clr={PALETTE.pink} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* GPA Distribution */}
        <div style={{
          background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14, padding: "18px 16px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 14 }}>
            📊 توزيع المعدلات
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.gpaDist} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="label" tick={{ fill: "var(--gpa-text-muted)", fontSize: 10, fontFamily: FONT }} />
              <YAxis tick={{ fill: "var(--gpa-text-faint)", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="مستخدمون" radius={[6, 6, 0, 0]}>
                {data.gpaDist.map((d: any, i: number) => (
                  <Cell key={i} fill={d.clr} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Registration timeline */}
        <div style={{
          background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14, padding: "18px 16px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 14 }}>
            📅 تسجيلات آخر 30 يوم
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.timeline}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={PALETTE.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="date" tick={{ fill: "var(--gpa-text-faint)", fontSize: 9, fontFamily: FONT }}
                interval={6} />
              <YAxis tick={{ fill: "var(--gpa-text-faint)", fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="مستخدمون جدد"
                stroke={PALETTE.accent} strokeWidth={2.5} fill="url(#regGrad)"
                dot={false} activeDot={{ r: 4, fill: PALETTE.accent }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* University + Level row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Universities */}
        <div style={{
          background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14, padding: "18px 16px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 14 }}>
            🏫 أبرز الجامعات
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.universities.map((u: any, i: number) => {
              const max = data.universities[0]?.count || 1;
              const pct = Math.round((u.count / max) * 100);
              const clrs = [PALETTE.accent, PALETTE.purple, PALETTE.blue, PALETTE.orange,
                PALETTE.red, PALETTE.pink, "#34d399", "#f97316"];
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--gpa-text-soft)", fontWeight: 600,
                      maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name}
                    </span>
                    <span style={{ fontSize: 11, color: clrs[i % clrs.length], fontWeight: 700 }}>
                      {u.count}
                    </span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: `linear-gradient(90deg,${clrs[i % clrs.length]},${clrs[(i + 1) % clrs.length]})`,
                      borderRadius: 2, transition: "width .5s",
                    }} />
                  </div>
                </div>
              );
            })}
            {data.universities.length === 0 && (
              <div style={{ color: "var(--gpa-text-faint)", fontSize: 12 }}>لا توجد بيانات بعد</div>
            )}
          </div>
        </div>

        {/* Levels + Recent */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Level distribution */}
          <div style={{
            background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 10 }}>
              📖 توزيع المستويات
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {data.levels.map((l: any) => (
                <div key={l.label} style={{
                  flex: 1, textAlign: "center", background: `${l.clr}12`,
                  border: `1px solid ${l.clr}30`, borderRadius: 10, padding: "8px 4px",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: l.clr }}>{l.count}</div>
                  <div style={{ fontSize: 9, color: "var(--gpa-text-faint)", marginTop: 2 }}>{l.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scale usage */}
          <div style={{
            background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 14, padding: "14px 16px", flex: 1,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 10 }}>
              🧮 نظام التقييم
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {data.scaleUsage.map((s: any, i: number) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--gpa-text-soft)" }}>
                    {s.id === "benha" ? "🎓 جامعة بنها 2021" : s.id === "generic" ? "📐 مقياس 4.0 عام" : s.id}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: i === 0 ? PALETTE.accent : PALETTE.purple,
                    background: `${i === 0 ? PALETTE.accent : PALETTE.purple}18`,
                    border: `1px solid ${i === 0 ? PALETTE.accent : PALETTE.purple}30`,
                    borderRadius: 6, padding: "2px 8px",
                  }}>{s.count}</span>
                </div>
              ))}
              {data.scaleUsage.length === 0 && (
                <div style={{ color: "var(--gpa-text-faint)", fontSize: 12 }}>لا توجد بيانات</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent users mini-table */}
      <div style={{
        background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14, overflow: "hidden",
      }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.06)",
          fontSize: 13, fontWeight: 700, color: "var(--gpa-text)" }}>
          🕐 آخر المسجلين
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: FONT }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,.03)" }}>
                {["البريد الإلكتروني", "انضم", "الجامعة", "المعدل", "المستوى", "الحالة"].map((h) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "start", color: "var(--gpa-text-muted)",
                    fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,.06)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <td style={{ padding: "9px 14px", color: "var(--gpa-text-soft)", maxWidth: 200,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--gpa-text-faint)", whiteSpace: "nowrap" }}>
                    {fmtDate(u.joined)}
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--gpa-text-soft)", whiteSpace: "nowrap",
                    maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.uni || "—"}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {u.gpa != null ? (
                      <span style={{ color: gpaClr(u.gpa), fontWeight: 700 }}>{u.gpa.toFixed(2)}</span>
                    ) : <span style={{ color: "var(--gpa-text-faintest)" }}>—</span>}
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--gpa-text-faint)" }}>
                    {u.level ? `L${u.level}` : "—"}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: u.hasProfile ? PALETTE.accent : "var(--gpa-text-faint)",
                      background: u.hasProfile ? `${PALETTE.accent}18` : "rgba(255,255,255,.05)",
                      border: `1px solid ${u.hasProfile ? PALETTE.accent + "33" : "rgba(255,255,255,.08)"}`,
                      borderRadius: 6, padding: "2px 8px",
                    }}>{u.hasProfile ? "مفعَّل" : "غير مفعَّل"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recent.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--gpa-text-faint)", fontSize: 12 }}>
              لا يوجد مستخدمون بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Section: Users Table ─── */
function UsersSection({ overviewFn }: { overviewFn: any }) {
  const getUsersFn = useServerFn(getAdminUsers);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["adminUsers", page, search],
    queryFn: () => getUsersFn({ data: { page, search } }),
    staleTime: 30_000,
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 25);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Fetch all pages
      const allUsers: any[] = [];
      let p = 1;
      while (true) {
        const batch = await getUsersFn({ data: { page: p, search } });
        allUsers.push(...(batch?.users ?? []));
        if (allUsers.length >= (batch?.total ?? 0)) break;
        p++;
      }
      const headers = ["البريد الإلكتروني", "تاريخ الانضمام", "الجامعة", "التخصص",
        "المعدل", "الهدف", "الساعات", "المستوى", "الفصول", "النظام"];
      const rows = allUsers.map((u: any) => [
        u.email ?? "",
        u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB") : "",
        u.university_name ?? "",
        u.major ?? "",
        u.current_gpa ?? "",
        u.target_gpa ?? "",
        u.credit_hours_completed ?? "",
        u.academic_level ?? "",
        u.semester_count ?? "",
        u.grading_system ?? "",
      ]);
      const csvContent = [headers, ...rows]
        .map((r) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `termly-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const inp: React.CSSProperties = {
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 10, color: "var(--gpa-text)", padding: "9px 14px",
    fontSize: 13, fontFamily: FONT, outline: "none", width: 280,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={inp}
          placeholder="🔍 ابحث بالبريد الإلكتروني..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
        />
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          style={{
            background: `linear-gradient(135deg,${PALETTE.accent}22,${PALETTE.purple}22)`,
            border: `1px solid ${PALETTE.accent}44`,
            borderRadius: 10, color: PALETTE.accent, padding: "9px 18px",
            fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
          }}>
          بحث
        </button>
        {search && (
          <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            style={{ background: "none", border: "none", color: "var(--gpa-text-faint)",
              fontSize: 12, cursor: "pointer", fontFamily: FONT }}>
            ✕ مسح
          </button>
        )}
        <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--gpa-text-faint)" }}>
            {total} مستخدم إجمالي
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting || total === 0}
            style={{
              background: exporting ? "rgba(255,255,255,.04)" : `${PALETTE.green}18`,
              border: `1px solid ${exporting ? "rgba(255,255,255,.08)" : PALETTE.green + "44"}`,
              borderRadius: 9, color: exporting ? "var(--gpa-text-faint)" : PALETTE.green,
              padding: "7px 14px", fontSize: 12, fontWeight: 600, fontFamily: FONT,
              cursor: exporting || total === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}>
            {exporting ? (
              <>
                <span style={{ display: "inline-block", animation: "spin .8s linear infinite" }}>↻</span>
                جاري التصدير...
              </>
            ) : (
              <>⬇ تصدير CSV</>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14, overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: FONT }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,.04)" }}>
                {["البريد الإلكتروني", "تاريخ الانضمام", "الجامعة", "التخصص",
                  "المعدل", "الهدف", "الساعات", "المستوى", "الفصول", "النظام"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "start",
                    color: "var(--gpa-text-muted)", fontWeight: 600,
                    borderBottom: "1px solid rgba(255,255,255,.06)", whiteSpace: "nowrap", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={10} style={{ padding: "32px", textAlign: "center",
                  color: "var(--gpa-text-faint)" }}>جاري التحميل...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={10} style={{ padding: "32px", textAlign: "center",
                  color: PALETTE.red }}>
                  ⚠ {(error as Error).message}
                </td></tr>
              )}
              {!isLoading && !isError && users.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)",
                  transition: "background .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.025)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "9px 14px", color: u.hasProfile ? "var(--gpa-text-soft)" : "var(--gpa-text-faint)",
                    maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span title={u.email}>{u.email}</span>
                    {!u.hasProfile && (
                      <span style={{ marginInlineStart: 6, fontSize: 9, color: "var(--gpa-text-faintest)",
                        background: "rgba(255,255,255,.05)", borderRadius: 4, padding: "1px 5px" }}>
                        غير مفعَّل
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--gpa-text-faint)", whiteSpace: "nowrap" }}>
                    {fmtDate(u.joined)}
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--gpa-text-soft)",
                    maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span title={u.uni}>{u.uni || "—"}</span>
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--gpa-text-faint)",
                    maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span title={u.major}>{u.major || "—"}</span>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {u.gpa != null
                      ? <span style={{ color: gpaClr(u.gpa), fontWeight: 700 }}>{u.gpa.toFixed(2)}</span>
                      : <span style={{ color: "var(--gpa-text-faintest)" }}>—</span>}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {u.gradTarget != null
                      ? <span style={{ color: PALETTE.blue }}>{u.gradTarget.toFixed(1)}</span>
                      : <span style={{ color: "var(--gpa-text-faintest)" }}>—</span>}
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--gpa-text-faint)" }}>
                    {u.credits ?? "—"}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {u.level
                      ? <span style={{
                          color: [PALETTE.purple, PALETTE.blue, PALETTE.accent, PALETTE.orange][u.level - 1],
                          fontWeight: 700,
                        }}>L{u.level}</span>
                      : <span style={{ color: "var(--gpa-text-faintest)" }}>—</span>}
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "center" }}>
                    {u.semesters > 0
                      ? <span style={{ color: PALETTE.accent, fontWeight: 700 }}>{u.semesters}</span>
                      : <span style={{ color: "var(--gpa-text-faintest)" }}>0</span>}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {u.scale === "benha"
                      ? <span style={{ fontSize: 10, color: PALETTE.accent,
                          background: `${PALETTE.accent}18`, border: `1px solid ${PALETTE.accent}30`,
                          borderRadius: 5, padding: "2px 7px" }}>بنها</span>
                      : u.scale === "generic"
                      ? <span style={{ fontSize: 10, color: PALETTE.purple,
                          background: `${PALETTE.purple}18`, border: `1px solid ${PALETTE.purple}30`,
                          borderRadius: 5, padding: "2px 7px" }}>4.0</span>
                      : <span style={{ color: "var(--gpa-text-faintest)", fontSize: 10 }}>—</span>}
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && users.length === 0 && (
                <tr><td colSpan={10} style={{ padding: "32px", textAlign: "center",
                  color: "var(--gpa-text-faint)" }}>لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,.06)",
            display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, color: page === 1 ? "var(--gpa-text-faintest)" : "var(--gpa-text-soft)",
                padding: "6px 14px", fontSize: 12, cursor: page === 1 ? "not-allowed" : "pointer",
                fontFamily: FONT }}>
              ← السابق
            </button>
            <span style={{ fontSize: 12, color: "var(--gpa-text-muted)" }}>
              {page} / {pages}
            </span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, color: page === pages ? "var(--gpa-text-faintest)" : "var(--gpa-text-soft)",
                padding: "6px 14px", fontSize: 12, cursor: page === pages ? "not-allowed" : "pointer",
                fontFamily: FONT }}>
              التالي →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Section: Analytics ─── */
function AnalyticsSection({ data }: { data: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Full GPA chart */}
        <div style={{
          background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14, padding: "18px 16px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 14 }}>
            📊 توزيع المعدلات التفصيلي
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.gpaDist} barSize={36} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--gpa-text-faint)", fontSize: 10 }} />
              <YAxis dataKey="en" type="category"
                tick={{ fill: "var(--gpa-text-muted)", fontSize: 9, fontFamily: FONT }}
                width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="مستخدمون" radius={[0, 6, 6, 0]}>
                {data.gpaDist.map((d: any, i: number) => (
                  <Cell key={i} fill={d.clr} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Level distribution pie */}
        <div style={{
          background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14, padding: "18px 16px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 14 }}>
            📖 توزيع المستويات الأكاديمية
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.levels} dataKey="count" nameKey="label"
                cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                paddingAngle={3} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                {data.levels.map((l: any, i: number) => (
                  <Cell key={i} fill={l.clr} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: FONT }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline full */}
      <div style={{
        background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14, padding: "18px 16px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 14 }}>
          📈 منحنى التسجيلات - آخر 30 يوم
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.timeline}>
            <defs>
              <linearGradient id="regGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PALETTE.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PALETTE.accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="date" tick={{ fill: "var(--gpa-text-faint)", fontSize: 10, fontFamily: FONT }}
              interval={4} />
            <YAxis tick={{ fill: "var(--gpa-text-faint)", fontSize: 10 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" name="مستخدمون جدد"
              stroke={PALETTE.accent} strokeWidth={2.5} fill="url(#regGrad2)"
              dot={{ r: 3, fill: PALETTE.accent }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Universities full */}
      <div style={{
        background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14, padding: "18px 16px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gpa-text)", marginBottom: 14 }}>
          🏫 أبرز الجامعات المستخدِمة
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.universities} layout="vertical" barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--gpa-text-faint)", fontSize: 10 }} />
            <YAxis dataKey="name" type="category" width={140}
              tick={{ fill: "var(--gpa-text-muted)", fontSize: 10, fontFamily: FONT }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="مستخدمون" radius={[0, 6, 6, 0]}
              fill={PALETTE.accent} fillOpacity={0.75} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Root Admin Dashboard ─── */
export default function AdminDashboard() {
  const getOverviewFn = useServerFn(getAdminOverview);
  const [section, setSection] = useState<"overview" | "users" | "analytics">("overview");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const overviewQ = useQuery({
    queryKey: ["adminOverview"],
    queryFn: async () => {
      const data = await getOverviewFn();
      setLastRefreshed(new Date());
      return data;
    },
    staleTime: 60_000,
    retry: false,
  });

  const handleRefresh = () => {
    overviewQ.refetch();
  };

  const fmtRefreshed = (d: Date) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  const navBtn = (key: typeof section, label: string, icon: string) => (
    <button
      onClick={() => setSection(key)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: section === key
          ? `linear-gradient(135deg,${PALETTE.accent}18,${PALETTE.purple}18)`
          : "transparent",
        border: section === key
          ? `1px solid ${PALETTE.accent}40`
          : "1px solid transparent",
        borderRadius: 10,
        color: section === key ? PALETTE.accent : "var(--gpa-text-muted)",
        padding: "9px 14px",
        fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
        transition: "all .15s",
        textAlign: "start", width: "100%",
      }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );

  const isErr = overviewQ.isError;
  const errMsg = overviewQ.error instanceof Error ? overviewQ.error.message : "خطأ غير معروف";
  const isLoading = overviewQ.isLoading;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--gpa-bg, #0f121c)",
      fontFamily: FONT,
      direction: "rtl",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Top Header ── */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,.07)",
        background: "rgba(255,255,255,.02)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "0 24px",
        display: "flex", alignItems: "center", gap: 14,
        height: 58, flexShrink: 0, position: "sticky", top: 0, zIndex: 50,
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, fontFamily: FONT_HEAD,
          background: `linear-gradient(135deg,${PALETTE.accent},${PALETTE.purple})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Termly
        </span>
        <div style={{
          fontSize: 10, fontWeight: 700, color: PALETTE.orange,
          background: `${PALETTE.orange}18`, border: `1px solid ${PALETTE.orange}44`,
          borderRadius: 6, padding: "2px 10px", letterSpacing: ".5px",
        }}>ADMIN</div>

        <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {overviewQ.isSuccess && (
            <div style={{ fontSize: 11, color: "var(--gpa-text-faint)" }}>
              {overviewQ.data.totalUsers} مستخدم · {overviewQ.data.usersWithProfile} مفعَّل
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={overviewQ.isFetching}
            title="Refresh data"
            style={{
              background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8, color: overviewQ.isFetching ? "var(--gpa-text-faintest)" : "var(--gpa-text-muted)",
              padding: "6px 12px", fontSize: 12, fontFamily: FONT, cursor: overviewQ.isFetching ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            <span style={{
              display: "inline-block",
              animation: overviewQ.isFetching ? "spin .8s linear infinite" : "none",
            }}>↻</span>
            <span style={{ fontSize: 10, color: "var(--gpa-text-faintest)" }}>
              {fmtRefreshed(lastRefreshed)}
            </span>
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,100,100,.1)", border: "1px solid rgba(255,100,100,.25)",
              borderRadius: 8, color: PALETTE.red, padding: "6px 14px",
              fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
            }}>
            تسجيل خروج
          </button>
          <button
            onClick={() => { window.location.href = "/app"; }}
            style={{
              background: `${PALETTE.accent}18`, border: `1px solid ${PALETTE.accent}30`,
              borderRadius: 8, color: PALETTE.accent, padding: "6px 14px",
              fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
            }}>
            ← التطبيق
          </button>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: 200, flexShrink: 0,
          borderInlineStart: "1px solid rgba(255,255,255,.06)",
          padding: "20px 12px",
          display: "flex", flexDirection: "column", gap: 4,
          background: "rgba(255,255,255,.015)",
        }}>
          <div style={{ fontSize: 9, color: "var(--gpa-text-faintest)", letterSpacing: "1px",
            textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>
            التنقل
          </div>
          {navBtn("overview", "نظرة عامة", "🏠")}
          {navBtn("users", "المستخدمون", "👥")}
          {navBtn("analytics", "الإحصائيات", "📊")}

          <div style={{ marginTop: "auto", padding: "12px 8px",
            borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 10, color: "var(--gpa-text-faintest)", marginBottom: 4 }}>إعداد الأدمن</div>
            <div style={{ fontSize: 11, color: "var(--gpa-text-faint)", lineHeight: 1.6 }}>
              أضف <code style={{ color: PALETTE.accent, background: `${PALETTE.accent}12`,
                borderRadius: 4, padding: "1px 4px", fontSize: 10 }}>ADMIN_EMAILS</code><br />
              في Replit Secrets.
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* Loading skeleton */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 14 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                    borderRadius: 16, padding: "20px 22px", height: 90,
                    animation: "skeleton-pulse 1.5s ease-in-out infinite",
                    animationDelay: `${i * 0.1}s`,
                  }} />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[...Array(2)].map((_, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                    borderRadius: 14, height: 220,
                    animation: "skeleton-pulse 1.5s ease-in-out infinite",
                    animationDelay: `${(i + 6) * 0.1}s`,
                  }} />
                ))}
              </div>
              <div style={{
                background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 14, height: 280,
                animation: "skeleton-pulse 1.5s ease-in-out infinite",
                animationDelay: "0.8s",
              }} />
            </div>
          )}

          {/* Error state */}
          {isErr && (
            <div style={{
              background: "rgba(255,100,100,.06)", border: "1px solid rgba(255,100,100,.2)",
              borderRadius: 14, padding: "32px 24px", textAlign: "center", maxWidth: 540, margin: "60px auto",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: PALETTE.red, marginBottom: 8 }}>
                وصول مرفوض
              </div>
              <div style={{ fontSize: 13, color: "var(--gpa-text-muted)", marginBottom: 20, lineHeight: 1.7 }}>
                {errMsg}
              </div>
              <div style={{
                background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 10, padding: "14px 16px", textAlign: "start",
              }}>
                <div style={{ fontSize: 11, color: "var(--gpa-text-muted)", marginBottom: 10, fontWeight: 700 }}>
                  لتفعيل لوحة الأدمن:
                </div>
                <div style={{ marginBottom: 8 }}>
                  <code style={{ color: PALETTE.accent, background: `${PALETTE.accent}18`,
                    borderRadius: 5, padding: "2px 7px", fontSize: 11 }}>ADMIN_EMAILS</code>
                  <span style={{ fontSize: 11, color: "var(--gpa-text-faint)", marginInlineStart: 8 }}>
                    بريدك الإلكتروني في Replit Secrets
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
                <button onClick={() => overviewQ.refetch()}
                  style={{ background: `${PALETTE.accent}18`, border: `1px solid ${PALETTE.accent}44`,
                    borderRadius: 8, color: PALETTE.accent, padding: "8px 20px",
                    fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
                  إعادة المحاولة
                </button>
                <button onClick={() => { window.location.href = "/app"; }}
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 8, color: "var(--gpa-text-soft)", padding: "8px 20px",
                    fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}>
                  ← العودة للتطبيق
                </button>
              </div>
            </div>
          )}

          {/* Sections */}
          {overviewQ.isSuccess && (
            <>
              {section === "overview" && <OverviewSection data={overviewQ.data} />}
              {section === "users" && <UsersSection overviewFn={getAdminOverview} />}
              {section === "analytics" && <AnalyticsSection data={overviewQ.data} />}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}
      `}</style>
    </div>
  );
}
