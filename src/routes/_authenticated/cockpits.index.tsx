import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, Wallet, Megaphone, Headphones, Layers,
  ShieldCheck, Home, UserRound, Building2, ArrowRight,
  Calendar, Users, ShoppingCart, Package, Stethoscope,
  Ticket, BarChart3, UtensilsCrossed, Calculator, Handshake,
  MessagesSquare, Sparkles, Zap, Cog,
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
  module?: string;
};

const COCKPITS: CockpitCard[] = [
  // Crescimento
  { to: "/crm", label: "CRM", description: "Leads, clientes, funis, atividades e oportunidades.", icon: Users, group: "Crescimento", module: "crm" },
  { to: "/commercial/cockpit", label: "Comercial", description: "Pipeline, oportunidades, conversão e metas.", icon: TrendingUp, group: "Crescimento" },
  { to: "/marketing/cockpit", label: "Marketing", description: "Leads, UTMs, campanhas e conversão.", icon: Megaphone, group: "Crescimento" },
  { to: "/automacoes", label: "Automações & WhatsApp", description: "Réguas, follow-ups, gatilhos e canais conectados.", icon: Zap, group: "Crescimento", module: "automacao" },

  // Operação por módulo
  { to: "/agenda", label: "Agenda", description: "Compromissos, profissionais, encaixes e fila.", icon: Calendar, group: "Operação", module: "agenda" },
  { to: "/sales", label: "Vendas & PDV", description: "Pedidos, caixa, cupons e fechamento de dia.", icon: ShoppingCart, group: "Operação", module: "pdv" },
  { to: "/inventory", label: "Estoque", description: "Produtos, fornecedores, movimentações e perdas.", icon: Package, group: "Operação", module: "estoque" },
  { to: "/operations/cockpit", label: "Operações", description: "Visão consolidada de vendas, caixa e movimentações.", icon: Cog, group: "Operação" },
  { to: "/eventos", label: "Eventos & Ingressos", description: "Lotes, inscritos, check-in e BI por evento.", icon: Ticket, group: "Operação", module: "eventos" },
  { to: "/ehr", label: "Saúde & Prontuário", description: "Pacientes, prontuário eletrônico e teleconsulta.", icon: Stethoscope, group: "Operação", module: "saude" },
  { to: "/restaurante/salao", label: "Restaurante", description: "Mesas, comandas, cardápio e cozinha.", icon: UtensilsCrossed, group: "Operação", module: "delivery" },
  { to: "/imobiliaria/vitrine", label: "Imobiliária", description: "Imóveis, interessados, matches e mensagens.", icon: Home, group: "Operação", module: "custom" },

  // Gestão
  { to: "/finance/cockpit", label: "Financeiro", description: "Receitas, despesas, fluxo de caixa e inadimplência.", icon: Wallet, group: "Gestão", module: "erp" },
  { to: "/users/corporate", label: "Corporativo", description: "Visão executiva por empresa, unidade e usuários.", icon: Building2, group: "Gestão" },
  { to: "/bi", label: "BI & Dashboards", description: "Indicadores cruzando todos os módulos ativos.", icon: BarChart3, group: "Gestão", module: "bi" },
  { to: "/contabilidade/cockpit", label: "Contabilidade", description: "Calendário fiscal, obrigações e portal do cliente.", icon: Calculator, group: "Gestão" },
  { to: "/reports", label: "Relatórios", description: "Exportações e relatórios por módulo.", icon: BarChart3, group: "Gestão" },

  // Relacionamento
  { to: "/support/cockpit", label: "Suporte", description: "Atendimentos, SLA e satisfação.", icon: Headphones, group: "Relacionamento" },
  { to: "/comunidade", label: "Comunidade", description: "Grupos, posts, eventos e moderação.", icon: MessagesSquare, group: "Relacionamento" },
  { to: "/clube", label: "Fidelização & Clube", description: "Pontos, cashback, recompensas e cupons.", icon: Sparkles, group: "Relacionamento", module: "fidelizacao" },
  { to: "/consumer/unified", label: "Clube — Membros", description: "Perfis, assinaturas, favoritos e gamificação dos membros do Clube Impulsionando.", icon: UserRound, group: "Relacionamento", module: "area_cliente" },

  // Plataforma
  { to: "/white-label/cockpit", label: "White Label", description: "Parceiros revendedores e contratos.", icon: Layers, group: "Plataforma", module: "white_label" },
  { to: "/affiliates", label: "Afiliados & Parceiros", description: "Links, comissões, payouts e ofertas.", icon: Handshake, group: "Plataforma", module: "parceiros" },
  { to: "/privacy/cockpit", label: "LGPD & Privacidade", description: "Consentimentos, exclusões e exports.", icon: ShieldCheck, group: "Plataforma" },
];

const GROUPS = ["Crescimento", "Operação", "Gestão", "Relacionamento", "Plataforma"] as const;

function CockpitsHub() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cockpits"
        description="Hub central de todos os cockpits operacionais e executivos. Cada módulo principal tem dashboard próprio — sem reaproveitamento de tela."
      />
      {GROUPS.map((group) => {
        const items = COCKPITS.filter((c) => c.group === group);
        if (!items.length) return null;
        return (
          <section key={group} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{group}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((c) => {
                const Icon = c.icon;
                return (
                  <Link key={c.to} to={c.to} className="group">
                    <Card className="p-5 h-full hover:border-primary/50 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                            <Icon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{c.label}</div>
                            {c.module ? (
                              <Badge variant="outline" className="mt-0.5 text-[10px]">
                                Módulo · {c.module}
                              </Badge>
                            ) : (
                              <div className="text-xs text-muted-foreground">{c.group}</div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">{c.description}</p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
