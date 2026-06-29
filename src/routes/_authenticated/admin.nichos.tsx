import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, Search, Layers, Users, FileCode, RefreshCw, AlertTriangle } from "lucide-react";
import { getNichosOverview } from "@/lib/nichos-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/nichos")({
  head: () => ({
    meta: [
      { title: "Nichos & Segmentos — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminNichosPage,
});

function AdminNichosPage() {
  const fn = useServerFn(getNichosOverview);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-nichos-overview"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });
  const [q, setQ] = useState("");
  const [macroFilter, setMacroFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const subs = data?.subnichos ?? [];
    const term = q.trim().toLowerCase();
    return subs.filter((s) => {
      if (macroFilter && s.macro_slug !== macroFilter) return false;
      if (!term) return true;
      return (
        s.sub_nome.toLowerCase().includes(term) ||
        s.sub_slug.toLowerCase().includes(term) ||
        s.macro_nome.toLowerCase().includes(term)
      );
    });
  }, [data, q, macroFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Nichos & Segmentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estrutura macro → segmento usada por tenants, planos, módulos e templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/niche-plans">Planos por Nicho</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/admin/niche-matrix">Matriz de Performance</Link>
          </Button>
        </div>
      </header>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Não foi possível carregar os nichos.</p>
            <p className="text-muted-foreground">
              Verifique sua permissão de admin ou tente novamente.
            </p>
          </div>
        </Card>
      )}

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Macro-nichos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : data?.macros.map((m) => {
                const active = macroFilter === m.slug;
                return (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => setMacroFilter(active ? null : m.slug)}
                    className={`text-left rounded-lg border p-4 transition ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-sm font-medium">{m.nome}</div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {m.sub_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {m.tenants_total}
                      </span>
                    </div>
                  </button>
                );
              })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar segmento..."
              className="pl-8"
            />
          </div>
          {macroFilter && (
            <Button variant="ghost" size="sm" onClick={() => setMacroFilter(null)}>
              Limpar filtro de macro
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Macro</th>
                  <th className="text-left px-4 py-2 font-medium">Segmento</th>
                  <th className="text-left px-4 py-2 font-medium">Slug</th>
                  <th className="text-right px-4 py-2 font-medium">Tenants</th>
                  <th className="text-right px-4 py-2 font-medium">Módulos</th>
                  <th className="text-right px-4 py-2 font-medium">Templates</th>
                  <th className="text-right px-4 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td colSpan={7} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum segmento encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={`${s.macro_slug}-${s.sub_slug}`} className="border-t border-border/60">
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="font-normal">
                          {s.macro_nome}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 font-medium">{s.sub_nome}</td>
                      <td className="px-4 py-2 text-xs font-mono text-muted-foreground">
                        {s.sub_slug}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{s.tenants}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <Layers className="h-3 w-3 text-muted-foreground" />
                          {s.modulos}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <FileCode className="h-3 w-3 text-muted-foreground" />
                          {s.templates}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            to="/admin/niche-plans"
                            search={{ niche: s.sub_slug } as never}
                          >
                            Planos
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-xs text-muted-foreground">
          Microcervejarias agora está classificada em <strong>Alimentação e Bebidas</strong>. Use a
          matriz para acompanhar performance comercial por segmento.
        </p>
      </section>
    </div>
  );
}
