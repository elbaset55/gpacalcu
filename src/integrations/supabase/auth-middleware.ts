import { createMiddleware } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { query } from "@/integrations/replit/db";

export interface ReplitUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

function getSessionId(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)termly_sid=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function getUserFromSession(sessionId: string): Promise<ReplitUser | null> {
  const { rows } = await query(
    `SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()`,
    [sessionId],
  );
  if (!rows[0]) return null;
  const sess = rows[0].sess as { userId?: string };
  if (!sess?.userId) return null;
  const { rows: userRows } = await query(
    `SELECT id, email, first_name, last_name, profile_image_url FROM replit_users WHERE id = $1`,
    [sess.userId],
  );
  if (!userRows[0]) return null;
  const u = userRows[0] as Record<string, string | null>;
  return {
    id: u.id as string,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    profileImageUrl: u.profile_image_url,
  };
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getWebRequest();
    if (!request?.headers) throw new Error("Unauthorized");

    const sessionId = getSessionId(request);
    if (!sessionId) throw new Error("Unauthorized");

    const user = await getUserFromSession(sessionId);
    if (!user) throw new Error("Unauthorized");

    return next({
      context: {
        userId: user.id,
        user,
      },
    });
  },
);
