import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runFullDiagnostic, probeSingleIntegration } from "@/lib/integrations-diagnostic.functions";

export const Route = createFileRoute("/_authenticated/core/integracoes/diagnostico")({
  head: () => ({ meta: [{ title: "Diagnóstico de Integrações — Core Impulsionando" }] }),
  component: DiagnosticPage,
});

function DiagnosticPage() {
  const runFn = useServerFn(runFullDiagnostic);
  const probeFn = useServerFn(probeSingleIntegration);

  const [results, setResults] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);

  const runAll = useMutation({
    mutationFn: () => runFn(),
    onSuccess: (r: any) => {
      setResults(r.results);
      setSummary(r.summary);
      toast.success(`Diagnóstico concluído: ${r.summary.ok.length} OK · ${r.summary.failed.length} com falha`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao executar diagnóstico"),
  });

  const probe = useMutation({
    mutationFn: (slug: any) => probeFn({ data: { slug } }),
    onSuccess: (r: any) => {
      setResults((prev) =>
        (prev ?? []).map((p) => (p.slug === r.slug ? r : p)),
      );
      toast[r.ok ? "success" : "error"](`${r.name}: ${r.ok ? "OK" : r.error ?? "falha"}`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha no teste"),
  });

  // Auto-run on mount
  useQuery({
    queryKey: ["diag-initial"],
    queryFn: async () => { await runAll.mutateAsync(); return true; },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div>
      <PageHeader
        title="Diagnóstico de Integrações"
        description="Testa em tempo real cada integração crítica do ecossistema Impulsionando. Logs persistidos em core_integration_logs."
      />

      <Card className="p-4 mb-4 shadow-card flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-sm">
          {summary
            ? <>OK: <strong>{summary.ok.length}</strong> · Falha: <strong className="text-destructive">{summary.failed.length}</strong> · Gerado em {new Date(summary.generated_at).toLocaleString("pt-BR")}</>
            : "Executando primeiro diagnóstico…"}
        </span>
        <Button size="sm" className="ml-auto" onClick={() => runAll.mutate()} disabled={runAll.isPending}>
          <RefreshCw className={`w-4 h-4 mr-1 ${runAll.isPending ? "animate-spin" : ""}`} /> Executar tudo
        </Button>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {(results ?? []).map((r) => (
          <Card key={r.slug} className="p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {r.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                  <strong>{r.name}</strong>
                  <Badge variant="outline" className={r.ok ? "bg-emerald-100 text-emerald-700" : r.configured ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                    {r.ok ? "OK" : r.configured ? "Falha" : "Não configurado"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Última checagem: {new Date(r.checked_at).toLocaleString("pt-BR")} · {r.duration_ms} ms
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => probe.mutate(r.slug)} disabled={probe.isPending}>
                Testar
              </Button>
            </div>

            {r.error && <div className="text-xs text-destructive mt-2">⚠ {r.error}</div>}
            {r.missing?.length > 0 && (
              <div className="text-xs text-amber-700 mt-1">
                Credenciais / itens ausentes: <code>{r.missing.join(", ")}</code>
              </div>
            )}
            {r.details && (
              <pre className="bg-muted/40 p-2 rounded text-[10px] overflow-auto max-h-32 mt-2">
                {JSON.stringify(r.details, null, 2)}
              </pre>
            )}
          </Card>
        ))}
      </div>

      {summary?.failed?.length > 0 && (
        <Card className="p-4 mt-4 shadow-card border-destructive/40">
          <div className="font-medium mb-2 text-destructive">Relatório — integrações com falha</div>
          <ul className="text-sm space-y-1">
            {summary.failed.map((f: any) => (
              <li key={f.slug}>
                <strong>{f.slug}</strong>: {f.error ?? "—"} {f.missing?.length ? ` · faltando ${f.missing.join(", ")}` : ""}
              </li>
            ))}
          </ul>
          <div className="text-xs text-muted-foreground mt-3">
            Próximos passos: configurar credenciais ausentes em <em>Secrets</em>, ajustar webhooks N8N em
            {" "}<code>core_integrations.config.webhooks</code> e revisar políticas RLS. Cada execução fica registrada em
            <code> core_integration_logs</code>.
          </div>
        </Card>
      )}
    </div>
  );
}
