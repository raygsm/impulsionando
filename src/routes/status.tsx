import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


type ServiceRow = {
  scope: string;
  url: string | null;
  name: string | null;
  currently_up: boolean | null;
  availability_bps_30d: number | null;
  latency_p95_ms_30d: number | null;
  last_check_at: string | null;
};

type IncidentRow = {
  id: string;
  scope: string;
  url: string | null;
  severity: string;
  status: string;
  title: string;
  detected_at: string;
  resolved_at: string | null;
};

type PostmortemRow = {
  id: string;
  scope: string;
  url: string | null;
  severity: string;
  title: string;
  detected_at: string;
  resolved_at: string | null;
  postmortem_summary: string | null;
  postmortem_lessons: string | null;
  postmortem_published_at: string | null;
};

type StatusPayload = {
  overall: "operational" | "degraded" | "outage" | "unknown";
  updated_at: string;
  summary: { monitored: number; up: number; down: number; openIncidents: number; sev1Open: number };
  services: ServiceRow[];
  incidents: IncidentRow[];
  postmortems: PostmortemRow[];
};

async function fetchStatus(): Promise<StatusPayload> {
  const res = await fetch("/api/public/status", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`status_http_${res.status}`);
  return (await res.json()) as StatusPayload;
}

const OVERALL_LABEL: Record<StatusPayload["overall"], { text: string; cls: string }> = {
  operational: { text: "Todos os sistemas operacionais", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  degraded: { text: "Operação parcialmente degradada", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  outage: { text: "Indisponibilidade ativa", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  unknown: { text: "Status indisponível", cls: "bg-muted text-muted-foreground border-border" },
};

function fmtPct(bps: number | null) {
  if (bps == null) return "—";
  return `${(bps / 100).toFixed(2)}%`;
}

function fmtMs(ms: number | null) {
  if (ms == null) return "—";
  return `${Math.round(ms)} ms`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function StatusPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["public-status"],
    queryFn: fetchStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const overall = data?.overall ?? "unknown";
  const badge = OVERALL_LABEL[overall];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">impulsionando.com.br</p>
          <h1 className="text-3xl font-bold tracking-tight">Status da Plataforma</h1>
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${badge.cls}`}>
            <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
            {badge.text}
          </div>
          <p className="text-xs text-muted-foreground">
            Atualizado: {fmtDate(data?.updated_at)} ·{" "}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="underline underline-offset-2 hover:text-foreground disabled:opacity-50"
            >
              {isFetching ? "atualizando…" : "atualizar agora"}
            </button>
            {" · "}
            <a
              href="/api/public/status.rss"
              className="underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              RSS
            </a>
          </p>

        </header>

        {error ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Não foi possível carregar o status agora. Tente novamente em alguns instantes.
            </CardContent>
          </Card>
        ) : null}

        {/* Summary KPIs */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Monitorados", value: data?.summary.monitored ?? "—" },
            { label: "Operacionais", value: data?.summary.up ?? "—" },
            { label: "Indisponíveis", value: data?.summary.down ?? "—" },
            { label: "Incidentes abertos", value: data?.summary.openIncidents ?? "—" },
            { label: "SEV1 abertos", value: data?.summary.sev1Open ?? "—" },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="py-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
                <div className="mt-1 text-2xl font-semibold">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Serviços monitorados (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : !data?.services.length ? (
              <p className="text-sm text-muted-foreground">Sem checagens públicas no momento.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Disponibilidade</TableHead>
                    <TableHead className="text-right">p95 latência</TableHead>
                    <TableHead className="text-right">Última checagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.services.map((s, i) => {
                    const up = s.currently_up !== false;
                    return (
                      <TableRow key={`${s.scope}-${s.url ?? s.name ?? i}`}>
                        <TableCell>
                          <div className="font-medium">{s.name ?? s.scope}</div>
                          {s.url ? (
                            <div className="text-xs text-muted-foreground truncate max-w-[280px]">{s.url}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                              up
                                ? "bg-emerald-500/15 text-emerald-700"
                                : "bg-red-500/15 text-red-700"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                            {up ? "Operacional" : "Indisponível"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(s.availability_bps_30d)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtMs(s.latency_p95_ms_30d)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(s.last_check_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Active / recent incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incidentes recentes (90 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.incidents.length ? (
              <p className="text-sm text-muted-foreground">Sem incidentes registrados.</p>
            ) : (
              <ul className="space-y-3">
                {data.incidents.slice(0, 15).map((i) => {
                  const open = i.status !== "resolved";
                  return (
                    <li key={i.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{i.title}</div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                            open
                              ? "bg-amber-500/15 text-amber-700"
                              : "bg-emerald-500/15 text-emerald-700"
                          }`}
                        >
                          {open ? i.status : "resolvido"} · {i.severity}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {i.scope}
                        {i.url ? ` · ${i.url}` : ""} · detectado {fmtDate(i.detected_at)}
                        {i.resolved_at ? ` · resolvido ${fmtDate(i.resolved_at)}` : ""}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Published postmortems */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Postmortems publicados</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.postmortems.length ? (
              <p className="text-sm text-muted-foreground">Nenhum postmortem publicado nos últimos 90 dias.</p>
            ) : (
              <div className="space-y-5">
                {data.postmortems.map((p) => (
                  <article key={p.id} className="border-l-2 border-primary/40 pl-4">
                    <header className="flex flex-wrap items-baseline gap-2">
                      <h2 className="font-semibold">{p.title}</h2>
                      <span className="text-xs uppercase text-muted-foreground">{p.severity}</span>
                    </header>
                    <p className="text-xs text-muted-foreground">
                      {p.scope}
                      {p.url ? ` · ${p.url}` : ""} · publicado {fmtDate(p.postmortem_published_at)} ·
                      detectado {fmtDate(p.detected_at)}
                      {p.resolved_at ? ` · resolvido ${fmtDate(p.resolved_at)}` : ""}
                    </p>
                    {p.postmortem_summary ? (
                      <p className="mt-2 text-sm whitespace-pre-wrap">{p.postmortem_summary}</p>
                    ) : null}
                    {p.postmortem_lessons ? (
                      <div className="mt-2 rounded-md bg-muted/40 p-3 text-sm">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">Lições aprendidas</div>
                        <p className="mt-1 whitespace-pre-wrap">{p.postmortem_lessons}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <SubscribeCard />

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Esta página é pública e atualizada automaticamente a cada minuto. Dados agregados — sem informações de clientes.
        </footer>

      </div>
    </main>
  );
}

export const Route = createFileRoute("/status")({
  component: StatusPage,
  head: () => ({
    meta: [
      { title: "Status da Plataforma · Impulsionando" },
      {
        name: "description",
        content:
          "Status em tempo real dos serviços Impulsionando: uptime, incidentes ativos e postmortems publicados.",
      },
      { property: "og:title", content: "Status da Plataforma · Impulsionando" },
      {
        property: "og:description",
        content: "Uptime, incidentes e postmortems publicados do ecossistema Impulsionando.",
      },
    ],
    links: [
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "Impulsionando — Status & Incidentes",
        href: "/api/public/status.rss",
      },
    ],
  }),

});
