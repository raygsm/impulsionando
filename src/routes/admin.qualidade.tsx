import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Run = {
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

type Range = "7d" | "30d" | "90d" | "all";

export const Route = createFileRoute("/admin/qualidade")({
  head: () => ({
    meta: [
      { title: "Painel de qualidade — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: QualityDashboardPage,
});

function QualityDashboardPage() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("30d");
  const [onlyFailures, setOnlyFailures] = useState(false);
  const [branch, setBranch] = useState<string>("__all__");

  useEffect(() => {
    fetch("/qa-history.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: Run[]) => setRuns(Array.isArray(data) ? data : []))
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);

  const branches = useMemo(() => {
    if (!runs) return [] as string[];
    const set = new Set<string>();
    for (const r of runs) if (r.ref) set.add(r.ref);
    return Array.from(set).sort();
  }, [runs]);

  const filtered = useMemo(() => {
    if (!runs) return [];
    const now = Date.now();
    const cutoff =
      range === "all"
        ? 0
        : now - { "7d": 7, "30d": 30, "90d": 90 }[range] * 24 * 60 * 60 * 1000;
    return runs
      .filter((r) => new Date(r.ts).getTime() >= cutoff)
      .filter((r) => (onlyFailures ? !r.success : true))
      .filter((r) => (branch === "__all__" ? true : r.ref === branch))
      .slice()
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [runs, range, onlyFailures, branch]);

  const stats = useMemo(() => {
    if (filtered.length === 0) {
      return { runs: 0, passRate: 0, avgDuration: 0, lastFailed: 0, lastTotal: 0 };
    }
    const passing = filtered.filter((r) => r.success).length;
    const last = filtered[filtered.length - 1];
    const avg = filtered.reduce((s, r) => s + r.durationMs, 0) / filtered.length;
    return {
      runs: filtered.length,
      passRate: (passing / filtered.length) * 100,
      avgDuration: avg,
      lastFailed: last.failed,
      lastTotal: last.total,
    };
  }, [filtered]);

  const chartData = useMemo(
    () =>
      filtered.map((r) => ({
        label: new Date(r.ts).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        passed: r.passed,
        failed: r.failed,
        duration: Math.round(r.durationMs / 1000),
      })),
    [filtered],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Painel de qualidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Histórico de execuções do CI lido de <code>/qa-history.json</code>. Atualizado a cada
          run pelo script <code>scripts/append-quality-history.mjs</code>.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <label className="text-sm">
          Período:{" "}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="ml-1 rounded border border-border bg-background px-2 py-1 text-sm"
          >
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
            <option value="90d">90 dias</option>
            <option value="all">Tudo</option>
          </select>
        </label>
        <label className="text-sm">
          Branch:{" "}
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="ml-1 rounded border border-border bg-background px-2 py-1 text-sm"
          >
            <option value="__all__">Todas</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyFailures}
            onChange={(e) => setOnlyFailures(e.target.checked)}
          />
          Apenas falhas
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Falha ao carregar histórico: {error}
        </div>
      )}
      {!runs && !error && (
        <div className="text-sm text-muted-foreground">Carregando histórico…</div>
      )}

      {runs && (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Runs no período" value={stats.runs.toString()} />
            <Stat label="Pass rate" value={`${stats.passRate.toFixed(1)}%`} />
            <Stat
              label="Duração média"
              value={`${(stats.avgDuration / 1000).toFixed(1)}s`}
            />
            <Stat
              label="Último run"
              value={`${stats.lastTotal - stats.lastFailed}/${stats.lastTotal}`}
              hint={stats.lastFailed === 0 ? "verde" : `${stats.lastFailed} falhas`}
            />
          </section>

          <section className="mb-8 rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Passou x falhou por execução
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="passed"
                    name="Passou"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    name="Falhou"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.35}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mb-8 rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Duração por execução (s)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="duration" name="Segundos" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Execuções recentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Quando</th>
                    <th className="py-2 pr-3">Branch</th>
                    <th className="py-2 pr-3">SHA</th>
                    <th className="py-2 pr-3">Resultado</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Falhas</th>
                    <th className="py-2 pr-3">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filtered]
                    .reverse()
                    .slice(0, 25)
                    .map((r, i) => (
                      <tr key={`${r.ts}-${i}`} className="border-t border-border/60">
                        <td className="py-2 pr-3">{new Date(r.ts).toLocaleString("pt-BR")}</td>
                        <td className="py-2 pr-3">{r.ref ?? "—"}</td>
                        <td className="py-2 pr-3 font-mono text-xs">
                          {r.sha ? r.sha.slice(0, 7) : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={
                              r.success
                                ? "rounded bg-primary/15 px-2 py-0.5 text-xs text-primary"
                                : "rounded bg-destructive/15 px-2 py-0.5 text-xs text-destructive"
                            }
                          >
                            {r.success ? "verde" : "vermelho"}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{r.total}</td>
                        <td className="py-2 pr-3">{r.failed}</td>
                        <td className="py-2 pr-3">{(r.durationMs / 1000).toFixed(1)}s</td>
                      </tr>
                    ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-muted-foreground">
                        Nenhuma execução no filtro atual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
