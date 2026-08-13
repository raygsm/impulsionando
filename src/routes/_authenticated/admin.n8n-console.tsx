import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/n8n-console")({
  head: () => ({ meta: [{ title: "Console n8n — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: LegacyN8nConsoleRedirect,
});

function LegacyN8nConsoleRedirect() {
  // O console anterior dependia de n8n_workflow_runs e core_funnel_dispatch_queue,
  // estruturas ausentes em produção. Mantemos a URL histórica apenas como
  // compatibilidade e convergimos para o painel baseado no registry real.
  return <Navigate to="/admin/integracoes/n8n" replace />;
}
