import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/automacao/fallback-humano")({
  head: () => ({ meta: [{ title: "Fallback Humano — Automação" }, { name: "robots", content: "noindex" }] }),
  component: FallbackPage,
});

const STEPS = [
  "Falha após 3 tentativas com backoff exponencial (2s / 8s / 32s)",
  "Sub-workflow _shared/fallback-humano.json é acionado",
  "Log status:failed + channel:internal registrado em n8n_workflow_runs",
  "Notificação int.workflow-falhou enviada ao responsável do tenant",
  "Se régua = financeiro → notifica admin financeiro adicional",
  "Se régua = suporte e severidade ≥ warning → chamado marcado escalonado_humano",
  "Em modo:demo, apenas gera log — não notifica staff real",
];

function FallbackPage() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-6 w-6 text-primary" />
          <h2 className="text-base font-semibold">Como o fallback humano funciona</h2>
        </div>
        <ol className="mt-4 space-y-2 text-sm">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-muted-foreground font-mono w-5 shrink-0">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card className="p-4 text-xs text-muted-foreground">
        Template completo em <code>docs/n8n/templates/fallback-humano.md</code>. Sub-workflow em
        <code className="mx-1">docs/n8n/workflows/_shared/fallback-humano.json</code>.
      </Card>
    </div>
  );
}
