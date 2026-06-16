import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { query } from "@/integrations/replit/db";
import { z } from "zod";
import { checkRateLimit } from "./rate-limit";

const profileSchema = z.object({
  lang: z.string().max(8),
  scale_id: z.string().max(16),
  is_benha: z.boolean(),
  total_req: z.number().int().min(60).max(400),
  uni_name: z.string().max(200).default(""),
  major: z.string().max(200).default(""),
  prev_gpa: z.number().min(0).max(4),
  prev_cr: z.number().int().min(0).max(500),
  semester: z.string().max(16),
  has_failed: z.boolean(),
  min_prev_sem_gpa: z.number().min(0).max(4),
  grad_target: z.number().min(0).max(4),
  current_level: z.number().int().min(1).max(6).default(1),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { rows } = await query(
      `SELECT * FROM academic_profiles WHERE user_id = $1`,
      [userId],
    );
    return rows[0] ?? null;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const rl = checkRateLimit(`saveProfile:${userId}`, 20, 60_000);
    if (!rl.allowed) throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`);
    await query(
      `INSERT INTO academic_profiles
         (user_id, lang, scale_id, is_benha, total_req, uni_name, major, prev_gpa, prev_cr,
          semester, has_failed, min_prev_sem_gpa, grad_target, current_level, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         lang=EXCLUDED.lang, scale_id=EXCLUDED.scale_id, is_benha=EXCLUDED.is_benha,
         total_req=EXCLUDED.total_req, uni_name=EXCLUDED.uni_name, major=EXCLUDED.major,
         prev_gpa=EXCLUDED.prev_gpa, prev_cr=EXCLUDED.prev_cr, semester=EXCLUDED.semester,
         has_failed=EXCLUDED.has_failed, min_prev_sem_gpa=EXCLUDED.min_prev_sem_gpa,
         grad_target=EXCLUDED.grad_target, current_level=EXCLUDED.current_level,
         updated_at=NOW()`,
      [
        userId, data.lang, data.scale_id, data.is_benha, data.total_req,
        data.uni_name, data.major, data.prev_gpa, data.prev_cr, data.semester,
        data.has_failed, data.min_prev_sem_gpa, data.grad_target, data.current_level,
      ],
    );
    return { ok: true };
  });

export const deleteProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await query(`DELETE FROM courses WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM semesters WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM academic_profiles WHERE user_id = $1`, [userId]);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await query(`DELETE FROM courses WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM semesters WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM reminders WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM academic_profiles WHERE user_id = $1`, [userId]);
    // Delete all active sessions so the cookie is immediately invalidated
    await query(`DELETE FROM sessions WHERE sess->>'userId' = $1`, [userId]);
    await query(`DELETE FROM replit_users WHERE id = $1`, [userId]);
    return { ok: true };
  });

const saveSemesterSchema = z.object({
  label: z.string().min(1).max(80),
  sem_type: z.string().max(16),
  year: z.number().int().min(1900).max(2200).optional().nullable(),
  courses: z
    .array(
      z.object({
        name: z.string().max(120),
        code: z.string().max(40).optional().default(""),
        credits: z.number().int().min(0).max(12),
        grade_letter: z.string().max(8).optional().nullable(),
        grade_pts: z.number().min(0).max(4).optional().nullable(),
      }),
    )
    .min(1)
    .max(20),
});

export const saveSemester = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => saveSemesterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const rl = checkRateLimit(`saveSemester:${userId}`, 10, 60_000);
    if (!rl.allowed) throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`);

    const existing = await query(
      `SELECT id FROM semesters WHERE user_id = $1 AND label = $2`,
      [userId, data.label],
    );
    if (existing.rows[0]) {
      throw new Error(
        `A semester named "${data.label}" already exists. Please use a different name.`,
      );
    }

    const semResult = await query(
      `INSERT INTO semesters (user_id, label, sem_type, year)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, data.label, data.sem_type, data.year ?? null],
    );
    const semId = semResult.rows[0].id as string;

    const courseValues = data.courses
      .map((_, i) => {
        const base = i * 7;
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7})`;
      })
      .join(",");
    const courseParams = data.courses.flatMap((c) => [
      userId,
      semId,
      c.name || "—",
      c.code ?? "",
      c.credits,
      c.grade_letter ?? null,
      c.grade_pts ?? null,
    ]);

    try {
      await query(
        `INSERT INTO courses (user_id, semester_id, name, code, credits, grade_letter, grade_pts)
         VALUES ${courseValues}`,
        courseParams,
      );
    } catch (e) {
      await query(`DELETE FROM semesters WHERE id = $1`, [semId]);
      throw e;
    }

    return { ok: true, semesterId: semId };
  });

export const listSemesters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { rows: semesters } = await query(
      `SELECT * FROM semesters WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
    const { rows: courses } = await query(
      `SELECT * FROM courses WHERE user_id = $1`,
      [userId],
    );
    return { semesters, courses };
  });
