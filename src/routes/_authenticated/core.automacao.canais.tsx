import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/automacao/canais")({
  head: () => ({ meta: [{ title: "Canais de automação — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: RedirectToDiagnostics,
});

function RedirectToDiagnostics() {
  return <Navigate to="/core/integracoes/diagnostico" replace />;
}
