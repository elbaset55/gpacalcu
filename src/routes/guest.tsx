import { createFileRoute } from "@tanstack/react-router";
import GPAAdvisorApp from "@/components/gpa/GPAAdvisorApp";

export const Route = createFileRoute("/guest")({
  component: GuestRoute,
});

function GuestRoute() {
  return <GPAAdvisorApp isGuest={true} />;
}
