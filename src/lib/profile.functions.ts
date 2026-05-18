import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("academic_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("academic_profiles")
      .upsert({ ...data, user_id: userId }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("courses").delete().eq("user_id", userId);
    await supabase.from("semesters").delete().eq("user_id", userId);
    await supabase.from("academic_profiles").delete().eq("user_id", userId);
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
  .inputValidator((input: unknown) => saveSemesterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sem, error: e1 } = await supabase
      .from("semesters")
      .insert({
        user_id: userId,
        label: data.label,
        sem_type: data.sem_type,
        year: data.year ?? null,
      })
      .select()
      .single();
    if (e1 || !sem) throw new Error(e1?.message ?? "Failed to save semester");

    const rows = data.courses.map((c) => ({
      user_id: userId,
      semester_id: sem.id,
      name: c.name || "—",
      code: c.code ?? "",
      credits: c.credits,
      grade_letter: c.grade_letter ?? null,
      grade_pts: c.grade_pts ?? null,
    }));
    const { error: e2 } = await supabase.from("courses").insert(rows);
    if (e2) throw new Error(e2.message);
    return { ok: true, semesterId: sem.id };
  });

export const listSemesters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: semesters, error: e1 } = await supabase
      .from("semesters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (e1) throw new Error(e1.message);
    const { data: courses, error: e2 } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", userId);
    if (e2) throw new Error(e2.message);
    return {
      semesters: semesters ?? [],
      courses: courses ?? [],
    };
  });
