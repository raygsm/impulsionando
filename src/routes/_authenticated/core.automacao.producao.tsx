import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/automacao/producao")({
  head: () => ({ meta: [{ title: "Automações em produção — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: RedirectToRuntime,
});

function RedirectToRuntime() {
  // Produção é o estado real do registry/runtime, não uma página estática.
  return <Navigate to="/admin/integracoes/n8n" replace />;
}
