import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/automacao/erros")({
  head: () => ({ meta: [{ title: "Erros de automação — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: RedirectToRuntime,
});

function RedirectToRuntime() {
  return <Navigate to="/admin/integracoes/n8n" replace />;
}
