import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const listMpagoEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [events, payments] = await Promise.all([
      supabaseAdmin
        .from("mpago_webhook_events")
        .select(
          "id, event_type, action, mp_resource_id, signature_valid, processed, processed_at, received_at, company_id",
        )
        .order("received_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("mpago_payments")
        .select("id, status, amount_cents, description, payer_email, mp_payment_id, received_at, approved_at, company_id")
        .order("received_at", { ascending: false })
        .limit(20),
    ]);

    return {
      events: events.data ?? [],
      payments: payments.data ?? [],
    };
  });

export const Route = createFileRoute("/_authenticated/admin/mpago-eventos")({
  component: MpagoEventsPage,
  head: () => ({ meta: [{ title: "Mercado Pago — Eventos | Admin" }] }),
});

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR") : "—";
const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    approved: { label: "Aprovado", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", Icon: CheckCircle2 },
    pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300", Icon: Clock },
    rejected: { label: "Rejeitado", cls: "bg-red-500/15 text-red-700 dark:text-red-300", Icon: AlertTriangle },
    refunded: { label: "Estornado", cls: "bg-slate-500/15 text-slate-700 dark:text-slate-300", Icon: AlertTriangle },
  };
  const it = map[status] ?? { label: status, cls: "bg-muted text-foreground", Icon: Clock };
  return (
    <Badge variant="outline" className={it.cls}>
      <it.Icon className="w-3 h-3 mr-1" />
      {it.label}
    </Badge>
  );
}

function MpagoEventsPage() {
  const fetcher = useServerFn(listMpagoEvents);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-mpago-events"],
    queryFn: () => fetcher(),
    refetchInterval: 10_000,
  });

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mercado Pago — Diagnóstico</h1>
          <p className="text-sm text-muted-foreground">
            Eventos do webhook e pagamentos recentes. Atualiza a cada 10s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos recentes</CardTitle>
            <CardDescription>Últimos 20 registros em `mpago_payments`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !data?.payments.length ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {data.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-border/40 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{p.description ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.payer_email ?? "sem e-mail"} · MP {p.mp_payment_id ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">{fmtDate(p.received_at)}</div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="font-semibold">{brl(p.amount_cents)}</div>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos do webhook</CardTitle>
            <CardDescription>Últimos 50 `mpago_webhook_events`.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !data?.events.length ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Nenhum evento recebido ainda.</p>
                <p className="text-xs">
                  Configure no painel do MP a URL:
                  <br />
                  <code className="text-[10px] break-all">
                    https://impulsionando.lovable.app/functions/v1/mpago-webhook?company_id=&lt;UUID&gt;
                  </code>
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-xs max-h-[500px] overflow-y-auto">
                {data.events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between border-b border-border/30 py-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold">{e.event_type}</span>
                        {e.action && <span className="text-muted-foreground">· {e.action}</span>}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {e.mp_resource_id} · {fmtDate(e.received_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {e.signature_valid === true && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700">
                          ✓ sig
                        </Badge>
                      )}
                      {e.signature_valid === false && (
                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-700">
                          ✗ sig
                        </Badge>
                      )}
                      {e.processed ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700">
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700">
                          ...
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como testar o webhook</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. No painel do Mercado Pago, em <b>Suas integrações → Webhooks</b>, configure a URL acima.</p>
          <p>2. Selecione os eventos <b>payment</b>, <b>merchant_order</b>, <b>plan</b> e <b>subscription</b>.</p>
          <p>3. Gere o segredo de assinatura e salve em <Link to="/admin/billing-health" className="underline">/admin/billing-health</Link> como <code>mpago_webhook_secret_&lt;company&gt;</code>.</p>
          <p>4. Use o botão "Simular notificação" do próprio painel MP para testar.</p>
        </CardContent>
      </Card>
    </div>
  );
}
