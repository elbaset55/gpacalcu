import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { query } from "@/integrations/replit/db";

function assertAdmin(user: { email: string | null } | null) {
  const email = (user?.email ?? "").toLowerCase();
  const raw = process.env.ADMIN_EMAILS ?? "";
  if (!raw.trim()) {
    throw new Error(
      "ADMIN_EMAILS is not configured. Add it to Secrets (comma-separated emails)."
    );
  }
  const allowed = raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(email)) {
    throw new Error(
      `Access denied: "${user?.email || "unknown"}" is not in the admin list.`
    );
  }
}

/* ─── Build a 30-day date array ─── */
function last30Days(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    });
  }
  return out;
}

/* ════════════════════════════════════════
   OVERVIEW
════════════════════════════════════════ */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin(context.user);

    const [
      usersRes,
      profilesRes,
      semRes,
      courseRes,
      reminderRes,
      gpaRes,
      uniRes,
      levelRes,
      scaleRes,
      recentRes,
      timelineRes,
      weekRes,
      todayRes,
      avgSemsRes,
    ] = await Promise.all([
      query<{ c: string }>("SELECT COUNT(*) AS c FROM replit_users"),
      query<{ c: string }>("SELECT COUNT(*) AS c FROM academic_profiles"),
      query<{ c: string }>("SELECT COUNT(*) AS c FROM semesters"),
      query<{ c: string }>("SELECT COUNT(*) AS c FROM courses"),
      query<{ c: string }>("SELECT COUNT(*) AS c FROM reminders"),
      query<{
        excellent: string; verygood: string; good: string;
        atrisk: string; avg_gpa: string | null;
      }>(`
        SELECT
          SUM(CASE WHEN prev_gpa >= 3.667 THEN 1 ELSE 0 END)::text AS excellent,
          SUM(CASE WHEN prev_gpa >= 3.0 AND prev_gpa < 3.667 THEN 1 ELSE 0 END)::text AS verygood,
          SUM(CASE WHEN prev_gpa >= 2.0 AND prev_gpa < 3.0 THEN 1 ELSE 0 END)::text AS good,
          SUM(CASE WHEN prev_gpa < 2.0 THEN 1 ELSE 0 END)::text AS atrisk,
          AVG(prev_gpa)::text AS avg_gpa
        FROM academic_profiles
      `),
      query<{ uni_name: string; cnt: string }>(`
        SELECT uni_name, COUNT(*) AS cnt
        FROM academic_profiles
        WHERE uni_name IS NOT NULL AND uni_name <> ''
        GROUP BY uni_name ORDER BY cnt DESC LIMIT 8
      `),
      query<{ current_level: number; cnt: string }>(`
        SELECT current_level, COUNT(*) AS cnt
        FROM academic_profiles GROUP BY current_level
      `),
      query<{ scale_id: string; cnt: string }>(`
        SELECT scale_id, COUNT(*) AS cnt
        FROM academic_profiles GROUP BY scale_id
      `),
      query<{
        id: string; email: string | null; created_at: string;
        uni_name: string | null; major: string | null;
        prev_gpa: number | null; current_level: number | null; has_profile: boolean;
      }>(`
        SELECT
          ru.id, ru.email, ru.created_at,
          ap.uni_name, ap.major, ap.prev_gpa, ap.current_level,
          (ap.user_id IS NOT NULL) AS has_profile
        FROM replit_users ru
        LEFT JOIN academic_profiles ap ON ru.id = ap.user_id
        ORDER BY ru.created_at DESC LIMIT 10
      `),
      query<{ d: string; cnt: string }>(`
        SELECT DATE(created_at)::text AS d, COUNT(*) AS cnt
        FROM replit_users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY d ORDER BY d
      `),
      query<{ c: string }>(
        "SELECT COUNT(*) AS c FROM replit_users WHERE created_at >= NOW() - INTERVAL '7 days'"
      ),
      query<{ c: string }>(
        "SELECT COUNT(*) AS c FROM replit_users WHERE created_at >= NOW() - INTERVAL '1 day'"
      ),
      query<{ avg_sems: string | null }>(`
        SELECT ROUND(AVG(sem_count),1)::text AS avg_sems
        FROM (SELECT COUNT(*) AS sem_count FROM semesters GROUP BY user_id) t
      `),
    ]);

    const g = gpaRes.rows[0];
    const totalUsers = parseInt(usersRes.rows[0]?.c ?? "0");
    const usersWithProfile = parseInt(profilesRes.rows[0]?.c ?? "0");
    const avgGpa = g?.avg_gpa ? Math.round(parseFloat(g.avg_gpa) * 1000) / 1000 : 0;

    /* GPA distribution */
    const gpaDist = [
      { label: "ممتاز", en: "Excellent (≥3.667)", count: parseInt(g?.excellent ?? "0"), clr: "#4fffb0" },
      { label: "جيد جداً", en: "Very Good (≥3.0)", count: parseInt(g?.verygood ?? "0"), clr: "#a78bfa" },
      { label: "جيد", en: "Good (≥2.0)", count: parseInt(g?.good ?? "0"), clr: "#38d9f5" },
      { label: "خطر", en: "At Risk (<2.0)", count: parseInt(g?.atrisk ?? "0"), clr: "#ff6b6b" },
    ];

    /* Universities */
    const universities = uniRes.rows.map((r: { uni_name: string; cnt: string }) => ({
      name: r.uni_name, count: parseInt(r.cnt),
    }));

    /* Levels */
    const levelMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    levelRes.rows.forEach((r: { current_level: number; cnt: string }) => {
      const l = Math.min(4, Math.max(1, r.current_level));
      levelMap[l] = (levelMap[l] || 0) + parseInt(r.cnt);
    });
    const levels = [
      { label: "Level 1", count: levelMap[1], clr: "#a78bfa" },
      { label: "Level 2", count: levelMap[2], clr: "#38bdf8" },
      { label: "Level 3", count: levelMap[3], clr: "#4fffb0" },
      { label: "Level 4", count: levelMap[4], clr: "#fbbf24" },
    ];

    /* Scale usage */
    const scaleUsage = scaleRes.rows.map((r: { scale_id: string; cnt: string }) => ({
      id: r.scale_id, count: parseInt(r.cnt),
    }));

    /* 30-day timeline — fill zeros for missing days */
    const timeMap: Record<string, number> = {};
    timelineRes.rows.forEach((r: { d: string; cnt: string }) => { timeMap[r.d] = parseInt(r.cnt); });
    const timeline = last30Days().map(({ iso, label }) => ({
      date: label,
      count: timeMap[iso] ?? 0,
    }));

    /* Recent users */
    const recent = recentRes.rows.map((r: {
      id: string; email: string | null; created_at: string;
      uni_name: string | null; major: string | null;
      prev_gpa: number | null; current_level: number | null; has_profile: boolean;
    }) => ({
      id: r.id,
      email: r.email || "—",
      joined: r.created_at,
      hasProfile: r.has_profile,
      uni: r.uni_name || "",
      major: r.major || "",
      gpa: r.prev_gpa != null ? Number(r.prev_gpa) : null,
      level: r.current_level != null ? Number(r.current_level) : null,
    }));

    return {
      totalUsers,
      usersWithProfile,
      activationRate: totalUsers ? Math.round((usersWithProfile / totalUsers) * 100) : 0,
      newUsersWeek: parseInt(weekRes.rows[0]?.c ?? "0"),
      newUsersToday: parseInt(todayRes.rows[0]?.c ?? "0"),
      totalSemesters: parseInt(semRes.rows[0]?.c ?? "0"),
      totalCourses: parseInt(courseRes.rows[0]?.c ?? "0"),
      totalReminders: parseInt(reminderRes.rows[0]?.c ?? "0"),
      avgGpa,
      avgSemsPerUser: parseFloat(avgSemsRes.rows[0]?.avg_sems ?? "0") || 0,
      gpaDist,
      universities,
      levels,
      scaleUsage,
      timeline,
      recent,
    };
  });

