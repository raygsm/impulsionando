import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, KeyRound, Webhook, ShieldCheck, ArrowRight } from "lucide-react";
import { CoreSection, EmptyState } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/mercado-pago")({
  head: () => ({ meta: [{ title: "Mercado Pago do cliente — Impulsionando" }] }),
  component: TenantMercadoPagoTab,
});

function TenantMercadoPagoTab() {
  const { slug } = Route.useParams();
  const webhookUrl = `https://impulsionando.com.br/api/public/mercado-pago/${slug}`;
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title="Mercado Pago"
        description={`Credenciais, webhooks, conciliação e saúde do gateway do cliente ${slug}.`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/clientes/$slug/financeiro" params={{ slug }}>
              Ir para Financeiro <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <KeyRound className="h-4 w-4" aria-hidden /> Credenciais
            </div>
            <p className="text-xs text-muted-foreground">
              Access Token e Public Key deste cliente serão armazenados como segredos e nunca versionados em código.
            </p>
            <EmptyState
              variant="compact"
              title="Credenciais ainda não configuradas"
              description="Assim que a equipe cadastrar as chaves do Mercado Pago deste cliente, elas passarão a ser rotacionadas e auditadas por aqui."
            />
          </Card>
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Webhook className="h-4 w-4" aria-hidden /> Webhooks
            </div>
            <p className="text-xs text-muted-foreground">
              Endpoint público dedicado ao cliente, com verificação de assinatura HMAC no handler:
            </p>
            <code className="block text-xs break-all rounded-md border bg-muted/40 p-2">
              {webhookUrl}
            </code>
            <p className="text-xs text-muted-foreground">
              Os eventos recebidos serão listados abaixo quando o gateway começar a disparar callbacks para este cliente.
            </p>
          </Card>
        </div>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Segurança e conciliação
          </div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Verificação de assinatura HMAC em toda requisição recebida.</li>
            <li>Registro imutável de eventos (payment.created, updated, refund, chargeback).</li>
            <li>Conciliação diária com as faturas do módulo Financeiro.</li>
            <li>Alertas para pagamentos não conciliados ou disputados.</li>
          </ul>
        </Card>

        <Card className="p-5">
          <EmptyState
            icon={<Wallet className="h-5 w-5" aria-hidden />}
            title="Nenhuma transação Mercado Pago registrada"
            description="Pagamentos, reembolsos, assinaturas e falhas do gateway serão consolidados aqui automaticamente conforme este cliente processar cobranças."
          />
        </Card>
      </CoreSection>
    </div>
  );
}
