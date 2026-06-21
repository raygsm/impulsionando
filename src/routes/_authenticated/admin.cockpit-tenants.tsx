import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/insights/KpiCard";
import { Loader2, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { fetchTenantCockpit } from "@/lib/tenant-cockpit.functions";

export const Route = createFileRoute("/_authenticated/admin/cockpit-tenants")({
  head: () => ({ meta: [{ title: "Cockpit de Tenants — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CockpitTenantsPage,
});

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

function CockpitTenantsPage() {
  const fn = useServerFn(fetchTenantCockpit);
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<"all" | "ok" | "warn" | "error">("all");
  const [sortBy, setSortBy] = useState<"mrr" | "rev30" | "errors" | "created">("mrr");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["tenant-cockpit", search],
    queryFn: () => fn({ data: { search: search || undefined } }),
    staleTime: 60_000,
  });

  const d = data as any;
  const filtered = useMemo(() => {
    if (!d) return [] as any[];
    let arr = [...d.tenants];
    if (healthFilter !== "all") arr = arr.filter((t) => t.health === healthFilter);
    arr.sort((a, b) => {
      if (sortBy === "mrr") return b.mrrBRL - a.mrrBRL;
      if (sortBy === "rev30") return b.revenue30BRL - a.revenue30BRL;
      if (sortBy === "errors") return b.errors7d - a.errors7d;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return arr;
  }, [d, healthFilter, sortBy]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Cockpit de Tenants"
        description="Visão consolidada de todas as empresas do ecossistema — plano, módulos, receita, saúde de integrações e eventos recentes."
      />

      {d && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard label="Total" value={d.kpis.total} />
          <KpiCard label="Ativos" value={d.kpis.active} />
          <KpiCard label="Demo" value={d.kpis.demo} />
          <KpiCard label="Com erro" value={d.kpis.withErrors} hint="saúde crítica" />
          <KpiCard label="Com warn" value={d.kpis.withWarns} />
          <KpiCard label="MRR total" value={fmtBRL(d.kpis.mrrTotalBRL)} hint="contratos ativos" />
          <KpiCard label="Receita 30d" value={fmtBRL(d.kpis.revenue30TotalBRL)} hint="captura líquida" />
        </div>
      )}

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por nome, trade ou subdomínio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-1">
            {(["all", "ok", "warn", "error"] as const).map((h) => (
              <Button key={h} variant={healthFilter === h ? "default" : "outline"} size="sm" onClick={() => setHealthFilter(h)}>
                {h === "all" ? "Todos" : h.toUpperCase()}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            <span className="text-xs text-muted-foreground self-center mr-1">Ordenar:</span>
            {([
              ["mrr", "MRR"],
              ["rev30", "Receita 30d"],
              ["errors", "Erros 7d"],
              ["created", "Criado em"],
            ] as const).map(([k, label]) => (
              <Button key={k} variant={sortBy === k ? "default" : "outline"} size="sm" onClick={() => setSortBy(k)}>
                {label}
              </Button>
            ))}
          </div>
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
          <div className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {(error as Error).message}
          </div>
        )}

        {d && (
          <div className="overflow-x-auto">
            <table className="text-sm min-w-full">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground">
                  <th className="text-left p-2">Saúde</th>
                  <th className="text-left p-2">Tenant</th>
                  <th className="text-left p-2">Tipo / Nicho</th>
                  <th className="text-right p-2">MRR</th>
                  <th className="text-right p-2">Receita 30d</th>
                  <th className="text-right p-2">Módulos</th>
                  <th className="text-right p-2">Integrações</th>
                  <th className="text-right p-2">Erros 7d</th>
                  <th className="text-left p-2">Próximo venc.</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} className="border-b border-border/20 hover:bg-muted/30">
                    <td className="p-2">
                      <HealthDot v={t.health} />
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.subdomain ?? "—"} {t.demo ? "· demo" : ""} {t.master ? "· master" : ""}
                      </div>
                    </td>
                    <td className="p-2 text-xs">
                      <div>{t.kind}</div>
                      <div className="text-muted-foreground">{t.niche ?? "—"}</div>
                    </td>
                    <td className="p-2 text-right font-medium">{fmtBRL(t.mrrBRL)}</td>
                    <td className="p-2 text-right">{fmtBRL(t.revenue30BRL)}</td>
                    <td className="p-2 text-right">{t.modulesEnabled}</td>
                    <td className="p-2 text-right">
                      {t.integrationsTotal}
                      {t.integrationsErrors > 0 && (
                        <span className="text-destructive ml-1">({t.integrationsErrors})</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {t.errors7d > 0 ? <span className="text-amber-600">{t.errors7d}</span> : 0}
                    </td>
                    <td className="p-2 text-xs">{t.nextDue ? new Date(t.nextDue).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {t.active ? (
                          <Badge variant="default" className="text-xs">ativo</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">inativo</Badge>
                        )}
                        {t.contractStatus && (
                          <Badge variant="outline" className="text-xs">{t.contractStatus}</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-muted-foreground text-sm">
                      Nenhum tenant encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function HealthDot({ v }: { v: "ok" | "warn" | "error" }) {
  if (v === "error") return <AlertCircle className="h-5 w-5 text-destructive" />;
  if (v === "warn") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
}
