import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/n8n-niches")({
  head: () => ({ meta: [{ title: "Réguas n8n por nicho — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: LegacyN8nNichesRedirect,
});

function LegacyN8nNichesRedirect() {
  // O editor anterior dependia de core_funnel_rules, ausente em produção.
  // Enquanto o catálogo de nichos não estiver vinculado ao registry real,
  // nenhuma UI poderá aparentar ativar/desativar regras inexistentes.
  return <Navigate to="/admin/integracoes/n8n" replace />;
}
