import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/automacao/fallback-humano")({
  head: () => ({ meta: [{ title: "Fallback humano — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: RedirectToRuntime,
});

function RedirectToRuntime() {
  // A página anterior descrevia uma cadeia teórica apoiada em tabelas antigas.
  // Fallback só voltará como módulo próprio quando houver execução auditável.
  return <Navigate to="/admin/integracoes/n8n" replace />;
}
