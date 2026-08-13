import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/automacao/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks de automação — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: RedirectToRuntime,
});

function RedirectToRuntime() {
  // A tela antiga inferia caminhos de webhook a partir do slug. O Core só
  // exibirá webhooks novamente depois de sincronizar o path efetivo do n8n.
  return <Navigate to="/admin/integracoes/n8n" replace />;
}
