import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/core/automacao/demonstracoes")({
  head: () => ({ meta: [{ title: "Demonstrações de automação — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: RedirectToCatalog,
});

function RedirectToCatalog() {
  // O catálogo de fluxos pode ser consultado sem sugerir que payload fictício
  // representa execução de produção.
  return <Navigate to="/core/automacao/fluxos" search={{ mode: "demo" }} replace />;
}
