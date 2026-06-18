import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { PercebidoSection } from "@/components/insights/PercebidoSection";
import { useAudience } from "@/hooks/use-audience";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/insights/percebido")({
  head: () => ({ meta: [{ title: "O que a Impulsionando percebeu" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PercebidoPage,
});

function PercebidoPage() {
  const { audience, label } = useAudience();
  const { companyId } = useActiveCompany();

  return (
    <div className="space-y-6">
      <PageHeader title="O que a Impulsionando percebeu" description="Insights agregados e principais aprendizados, calculados em tempo real para a sua audiência." />
      <Card className="p-3 flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Audiência atual:</span>
        <Badge variant="secondary">{label}</Badge>
      </Card>
      <PercebidoSection audience={audience} companyId={companyId || undefined} days={30} />
      {audience === "empresa" && (
        <PercebidoSection audience="empresa" companyId={companyId || undefined} days={90} />
      )}
    </div>
  );
}
