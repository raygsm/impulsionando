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


type HistoryPoint = { day: string; up_ratio: number | null };

type ServiceRow = {
  scope: string;
  url: string | null;
  name: string | null;
  currently_up: boolean | null;
  availability_bps_30d: number | null;
  latency_p95_ms_30d: number | null;
  last_check_at: string | null;
  history?: HistoryPoint[];
};


type IncidentUpdate = {
  id: string;
  status: string;
  body: string;
  created_at: string;
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
  updates?: IncidentUpdate[];
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

type MaintenanceRow = {
  id: string;
  title: string;
  description: string | null;
  scope: string;
  url: string | null;
  severity: "info" | "minor" | "major";
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
};

type StatusPayload = {
  overall: "operational" | "degraded" | "outage" | "maintenance" | "unknown";
  updated_at: string;
  summary: { monitored: number; up: number; down: number; openIncidents: number; sev1Open: number; maintenance?: number };
  services: ServiceRow[];
  incidents: IncidentRow[];
  postmortems: PostmortemRow[];
  maintenance?: MaintenanceRow[];
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
  maintenance: { text: "Manutenção programada em curso", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
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
            <CardTitle className="text-base">Serviços monitorados (uptime 90 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : !data?.services.length ? (
              <p className="text-sm text-muted-foreground">Sem checagens públicas no momento.</p>
            ) : (
              <ul className="divide-y">
                {data.services.map((s, i) => {
                  const up = s.currently_up !== false;
                  const history = s.history ?? [];
                  return (
                    <li key={`${s.scope}-${s.url ?? s.name ?? i}`} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.name ?? s.scope}</div>
                          {s.url ? (
                            <div className="text-xs text-muted-foreground truncate max-w-[420px]">{s.url}</div>
                          ) : null}
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            up ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                          {up ? "Operacional" : "Indisponível"}
                        </span>
                      </div>
                      {history.length > 0 && (
                        <div className="mt-2 flex items-end gap-[2px] h-8" aria-label="Histórico de uptime (90 dias)">
                          {history.map((h) => {
                            const r = h.up_ratio;
                            let cls = "bg-muted";
                            let title = `${h.day} · sem dados`;
                            if (r != null) {
                              if (r >= 0.999) cls = "bg-emerald-500";
                              else if (r >= 0.99) cls = "bg-emerald-400";
                              else if (r >= 0.95) cls = "bg-amber-400";
                              else if (r >= 0.5) cls = "bg-orange-500";
                              else cls = "bg-red-500";
                              title = `${h.day} · ${(r * 100).toFixed(2)}% up`;
                            }
                            return (
                              <span
                                key={h.day}
                                title={title}
                                className={`inline-block w-[3px] h-full rounded-sm ${cls}`}
                              />
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                        <span>Disp. 30d: <span className="text-foreground">{fmtPct(s.availability_bps_30d)}</span></span>
                        <span>p95: <span className="text-foreground">{fmtMs(s.latency_p95_ms_30d)}</span></span>
                        <span>Última checagem: {fmtDate(s.last_check_at)}</span>
                        <span className="ml-auto">90d ←  → hoje</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Scheduled maintenance */}
        {data?.maintenance && data.maintenance.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manutenções programadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.maintenance.map((m) => {
                  const live = m.status === "in_progress";
                  return (
                    <li key={m.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{m.title}</div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                            live ? "bg-sky-500/15 text-sky-700" : "bg-slate-500/15 text-slate-700"
                          }`}
                        >
                          {live ? "em curso" : "agendada"} · {m.severity}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {m.scope}
                        {m.url ? ` · ${m.url}` : ""} · {fmtDate(m.starts_at)} → {fmtDate(m.ends_at)}
                      </div>
                      {m.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm">{m.description}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ) : null}


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
                      {i.updates && i.updates.length > 0 && (
                        <ol className="mt-3 space-y-2 border-l border-border pl-3">
                          {i.updates.slice(0, 5).map((u) => (
                            <li key={u.id} className="text-xs">
                              <div className="flex gap-2 items-center">
                                <span className="font-semibold uppercase tracking-wide text-[10px] text-primary">
                                  {u.status}
                                </span>
                                <span className="text-muted-foreground">{fmtDate(u.created_at)}</span>
                              </div>
                              <div className="mt-0.5 whitespace-pre-wrap text-foreground/90">{u.body}</div>
                            </li>
                          ))}
                        </ol>
                      )}
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
        <EmbedCard />


        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Esta página é pública e atualizada automaticamente a cada minuto. Dados agregados — sem informações de clientes.
        </footer>

      </div>
    </main>
  );
}

function SubscribeCard() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/public/status-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "status_page" }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
      if (res.ok && json.ok) {
        setState("ok");
        setMsg(json.message ?? "Verifique seu email para confirmar a inscrição.");
        setEmail("");
      } else {
        setState("error");
        setMsg(json.error === "invalid_email" ? "Email inválido." : "Não foi possível inscrever agora. Tente novamente.");
      }
    } catch {
      setState("error");
      setMsg("Falha de rede. Tente novamente.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Receber atualizações por email</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Inscreva-se para receber notificações de novos incidentes, resoluções e postmortems publicados. Enviamos um link
          de confirmação por email.
        </p>
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === "loading"}
            className="sm:max-w-sm"
          />
          <Button type="submit" disabled={state === "loading" || !email}>
            {state === "loading" ? "Enviando…" : "Inscrever"}
          </Button>
        </form>
        {msg ? (
          <p className={`mt-2 text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>{msg}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmbedCard() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://impulsionando.com.br";
  const iframe = `<iframe src="${origin}/status/embed" title="Status Impulsionando" style="width:100%;max-width:480px;height:80px;border:0" loading="lazy"></iframe>`;
  const badgeMd = `[![Status](${origin}/api/public/status-badge.svg)](${origin}/status)`;

  
  const [copied, setCopied] = useState<string>("");
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* ignore */
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Incorporar no seu site</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cole o snippet abaixo na sua landing page para exibir o status em tempo real.
        </p>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">HTML / iframe</span>
            <Button size="sm" variant="outline" onClick={() => copy(iframe, "iframe")}>
              {copied === "iframe" ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 text-xs"><code>{iframe}</code></pre>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Feed RSS</span>
            <Button size="sm" variant="outline" onClick={() => copy(`${origin}/api/public/status.rss`, "rss")}>
              {copied === "rss" ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 text-xs"><code>{origin}/api/public/status.rss</code></pre>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Badge (Markdown)</span>
            <Button size="sm" variant="outline" onClick={() => copy(badgeMd, "badge")}>
              {copied === "badge" ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 text-xs"><code>{badgeMd}</code></pre>
          <img src="/api/public/status-badge.svg" alt="Status badge preview" className="mt-2 h-5" />
        </div>
        <div className="pt-2">
          <a
            href="/status/embed"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Pré-visualizar widget →
          </a>
        </div>
      </CardContent>
    </Card>
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
