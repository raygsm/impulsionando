import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowRight } from "lucide-react";
import { CoreSection, EmptyState } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro do Cliente — Impulsionando" }] }),
  component: TenantFinanceTab,
});

function TenantFinanceTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title="Financeiro do cliente"
        description={`Contratos, recorrência, faturas, repasses e histórico financeiro de ${slug}. Sempre em BRL, com dados consolidados a partir dos módulos ativos.`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/core/financeiro-consolidado">
              Financeiro consolidado <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <EmptyState
          icon={<CreditCard className="h-5 w-5" aria-hidden />}
          title="Painel financeiro deste cliente em consolidação"
          description="MRR, fatura em aberto, próximas cobranças e inadimplência aparecerão aqui automaticamente conforme o cliente registrar movimentações. A visão global consolida hoje todos os clientes, com filtro por período e status."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/core/financeiro-consolidado">Abrir visão consolidada</Link>
            </Button>
          }
        />
      </CoreSection>
    </div>
  );
}
