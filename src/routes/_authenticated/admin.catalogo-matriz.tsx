import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/insights/KpiCard";
import { Loader2, AlertTriangle, AlertCircle, Check, X } from "lucide-react";
import { fetchCatalogMatrix } from "@/lib/catalog-matrix.functions";

export const Route = createFileRoute("/_authenticated/admin/catalogo-matriz")({
  head: () => ({ meta: [{ title: "Catálogo Unificado — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CatalogMatrixPage,
});

function CatalogMatrixPage() {
  const fn = useServerFn(fetchCatalogMatrix);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["catalog-matrix"],
    queryFn: () => fn({ data: {} }),
    staleTime: 120_000,
  });
  const [q, setQ] = useState("");
  const [view, setView] = useState<"matrix" | "plans" | "issues">("matrix");

  const d = data as any;
  const filteredModules = useMemo(() => {
    if (!d) return [] as any[];
    const needle = q.trim().toLowerCase();
    if (!needle) return d.modules;
    return d.modules.filter((m: any) =>
      [m.slug, m.name, m.category].filter(Boolean).some((s: string) => s.toLowerCase().includes(needle)),
    );
  }, [d, q]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Catálogo Unificado — Planos × Módulos × Nichos"
        description="Matriz consolidada do ecossistema com detecção de inconsistências entre módulos, planos e nichos."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={view === "matrix" ? "default" : "outline"} size="sm" onClick={() => setView("matrix")}>
          Matriz Módulo × Nicho
        </Button>
        <Button variant={view === "plans" ? "default" : "outline"} size="sm" onClick={() => setView("plans")}>
          Planos × Módulos
        </Button>
        <Button variant={view === "issues" ? "default" : "outline"} size="sm" onClick={() => setView("issues")}>
          Inconsistências {d?.counts?.issues ? `(${d.counts.issues})` : ""}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      )}
      {error && (
        <Card className="p-4 text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {(error as Error).message}
        </Card>
      )}

      {d && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label="Módulos" value={d.counts.modules} hint={`${d.counts.modulesActive} ativos`} />
            <KpiCard label="Nichos" value={d.counts.niches} hint={`${d.counts.nichesActive} ativos`} />
            <KpiCard label="Planos Billing" value={d.counts.billingPlans} hint={`${d.counts.billingPlansActive} ativos`} />
            <KpiCard label="Tiers (macro)" value={d.counts.planTiers} hint="core_niche_plan_modules" />
            <KpiCard
              label="Inconsistências"
              value={d.counts.issues}
              hint={`${d.counts.errors} erros · ${d.counts.issues - d.counts.errors} warns`}
            />
          </div>

          {view === "matrix" && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h3 className="font-semibold">Matriz Módulo × Nicho ({filteredModules.length})</h3>
                <Input
                  placeholder="Buscar módulo…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="text-xs min-w-full">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left p-1 sticky left-0 bg-background min-w-48">Módulo</th>
                      <th className="text-left p-1">Cat.</th>
                      {d.niches.filter((n: any) => n.active).map((n: any) => (
                        <th key={n.slug} className="p-1 text-left rotate-180" style={{ writingMode: "vertical-rl" }} title={n.name}>
                          {n.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModules.map((m: any) => (
                      <tr key={m.slug} className="border-b border-border/20 hover:bg-muted/30">
                        <td className="p-1 sticky left-0 bg-background">
                          <div className="font-medium">{m.name}</div>
                          <div className="text-muted-foreground">{m.slug}</div>
                        </td>
                        <td className="p-1 text-muted-foreground">{m.category ?? "—"}</td>
                        {d.niches.filter((n: any) => n.active).map((n: any) => {
                          const cell = d.moduleNicheMatrix[m.slug]?.[n.slug];
                          return (
                            <td key={n.slug} className="p-1 text-center">
                              {cell === "recommended" ? (
                                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" title="Recomendado" />
                              ) : cell === "optional" ? (
                                <span className="inline-block w-3 h-3 rounded-full bg-amber-400" title="Opcional" />
                              ) : cell === "linked" ? (
                                <span className="inline-block w-3 h-3 rounded-full bg-sky-400" title="Vinculado" />
                              ) : (
                                <span className="text-muted-foreground/40">·</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> Recomendado</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-amber-400" /> Opcional</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-sky-400" /> Vinculado</span>
              </div>
            </Card>
          )}

          {view === "plans" && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Planos Billing × Módulos incluídos</h3>
              <div className="space-y-2">
                {d.billingPlans.map((bp: any) => (
                  <div key={bp.code} className="border border-border/40 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{bp.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{bp.code}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant={bp.active ? "default" : "secondary"}>
                          {bp.active ? "Ativo" : "Inativo"}
                        </Badge>
                        <span className="font-medium">R$ {bp.recurring.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {bp.modules.length} módulo(s) {bp.moduleCount != null ? `· declarado: ${bp.moduleCount}` : ""}
                      {bp.extraPrice > 0 ? ` · extra: R$ ${bp.extraPrice.toFixed(2)}/módulo` : ""}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bp.modules.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Nenhum módulo declarado</span>
                      ) : (
                        bp.modules.map((slug: string) => {
                          const exists = d.modules.some((m: any) => m.slug === slug);
                          return (
                            <Badge key={slug} variant={exists ? "outline" : "destructive"} className="text-xs">
                              {exists ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              {slug}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold mb-3 mt-6">Tiers por macro-nicho (essencial/profissional/completo)</h3>
              <div className="space-y-1.5">
                {d.planTiers.map((pt: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm border-b border-border/30 pb-1">
                    <div>
                      <Badge variant="secondary" className="mr-2">{pt.macro}</Badge>
                      <Badge variant="outline" className="mr-2">{pt.tier}</Badge>
                      <span className="text-xs text-muted-foreground">{pt.modules.length} mód. · limite {pt.chooseLimit ?? "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {view === "issues" && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Inconsistências detectadas ({d.issues.length})</h3>
              {d.issues.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhuma inconsistência. 🎉</div>
              ) : (
                <div className="space-y-1.5">
                  {d.issues.map((it: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm border-b border-border/30 pb-1.5">
                      {it.severity === "error" ? (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div>{it.message}</div>
                        <div className="text-xs text-muted-foreground">{it.source}{it.ref ? ` · ${it.ref}` : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
