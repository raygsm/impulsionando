import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/insights/KpiCard";
import { Loader2 } from "lucide-react";
import { fetchAuditTrail } from "@/lib/audit-trail.functions";

export const Route = createFileRoute("/_authenticated/admin/audit-trail")({
  head: () => ({ meta: [{ title: "Audit Trail — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AuditTrailPage,
});

function AuditTrailPage() {
  const fn = useServerFn(fetchAuditTrail);
  const [days, setDays] = useState(30);
  const [entity, setEntity] = useState("");
  const [entityId, setEntityId] = useState("");
  const [action, setAction] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["audit-trail", days, entity, entityId, action, userEmail],
    queryFn: () => fn({ data: { days, entity: entity || undefined, entityId: entityId || undefined, action: action || undefined, userEmail: userEmail || undefined } }),
    staleTime: 30_000,
  });
  const d = data as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" description="Linha do tempo unificada de todas as ações administrativas registradas no core, com diff de antes/depois por entidade." />

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <label className="text-xs space-y-1">Janela (dias)<Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value) || 30)} className="w-24" /></label>
        <label className="text-xs space-y-1">Entidade<Input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="ex: company" className="w-40" /></label>
        <label className="text-xs space-y-1">Entity ID<Input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="uuid ou id" className="w-56" /></label>
        <label className="text-xs space-y-1">Ação<Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="ex: update" className="w-40" /></label>
        <label className="text-xs space-y-1">Usuário<Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="email" className="w-56" /></label>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Atualizar"}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setEntity(""); setEntityId(""); setAction(""); setUserEmail(""); }}>limpar</Button>
      </Card>

      {isLoading || !d ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>
      ) : error ? (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">{(error as Error).message}</Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Eventos" value={d.stats.total} hint={`Últimos ${days}d`} />
            <KpiCard label="Entidades distintas" value={d.stats.topEntities.length} />
            <KpiCard label="Ações distintas" value={d.stats.topActions.length} />
            <KpiCard label="Usuários distintos" value={d.stats.topUsers.length} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <TopList title="Top entidades" items={d.stats.topEntities} onClick={(k) => setEntity(k)} />
            <TopList title="Top ações" items={d.stats.topActions} onClick={(k) => setAction(k)} />
            <TopList title="Top usuários" items={d.stats.topUsers} onClick={(k) => setUserEmail(k)} />
          </div>

          <Card className="p-3">
            {d.events.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Sem eventos no período/filtros.</p>
            ) : (
              <ul className="divide-y">
                {d.events.map((e: any) => (
                  <li key={e.id} className="py-2">
                    <button className="w-full text-left flex items-center gap-2" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                      <span className="text-xs font-mono text-muted-foreground w-32 shrink-0">{String(e.created_at).slice(5,19).replace("T"," ")}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{e.entity}</Badge>
                      <Badge variant="secondary">{e.action}</Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{e.entity_id ?? ""}</span>
                      <span className="text-sm flex-1 truncate">{e.user_email ?? "—"}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {e.changedKeys.length > 0 && <span className="mr-2">±{e.changedKeys.length}</span>}
                        {e.addedKeys.length > 0 && <span className="mr-2 text-emerald-600">+{e.addedKeys.length}</span>}
                        {e.removedKeys.length > 0 && <span className="text-rose-600">-{e.removedKeys.length}</span>}
                      </span>
                    </button>
                    {expanded === e.id && (
                      <div className="mt-2 ml-32 space-y-2">
                        {e.changedKeys.length > 0 && (
                          <div className="text-xs">
                            <span className="font-semibold">Campos alterados:</span> {e.changedKeys.map((k: string) => <Badge key={k} variant="outline" className="mr-1">{k}</Badge>)}
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <p className="font-semibold mb-1">Antes</p>
                            <pre className="bg-muted border rounded p-2 overflow-x-auto max-h-64">{JSON.stringify(e.before, null, 2)}</pre>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Depois</p>
                            <pre className="bg-muted border rounded p-2 overflow-x-auto max-h-64">{JSON.stringify(e.after, null, 2)}</pre>
                          </div>
                        </div>
                        {e.metadata && Object.keys(e.metadata).length > 0 && (
                          <div className="text-[11px]">
                            <p className="font-semibold mb-1">Metadata</p>
                            <pre className="bg-muted border rounded p-2 overflow-x-auto">{JSON.stringify(e.metadata, null, 2)}</pre>
                          </div>
                        )}
                        {e.entity_id && (
                          <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); setEntity(e.entity); setEntityId(e.entity_id); }}>
                            Ver linha do tempo desta entidade
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function TopList({ title, items, onClick }: { title: string; items: { key: string; count: number }[]; onClick: (k: string) => void }) {
  return (
    <Card className="p-3">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {items.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : (
        <ul className="space-y-1 text-xs">
          {items.map((i) => (
            <li key={i.key} className="flex items-center justify-between">
              <button className="text-left truncate hover:underline font-mono" onClick={() => onClick(i.key)}>{i.key}</button>
              <Badge variant="secondary">{i.count}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
