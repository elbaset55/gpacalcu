import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { query } from "@/integrations/replit/db";
import { z } from "zod";
import { checkRateLimit } from "./rate-limit";

const newReminderSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(2000).default(""),
  kind: z.string().max(40).default("general"),
  due_at: z.string(),
});

export const listReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { rows } = await query(
      `SELECT id, title, body, kind, due_at, done FROM reminders
       WHERE user_id = $1 ORDER BY due_at ASC`,
      [userId],
    );
    return rows as Array<{
      id: string;
      title: string;
      body: string;
      kind: string;
      due_at: string;
      done: boolean;
    }>;
  });

export const addReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => newReminderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const rl = checkRateLimit(`addReminder:${userId}`, 30, 60_000);
    if (!rl.allowed) throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`);
    await query(
      `INSERT INTO reminders (user_id, title, body, kind, due_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, data.title, data.body, data.kind, data.due_at],
    );
    return { ok: true };
  });

export const toggleReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), done: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await query(
      `UPDATE reminders SET done = $1 WHERE id = $2 AND user_id = $3`,
      [data.done, data.id, userId],
    );
    return { ok: true };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await query(
      `DELETE FROM reminders WHERE id = $1 AND user_id = $2`,
      [data.id, userId],
    );
    return { ok: true };
  });
