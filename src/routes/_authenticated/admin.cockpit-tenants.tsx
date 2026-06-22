// Legacy redirect → rota canônica /admin/master-hub (vertente Clientes).
// Mantido para não quebrar bookmarks/URLs antigos da equipe.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/cockpit-tenants")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/master-hub" });
  },
});
