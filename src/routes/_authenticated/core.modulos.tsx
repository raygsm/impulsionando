import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listModulesLibrary, coreModulesDashboard, READINESS_STATUS_LABELS } from "@/lib/modules.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageElements";
import { Boxes, TrendingUp, AlertCircle, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/modulos")({
  component: CoreModulosPage,
});

function CoreModulosPage() {
  const fetchLib = useServerFn(listModulesLibrary);
  const fetchDash = useServerFn(coreModulesDashboard);
  const { data: lib } = useQuery({ queryKey: ["core-modules-lib"], queryFn: () => fetchLib() });
  const { data: dash } = useQuery({ queryKey: ["core-modules-dash"], queryFn: () => fetchDash() });

  const cards = [
    { label: "Clientes ativos", value: dash?.totalActiveClients ?? 0, icon: Users },
    { label: "Instalações ativas", value: dash?.totalInstalls ?? 0, icon: Boxes },
    { label: "Atualizações pendentes", value: dash?.totalPendingUpdates ?? 0, icon: AlertCircle },
    { label: "Módulos catalogados", value: lib?.modules.length ?? 0, icon: TrendingUp },
  ];

  return (
    <>
      <PageHeader
        title="Biblioteca de Módulos — Core"
        description="Catálogo único e versionado. Toda a base aponta para a mesma versão oficial de cada módulo."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="mt-1 text-xl font-bold">{c.value}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 mb-4">
        <h3 className="font-semibold mb-3">Ranking de adoção</h3>
        <div className="space-y-1.5">
          {(dash?.ranking ?? []).slice(0, 10).map((r) => (
            <div key={r.slug} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
              <Link to="/core/modulos/$slug" params={{ slug: r.slug }} className="hover:underline">
                {r.name} <span className="text-xs text-muted-foreground">v{r.version}</span>
              </Link>
              <div className="flex items-center gap-2">
                {r.outdated > 0 && <Badge variant="outline" className="text-amber-600 border-amber-300">{r.outdated} atrasados</Badge>}
                <Badge variant="secondary">{r.installs} instalações</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Catálogo completo</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(lib?.modules ?? []).map((m: any) => {
            const status = m.readiness_status ?? "em_desenvolvimento";
            const installable = status === "certificado" || status === "publicado";
            return (
            <Link
              key={m.id}
              to="/core/modulos/$slug"
              params={{ slug: m.slug }}
              className="block border rounded-lg p-3 hover:bg-muted/40 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.description || m.category || "—"}</div>
                </div>
                <Badge variant="outline">v{m.current_version}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs gap-2 flex-wrap">
                <Badge variant={installable ? "default" : "outline"} className="text-[10px]">
                  {READINESS_STATUS_LABELS[status] ?? status}
                </Badge>
                <span className="text-muted-foreground">{m.installs} instalações</span>
                {m.outdated > 0 ? (
                  <span className="text-amber-600">{m.outdated} desatualizados</span>
                ) : (
                  <span className="text-emerald-600">Todos atualizados</span>
                )}
              </div>
              {(m.dependencies ?? []).length > 0 && (
                <div className="mt-1 text-[10px] text-muted-foreground">Depende de: {(m.dependencies as string[]).join(", ")}</div>
              )}
            </Link>
            );
          })}
        </div>
      </Card>
    </>
  );
}
