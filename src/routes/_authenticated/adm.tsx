import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

// Rota oficial /adm — central operacional da Impulsionando.
// /adm sozinho redireciona para /core; filhos (ex.: /adm/agentes) renderizam normalmente.
export const Route = createFileRoute("/_authenticated/adm")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/adm" || location.pathname === "/adm/") {
      throw redirect({ to: "/core" });
    }
  },
  component: () => <Outlet />,
});
