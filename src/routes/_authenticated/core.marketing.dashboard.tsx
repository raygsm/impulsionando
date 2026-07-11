import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { MarketingKpiBoard } from "@/components/integracoes/MarketingKpiBoard";
import { ImpulsinitoHint } from "@/components/integracoes/ImpulsinitoHint";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/marketing/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard de Marketing" }, { name: "robots", content: "noindex" }],
  }),
  component: MarketingDashboardPage,
});

function MarketingDashboardPage() {
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
        title="Dashboard de Marketing"
        description="Sessões, campanhas, conversões, ROAS, CTR, CPA, CAC e LTV consolidados."
      />
      <ImpulsinitoHint title="Como ler">
        Cada card mostra a variação em relação ao período anterior. Verde é positivo, âmbar merece
        atenção. Os números virão das suas integrações reais quando o Codex concluir a etapa.
      </ImpulsinitoHint>
      <MarketingKpiBoard />
    </div>
  );
}
