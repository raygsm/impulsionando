import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ALL_WORKFLOWS } from "@/data/automacao-catalog";
import { FlowCard } from "@/components/core/automacao/FlowCard";

export const Route = createFileRoute("/_authenticated/core/automacao/demonstracoes")({
  head: () => ({ meta: [{ title: "Demonstrações — Automação" }, { name: "robots", content: "noindex" }] }),
  component: DemoPage,
});

function DemoPage() {
  const items = ALL_WORKFLOWS.filter((w) => w.modo === "demo");
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30 text-sm">
        <p><strong>Modo demonstração</strong> — payload fictício, nenhum canal real acionado, logs simulados apenas.
        Alterne para produção via <code>/core/automacao/aprovacoes</code> quando o checklist estiver assinado.</p>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((wf) => <FlowCard key={wf.slug} wf={wf} />)}
      </div>
    </div>
  );
}
