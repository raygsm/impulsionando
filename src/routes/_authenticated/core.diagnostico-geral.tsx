import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runFullDiagnostic } from "@/lib/integrations-diagnostic.functions";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert, RefreshCcw, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/diagnostico-geral")({
  component: DiagnosticoGeralPage,
});

const RISK_MAP: Record<string, { risk: string; next: string }> = {
  n8n:        { risk: "Automações de workflows não executam, falhas silenciosas em integrações pós-pagamento e onboarding.", next: "Configurar N8N_BASE_URL/N8N_API_KEY e reprocessar runs com erro no painel de automações." },
  github:     { risk: "Sem geração automática de repositórios e deploy de projetos clonados.", next: "Validar GITHUB_TOKEN com escopo repo e revalidar integração." },
  supabase:   { risk: "Operações privilegiadas (admin/seed/migrations) falham; auth admin indisponível.", next: "Restaurar SUPABASE_SERVICE_ROLE_KEY e SUPABASE_URL no ambiente." },
  mercadopago:{ risk: "Cobranças PIX/cartão indisponíveis; faturas ficam pendentes sem baixa.", next: "Configurar MERCADOPAGO_ACCESS_TOKEN e validar webhook de pagamentos." },
  email:      { risk: "E-mails transacionais (contratos, assinaturas, notificações) não saem da fila.", next: "Verificar domínio em notify.* e processador da fila pgmq; revisar email_send_log." },
  zapi:       { risk: "WhatsApp outbound parado; alertas e onboardings via Z-API não chegam.", next: "Confirmar ZAPI_INSTANCE_ID/ZAPI_TOKEN e status da sessão no provedor." },
  webhooks:   { risk: "Execuções de webhook com falha ficam paradas, sem reprocessamento.", next: "Revisar webhook_runs com status=error e usar painel /automacoes para reprocessar." },
};

function DiagnosticoGeralPage() {
  const runFn = useServerFn(runFullDiagnostic);
  const q = useQuery({
    queryKey: ["diagnostico-geral"],
    queryFn: () => runFn({ data: {} as any }),
    refetchOnWindowFocus: false,
  });

  const results = q.data?.results ?? [];
  const okList = results.filter((r: any) => r.ok);
  const failList = results.filter((r: any) => !r.ok);

  const exportCsv = () => {
    const rows = [
      ["slug", "status", "ms", "error", "missing", "checked_at"],
      ...results.map((r: any) => [
        r.slug, r.ok ? "ok" : "fail", r.duration_ms ?? "", r.error ?? "",
        (r.missing ?? []).join("|"), r.checked_at ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `diagnostico-integracoes-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diagnóstico Consolidado de Integrações</h1>
          <p className="text-sm text-muted-foreground">
            Status real-time, riscos operacionais e próximos passos para cada integração.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
            {q.isFetching ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
            Re-executar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!results.length}>
            <Download className="w-4 h-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total verificadas</div>
          <div className="text-3xl font-bold">{results.length}</div>
        </Card>
        <Card className="p-4 bg-emerald-50">
          <div className="text-xs text-emerald-700">Funcionando</div>
          <div className="text-3xl font-bold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> {okList.length}
          </div>
        </Card>
        <Card className="p-4 bg-rose-50">
          <div className="text-xs text-rose-700">Com falha</div>
          <div className="text-3xl font-bold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" /> {failList.length}
          </div>
        </Card>
      </div>

      {q.isLoading && (
        <Card className="p-6 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Executando probes…
        </Card>
      )}

      {failList.length > 0 && (
        <Card className="p-5 border-rose-300 bg-rose-50/30">
          <div className="flex items-center gap-2 mb-3 text-rose-700">
            <ShieldAlert className="w-5 h-5" />
            <strong>Integrações com falha — ação requerida</strong>
          </div>
          <div className="space-y-3">
            {failList.map((r: any) => {
              const info = RISK_MAP[r.slug] ?? { risk: "Impacto não mapeado.", next: "Revisar credenciais e logs." };
              return (
                <div key={r.slug} className="rounded-md border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm uppercase">{r.slug}</div>
                    <Badge variant="destructive">FAIL</Badge>
                  </div>
                  <div className="text-sm text-rose-700 mt-1">{r.error || "Falha não detalhada"}</div>
                  {r.missing?.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Credenciais ausentes: <span className="font-mono">{r.missing.join(", ")}</span>
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div><strong>Risco:</strong> {info.risk}</div>
                    <div><strong>Próximo passo:</strong> {info.next}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {okList.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <strong>Integrações funcionando</strong>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {okList.map((r: any) => (
              <div key={r.slug} className="flex items-center justify-between border rounded-md p-2 bg-emerald-50/40">
                <div className="font-mono text-sm uppercase">{r.slug}</div>
                <div className="text-xs text-muted-foreground">{r.duration_ms ?? 0} ms</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="font-semibold mb-2">Relatório executivo</div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Total avaliadas: <strong>{results.length}</strong></li>
          <li>OK: <strong>{okList.map((r: any) => r.slug).join(", ") || "—"}</strong></li>
          <li>Falha: <strong>{failList.map((r: any) => r.slug).join(", ") || "—"}</strong></li>
          <li>Credenciais ausentes: <strong>{[...new Set(failList.flatMap((r: any) => r.missing ?? []))].join(", ") || "nenhuma"}</strong></li>
          <li>Gerado em: <strong>{q.data?.summary?.generated_at ?? "—"}</strong></li>
        </ul>
      </Card>
    </div>
  );
}
