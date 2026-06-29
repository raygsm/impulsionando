import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/automacoes")({
  head: () => ({ meta: [{ title: "Automações do Cliente — Impulsionando" }] }),
  component: TenantAutomationsTab,
});

function TenantAutomationsTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Workflow className="h-5 w-5" /> Automações n8n
        </h2>
        <p className="text-sm text-muted-foreground">
          Réguas de funil e integrações ativas para <code>{slug}</code>.
        </p>
      </header>
      <Card className="p-6 text-sm space-y-3">
        <p>
          Visualização central de workflows n8n disponível em{" "}
          <Link to="/core/integracoes/n8n" className="text-primary hover:underline">
            /core/integracoes/n8n
          </Link>. Próxima entrega (W35): listar workflows vinculados ao tenant com status, última
          execução, logs e botão de teste.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/core/integracoes/n8n">Abrir integrações n8n</Link>
        </Button>
      </Card>
    </div>
  );
}