/* ════════════════════════════════════════
   USERS LIST
════════════════════════════════════════ */
export const getAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { page?: number; search?: string } | null;
    return { page: Math.max(1, i?.page ?? 1), search: (i?.search ?? "").trim() };
  })
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);

    const perPage = 25;
    const offset = (data.page - 1) * perPage;
    const like = `%${data.search}%`;

    const [usersRes, countRes] = await Promise.all([
      query<{
        id: string; email: string | null; created_at: string;
        uni_name: string | null; major: string | null;
        prev_gpa: number | null; current_level: number | null;
        scale_id: string | null; prev_cr: number | null;
        grad_target: number | null; is_benha: boolean | null;
        sem_count: string;
      }>(`
        SELECT
          ru.id, ru.email, ru.created_at,
          ap.uni_name, ap.major, ap.prev_gpa, ap.current_level,
          ap.scale_id, ap.prev_cr, ap.grad_target, ap.is_benha,
          COALESCE((
            SELECT COUNT(*) FROM semesters s WHERE s.user_id = ru.id
          ), 0)::text AS sem_count
        FROM replit_users ru
        LEFT JOIN academic_profiles ap ON ru.id = ap.user_id
        WHERE $1 = '' OR ru.email ILIKE $1
        ORDER BY ru.created_at DESC
        LIMIT $2 OFFSET $3
      `, [like === "%%" ? "" : like, perPage, offset]),
      query<{ c: string }>(`
        SELECT COUNT(*) AS c FROM replit_users
        WHERE $1 = '' OR email ILIKE $1
      `, [like === "%%" ? "" : like]),
    ]);

    const users = usersRes.rows.map((r: {
      id: string; email: string | null; created_at: string;
      uni_name: string | null; major: string | null; prev_gpa: number | null;
      current_level: number | null; scale_id: string | null; prev_cr: number | null;
      grad_target: number | null; is_benha: boolean | null; sem_count: string;
    }) => ({
      id: r.id,
      email: r.email || "—",
      joined: r.created_at,
      hasProfile: r.uni_name != null || r.prev_gpa != null,
      uni: r.uni_name || "",
      major: r.major || "",
      gpa: r.prev_gpa != null ? Number(r.prev_gpa) : null,
      level: r.current_level != null ? Number(r.current_level) : null,
      scale: r.scale_id || "",
      credits: r.prev_cr != null ? Number(r.prev_cr) : null,
      gradTarget: r.grad_target != null ? Number(r.grad_target) : null,
      isBenha: r.is_benha ?? false,
      semesters: parseInt(r.sem_count ?? "0"),
    }));

    return { users, total: parseInt(countRes.rows[0]?.c ?? "0") };
  });
