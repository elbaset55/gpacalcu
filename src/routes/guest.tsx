import { createFileRoute } from "@tanstack/react-router";
import GPAAdvisorApp from "@/components/gpa/GPAAdvisorApp";

export const Route = createFileRoute("/guest")({
  validateSearch: (search: Record<string, unknown>) => ({
    onboard: search.onboard === "1",
  }),
  component: GuestRoute,
});

function GuestRoute() {
  const { onboard } = Route.useSearch();
  return <GPAAdvisorApp isGuest={true} forceSetup={onboard} />;
}
