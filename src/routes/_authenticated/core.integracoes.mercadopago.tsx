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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/integracoes/mercadopago")({
  head: () => ({ meta: [{ title: "Mercado Pago — Integração" }, { name: "robots", content: "noindex" }] }),
  component: MercadoPagoPage,
});

function MercadoPagoPage() {
  const qc = useQueryClient();
  const get = useServerFn(getIntegration);
  const update = useServerFn(updateIntegration);
  const test = useServerFn(testIntegration);
  const logs = useServerFn(listIntegrationLogs);

  const { data: integ } = useQuery({ queryKey: ["integ", "mp"], queryFn: () => get({ data: { slug: "mercadopago" } }) });
  const { data: logsData } = useQuery({ queryKey: ["integ-logs", "mp"], queryFn: () => logs({ data: { slug: "mercadopago", limit: 30 } }), refetchInterval: 8000 });

  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [publicKey, setPublicKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    if (!integ) return;
    const cfg: any = (integ as any).config ?? {};
    setEnvironment(((integ as any).environment as any) ?? "sandbox");
    setPublicKey(cfg.public_key ?? "");
    setWebhookUrl(cfg.webhook_url ?? "");
    setRecipient(cfg.recipient_account ?? "");
  }, [integ]);

  const save = useMutation({
    mutationFn: () => update({
      data: {
        slug: "mercadopago",
        environment,
        config: {
          public_key: publicKey,
          webhook_url: webhookUrl,
          recipient_account: recipient,
          payment_methods: ["pix", "credit_card", "boleto"],
        },
      },
    }),
    onSuccess: () => { toast.success("Configuração salva"); qc.invalidateQueries({ queryKey: ["integ", "mp"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const runTest = useMutation({
    mutationFn: () => test({ data: { slug: "mercadopago", event: "credentials_check" } }),
    onSuccess: (r: any) => {
      if (r.status === "success") toast.success(`Credenciais OK em ${r.duration_ms}ms`);
      else toast.error(`Falha: ${r.error}`);
      qc.invalidateQueries({ queryKey: ["integ-logs", "mp"] });
      qc.invalidateQueries({ queryKey: ["integ", "mp"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const status = (integ as any)?.status ?? "not_configured";

  return (
    <>
      <PageHeader
        title="Mercado Pago — Checkout Transparente"
        description="Configure as credenciais do Mercado Pago. O Access Token fica armazenado de forma segura nas secrets do servidor (nunca aparece no navegador)."
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

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Ambiente</Label>
            <Select value={environment} onValueChange={(v: any) => setEnvironment(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (teste)</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Public Key (frontend)</Label>
            <Input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder="APP_USR-..." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Webhook URL (configurar no painel do MP)</Label>
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://impulsionando.com.br/api/public/webhooks/mercadopago" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Conta recebedora</Label>
            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="ID ou e-mail da conta MP" />
          </div>
        </div>

        <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
          <div className="font-medium">Access Token</div>
          <p className="text-muted-foreground">
            O Access Token é sensível e fica armazenado como secret no servidor (variável <code className="font-mono">MERCADOPAGO_ACCESS_TOKEN</code>).
            Para configurar ou trocar, peça à equipe Impulsionando para atualizar a secret — nunca cole o token aqui.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => runTest.mutate()} disabled={runTest.isPending}>
            Testar credenciais
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar configuração</Button>
        </div>
      </Card>

      <Card className="p-4 mt-4">
        <div className="text-sm font-medium mb-2">Histórico de testes & webhooks</div>
        <div className="divide-y text-xs">
          {((logsData as any)?.items ?? []).map((l: any) => (
            <div key={l.id} className="py-2 grid grid-cols-[80px_160px_1fr_80px] gap-2 items-center">
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
