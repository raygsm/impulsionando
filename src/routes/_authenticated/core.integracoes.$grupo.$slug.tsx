import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { findIntegration } from "@/data/integracoes-catalog";
import { IntegrationStatusPill } from "@/components/integracoes/IntegrationStatusPill";
import { DynamicFieldsForm } from "@/components/integracoes/DynamicFieldsForm";
import { DiagnosticsPanel } from "@/components/integracoes/DiagnosticsPanel";
import { ConnectWizard } from "@/components/integracoes/ConnectWizard";
import { ImpulsinitoHint } from "@/components/integracoes/ImpulsinitoHint";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, ExternalLink, PlugZap, RefreshCw } from "lucide-react";

type Search = { tab?: "visao" | "configurar" | "diagnostico" | "docs"; wizard?: 0 | 1 };

export const Route = createFileRoute("/_authenticated/core/integracoes/$grupo/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: (s.tab as Search["tab"]) ?? "visao",
    wizard: s.wizard === 1 || s.wizard === "1" ? 1 : 0,
  }),
  head: () => ({
    meta: [{ title: "Detalhe da integração" }, { name: "robots", content: "noindex" }],
  }),
  component: DetalhePage,
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">Integração não encontrada.</div>
  ),
});

function DetalhePage() {
  const { grupo, slug } = Route.useParams();
  const search = Route.useSearch();
  const item = findIntegration(grupo, slug);
  if (!item) throw notFound();

  const [wizardOpen, setWizardOpen] = useState(search.wizard === 1);
  const Icon = item.icon;
  const isConnected = item.state !== "nao-configurado";

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
          <Link to={`/core/integracoes/${grupo}` as never}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <PageHeader title={item.name} description={item.description} />
            <div className="mt-1">
              <IntegrationStatusPill state={item.state} />
              {item.lastSync && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Última sincronização: {item.lastSync}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isConnected && (
            <Button className="gap-1.5" onClick={() => setWizardOpen(true)}>
              <PlugZap className="h-4 w-4" /> Conectar
            </Button>
          )}
          {isConnected && (
            <Button variant="outline" className="gap-1.5" onClick={() => setWizardOpen(true)}>
              <RefreshCw className="h-4 w-4" /> Reconectar
            </Button>
          )}
          <Button variant="ghost" className="gap-1.5" asChild>
            <a href={item.docsUrl ?? "#"} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="h-4 w-4" /> Documentação
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={search.tab ?? "visao"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="configurar">Configurar</TabsTrigger>
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="docs">Ajuda</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold">O que o {item.name} faz por você</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Pré-requisitos
              </div>
              <ul className="space-y-1">
                {item.requirements.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          </Card>
          <ImpulsinitoHint>
            Se algo der errado durante a conexão, eu explico o que aconteceu em linguagem simples e
            sugiro o próximo passo. Não é preciso saber nada técnico.
          </ImpulsinitoHint>
        </TabsContent>

        <TabsContent value="configurar" className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 text-sm text-muted-foreground">
              Ajuste os campos abaixo. As alterações só são aplicadas depois de salvar.
            </div>
            <DynamicFieldsForm fields={item.fields} />
            <div className="mt-4 flex gap-2">
              <Button>Salvar</Button>
              <Button variant="outline">Testar conexão</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostico">
          <DiagnosticsPanel item={item} />
        </TabsContent>

        <TabsContent value="docs">
          <Card className="p-5 text-sm space-y-2">
            <p className="font-medium">Como funciona</p>
            <p className="text-muted-foreground">
              O Impulsionando atua como camada de orquestração. Você conecta uma vez e o Core distribui
              os dados para automações, dashboards e o Impulsinito.
            </p>
            <p className="text-muted-foreground">
              A documentação completa fica com o time do Codex durante a homologação de cada integração.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <ConnectWizard item={item} open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
