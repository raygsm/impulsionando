import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { AlertsPanel } from "@/components/integracoes/AlertsPanel";
import { ImpulsinitoHint } from "@/components/integracoes/ImpulsinitoHint";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/integracoes/alertas")({
  head: () => ({
    meta: [{ title: "Alertas de integrações" }, { name: "robots", content: "noindex" }],
  }),
  component: AlertasPage,
});

function AlertasPage() {
  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
          <Link to="/core/integracoes">
            <ChevronLeft className="h-4 w-4" /> Integrações
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Alertas"
        description="Tokens expirados, canais desconectados e configurações pendentes."
      />
      <ImpulsinitoHint title="Prioridade">
        Comece pelos alertas em vermelho — eles interrompem o fluxo de dados. Os amarelos avisam antes
        que algo pare de funcionar.
      </ImpulsinitoHint>
      <AlertsPanel />
    </div>
  );
}
