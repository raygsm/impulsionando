import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listChecklistOverview } from "@/lib/onboarding.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, RefreshCw, Search, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/onboarding-checklist")({
  head: () => ({ meta: [{ title: "Checklist de Go-Live — Admin Impulsionando" }] }),
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm mb-3">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

type Filter = "all" | "completed" | "in_progress" | "not_started";

function Page() {
  const fn = useServerFn(listChecklistOverview);
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "onboarding-checklist-overview"],
    queryFn: () => fn(),
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const rows = data?.rows ?? [];
    return rows.filter((r) => {
      if (filter === "completed" && r.pct !== 100) return false;
      if (filter === "in_progress" && !(r.pct > 0 && r.pct < 100)) return false;
      if (filter === "not_started" && r.pct !== 0) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return r.company_name?.toLowerCase().includes(q) || r.slug?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, query, filter]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-80" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) return null;
  const s = data.summary;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Checklist de Go-Live
          </h1>
          <p className="text-sm text-muted-foreground">Progresso de onboarding consolidado de todos os tenants.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tenants</div><div className="text-2xl font-semibold">{s.tenants}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Concluídos</div><div className="text-2xl font-semibold text-green-600">{s.completed}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Em andamento</div><div className="text-2xl font-semibold text-amber-600">{s.in_progress}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Progresso médio</div><div className="text-2xl font-semibold">{s.avg_pct}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Tenants ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou slug..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="not_started">Não iniciados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum tenant encontrado.</div>
            )}
            {filtered.map((r) => {
              const StatusIcon = r.pct === 100 ? CheckCircle2 : r.pct === 0 ? AlertCircle : Clock;
              const statusColor = r.pct === 100 ? "text-green-600" : r.pct === 0 ? "text-muted-foreground" : "text-amber-600";
              return (
                <div key={r.company_id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition">
                  <StatusIcon className={`h-5 w-5 shrink-0 ${statusColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{r.company_name}</span>
                      {r.slug && <Badge variant="outline" className="text-xs">{r.slug}</Badge>}
                      {r.niche_code && <Badge variant="secondary" className="text-xs">{r.niche_code}</Badge>}
                      {!r.is_active && <Badge variant="destructive" className="text-xs">inativo</Badge>}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={r.pct} className="h-1.5 flex-1 max-w-md" />
                      <span className="text-xs text-muted-foreground tabular-nums w-32 text-right">
                        {r.done}/{r.total} · {r.pct}%
                      </span>
                    </div>
                  </div>
                  {r.slug && (
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/admin/clientes/$slug" params={{ slug: r.slug }}>
                        Abrir <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
