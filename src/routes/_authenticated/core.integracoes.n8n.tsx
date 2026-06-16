import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getIntegration, updateIntegration, testIntegration, listIntegrationLogs } from "@/lib/core-integrations.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/integracoes/n8n")({
  head: () => ({ meta: [{ title: "N8N — Integração" }, { name: "robots", content: "noindex" }] }),
  component: N8nPage,
});

const EVENTS = [
  "new_customer", "trial_started", "invoice_created", "payment_confirmed",
  "appointment_created", "appointment_rescheduled", "appointment_cancelled",
  "email_sent", "whatsapp_sent", "realestate_lead", "affiliate_invited",
  "briefing_received",
];

function N8nPage() {
  const qc = useQueryClient();
  const get = useServerFn(getIntegration);
  const update = useServerFn(updateIntegration);
  const test = useServerFn(testIntegration);
  const logs = useServerFn(listIntegrationLogs);

  const { data: integ } = useQuery({ queryKey: ["integ", "n8n"], queryFn: () => get({ data: { slug: "n8n" } }) });
  const { data: logsData } = useQuery({ queryKey: ["integ-logs", "n8n"], queryFn: () => logs({ data: { slug: "n8n", limit: 30 } }), refetchInterval: 8000 });

  const [baseUrl, setBaseUrl] = useState("");
  const [webhooks, setWebhooks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!integ) return;
    const cfg: any = (integ as any).config ?? {};
    setBaseUrl(cfg.base_url ?? "");
    setWebhooks(cfg.webhooks ?? {});
  }, [integ]);

  const save = useMutation({
    mutationFn: () => update({ data: { slug: "n8n", config: { base_url: baseUrl, webhooks } } }),
    onSuccess: () => { toast.success("Configuração salva"); qc.invalidateQueries({ queryKey: ["integ", "n8n"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const runTest = useMutation({
    mutationFn: (event: string) => test({ data: { slug: "n8n", event, payload: { test: true, ts: Date.now() } } }),
    onSuccess: (r: any) => {
      if (r.status === "success") toast.success(`Teste OK em ${r.duration_ms}ms`);
      else toast.error(`Falha: ${r.error}`);
      qc.invalidateQueries({ queryKey: ["integ-logs", "n8n"] });
      qc.invalidateQueries({ queryKey: ["integ", "n8n"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const status = (integ as any)?.status ?? "not_configured";

  return (
    <>
      <PageHeader
        title="N8N — Automações"
        description="Configure URLs de webhook para cada evento operacional. Cada teste envia payload real ao N8N e registra a resposta."
      />

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant={status === "connected" ? "default" : status === "error" ? "destructive" : "outline"}>
            {status}
          </Badge>
          {(integ as any)?.last_test_at && (
            <span className="text-xs text-muted-foreground">
              Último teste: {new Date((integ as any).last_test_at).toLocaleString("pt-BR")}
            </span>
          )}
          {(integ as any)?.last_error && (
            <span className="text-xs text-destructive truncate">Erro: {(integ as any).last_error}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label>URL base (fallback)</Label>
          <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://n8n.suaempresa.com/webhook/..." />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Webhooks por evento</div>
          <div className="grid gap-2">
            {EVENTS.map((ev) => (
              <div key={ev} className="grid grid-cols-[200px_1fr_auto] gap-2 items-center">
                <Label className="text-xs font-mono">{ev}</Label>
                <Input
                  value={webhooks[ev] ?? ""}
                  onChange={(e) => setWebhooks((w) => ({ ...w, [ev]: e.target.value }))}
                  placeholder="https://n8n.suaempresa.com/webhook/..."
                />
                <Button size="sm" variant="outline" onClick={() => runTest.mutate(ev)} disabled={runTest.isPending}>
                  Testar
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar configuração</Button>
        </div>
      </Card>

      <Card className="p-4 mt-4">
        <div className="text-sm font-medium mb-2">Histórico de execuções</div>
        <div className="divide-y text-xs">
          {((logsData as any)?.items ?? []).map((l: any) => (
            <div key={l.id} className="py-2 grid grid-cols-[80px_140px_1fr_80px] gap-2 items-center">
              <Badge variant={l.status === "success" ? "default" : "destructive"} className="w-fit text-[10px]">{l.status}</Badge>
              <span className="font-mono">{l.event_type}</span>
              <span className="truncate text-muted-foreground">{l.error ?? JSON.stringify(l.response).slice(0, 120)}</span>
              <span className="text-right">{l.duration_ms}ms</span>
            </div>
          ))}
          {!((logsData as any)?.items ?? []).length && (
            <div className="py-4 text-muted-foreground">Nenhuma execução registrada ainda.</div>
          )}
        </div>
      </Card>
    </>
  );
}
