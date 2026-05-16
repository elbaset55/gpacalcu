import { createFileRoute } from "@tanstack/react-router";
import GPAAdvisorApp from "@/components/gpa/GPAAdvisorApp";

export const Route = createFileRoute("/_authenticated/app")({
  component: GPAAdvisorApp,
});
