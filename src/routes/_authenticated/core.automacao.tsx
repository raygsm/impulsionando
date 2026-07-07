import { createFileRoute, Link, Outlet, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { PageHeader } from "@/components/app/PageElements";
import { AutomacaoSubnav } from "@/components/core/automacao/AutomacaoSubnav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users } from "lucide-react";

const automacaoSearchSchema = z.object({
  tenant: z.string().min(1).optional(),
});

export const Route = createFileRoute("/_authenticated/core/automacao")({
  head: () => ({
    meta: [
      { title: "Automação & N8N — Impulsionando" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Central de workflows N8N do ecossistema Impulsionando: fluxos, modelos, execuções, aprovações e monitoramento." },
    ],
  }),
  validateSearch: automacaoSearchSchema,
  component: AutomacaoLayout,
});

function AutomacaoLayout() {
  const { tenant } = useSearch({ from: "/_authenticated/core/automacao" });
  return (
    <div className="mx-auto max-w-7xl p-6">
      <PageHeader
        title="Automação & N8N"
        description="Orquestração de workflows do Core Impulsionando — captação, conversão, retenção, financeiro, suporte, vitrine e clube. Nada aqui dispara canal real: aprovações e ativação de produção seguem checklist em docs/n8n/."
      />
      {tenant ? (
        <Alert className="mb-4">
          <Users className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Escopo: cliente <code className="px-1 bg-muted rounded">{tenant}</code>
          </AlertTitle>
          <AlertDescription className="text-xs">
            Visualização contextual — filtros e ações permanecem em modo demo e exigem aprovação
            backend antes de disparar canal real.{" "}
            <Link
              to="/admin/clientes/$slug/automacoes"
              params={{ slug: tenant }}
              className="text-primary hover:underline"
            >
              Voltar ao workspace do cliente
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      <AutomacaoSubnav />
      <Outlet />
    </div>
  );
}
