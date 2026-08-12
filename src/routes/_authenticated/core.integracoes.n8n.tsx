import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/integracoes/n8n")({
  head: () => ({
    meta: [
      { title: "n8n — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: N8nCoreRedirect,
});

function N8nCoreRedirect() {
  // Há um único painel operacional do n8n. Mantemos esta rota histórica
  // apenas como entrada compatível, evitando dois lugares com estados distintos.
  return <Navigate to="/admin/integracoes/n8n" replace />;
}
