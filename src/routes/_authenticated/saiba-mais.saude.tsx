import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/saiba-mais/saude")({
  head: () => ({
    meta: [
      { title: "Saúde da Conta — Saiba Mais" },
      { name: "description", content: "Como a Impulsionando calcula o score de saúde da sua conta e o que cada dimensão significa." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SaudeContaPage,
});

const DIMENSIONS = [
  { name: "Adoção", weight: "30%", desc: "Quantos módulos contratados estão sendo realmente usados nos últimos 14 dias." },
  { name: "Financeiro", weight: "25%", desc: "Pontualidade de pagamentos, recorrência ativa e ausência de chargebacks." },
  { name: "Relacionamento", weight: "20%", desc: "Volume e qualidade de interações com clientes (agenda, mensagens, NPS)." },
  { name: "Operação", weight: "15%", desc: "Vendas, estoque e processos rodando sem alertas críticos." },
  { name: "Crescimento", weight: "10%", desc: "Captação de leads, conversão e tendência de receita nos últimos 90 dias." },
];

function SaudeContaPage() {
  return (
    <div className="space-y-6">
      <Link to="/saiba-mais" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Voltar para Saiba Mais
      </Link>

      <PageHeader
        title="Saúde da Conta"
        description="Um único score contínuo (0 a 100) que mostra se sua conta está bem ou precisa de atenção."
      />

      <Card className="p-5">
        <Badge variant="secondary" className="mb-2">Em construção — Fase 3</Badge>
        <h2 className="text-base font-semibold">Como o score é calculado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A nota é uma média ponderada de cinco dimensões, recalculada a cada hora.
          Quando uma dimensão cai abaixo do limite saudável, a plataforma sugere ações concretas.
        </p>

        <div className="mt-4 space-y-2">
          {DIMENSIONS.map((d) => (
            <div key={d.name} className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <div className="text-sm font-semibold">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.desc}</div>
              </div>
              <Badge variant="outline" className="shrink-0">{d.weight}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="mt-2 text-sm font-semibold">≥ 80 — Saudável</h3>
          <p className="mt-1 text-xs text-muted-foreground">Conta usando bem o contratado, baixo risco de churn.</p>
        </Card>
        <Card className="p-4">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          <h3 className="mt-2 text-sm font-semibold">50–79 — Atenção</h3>
          <p className="mt-1 text-xs text-muted-foreground">Algumas dimensões fracas; ações sugeridas no Onboarding.</p>
        </Card>
        <Card className="p-4">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <h3 className="mt-2 text-sm font-semibold">&lt; 50 — Crítico</h3>
          <p className="mt-1 text-xs text-muted-foreground">Risco de churn alto; CS proativo é acionado automaticamente.</p>
        </Card>
      </div>
    </div>
  );
}
