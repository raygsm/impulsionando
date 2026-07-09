import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, KeyRound, Webhook, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/mercado-pago")({
  head: () => ({ meta: [{ title: "Mercado Pago do cliente — Impulsionando" }] }),
  component: TenantMercadoPagoTab,
});

// Onda 3.2 — Cliente 360. Aba visual "Mercado Pago". A integração real
// (credenciais por cliente, webhooks assinados, split, conciliação)
// entra na Fase 3.5, junto com o destravamento controlado do backend.
function TenantMercadoPagoTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Mercado Pago
          </h2>
          <p className="text-sm text-muted-foreground">
            Credenciais, webhooks e conciliação do cliente <code>{slug}</code>.
          </p>
        </div>
        <Badge variant="outline">Prévia visual · Fase 3.5</Badge>
      </header>

      <Card className="p-6 space-y-3 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <KeyRound className="h-4 w-4" /> Credenciais
        </div>
        <p className="text-muted-foreground text-xs">
          As chaves (Access Token e Public Key) do Mercado Pago do cliente serão armazenadas
          como segredos, nunca em código. Configuração real na Fase 3.5.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <MockField label="Access Token" value="MP-ACCESS-TOKEN-****-****" />
          <MockField label="Public Key" value="APP_USR-********-********" />
        </div>
      </Card>

      <Card className="p-6 space-y-3 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Webhook className="h-4 w-4" /> Webhooks
        </div>
        <p className="text-muted-foreground text-xs">
          Endpoints públicos por cliente sob <code>/api/public/mercado-pago/*</code> — sempre
          com verificação de assinatura no handler. Configuração real na Fase 3.5.
        </p>
        <MockField label="URL do webhook" value={`https://impulsionando.com.br/api/public/mercado-pago/${slug}`} />
      </Card>

      <Card className="p-6 space-y-3 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4" /> Segurança e conciliação
        </div>
        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
          <li>Verificação de assinatura HMAC em toda requisição recebida</li>
          <li>Registro imutável de eventos (payment.created, payment.updated, refund, chargeback)</li>
          <li>Conciliação diária com faturas do módulo Financeiro</li>
          <li>Alertas para pagamentos não conciliados ou disputados</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/clientes/$slug/financeiro" params={{ slug }}>Ir para Financeiro</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <code className="text-xs break-all">{value}</code>
    </div>
  );
}
