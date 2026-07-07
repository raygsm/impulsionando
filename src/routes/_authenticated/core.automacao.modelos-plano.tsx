import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ALL_WORKFLOWS, planLevel, REGUA_LABEL, type Plano } from "@/data/automacao-catalog";
import { FlowStatusBadge } from "@/components/core/automacao/StatusBadges";

export const Route = createFileRoute("/_authenticated/core/automacao/modelos-plano")({
  head: () => ({ meta: [{ title: "Modelos por Plano — Automação" }, { name: "robots", content: "noindex" }] }),
  component: ModelosPlanoPage,
});

const PLANOS: Plano[] = ["free","essencial","pro","premium","wl"];

function ModelosPlanoPage() {
  return (
    <div className="space-y-6">
      {PLANOS.map((p) => {
        const items = ALL_WORKFLOWS.filter((w) => planLevel(w.planoMin) <= planLevel(p));
        return (
          <section key={p}>
            <Card className="p-3 flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase">{p}</h2>
              <span className="text-xs text-muted-foreground">{items.length} workflow(s) disponíveis</span>
            </Card>
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr><th className="text-left p-2">Slug</th><th className="text-left p-2">Nome</th><th className="text-left p-2">Régua</th><th className="text-left p-2">Plano mín.</th><th className="text-left p-2">Status</th></tr>
                </thead>
                <tbody>
                  {items.map((w) => (
                    <tr key={w.slug} className="border-t">
                      <td className="p-2 font-mono">{w.slug}</td>
                      <td className="p-2">{w.nome}</td>
                      <td className="p-2">{REGUA_LABEL[w.regua]}</td>
                      <td className="p-2 uppercase">{w.planoMin}</td>
                      <td className="p-2"><FlowStatusBadge status={w.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
