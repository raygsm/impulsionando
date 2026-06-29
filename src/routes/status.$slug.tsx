import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HistoryPoint = { day: string; up_ratio: number | null };

type IncidentUpdate = { id: string; status: string; body: string; created_at: string };
type IncidentRow = {
  id: string;
  severity: string;
  status: string;
  title: string;
  detected_at: string;
  resolved_at: string | null;
  postmortem_summary: string | null;
  postmortem_published_at: string | null;
  updates?: IncidentUpdate[];
};
type MaintenanceRow = {
  id: string;
  title: string;
  description: string | null;
  severity: "info" | "minor" | "major";
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
};

type DetailPayload = {
  service: {
    name: string;
    url: string;
    slug: string;
    currently_up: boolean | null;
    availability_bps_30d: number | null;
    latency_p95_ms_30d: number | null;
    last_check_at: string | null;
  };
  history: HistoryPoint[];
  incidents: IncidentRow[];
  maintenance: MaintenanceRow[];
  updated_at: string;
  error?: string;
};

function fmtPct(bps: number | null) {
  if (bps == null) return "—";
  return `${(bps / 100).toFixed(2)}%`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
}

function dayColor(r: number | null) {
  if (r == null) return "bg-muted";
  if (r >= 0.999) return "bg-emerald-500";
  if (r >= 0.99) return "bg-emerald-400";
  if (r >= 0.95) return "bg-yellow-400";
  if (r >= 0.8) return "bg-orange-500";
  return "bg-red-500";
}

function Sparkline({ history }: { history: HistoryPoint[] }) {
  return (
    <div className="flex items-end gap-[2px] h-10 w-full overflow-hidden">
      {history.map((d) => (
        <div
          key={d.day}
          title={`${d.day} — ${d.up_ratio == null ? "sem dados" : (d.up_ratio * 100).toFixed(2) + "%"}`}
          className={`flex-1 rounded-sm ${dayColor(d.up_ratio)}`}
          style={{ minWidth: 3, height: d.up_ratio == null ? "30%" : `${20 + d.up_ratio * 80}%` }}
        />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/status/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Status — ${params.slug} | Impulsionando` },
      { name: "description", content: `Histórico e incidentes do serviço ${params.slug}.` },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: StatusDetailPage,
  errorComponent: ({ error }) => (
    <main className="container mx-auto p-6">
      <p className="text-red-600">Erro ao carregar: {String(error?.message ?? error)}</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="container mx-auto p-6">
      <p>Serviço não encontrado.</p>
    </main>
  ),
});

function StatusDetailPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError } = useQuery<DetailPayload>({
    queryKey: ["status-detail", slug],
    queryFn: async () => {
      const r = await fetch(`/api/public/status/${encodeURIComponent(slug)}`);
      if (!r.ok) throw new Error("not_found");
      return r.json();
    },
    refetchInterval: 60_000,
  });

  return (
    <main className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="text-sm">
        <Link to="/status" className="text-muted-foreground hover:underline">
          ← Voltar para Status geral
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : isError || !data || data.error ? (
        <p className="text-red-600">Serviço não encontrado ou indisponível.</p>
      ) : (
        <>
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">{data.service.name}</h1>
            <p className="text-sm text-muted-foreground break-all">{data.service.url}</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Status atual</div>
                <div className={`text-lg font-semibold ${data.service.currently_up === false ? "text-red-600" : "text-emerald-600"}`}>
                  {data.service.currently_up === false ? "Indisponível" : "Operacional"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Disponibilidade 30d</div>
                <div className="text-lg font-semibold">{fmtPct(data.service.availability_bps_30d)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">p95 30d</div>
                <div className="text-lg font-semibold">{data.service.latency_p95_ms_30d ?? "—"} ms</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Última verificação</div>
                <div className="text-sm">{fmtDate(data.service.last_check_at)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico 90 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <Sparkline history={data.history} />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{data.history[0]?.day}</span>
                <span>hoje</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incidentes (90d)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem incidentes nos últimos 90 dias.</p>
              ) : (
                <ul className="divide-y">
                  {data.incidents.map((i) => (
                    <li key={i.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{i.title}</div>
                        <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted">
                          {i.severity} · {i.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Detectado em {fmtDate(i.detected_at)}
                        {i.resolved_at ? ` · resolvido em ${fmtDate(i.resolved_at)}` : ""}
                      </div>
                      {i.updates && i.updates.length > 0 ? (
                        <ul className="mt-2 space-y-1 border-l pl-3">
                          {i.updates.map((u) => (
                            <li key={u.id} className="text-xs">
                              <span className="font-medium">[{u.status}]</span> {u.body}{" "}
                              <span className="text-muted-foreground">— {fmtDate(u.created_at)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {i.postmortem_published_at && i.postmortem_summary ? (
                        <p className="mt-2 text-sm">
                          <span className="font-medium">Postmortem:</span> {i.postmortem_summary}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {data.maintenance.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Janelas de manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {data.maintenance.map((m) => (
                    <li key={m.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{m.title}</div>
                        <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted">
                          {m.severity} · {m.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fmtDate(m.starts_at)} → {fmtDate(m.ends_at)}
                      </div>
                      {m.description ? <p className="text-sm mt-1">{m.description}</p> : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <p className="text-xs text-muted-foreground">Atualizado em {fmtDate(data.updated_at)}</p>
        </>
      )}
    </main>
  );
}
