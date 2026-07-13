/**
 * Layout do macro-nicho: apenas renderiza filhos (index + subniches).
 * Metadata específica vive nas rotas-folha.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/templates/$macro")({
  component: () => <Outlet />,
});
