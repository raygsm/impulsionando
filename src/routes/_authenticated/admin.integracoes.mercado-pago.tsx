import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMpIntegrationStatus, testMpIntegration } from "@/lib/mercadopago.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Webhook, ShieldCheck, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/integracoes/mercado-pago")({
  component: MpAdminPage,
  head: () => ({ meta: [{ title: "Mercado Pago — Integração" }] }),
});

function MpAdminPage() {
  const statusFn = useServerFn(getMpIntegrationStatus);
  const testFn = useServerFn(testMpIntegration);
  const { data, refetch } = useQuery({ queryKey: ["mp-admin-status"], queryFn: () => statusFn() });
  const [testing, setTesting] = useState(false);

  async function runTest() {
    setTesting(true);
    try {
      const r = await testFn();
      if (r.ok) toast.success(`Integração OK · ${r.methods_count} métodos disponíveis.`);
      else toast.error(`Falha: ${r.message}`);
    } finally { setTesting(false); }
  }

  if (!data) return <div className="p-6">Carregando…</div>;

  const ok = (b: boolean) => b
    ? <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Sim</Badge>
    : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Não</Badge>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Integração Mercado Pago
        </h1>
        <p className="text-sm text-muted-foreground">
          Checkout Transparente sem redirecionamento externo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais</CardTitle>
          <CardDescription>Os valores ficam apenas em variáveis seguras. O Access Token nunca é exibido.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Public Key configurada">{ok(data.public_key_configured)}{data.public_key_preview && <span className="text-xs text-muted-foreground ml-2">{data.public_key_preview}</span>}</Row>
          <Row label="Access Token configurado">{ok(data.access_token_configured)}</Row>
          <Row label="Webhook secret">{ok(data.webhook_secret_configured)}</Row>
          <Row label="Ambiente">
            <Badge variant={data.environment === "production" ? "default" : "secondary"}>
              {data.environment === "production" ? "Produção" : "Sandbox/Teste"}
            </Badge>
          </Row>
          <Row label="Webhook URL">
            <code className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
              <Webhook className="w-3 h-3" /> {data.webhook_url}
            </code>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de integração</CardTitle>
          <CardDescription>
            Chama o endpoint de payment_methods do Mercado Pago para validar o Access Token.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={runTest} disabled={testing}>
            <RefreshCcw className={`w-4 h-4 mr-1 ${testing ? "animate-spin" : ""}`} /> Testar integração
          </Button>
          <Button variant="outline" onClick={() => refetch()}>Atualizar status</Button>
        </CardContent>
      </Card>

      {!data.access_token_configured && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4 text-sm">
            Informe as credenciais do Mercado Pago (MERCADOPAGO_PUBLIC_KEY e MERCADOPAGO_ACCESS_TOKEN) nos secrets do projeto para ativar o checkout transparente.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
