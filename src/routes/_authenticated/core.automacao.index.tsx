import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ALL_WORKFLOWS, CATALOG, NICHO_VARIANTS, TENANTS_MOCK, CHANNELS_MOCK, REGUA_LABEL } from "@/data/automacao-catalog";
import { AUTOMACAO_NAV } from "@/components/core/automacao/AutomacaoSubnav";

export const Route = createFileRoute("/_authenticated/core/automacao/")({
  head: () => ({ meta: [{ title: "Automação — Visão geral" }, { name: "robots", content: "noindex" }] }),
  component: AutomacaoIndex,
});

function AutomacaoIndex() {
  const totais = {
    total: ALL_WORKFLOWS.length,
    core: CATALOG.length,
    nicho: NICHO_VARIANTS.length,
    tenants: TENANTS_MOCK.length,
    canais: CHANNELS_MOCK.length,
    demo: ALL_WORKFLOWS.filter((w) => w.modo === "demo").length,
    rascunho: ALL_WORKFLOWS.filter((w) => w.status === "rascunho").length,
  };
  const porRegua = Object.entries(
    ALL_WORKFLOWS.reduce<Record<string, number>>((acc, w) => {
      acc[w.regua] = (acc[w.regua] ?? 0) + 1;
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Workflows totais", totais.total],
          ["Core", totais.core],
          ["Nicho (variações)", totais.nicho],
          ["Tenants mapeados", totais.tenants],
          ["Canais integrados", totais.canais],
          ["Em modo demo", totais.demo],
          ["Rascunho", totais.rascunho],
          ["Produção ativa", 0],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold mt-1">{value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Distribuição por régua</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {porRegua.map(([r, n]) => (
            <div key={r} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
              <span>{REGUA_LABEL[r as keyof typeof REGUA_LABEL] ?? r}</span>
              <span className="font-mono">{n}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Áreas</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {AUTOMACAO_NAV.filter((n) => n.to !== "/core/automacao").map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted transition-colors">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
