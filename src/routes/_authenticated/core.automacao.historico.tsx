import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/automacao/historico")({
  head: () => ({ meta: [{ title: "Histórico de automações — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: RedirectToRuntime,
});

function RedirectToRuntime() {
  return <Navigate to="/admin/integracoes/n8n" replace />;
}
