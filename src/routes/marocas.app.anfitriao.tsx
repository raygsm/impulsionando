import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/marocas/app/anfitriao")({
  component: () => <Outlet />,
});
