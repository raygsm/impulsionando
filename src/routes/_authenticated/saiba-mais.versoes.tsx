import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowLeft, ShieldCheck, Undo2, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/saiba-mais/versoes")({
  head: () => ({
    meta: [
      { title: "Versões & Atualizações — Saiba Mais" },
      { name: "description", content: "Histórico de versões dos módulos, política de rollout progressivo e backup automático." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: VersoesPage,
});

const STAGES = [
  { stage: "Sandbox", icon: FlaskConical, desc: "Toda nova versão roda primeiro em ambiente isolado com dados de teste." },
  { stage: "Rollout 5% → 25% → 100%", icon: ShieldCheck, desc: "Liberação progressiva por carteira, monitorando erros e satisfação." },
  { stage: "Backup automático", icon: Undo2, desc: "Snapshot antes de aplicar; rollback em um clique se algo regredir." },
];

function VersoesPage() {
  return (
    <div className="space-y-6">
      <Link to="/saiba-mais" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Voltar para Saiba Mais
      </Link>

      <PageHeader
        icon={<RefreshCw className="h-5 w-5" />}
        title="Versões & Atualizações"
        description="Como evoluímos os módulos sem quebrar sua operação."
      />

      <Card className="p-5">
        <Badge variant="secondary" className="mb-2">Em construção — Fase 3</Badge>
        <h2 className="text-base font-semibold">Pipeline de atualização segura</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada módulo tem versionamento semântico. Quando publicamos uma nova versão, ela percorre três etapas obrigatórias antes de chegar à sua conta.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.stage} className="rounded-md border p-3">
                <Icon className="h-5 w-5 text-primary" />
                <div className="mt-2 text-sm font-semibold">{s.stage}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Onde acompanhar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O histórico completo por módulo, com changelog e janela de manutenção, aparece no painel do módulo correspondente em <Link to="/modules" className="text-primary underline">Módulos</Link>.
        </p>
      </Card>
    </div>
  );
}
