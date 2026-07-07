import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/automacao/logs")({
  head: () => ({ meta: [{ title: "Logs — Automação" }, { name: "robots", content: "noindex" }] }),
  component: LogsPage,
});

function LogsPage() {
  return (
    <Card className="p-6 space-y-3 text-sm">
      <h2 className="text-base font-semibold">Trilha de execuções</h2>
      <p className="text-muted-foreground">
        Logs reais são gravados por <code>/api/public/hooks/n8n-log</code> na tabela
        <code className="mx-1">n8n_workflow_runs</code> e consumidos pelo painel legado de integração N8N.
      </p>
      <Link to="/core/integracoes/n8n" className="inline-flex items-center gap-1 text-primary hover:underline">
        Abrir painel de integração N8N <ExternalLink className="h-3.5 w-3.5" />
      </Link>
      <p className="text-xs text-muted-foreground pt-3 border-t">
        Painel dedicado com filtros por tenant/régua/status será entregue na Onda 4 (requer view agregada
        <code className="mx-1">v_n8n_metrics</code>, pendente em docs/n8n/PENDENCIAS.md).
      </p>
    </Card>
  );
}
