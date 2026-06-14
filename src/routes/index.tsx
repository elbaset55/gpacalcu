import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { query } from "@/integrations/replit/db";

const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  if (typeof window !== "undefined") return { loggedIn: false };
  const { default: mod } = await import("@tanstack/react-start/server");
  const request = mod.getWebRequest?.();
  if (!request) return { loggedIn: false };
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)termly_sid=([^;]+)/);
  if (!match) return { loggedIn: false };
  const sessionId = decodeURIComponent(match[1]);
  const { rows } = await query(
    `SELECT sid FROM sessions WHERE sid = $1 AND expire > NOW()`,
    [sessionId],
  );
  return { loggedIn: rows.length > 0 };
});

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const cookie = document.cookie;
    const hasSid = /(?:^|;\s*)termly_sid=/.test(cookie);
    if (hasSid) {
      throw redirect({ to: "/app" });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
