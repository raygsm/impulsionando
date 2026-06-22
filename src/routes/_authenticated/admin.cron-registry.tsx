// Cockpit de cron jobs: lista cada agendamento registrado em cron.job,
// com schedule, URL alvo, último run, sucessos/falhas em 24h e flag de
// duplicidade (mesma URL chamada por dois jobs).
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { listCronRegistry } from "@/lib/cron-registry.functions";

export const Route = createFileRoute("/_authenticated/admin/cron-registry")({
  head: () => ({ meta: [{ title: "Cron Registry · Impulsionando" }] }),
  component: CronRegistryPage,
});

function CronRegistryPage() {
  const fn = useServerFn(listCronRegistry);
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "cron-registry"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <header className="flex items-center justify-between border-b pb-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" /> Cron Registry
          </h1>
          <p className="text-sm text-muted-foreground">
            Todos os cron jobs do Postgres (pg_cron), com detecção de duplicidade
            por URL alvo.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </header>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Carregando agendamentos…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Jobs" value={data.totals.jobs} />
            <Stat label="Ativos" value={data.totals.active} />
            <Stat
              label="Falhas (24h)"
              value={data.totals.failed24h}
              tone={data.totals.failed24h > 0 ? "bad" : "ok"}
            />
            <Stat
              label="URLs duplicadas"
              value={data.totals.duplicates}
              tone={data.totals.duplicates > 0 ? "warn" : "ok"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agendamentos</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2">Job</th>
                    <th className="text-left">Schedule</th>
                    <th className="text-left">URL</th>
                    <th className="text-left">Último run</th>
                    <th className="text-right">24h ok</th>
                    <th className="text-right">24h erro</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.jobid} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3">
                        <div className="font-medium flex items-center gap-1">
                          {r.jobname}
                          {!r.active ? (
                            <span className="text-xs px-1 rounded bg-muted text-muted-foreground">
                              off
                            </span>
                          ) : null}
                          {r.duplicateUrl ? (
                            <span
                              className="inline-flex items-center text-amber-600"
                              title="Outra entrada de cron chama a mesma URL"
                            >
                              <AlertTriangle className="h-3 w-3 ml-1" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="pr-3 font-mono text-xs">{r.schedule}</td>
                      <td className="pr-3 text-xs break-all max-w-xs">
                        {r.url ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="pr-3 text-xs">
                        {r.last_run ? (
                          <>
                            {new Date(r.last_run).toLocaleString("pt-BR")}
                            {r.last_status === "succeeded" ? (
                              <CheckCircle2 className="inline h-3 w-3 ml-1 text-green-600" />
                            ) : r.last_status ? (
                              <span className="ml-1 text-destructive">
                                ({r.last_status})
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-muted-foreground">nunca</span>
                        )}
                      </td>
                      <td className="text-right">{r.ok_24h}</td>
                      <td
                        className={`text-right ${
                          Number(r.bad_24h) > 0 ? "text-destructive font-medium" : ""
                        }`}
                      >
                        {r.bad_24h}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "bad";
}) {
  const cls =
    tone === "bad"
      ? "text-destructive"
      : tone === "warn"
        ? "text-amber-600"
        : "";
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold text-xl ${cls}`}>{value}</div>
    </div>
  );
}
