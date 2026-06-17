import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import {
  TrendingUp, Wallet, Megaphone, Headphones, Layers,
  ShieldCheck, Home, UserRound, Building2, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/cockpits/")({
  head: () => ({ meta: [{ title: "Cockpits — Impulsionando" }] }),
  component: CockpitsHub,
});

type CockpitCard = {
  to: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
};

const COCKPITS: CockpitCard[] = [
  { to: "/users/corporate", label: "Corporativo", description: "Visão executiva por empresa, unidade e usuários.", icon: Building2, group: "Gestão" },
  { to: "/finance/cockpit", label: "Financeiro", description: "Receitas, despesas, fluxo de caixa e inadimplência.", icon: Wallet, group: "Gestão" },
  { to: "/commercial/cockpit", label: "Comercial", description: "Pipeline, oportunidades, conversão e metas.", icon: TrendingUp, group: "Crescimento" },
  { to: "/marketing/cockpit", label: "Marketing", description: "Leads, UTMs, campanhas e conversão.", icon: Megaphone, group: "Crescimento" },
  { to: "/operations/cockpit", label: "Operações", description: "Vendas, caixa, pedidos e movimentações.", icon: TrendingUp, group: "Operação" },
  { to: "/support/cockpit", label: "Suporte", description: "Atendimentos, SLA e satisfação.", icon: Headphones, group: "Operação" },
  { to: "/white-label/cockpit", label: "White Label", description: "Parceiros revendedores e contratos.", icon: Layers, group: "Plataforma" },
  { to: "/consumer/unified", label: "Consumidor Unificado", description: "Perfis, assinaturas e favoritos do consumidor final.", icon: UserRound, group: "Plataforma" },
  { to: "/privacy/cockpit", label: "LGPD & Privacidade", description: "Consentimentos, exclusões e exports.", icon: ShieldCheck, group: "Compliance" },
  { to: "/realestate/cockpit", label: "Imobiliária", description: "Imóveis, buscas, matches e mensagens.", icon: Home, group: "Nichos" },
];

function CockpitsHub() {
  const groups = Array.from(new Set(COCKPITS.map((c) => c.group)));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cockpits"
        description="Hub central de todos os cockpits operacionais e executivos da plataforma."
      />
      {groups.map((group) => (
        <section key={group} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{group}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COCKPITS.filter((c) => c.group === group).map((c) => {
              const Icon = c.icon;
              return (
                <Link key={c.to} to={c.to} className="group">
                  <Card className="p-5 h-full hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{c.label}</div>
                          <div className="text-xs text-muted-foreground">{c.group}</div>
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{c.description}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
