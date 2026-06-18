import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Layers, Boxes, Tags, Activity, RefreshCw, Sparkles, ArrowRight,
  Crown, Users2, Building2, Megaphone,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/saiba-mais/")({
  head: () => ({
    meta: [
      { title: "Saiba Mais — Impulsionando" },
      { name: "description", content: "Hub central para conhecer planos, módulos, nichos, automações e novidades da plataforma." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SaibaMaisHub,
});

interface HubCard {
  to: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const SECTIONS: { title: string; items: HubCard[] }[] = [
  {
    title: "Planos & Comercial",
    items: [
      { to: "/planos", label: "Comparativo de planos", icon: Crown, description: "Essencial, Integrado e Avançado: o que cada um entrega e quando faz sentido." },
      { to: "/contratar", label: "Contratar / Simular", icon: Sparkles, description: "Monte sua combinação de módulos e veja o investimento mensal." },
      { to: "/modulos", label: "Catálogo de módulos", icon: Boxes, description: "Todos os módulos disponíveis, dependências e o que cada um resolve." },
    ],
  },
  {
    title: "Nichos & Casos de uso",
    items: [
      { to: "/como-funciona/fitness", label: "Fitness / Academias", icon: Tags, description: "Como a plataforma se adapta ao dia a dia de estúdios e academias." },
      { to: "/demo.imobiliaria", label: "Imobiliária", icon: Building2, description: "Vitrine pública, captação de interessados e match automatizado." },
      { to: "/demo.advogados", label: "Advocacia", icon: Users2, description: "Gestão de clientes, agenda e cobrança recorrente para escritórios." },
    ],
  },
  {
    title: "Inteligência & Saúde da Conta",
    items: [
      { to: "/saiba-mais/saude", label: "Saúde da Conta", icon: Activity, description: "Score contínuo de uso, adoção, financeiro e relacionamento.", badge: "novo" },
      { to: "/saiba-mais/versoes", label: "Versões & Atualizações", icon: RefreshCw, description: "Histórico de releases, melhorias por módulo e roadmap público.", badge: "novo" },
      { to: "/insights/respostas", label: "O que a Impulsionando percebeu", icon: Megaphone, description: "Insights automatizados, oportunidades e alertas para o seu negócio." },
    ],
  },
  {
    title: "Para parceiros white label",
    items: [
      { to: "/white-label/cockpit", label: "Cockpit White Label", icon: Layers, description: "Marca própria, gestão de carteira e revenda da plataforma." },
    ],
  },
];

function SaibaMaisHub() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Saiba Mais"
        description="Conheça em profundidade o que a Impulsionando entrega: planos, módulos, nichos, inteligência e novidades."
      />

      {SECTIONS.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="block">
                  <Card className="h-full p-4 transition hover:border-primary/40 hover:shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold leading-tight">{item.label}</h3>
                          {item.badge && <Badge variant="secondary" className="text-[10px]">{item.badge}</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          Ver detalhes <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
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
