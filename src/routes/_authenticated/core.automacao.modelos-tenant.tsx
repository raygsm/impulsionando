import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { TENANTS_MOCK, ALL_WORKFLOWS, planLevel, type Plano } from "@/data/automacao-catalog";
import { ModoBadge } from "@/components/core/automacao/StatusBadges";

export const Route = createFileRoute("/_authenticated/core/automacao/modelos-tenant")({
  head: () => ({ meta: [{ title: "Modelos por Tenant — Automação" }, { name: "robots", content: "noindex" }] }),
  component: ModelosTenantPage,
});

function ModelosTenantPage() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Habilitação de workflows por tenant. Fonte real virá de tabela no backend (ver
        <code className="mx-1">docs/n8n/PENDENCIAS.md</code>). Aqui exibimos o subset elegível por plano+nicho.
      </p>
      {TENANTS_MOCK.map((t) => {
        const eligible = ALL_WORKFLOWS.filter((w) =>
          planLevel(w.planoMin) <= planLevel(t.plano as Plano) &&
          (w.regua !== "nicho" || w.nichos?.some((n) => t.nicho.startsWith(n) || n.startsWith(t.nicho.split("_")[0])))
        );
        return (
          <Card key={t.slug} className="p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{t.nome} <span className="font-mono text-xs text-muted-foreground">/{t.slug}</span></div>
                <div className="text-xs text-muted-foreground">Plano {t.plano.toUpperCase()} · Nicho {t.nicho}</div>
              </div>
              <div className="flex items-center gap-2">
                <ModoBadge modo={t.modo} />
                <span className="text-xs text-muted-foreground">{eligible.length} workflow(s) elegíveis</span>
              </div>
            </div>
            {t.bloqueios.length > 0 && (
              <div className="text-xs">
                <span className="text-muted-foreground">Bloqueios: </span>
                {t.bloqueios.map((b) => <span key={b} className="mr-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5">{b}</span>)}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
