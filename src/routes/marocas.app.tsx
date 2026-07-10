import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/marocas/app")({
  component: () => <Outlet />,
});
