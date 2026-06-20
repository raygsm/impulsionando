/**
 * /core/ecossistema — Dashboard CORE do Ecossistema Impulsionando.
 * Mostra volume total de empresas públicas, distribuição por segmento,
 * cidade e estado, e as últimas atualizações na vitrine pública.
 */
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { fetchEcosystemMetrics } from "@/lib/core-ecosystem.functions";
import { Building2, MapPin, Tag, Globe2, ArrowUpRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/ecossistema")({
  head: () => ({ meta: [{ title: "Ecossistema — Core" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: CoreEcosystemPage,
});

function Bar({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 rounded bg-muted overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${w}%` }} />
    </div>
  );
}

function CoreEcosystemPage() {
  const fetcher = useServerFn(fetchEcosystemMetrics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["core-ecosystem"],
    queryFn: () => fetcher(),
  });

  if (isLoading) return <Card className="p-6">Carregando métricas do ecossistema…</Card>;
  if (error) return <Card className="p-6 text-destructive">{(error as Error).message}</Card>;
  if (!data) return null;

  const maxSeg = Math.max(1, ...data.bySegment.map((s) => s.count));
  const maxCity = Math.max(1, ...data.byCity.map((s) => s.count));
  const maxState = Math.max(1, ...data.byState.map((s) => s.count));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ecossistema Impulsionando</h1>
          <p className="text-sm text-muted-foreground">
            Distribuição das empresas visíveis na vitrine pública por segmento, cidade e estado.
          </p>
        </div>
        <Link
          to="/ecossistema"
          className="ml-auto text-sm text-primary hover:underline flex items-center gap-1"
        >
          Abrir vitrine pública <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Building2 className="w-3.5 h-3.5" /> Empresas públicas</div>
          <div className="text-3xl font-bold mt-1">{data.totalCompanies}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Tag className="w-3.5 h-3.5" /> Segmentos distintos</div>
          <div className="text-3xl font-bold mt-1">{data.bySegment.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><MapPin className="w-3.5 h-3.5" /> Cidades cobertas</div>
          <div className="text-3xl font-bold mt-1">{data.byCity.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Globe2 className="w-3.5 h-3.5" /> Estados</div>
          <div className="text-3xl font-bold mt-1">{data.byState.length}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Top segmentos</h2>
          <ul className="space-y-2 text-sm">
            {data.bySegment.map((s) => (
              <li key={s.segment}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate">{s.segment}</span><span className="text-muted-foreground">{s.count}</span>
                </div>
                <Bar value={s.count} max={maxSeg} />
              </li>
            ))}
            {data.bySegment.length === 0 && <li className="text-muted-foreground text-xs">Sem dados.</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Top cidades</h2>
          <ul className="space-y-2 text-sm">
            {data.byCity.map((s) => (
              <li key={s.city}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate">{s.city}</span><span className="text-muted-foreground">{s.count}</span>
                </div>
                <Bar value={s.count} max={maxCity} />
              </li>
            ))}
            {data.byCity.length === 0 && <li className="text-muted-foreground text-xs">Sem dados.</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Globe2 className="w-4 h-4 text-primary" /> Top estados</h2>
          <ul className="space-y-2 text-sm">
            {data.byState.map((s) => (
              <li key={s.state}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate">{s.state}</span><span className="text-muted-foreground">{s.count}</span>
                </div>
                <Bar value={s.count} max={maxState} />
              </li>
            ))}
            {data.byState.length === 0 && <li className="text-muted-foreground text-xs">Sem dados.</li>}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Atualizações recentes</h2>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma empresa pública ainda.</p>
        ) : (
          <ul className="divide-y">
            {data.recent.map((r) => (
              <li key={r.id} className="py-2 flex items-center gap-3 text-sm">
                <span className="font-medium truncate flex-1">{r.name}</span>
                {r.segment && <Badge variant="outline" className="text-xs">{r.segment}</Badge>}
                {r.city && <span className="text-xs text-muted-foreground">{r.city}</span>}
                <Link to="/vitrine/$slug" params={{ slug: r.slug }} className="text-xs text-primary hover:underline">
                  ver vitrine
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
