import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});
