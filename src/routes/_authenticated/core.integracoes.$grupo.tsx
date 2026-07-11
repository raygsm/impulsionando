import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import {
  INTEGRATION_GROUPS,
  integrationsByGroup,
  type IntegrationGroupSlug,
} from "@/data/integracoes-catalog";
import { IntegrationCard } from "@/components/integracoes/IntegrationCard";
import { ImpulsinitoHint } from "@/components/integracoes/ImpulsinitoHint";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/core/integracoes/$grupo")({
  head: () => ({
    meta: [{ title: "Integrações do grupo" }, { name: "robots", content: "noindex" }],
  }),
  component: GrupoPage,
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">Grupo de integrações não encontrado.</div>
  ),
});

function GrupoPage() {
  const { grupo } = Route.useParams();
  const meta = INTEGRATION_GROUPS.find((g) => g.slug === grupo);
  if (!meta) throw notFound();

  const items = integrationsByGroup(grupo as IntegrationGroupSlug);
  const Icon = meta.icon;

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
        title={meta.label}
        description={meta.description}
        icon={<Icon className="h-5 w-5" />}
      />

      <ImpulsinitoHint title={`Dicas para ${meta.label}`}>
        Prefira começar pelas ferramentas que você já usa. Ao clicar em <strong>Conectar</strong> eu
        te levo por um passo a passo — nada é ativado sem sua confirmação.
      </ImpulsinitoHint>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((i) => (
          <IntegrationCard key={i.slug} item={i} />
        ))}
      </div>
    </div>
  );
}
