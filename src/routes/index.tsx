import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      // Server-side: send a 302 to /login immediately — no white screen.
      // If the user has a valid session, _authenticated layout handles the auth guard.
      throw redirect({ to: "/login" });
    }
    // Client-side: check cookie directly
    const hasSid = /(?:^|;\s*)termly_sid=/.test(document.cookie);
    throw redirect({ to: hasSid ? "/app" : "/login" });
  },
  component: () => null,
});
