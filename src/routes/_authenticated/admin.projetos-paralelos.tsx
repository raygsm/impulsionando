import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExternalLink, AlertTriangle, RefreshCw, CheckCircle2, Clock, Archive, ArrowRight, Layers, DollarSign } from "lucide-react";
import { getParallelProjects, advanceParallelProject } from "@/lib/parallel-projects.functions";

export const Route = createFileRoute("/_authenticated/admin/projetos-paralelos")({
  head: () => ({ meta: [{ title: "Projetos Paralelos — Core Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ProjetosParalelosPage,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const STATUS_META: Record<string, { label: string; variant: any; icon: any }> = {
  native:      { label: "Nativo",       variant: "default",     icon: CheckCircle2 },
  pending:     { label: "Pendente",     variant: "secondary",   icon: Clock },
  in_progress: { label: "Em migração",  variant: "outline",     icon: RefreshCw },
  migrated:    { label: "Migrado",      variant: "default",     icon: CheckCircle2 },
  archived:    { label: "Arquivado",    variant: "secondary",   icon: Archive },
};

function ProjetosParalelosPage() {
  const fn = useServerFn(getParallelProjects);
  const advance = useServerFn(advanceParallelProject);
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-parallel-projects"],
    queryFn: () => fn({ data: {} as never }),
    staleTime: 60_000,
  });
  const mut = useMutation({
    mutationFn: (vars: { companyId: string; newStatus: any }) => advance({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-parallel-projects"] }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projetos Paralelos</h1>
          <p className="text-sm text-muted-foreground">
            Consolidação dos projetos Lovable que estão sendo absorvidos pelo Core Impulsionando.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" /> {(error as Error).message}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground">Projetos mapeados</div>
              <div className="text-2xl font-bold mt-1">{data.summary.total}</div>
              <div className="text-xs text-muted-foreground mt-1">{data.summary.vitrineActive} ativos na vitrine</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground">Pendentes</div>
              <div className="text-2xl font-bold mt-1 text-amber-600">{data.summary.pending}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground">Em migração</div>
              <div className="text-2xl font-bold mt-1 text-primary">{data.summary.inProgress}</div>
              <div className="text-xs text-muted-foreground mt-1">{data.summary.migrated} migrados</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><DollarSign className="w-3 h-3" /> MRR consolidado</div>
              <div className="text-2xl font-bold mt-1 text-primary">{brl(data.summary.totalMRR)}</div>
            </Card>
          </div>

          <div className="space-y-4">
            {data.projects.map((p) => {
              const meta = STATUS_META[p.migration_status] ?? STATUS_META.pending;
              const Icon = meta.icon;
              return (
                <Card key={p.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      {p.logo_url ? (
                        <img src={p.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg truncate">{p.name}</h3>
                          <Badge variant={meta.variant} className="gap-1"><Icon className="w-3 h-3" /> {meta.label}</Badge>
                          {p.vitrine_show_external && <Badge variant="outline" className="text-emerald-600 border-emerald-600/40">Vitrine</Badge>}
                          {!p.is_active && <Badge variant="destructive">Inativo</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                          {p.nicheName && <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {p.nicheName}</span>}
                          {p.public_slug && <span>/{p.public_slug}</span>}
                          {(p.address_city || p.address_state) && <span>{[p.address_city, p.address_state].filter(Boolean).join(" / ")}</span>}
                          {p.mrr > 0 && <span className="text-primary font-semibold">{brl(p.mrr)} MRR</span>}
                        </div>
                        {p.external_url && (
                          <a href={p.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                            <ExternalLink className="w-3 h-3" /> {p.external_url}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={p.migration_status}
                        onValueChange={(v) => mut.mutate({ companyId: p.id, newStatus: v as any })}
                      >
                        <SelectTrigger className="w-40 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_META).map(([k, m]) => (
                            <SelectItem key={k} value={k}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Link to="/admin/tenant-360" search={{ companyId: p.id } as any}>
                        <Button size="sm" variant="outline" className="gap-1">
                          Tenant 360° <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {p.logs.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-xs uppercase text-muted-foreground mb-2">Últimos passos</div>
                      <ul className="space-y-1">
                        {p.logs.map((l: any) => (
                          <li key={l.id} className="text-xs flex items-start gap-2">
                            <Badge variant={l.status === "done" ? "default" : l.status === "pending" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                              {l.status}
                            </Badge>
                            <span className="font-mono text-muted-foreground">{l.step}</span>
                            {l.notes && <span className="text-muted-foreground truncate">— {l.notes}</span>}
                            <span className="text-muted-foreground ml-auto shrink-0">{new Date(l.created_at).toLocaleDateString("pt-BR")}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}

            {data.projects.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                Nenhum projeto paralelo mapeado ainda.
              </Card>
            )}
          </div>

          <Card className="p-4 text-xs text-muted-foreground">
            Última atualização: {new Date(data.generatedAt).toLocaleString("pt-BR")}. Cada projeto Lovable
            paralelo é tratado como tenant do Core — esta tela acompanha a consolidação plena.
          </Card>
        </>
      ) : null}
    </div>
  );
}
