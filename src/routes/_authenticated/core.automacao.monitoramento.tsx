import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/automacao/monitoramento")({
  head: () => ({ meta: [{ title: "Monitoramento de automações — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: RedirectToHealth,
});

function RedirectToHealth() {
  return <Navigate to="/core/hub-automacoes" replace />;
}
