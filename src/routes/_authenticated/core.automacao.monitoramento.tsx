import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/automacao/monitoramento")({
  head: () => ({ meta: [{ title: "Monitoramento — Automação" }, { name: "robots", content: "noindex" }] }),
  component: MonitorPage,
});

const CARDS = [
  { label: "Execuções (24h)", value: "—", hint: "Aguardando v_n8n_metrics" },
  { label: "Taxa de sucesso", value: "—", hint: "Meta ≥ 98%" },
  { label: "Latência P95", value: "—", hint: "Meta ≤ 8s" },
  { label: "Fila de retries", value: "—", hint: "Backoff 2s / 8s / 32s" },
  { label: "Fallbacks humanos", value: "—", hint: "Acionamentos por dia" },
  { label: "Opt-outs (24h)", value: "—", hint: "Alerta se > 3%" },
];

function MonitorPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CARDS.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{c.hint}</div>
          </Card>
        ))}
      </div>
      <Card className="p-4 text-xs text-muted-foreground">
        Alertas críticos (falhas &gt; 5% em 15min, latência acima do SLO, opt-out anormal) disparam
        <code className="mx-1">int.workflow-falhou</code> para administradores. Regras completas em
        <code className="mx-1">docs/n8n/plano-producao.md</code>.
      </Card>
    </div>
  );
}
