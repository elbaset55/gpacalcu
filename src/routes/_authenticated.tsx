import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") {
      // SSR: always redirect to login; client hydration re-checks via cookie
      throw redirect({
        to: "/login",
        search: { redirect: location.href, error: undefined },
      });
    }
    // Client-side: check for the Replit session cookie
    const hasSid = /(?:^|;\s*)termly_sid=/.test(document.cookie);
    if (!hasSid) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href, error: undefined },
      });
    }
  },
  component: () => <Outlet />,
});
