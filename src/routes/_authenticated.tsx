import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { query } from "@/integrations/replit/db";

const checkSession = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  if (!request?.headers) return { loggedIn: false };
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

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window !== "undefined") {
      const hasSid = /(?:^|;\s*)termly_sid=/.test(document.cookie);
      if (!hasSid) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href },
        });
      }
      return;
    }
    const result = await checkSession();
    if (!result.loggedIn) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
});
