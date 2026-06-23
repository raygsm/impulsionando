import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { debugListProductos } from "@/lib/riomed-debug.functions";
import {
  clearTelemetry,
  downloadTelemetry,
  getTelemetry,
  subscribeTelemetry,
  type TelemetryEntry,
} from "@/lib/riomed-telemetry";
import {
  Bug,
  Download,
  Play,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/riomed/debug")({
  head: () => ({
    meta: [
      { title: "Rio Med — Debug" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RiomedDebugPage,
});

function RiomedDebugPage() {
  const run = useServerFn(debugListProductos);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(60);
  const [entries, setEntries] = useState<TelemetryEntry[]>(getTelemetry());

  useEffect(() => subscribeTelemetry(setEntries), []);

  const mut = useMutation({
    mutationFn: () =>
      run({
        data: {
          search: search || undefined,
          category: category || undefined,
          limit,
        },
      }),
  });

  const result = mut.data;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center gap-3">
          <Bug className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-xl font-extrabold">Rio Med · Debug</h1>
            <p className="text-sm text-slate-300">
              Instrumentação do <code>listProductos</code> e buffer de telemetria.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* -------------- listProductos runner -------------- */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">
            Executar <code>listProductos</code>
          </h2>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <label className="text-sm">
              <span className="block font-semibold text-slate-700 mb-1">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="ex: monitor"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-slate-700 mb-1">category</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="ex: monitoreo"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-slate-700 mb-1">limit</span>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 60)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--riomed-primary,#0a5cae)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            {mut.isPending ? "Executando…" : "Rodar query"}
          </button>

          {mut.isError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <div className="font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Falha ao executar
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs">
                {(mut.error as Error)?.stack ?? (mut.error as Error)?.message}
              </pre>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <Stat label="Total" value={`${result.totalMs} ms`} icon={Clock} />
                <Stat label="Linhas" value={String(result.rowCount)} icon={CheckCircle2} />
                <Stat
                  label="Status"
                  value={result.ok ? "OK" : "Com falhas"}
                  icon={result.ok ? CheckCircle2 : AlertCircle}
                  tone={result.ok ? "ok" : "err"}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">Query SQL</h3>
                <pre className="rounded-lg bg-slate-900 text-slate-100 p-4 text-xs overflow-x-auto">
                  {result.queryDescription}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">Etapas</h3>
                <div className="rounded-lg border border-slate-200 divide-y">
                  {result.stages.map((s, i) => (
                    <div key={i} className="p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-mono">
                          {s.status === "ok" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-semibold">{s.name}</span>
                        </div>
                        <span className="text-slate-600 font-mono">
                          {s.durationMs} ms
                        </span>
                      </div>
                      {s.message && (
                        <div className="mt-1 text-red-700">{s.message}</div>
                      )}
                      {s.stack && (
                        <pre className="mt-2 whitespace-pre-wrap text-[11px] bg-red-50 p-2 rounded">
                          {s.stack}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* -------------- Telemetry buffer -------------- */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Buffer de telemetria
              </h2>
              <p className="text-sm text-slate-600">
                {entries.length} evento(s) capturado(s) nesta sessão.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadTelemetry("json")}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> JSON
              </button>
              <button
                type="button"
                onClick={() => downloadTelemetry("csv")}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> CSV
              </button>
              <button
                type="button"
                onClick={() => clearTelemetry()}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" /> Limpar
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="text-sm text-slate-500">
              Nenhum evento capturado. Navegue pelo site público para começar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="text-left text-slate-600">
                  <tr>
                    <th className="py-2 pr-3">ts</th>
                    <th className="py-2 pr-3">scope</th>
                    <th className="py-2 pr-3">stage</th>
                    <th className="py-2 pr-3">status</th>
                    <th className="py-2 pr-3">ms</th>
                    <th className="py-2 pr-3">message</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries
                    .slice()
                    .reverse()
                    .map((e) => (
                      <tr key={e.id}>
                        <td className="py-1.5 pr-3 whitespace-nowrap">
                          {e.ts.slice(11, 19)}
                        </td>
                        <td className="py-1.5 pr-3">{e.scope}</td>
                        <td className="py-1.5 pr-3">{e.stage}</td>
                        <td
                          className={`py-1.5 pr-3 font-bold ${
                            e.status === "ok" ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {e.status}
                        </td>
                        <td className="py-1.5 pr-3">{e.durationMs ?? ""}</td>
                        <td className="py-1.5 pr-3 max-w-md truncate">
                          {e.message ?? ""}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: any;
  tone?: "default" | "ok" | "err";
}) {
  const toneCls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "err"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-slate-200 bg-slate-50 text-slate-900";
  return (
    <div className={`rounded-lg border p-3 flex items-center gap-3 ${toneCls}`}>
      <Icon className="h-5 w-5 opacity-70" />
      <div>
        <div className="text-[11px] uppercase tracking-wider opacity-70">
          {label}
        </div>
        <div className="font-extrabold">{value}</div>
      </div>
    </div>
  );
}
