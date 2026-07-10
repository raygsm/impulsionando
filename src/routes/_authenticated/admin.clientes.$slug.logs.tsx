import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { CoreSection, EmptyState } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/logs")({
  head: () => ({ meta: [{ title: "Logs & Auditoria do Cliente — Impulsionando" }] }),
  component: TenantLogsTab,
});

function TenantLogsTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title="Logs e auditoria"
        description={`Histórico de ações sensíveis, eventos LGPD e compliance do cliente ${slug}. Filtros por período, severidade e origem serão consolidados nesta aba.`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/audit-trail">
              Audit trail global <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
          title="Trilha de auditoria filtrada por cliente em consolidação"
          description="Os eventos deste cliente aparecerão aqui automaticamente, com filtros por severidade, período, origem e usuário. Enquanto isso, a trilha global registra e preserva todo o histórico auditável."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/audit-trail">Consultar audit trail</Link>
            </Button>
          }
        />
      </CoreSection>
    </div>
  );
}
