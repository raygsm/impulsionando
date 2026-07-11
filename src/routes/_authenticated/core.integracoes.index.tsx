import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { INTEGRATIONS, INTEGRATION_GROUPS } from "@/data/integracoes-catalog";
import { IntegrationCard } from "@/components/integracoes/IntegrationCard";
import { ImpulsinitoHint } from "@/components/integracoes/ImpulsinitoHint";
import { Inbox, BellRing, LineChart, Search, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/integracoes/")({
  head: () => ({
    meta: [
      { title: "Integrações — Core Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IntegracoesHub,
});

function IntegracoesHub() {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      INTEGRATIONS.filter((i) =>
        (i.name + " " + i.description).toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [q],
  );

  const totals = {
    conectadas: INTEGRATIONS.filter((i) => i.state === "conectado").length,
    erro: INTEGRATIONS.filter((i) => i.state === "erro").length,
    atencao: INTEGRATIONS.filter((i) => i.state === "atencao").length,
    naoConectadas: INTEGRATIONS.filter((i) => i.state === "nao-configurado").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        description="Conecte seus canais digitais em um só lugar. Simples, guiado e seguro."
      />

      {/* Atalhos de topo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            to: "/core/integracoes/omnichannel",
            icon: Inbox,
            title: "Caixa de entrada unificada",
            desc: "Todas as conversas em um só lugar.",
          },
          {
            to: "/core/marketing/dashboard",
            icon: LineChart,
            title: "Dashboard de marketing",
            desc: "Sessões, campanhas, ROAS e conversões.",
          },
          {
            to: "/core/integracoes/alertas",
            icon: BellRing,
            title: "Alertas",
            desc: "Fique de olho em tokens e conexões que precisam de atenção.",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.to} to={s.to as never} className="group">
              <Card className="h-full p-4 transition hover:border-primary/60 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{s.title}</h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Visão consolidada */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Conectadas", totals.conectadas, "text-emerald-700"],
          ["Precisam de atenção", totals.atencao, "text-amber-700"],
          ["Com erro", totals.erro, "text-red-700"],
          ["Não conectadas", totals.naoConectadas, "text-muted-foreground"],
        ].map(([label, value, cls]) => (
          <Card key={String(label)} className="p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`text-2xl font-semibold mt-1 ${cls as string}`}>{value as number}</div>
          </Card>
        ))}
      </div>

      <ImpulsinitoHint title="Boas-vindas">
        Comece pelo grupo <strong>Marketing</strong> se quiser conectar Google Ads, Meta e Analytics.
        Depois abra <strong>Mensagens</strong> para juntar WhatsApp, Instagram e Messenger numa caixa
        só. Cada integração tem passo a passo — não precisa saber nada de código.
      </ImpulsinitoHint>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar integração (ex.: WhatsApp, Google Ads, HubSpot)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Grupos */}
      {INTEGRATION_GROUPS.map((g) => {
        const items = filtered.filter((i) => i.group === g.slug);
        if (items.length === 0) return null;
        const Icon = g.icon;
        return (
          <section key={g.slug} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{g.label}</h2>
                  <p className="text-xs text-muted-foreground">{g.description}</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link to={`/core/integracoes/${g.slug}` as never}>
                  Ver tudo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((i) => (
                <IntegrationCard key={i.slug} item={i} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
