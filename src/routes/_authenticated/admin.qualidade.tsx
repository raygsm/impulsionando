import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Entry = {
  ts: string;
  total: number;
  passed: number;
  failed: number;
  files: number;
  durationMs: number;
  success: boolean;
  sha: string | null;
  ref: string | null;
  runId: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/qualidade")({
  component: QualityDashboard,
  head: () => ({
    meta: [
      { title: "Dashboard de Qualidade" },
      {
        name: "description",
        content:
          "Histórico de execuções da suíte de testes, cobertura e tempo de execução.",
      },
    ],
  }),
});

function fmtDuration(ms: number) {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${(s - m * 60).toFixed(0)}s`;
}

function QualityDashboard() {
  const [history, setHistory] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/qa-history.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: Entry[]) => setHistory(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message));
  }, []);

  const last = history?.[0];
  const avgDur =
    history && history.length
      ? history.reduce((s, e) => s + e.durationMs, 0) / history.length
      : 0;
  const successRate =
    history && history.length
      ? (history.filter((e) => e.success).length / history.length) * 100
      : 0;
  const coverage = last ? (last.passed / Math.max(1, last.total)) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Qualidade</h1>
        <p className="text-muted-foreground">
          Histórico das execuções automatizadas da suíte de testes. Atualizado a
          cada job do workflow <code>tests-gate</code>.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar o histórico: {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Última execução"
          value={last ? `${last.passed}/${last.total}` : "—"}
          tone={last?.success ? "ok" : "fail"}
          hint={last ? new Date(last.ts).toLocaleString() : ""}
        />
        <Kpi
          label="Cobertura de aprovação"
          value={`${coverage.toFixed(2)}%`}
          tone={coverage === 100 ? "ok" : "warn"}
          hint={`${last?.files ?? 0} arquivos`}
        />
        <Kpi
          label="Duração média"
          value={fmtDuration(avgDur)}
          tone="neutral"
          hint={`${history?.length ?? 0} execuções`}
        />
        <Kpi
          label="Taxa de sucesso"
          value={`${successRate.toFixed(1)}%`}
          tone={successRate === 100 ? "ok" : "warn"}
          hint="Últimas execuções"
        />
      </section>

      <section className="rounded-lg border bg-card">
        <header className="border-b p-4">
          <h2 className="text-lg font-semibold">Histórico de execuções</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Quando</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Arquivos</th>
                <th className="p-3">Duração</th>
                <th className="p-3">Commit</th>
              </tr>
            </thead>
            <tbody>
              {history?.length ? (
                history.map((e, i) => (
                  <tr key={`${e.ts}-${i}`} className="border-t">
                    <td className="p-3">{new Date(e.ts).toLocaleString()}</td>
                    <td className="p-3">
                      <span
                        className={
                          e.success
                            ? "rounded bg-green-100 px-2 py-0.5 text-green-800"
                            : "rounded bg-red-100 px-2 py-0.5 text-red-800"
                        }
                      >
                        {e.passed}/{e.total} {e.success ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="p-3">{e.files}</td>
                    <td className="p-3">{fmtDuration(e.durationMs)}</td>
                    <td className="p-3 font-mono text-xs">
                      {e.sha ? e.sha.slice(0, 7) : "local"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={5}>
                    {history ? "Sem execuções registradas ainda." : "Carregando..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "ok" | "warn" | "fail" | "neutral";
}) {
  const toneCls =
    tone === "ok"
      ? "text-green-700"
      : tone === "fail"
        ? "text-red-700"
        : tone === "warn"
          ? "text-amber-700"
          : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneCls}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
