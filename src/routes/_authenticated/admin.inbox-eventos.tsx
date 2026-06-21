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
import { fetchUnifiedInbox } from "@/lib/inbox-events.functions";

const SOURCES = [
  { key: "webhook", label: "Webhooks" },
  { key: "integration", label: "Integrações" },
  { key: "n8n", label: "N8N" },
  { key: "runtime", label: "Runtime" },
] as const;

export const Route = createFileRoute("/_authenticated/admin/inbox-eventos")({
  head: () => ({ meta: [{ title: "Inbox de Eventos — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: InboxEventosPage,
});

function InboxEventosPage() {
  const fn = useServerFn(fetchUnifiedInbox);
  const [hours, setHours] = useState(24);
  const [severity, setSeverity] = useState("");
  const [q, setQ] = useState("");
  const [sources, setSources] = useState<string[]>([...SOURCES.map((s) => s.key)]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["inbox-events", hours, severity, q, sources.join(",")],
    queryFn: () => fn({ data: { hours, severity: severity || undefined, q: q || undefined, sources } }),
    staleTime: 30_000,
  });
  const d = data as any;

  function toggleSrc(k: string) {
    setSources((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inbox de Eventos" description="Stream cronológico unificado de webhooks, integrações, N8N e runtime do core. Útil para diagnosticar incidentes ponta a ponta." />

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <label className="text-xs space-y-1">Janela (h)<Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value) || 24)} className="w-24" /></label>
        <label className="text-xs space-y-1">Severidade
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="border rounded px-2 py-1.5 text-sm w-32">
            <option value="">todas</option><option value="error">error</option><option value="warn">warn</option><option value="info">info</option><option value="ok">ok</option>
          </select>
        </label>
        <label className="text-xs space-y-1 flex-1 min-w-[200px]">Busca<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="texto no label ou detalhe" /></label>
        <div className="flex items-center gap-2">
          {SOURCES.map((s) => (
            <button key={s.key} onClick={() => toggleSrc(s.key)}>
              <Badge variant={sources.includes(s.key) ? "default" : "outline"}>{s.label}</Badge>
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Atualizar"}</Button>
      </Card>

      {isLoading || !d ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>
      ) : error ? (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">{(error as Error).message}</Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total" value={d.total} hint={`Últimas ${hours}h`} />
            <KpiCard label="Erros" value={d.counts.error ?? 0} />
            <KpiCard label="Warns" value={d.counts.warn ?? 0} />
            <KpiCard label="OK / Info" value={(d.counts.ok ?? 0) + (d.counts.info ?? 0)} />
          </div>

          <Card className="p-3">
            {d.events.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Sem eventos no período.</p>
            ) : (
              <ul className="divide-y">
                {d.events.map((e: any) => (
                  <li key={e.id} className="py-2">
                    <button className="w-full text-left flex items-center gap-2" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                      <span className="text-xs font-mono text-muted-foreground w-32 shrink-0">{String(e.ts).slice(5, 19).replace("T", " ")}</span>
                      <Badge variant={e.severity === "error" ? "destructive" : e.severity === "warn" ? "outline" : e.severity === "ok" ? "secondary" : "default"}>{e.severity}</Badge>
                      <Badge variant="secondary" className="font-mono text-[10px]">{e.source}</Badge>
                      <span className="text-sm font-medium truncate flex-1">{e.label}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[40%]">{e.detail}</span>
                    </button>
                    {expanded === e.id && (
                      <pre className="mt-2 ml-32 text-[11px] bg-muted border rounded p-2 overflow-x-auto">{JSON.stringify(e.payload, null, 2)}</pre>
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
