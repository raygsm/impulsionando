import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { AutomacaoSubnav } from "@/components/core/automacao/AutomacaoSubnav";

export const Route = createFileRoute("/_authenticated/core/automacao")({
  head: () => ({
    meta: [
      { title: "Automação & N8N — Impulsionando" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Central de workflows N8N do ecossistema Impulsionando: fluxos, modelos, execuções, aprovações e monitoramento." },
    ],
  }),
  component: AutomacaoLayout,
});

function AutomacaoLayout() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <PageHeader
        title="Automação & N8N"
        description="Orquestração de workflows do Core Impulsionando — captação, conversão, retenção, financeiro, suporte, vitrine e clube. Nada aqui dispara canal real: aprovações e ativação de produção seguem checklist em docs/n8n/."
      />
      <AutomacaoSubnav />
      <Outlet />
    </div>
  );
}
