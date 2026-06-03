import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageElements";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Building2, Tags, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bi/")({
  head: () => ({ meta: [{ title: "Visão geral — BI" }] }),
  component: Page,
});

function Page() {
  const { data: me } = useCurrentUser();
  const isSuper = me?.isSuperAdmin ?? false;

  const cards = [
    {
      to: "/bi/company",
      title: "Dashboard do Cliente",
      desc: "KPIs operacionais da empresa ativa: vendas, financeiro, agenda, CRM e estoque comparando períodos.",
      icon: BarChart3,
    },
    ...(isSuper
      ? [
          {
            to: "/bi/master",
            title: "Dashboard Master",
            desc: "Visão consolidada de todas as empresas da plataforma — receita, ticket médio, agenda e leads.",
            icon: Building2,
          },
          {
            to: "/bi/niches",
            title: "Inteligência por Nicho",
            desc: "Comparativo agregado e anonimizado por nicho de mercado — referência para benchmarking.",
            icon: Tags,
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Business Intelligence"
        description="Dashboards consolidados Master, Nicho e Cliente. Dados em tempo real conforme suas permissões."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to}>
              <Card className="p-6 shadow-card h-full hover:shadow-elegant transition-shadow">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-semibold">{c.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
