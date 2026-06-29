import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro do Cliente — Impulsionando" }] }),
  component: TenantFinanceTab,
});

function TenantFinanceTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Financeiro
        </h2>
        <p className="text-sm text-muted-foreground">
          Plano, faturas, recorrência e inadimplência de <code>{slug}</code>.
        </p>
      </header>
      <Card className="p-6 text-sm space-y-3">
        <p>
          Acesse a visão consolidada em{" "}
          <Link to="/core/financeiro-consolidado" className="text-primary hover:underline">
            /core/financeiro-consolidado
          </Link>. Próxima entrega: filtro fixo por tenant nesta aba, com fatura aberta, MRR e ações
          de cobrança.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/core/financeiro-consolidado">Abrir financeiro consolidado</Link>
        </Button>
      </Card>
    </div>
  );
}
