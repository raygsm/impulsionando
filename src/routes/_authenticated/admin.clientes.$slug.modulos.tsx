import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Boxes, ArrowRight } from "lucide-react";
import { CoreSection, EmptyState } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/modulos")({
  head: () => ({ meta: [{ title: "Módulos do Cliente — Impulsionando" }] }),
  component: TenantModulesTab,
});

function TenantModulesTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title="Módulos ativos do cliente"
        description={`Catálogo, ativação, dependências e planos vinculados de ${slug}. A visão consolidada segue no catálogo global enquanto a ativação por cliente é preparada nesta aba.`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/modules">
              Abrir catálogo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <EmptyState
          icon={<Boxes className="h-5 w-5" aria-hidden />}
          title="Central de módulos deste cliente em consolidação"
          description="A ativação por módulo, dependências e histórico de mudanças aparecerão aqui automaticamente conforme o cliente contratar ou reconfigurar recursos. Enquanto isso, o catálogo global permite operar cada módulo com todas as regras do plano vigente."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/modules">Gerenciar no catálogo</Link>
            </Button>
          }
        />
      </CoreSection>
    </div>
  );
}
