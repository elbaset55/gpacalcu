import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      throw redirect({ to: "/login", search: { redirect: "/", error: undefined } });
    }
    const hasSid = /(?:^|;\s*)termly_sid=/.test(document.cookie);
    if (hasSid) {
      throw redirect({ to: "/app" });
    }
    throw redirect({ to: "/login", search: { redirect: "/", error: undefined } });
  },
  component: () => null,
});
