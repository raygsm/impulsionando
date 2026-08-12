import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { requireChrismedManagement } from "@/lib/chrismed-management";

const CHRISMED_COMPANY_ID = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";

export const Route = createFileRoute("/_authenticated/chrismed/alertas")({
  beforeLoad: requireChrismedManagement,
  head: () => ({
    meta: [
      { title: "CHRISMED — Central de Alertas" },
      { name: "description", content: "Monitor operacional de pagamentos e comunicações da CHRISMED." },
    ],
  }),
  component: AlertasPage,
});

type Alert = {
  id: string;
  kind: "pix_expired" | "pix_rejected" | "outbox_failed" | "outbox_stuck";
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  created_at: string;
  context_id?: string;
};

const SEVERITY = {
  critical: { color: "destructive" as const, icon: XCircle },
  warning: { color: "secondary" as const, icon: AlertTriangle },
  info: { color: "outline" as const, icon: Clock },
};

function fmtTime(value: string) {
  const d = new Date(value);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff}min atrás`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
  return d.toLocaleString("pt-BR");
}

function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState({ critical: 0, warning: 0, info: 0, resolved24h: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const list: Alert[] = [];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const [pixResult, failedResult, stuckResult, sentResult] = await Promise.all([
      supabase
        .from("mpago_payments")
        .select("id,status,amount_cents,payer_name,payer_email,created_at")
        .eq("company_id", CHRISMED_COMPANY_ID)
        .in("status", ["rejected", "cancelled", "expired"])
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("chrismed_communication_outbox")
        .select("id,event_code,channel,recipient,last_error,attempts,created_at")
        .eq("company_id", CHRISMED_COMPANY_ID)
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("chrismed_communication_outbox")
        .select("id,event_code,channel,recipient,attempts,created_at")
        .eq("company_id", CHRISMED_COMPANY_ID)
        .in("status", ["queued", "sending", "pending"])
        .lt("created_at", tenMinAgo)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("chrismed_communication_outbox")
        .select("*", { count: "exact", head: true })
        .eq("company_id", CHRISMED_COMPANY_ID)
        .eq("status", "sent")
        .gte("sent_at", since),
    ]);

    const firstError = pixResult.error ?? failedResult.error ?? stuckResult.error ?? sentResult.error;
    if (firstError) setLoadError(firstError.message);

    (pixResult.data ?? []).forEach((p) => {
      list.push({
        id: `pix-${p.id}`,
        kind: p.status === "rejected" ? "pix_rejected" : "pix_expired",
        severity: p.status === "rejected" ? "warning" : "info",
        title: `PIX ${p.status} — ${p.payer_name ?? p.payer_email ?? "cliente"}`,
        detail: `R$ ${((p.amount_cents ?? 0) / 100).toFixed(2)} · ${p.payer_email ?? ""}`,
        created_at: p.created_at,
        context_id: p.id,
      });
    });

    (failedResult.data ?? []).forEach((m) => {
      list.push({
        id: `outbox-fail-${m.id}`,
        kind: "outbox_failed",
        severity: "critical",
        title: `${m.event_code} · ${m.channel} falhou (${m.attempts}x)`,
        detail: `Para: ${m.recipient} · ${m.last_error ?? "erro desconhecido"}`,
        created_at: m.created_at,
        context_id: m.id,
      });
    });

    (stuckResult.data ?? []).forEach((m) => {
      list.push({
        id: `outbox-stuck-${m.id}`,
        kind: "outbox_stuck",
        severity: "warning",
        title: `${m.event_code} · ${m.channel} está atrasada`,
        detail: `Para: ${m.recipient} · ${m.attempts} tentativa(s)`,
        created_at: m.created_at,
        context_id: m.id,
      });
    });

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAlerts(list);
    setStats({
      critical: list.filter((a) => a.severity === "critical").length,
      warning: list.filter((a) => a.severity === "warning").length,
      info: list.filter((a) => a.severity === "info").length,
      resolved24h: sentResult.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function retryOutbox(id: string) {
    const { error } = await supabase
      .from("chrismed_communication_outbox")
      .update({ status: "queued", attempts: 0, last_error: null, available_at: new Date().toISOString() })
      .eq("company_id", CHRISMED_COMPANY_ID)
      .eq("id", id);
    if (error) {
      toast.error(`Não foi possível recolocar a mensagem na fila: ${error.message}`);
      return;
    }
    toast.success("Mensagem recolocada na fila.");
    load();
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-7 px-4 py-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Gestão CHRISMED</p>
          <h1 className="text-3xl font-bold tracking-tight">Central de Alertas</h1>
          <p className="text-sm text-muted-foreground">Pagamentos e comunicações que exigem atenção operacional.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost"><a href="/chrismed/admin">Voltar à gestão</a></Button>
          <Button onClick={load} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar
          </Button>
        </div>
      </header>

      {loadError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{loadError}</div>}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Críticos</CardDescription><CardTitle className="text-3xl text-red-600">{stats.critical}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Avisos</CardDescription><CardTitle className="text-3xl text-amber-600">{stats.warning}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Informativos</CardDescription><CardTitle className="text-3xl">{stats.info}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Enviados 24h</CardDescription><CardTitle className="text-3xl text-emerald-600">{stats.resolved24h}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Eventos ativos</CardTitle><CardDescription>Itens que precisam de acompanhamento agora.</CardDescription></CardHeader>
        <CardContent>
          {!loading && alerts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground"><CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />Nenhum alerta ativo.</div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => {
                const sev = SEVERITY[a.severity];
                const Icon = sev.icon;
                return (
                  <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Icon className={`mt-0.5 h-5 w-5 ${a.severity === "critical" ? "text-red-600" : a.severity === "warning" ? "text-amber-600" : "text-slate-500"}`} />
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{a.title}</span><Badge variant={sev.color}>{a.severity}</Badge></div><div className="text-sm text-muted-foreground">{a.detail}</div><div className="mt-0.5 text-xs text-muted-foreground">{fmtTime(a.created_at)}</div></div>
                    </div>
                    {(a.kind === "outbox_failed" || a.kind === "outbox_stuck") && a.context_id && <Button size="sm" variant="outline" onClick={() => retryOutbox(a.context_id!)}><Send className="mr-1 h-3.5 w-3.5" />Reenviar</Button>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
