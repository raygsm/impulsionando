import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/insights/KpiCard";
import {
  readDemoFallbackLog,
  type DemoFallbackEvent,
} from "@/lib/demoResolver";
import {
  readFunnelEventsBuffer,
  type FunnelEnvelope,
} from "@/lib/funnelTracking";
import {
  AlertTriangle, RefreshCw, Trash2, Download, Search,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/funnel-fallbacks")({
  head: () => ({
    meta: [
      { title: "Fallbacks do funil — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FunnelFallbacksPage,
});

const PERIODS: Array<{ id: string; label: string; ms: number | null }> = [
  { id: "1h", label: "Última hora", ms: 60 * 60 * 1000 },
  { id: "24h", label: "Últimas 24h", ms: 24 * 60 * 60 * 1000 },
  { id: "7d", label: "Últimos 7 dias", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "30d", label: "Últimos 30 dias", ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "all", label: "Todos", ms: null },
];

const FALLBACK_STORAGE = "impulsionando:demo-fallback-log";
const EVENTS_STORAGE = "impulsionando:funnel-events";

function FunnelFallbacksPage() {
  const [tick, setTick] = useState(0);
  const [period, setPeriod] = useState<string>("24h");
  const [origem, setOrigem] = useState<string>("__all");
  const [search, setSearch] = useState<string>("");
  const [events, setEvents] = useState<FunnelEnvelope[]>([]);
  const [fallbacks, setFallbacks] = useState<DemoFallbackEvent[]>([]);

  useEffect(() => {
    setEvents(readFunnelEventsBuffer());
    setFallbacks(readDemoFallbackLog());
  }, [tick]);

  const cutoff = useMemo(() => {
    const p = PERIODS.find((x) => x.id === period);
    if (!p?.ms) return 0;
    return Date.now() - p.ms;
  }, [period]);

  const inWindow = (iso?: string) => {
    if (!cutoff) return true;
    if (!iso) return false;
    const t = Date.parse(iso);
    return Number.isFinite(t) && t >= cutoff;
  };

  const origens = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) if (e.origem) s.add(e.origem);
    return Array.from(s).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!inWindow(e.at)) return false;
      if (origem !== "__all" && e.origem !== origem) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [e.cta, e.nicho_pedido, e.alias_resolvido, e.rotaDestino, e.traceId, e.origem]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, origem, cutoff, search]);

  const filteredFallbacks = useMemo(() => {
    return fallbacks.filter((f) => inWindow(f.at));
  }, [fallbacks, cutoff]);

  const totalEvents = filteredEvents.length;
  const totalFallbackEvents = filteredEvents.filter((e) => e.isFallback).length;
  const fallbackRate = totalEvents ? (totalFallbackEvents / totalEvents) * 100 : 0;
  const uniqueTraces = new Set(filteredEvents.map((e) => e.traceId)).size;

  // Agregação por nicho pedido
  const byNicho = useMemo(() => {
    const map = new Map<string, { total: number; fallback: number; rotas: Set<string>; traces: Set<string> }>();
    for (const e of filteredEvents) {
      const key = (e.nicho_pedido || e.alias_resolvido || "—").toString();
      const cur = map.get(key) ?? { total: 0, fallback: 0, rotas: new Set(), traces: new Set() };
      cur.total += 1;
      if (e.isFallback) cur.fallback += 1;
      cur.rotas.add(e.rotaDestino);
      cur.traces.add(e.traceId);
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([nicho, v]) => ({
        nicho,
        total: v.total,
        fallback: v.fallback,
        rate: v.total ? (v.fallback / v.total) * 100 : 0,
        rotas: Array.from(v.rotas),
        traces: v.traces.size,
      }))
      .sort((a, b) => b.fallback - a.fallback || b.total - a.total);
  }, [filteredEvents]);

  // Agregação por rotaDestino
  const byRota = useMemo(() => {
    const map = new Map<string, { total: number; fallback: number }>();
    for (const e of filteredEvents) {
      const cur = map.get(e.rotaDestino) ?? { total: 0, fallback: 0 };
      cur.total += 1;
      if (e.isFallback) cur.fallback += 1;
      map.set(e.rotaDestino, cur);
    }
    return Array.from(map.entries())
      .map(([rota, v]) => ({ rota, ...v, rate: v.total ? (v.fallback / v.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredEvents]);

  const clearBuffers = () => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Limpar buffers locais de fallback e eventos do funil?")) return;
    window.localStorage.removeItem(FALLBACK_STORAGE);
    window.localStorage.removeItem(EVENTS_STORAGE);
    setTick((n) => n + 1);
  };

  const exportJson = () => {
    if (typeof window === "undefined") return;
    const payload = {
      generatedAt: new Date().toISOString(),
      filters: { period, origem, search },
      events: filteredEvents,
      fallbacks: filteredFallbacks,
      aggregates: { byNicho, byRota, fallbackRate, uniqueTraces, totalEvents },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funnel-fallbacks-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria de fallbacks do funil"
        description="Inspeciona, no navegador do auditor, eventos de CTA capturados por trackFunnelCta e fallbacks emitidos por resolveDemoNicho. Buffer local com últimos 60 eventos e 30 fallbacks."
      />

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Período</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Origem do CTA</Label>
          <Select value={origem} onValueChange={setOrigem}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas ({origens.length})</SelectItem>
              {origens.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-[220px]">
          <Label className="text-xs">Buscar (cta, nicho, rota, traceId)</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ex.: saude, diag-ver-demo, trc_..." className="pl-8" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTick((n) => n + 1)}>
            <RefreshCw className="w-4 h-4 mr-1" /> Recarregar
          </Button>
          <Button variant="outline" size="sm" onClick={exportJson}>
            <Download className="w-4 h-4 mr-1" /> Exportar JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={clearBuffers} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-1" /> Limpar buffers
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Eventos no período" value={String(totalEvents)} />
        <KpiCard label="Eventos em fallback" value={String(totalFallbackEvents)} />
        <KpiCard label="Taxa de fallback" value={`${fallbackRate.toFixed(1)}%`} />
        <KpiCard label="Traces únicos" value={String(uniqueTraces)} />
      </div>

      {totalEvents === 0 && (
        <Card className="p-6 text-sm text-muted-foreground flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
          <div>
            Nenhum evento no buffer local para os filtros atuais. Esta auditoria lê apenas o navegador
            corrente (rolling buffer de <code>localStorage</code>). Para coleta agregada entre usuários,
            plugue um sink server-side em <code>trackFunnelCta</code>.
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <h2 className="text-base font-semibold">Por nicho pedido</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nicho pedido</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Fallback</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead>Rotas destino</TableHead>
                <TableHead className="text-right">Traces</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byNicho.map((r) => (
                <TableRow key={r.nicho}>
                  <TableCell className="font-mono text-xs">{r.nicho}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.fallback > 0 ? (
                      <Badge variant="destructive">{r.fallback}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.rate.toFixed(1)}%</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[280px]">
                    {r.rotas.join(", ")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.traces}</TableCell>
                </TableRow>
              ))}
              {byNicho.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-base font-semibold">Por rota destino</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rota destino</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Fallback</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byRota.map((r) => (
                <TableRow key={r.rota}>
                  <TableCell className="font-mono text-xs">{r.rota}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.fallback}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.rate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              {byRota.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-base font-semibold">Eventos brutos ({filteredEvents.length})</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>traceId</TableHead>
                <TableHead>cta</TableHead>
                <TableHead>origem</TableHead>
                <TableHead>nicho pedido</TableHead>
                <TableHead>alias resolvido</TableHead>
                <TableHead>rota destino</TableHead>
                <TableHead>fallback?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((e, i) => (
                <TableRow key={`${e.traceId}-${e.at}-${i}`}>
                  <TableCell className="text-xs whitespace-nowrap">{e.at?.replace("T", " ").slice(0, 19)}</TableCell>
                  <TableCell className="font-mono text-[11px]">{e.traceId}</TableCell>
                  <TableCell className="text-xs">{e.cta}</TableCell>
                  <TableCell className="text-xs">{e.origem ?? "—"}</TableCell>
                  <TableCell className="font-mono text-[11px]">{e.nicho_pedido ?? "—"}</TableCell>
                  <TableCell className="font-mono text-[11px]">{e.alias_resolvido}</TableCell>
                  <TableCell className="font-mono text-[11px]">{e.rotaDestino}</TableCell>
                  <TableCell>
                    {e.isFallback ? <Badge variant="destructive">fallback</Badge> : <Badge variant="secondary">ok</Badge>}
                  </TableCell>
                </TableRow>
              ))}
              {filteredEvents.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground text-sm">Nenhum evento</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-base font-semibold">Log de fallbacks do resolver ({filteredFallbacks.length})</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>onde</TableHead>
                <TableHead>path</TableHead>
                <TableHead>pedido</TableHead>
                <TableHead>resolvido</TableHead>
                <TableHead>reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFallbacks.map((f, i) => (
                <TableRow key={`${f.at}-${i}`}>
                  <TableCell className="text-xs whitespace-nowrap">{f.at?.replace("T", " ").slice(0, 19)}</TableCell>
                  <TableCell className="text-xs">{f.where ?? "—"}</TableCell>
                  <TableCell className="text-xs">{f.path ?? "—"}</TableCell>
                  <TableCell className="font-mono text-[11px]">{f.requested}</TableCell>
                  <TableCell className="font-mono text-[11px]">{f.slug}</TableCell>
                  <TableCell><Badge variant="outline">{f.reason}</Badge></TableCell>
                </TableRow>
              ))}
              {filteredFallbacks.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm">Sem fallbacks</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
