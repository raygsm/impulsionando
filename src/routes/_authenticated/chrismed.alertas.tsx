import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, XCircle, Clock, Send, CheckCircle2 } from 'lucide-react';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

export const Route = createFileRoute('/_authenticated/chrismed/alertas')({
  head: () => ({
    meta: [
      { title: 'CHRISMED — Central de Alertas' },
      { name: 'description', content: 'Monitor em tempo real: PIX expirados, mensagens com falha e fila atrasada.' },
    ],
  }),
  component: AlertasPage,
});

type Alert = {
  id: string;
  kind: 'pix_expired' | 'pix_rejected' | 'outbox_failed' | 'outbox_stuck' | 'webhook_error';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  created_at: string;
  context_id?: string;
};

const SEVERITY = {
  critical: { color: 'destructive' as const, icon: XCircle },
  warning: { color: 'secondary' as const, icon: AlertTriangle },
  info: { color: 'outline' as const, icon: Clock },
};

function fmtTime(s: string) {
  const d = new Date(s);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff}min atrás`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
  return d.toLocaleString('pt-BR');
}

function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ critical: 0, warning: 0, info: 0, resolved24h: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const list: Alert[] = [];

    // 1) PIX rejeitados ou expirados nas últimas 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: pix } = await supabase
      .from('mpago_payments')
      .select('id,status,amount_cents,payer_name,payer_email,created_at')
      .eq('company_id', CHRISMED_COMPANY_ID)
      .in('status', ['rejected', 'cancelled', 'expired'])
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    (pix ?? []).forEach((p) => {
      list.push({
        id: `pix-${p.id}`,
        kind: p.status === 'rejected' ? 'pix_rejected' : 'pix_expired',
        severity: p.status === 'rejected' ? 'warning' : 'info',
        title: `PIX ${p.status} — ${p.payer_name ?? p.payer_email ?? 'cliente'}`,
        detail: `R$ ${((p.amount_cents ?? 0) / 100).toFixed(2)} · ${p.payer_email ?? ''}`,
        created_at: p.created_at,
        context_id: p.id,
      });
    });

    // 2) Outbox com falha
    const { data: failed } = await supabase
      .from('message_outbox')
      .select('id,channel,recipient_email,recipient_phone,subject,last_error,attempts,created_at')
      .eq('company_id', CHRISMED_COMPANY_ID)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(50);

    (failed ?? []).forEach((m) => {
      list.push({
        id: `outbox-fail-${m.id}`,
        kind: 'outbox_failed',
        severity: 'critical',
        title: `Mensagem ${m.channel} falhou (${m.attempts}x)`,
        detail: `Para: ${m.recipient_email ?? m.recipient_phone} · ${m.last_error ?? 'erro desconhecido'}`,
        created_at: m.created_at,
        context_id: m.id,
      });
    });

    // 3) Outbox preso na fila há mais de 10min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: stuck } = await supabase
      .from('message_outbox')
      .select('id,channel,recipient_email,recipient_phone,subject,attempts,created_at')
      .eq('company_id', CHRISMED_COMPANY_ID)
      .in('status', ['queued', 'sending'])
      .lt('created_at', tenMinAgo)
      .order('created_at', { ascending: false })
      .limit(20);

    (stuck ?? []).forEach((m) => {
      list.push({
        id: `outbox-stuck-${m.id}`,
        kind: 'outbox_stuck',
        severity: 'warning',
        title: `Mensagem ${m.channel} atrasada na fila`,
        detail: `Para: ${m.recipient_email ?? m.recipient_phone} · ${m.attempts} tentativas`,
        created_at: m.created_at,
      });
    });

    // Resolvidos nas últimas 24h (para KPI)
    const { count: sentCount } = await supabase
      .from('message_outbox')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', CHRISMED_COMPANY_ID)
      .eq('status', 'sent')
      .gte('sent_at', since);

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAlerts(list);
    setStats({
      critical: list.filter((a) => a.severity === 'critical').length,
      warning: list.filter((a) => a.severity === 'warning').length,
      info: list.filter((a) => a.severity === 'info').length,
      resolved24h: sentCount ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  async function retryOutbox(id: string) {
    await supabase
      .from('message_outbox')
      .update({ status: 'queued', attempts: 0, last_error: null, next_retry_at: null })
      .eq('id', id);
    load();
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Alertas</h1>
          <p className="text-muted-foreground">CHRISMED · monitor em tempo real · atualiza a cada 30s</p>
        </div>
        <Button onClick={load} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardHeader className="pb-2"><CardDescription>Críticos</CardDescription><CardTitle className="text-3xl text-red-600">{stats.critical}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Avisos</CardDescription><CardTitle className="text-3xl text-amber-600">{stats.warning}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Informativos</CardDescription><CardTitle className="text-3xl text-slate-600">{stats.info}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Enviados 24h</CardDescription><CardTitle className="text-3xl text-emerald-600">{stats.resolved24h}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos ativos</CardTitle>
          <CardDescription>Tudo que precisa de atenção operacional agora.</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              Nenhum alerta ativo. Tudo operando normalmente.
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => {
                const sev = SEVERITY[a.severity];
                const Icon = sev.icon;
                return (
                  <div key={a.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg hover:bg-muted/40">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className={`h-5 w-5 mt-0.5 ${a.severity === 'critical' ? 'text-red-600' : a.severity === 'warning' ? 'text-amber-600' : 'text-slate-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{a.title}</span>
                          <Badge variant={sev.color} className="text-xs">{a.severity}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{a.detail}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{fmtTime(a.created_at)}</div>
                      </div>
                    </div>
                    {(a.kind === 'outbox_failed' || a.kind === 'outbox_stuck') && a.context_id && (
                      <Button size="sm" variant="outline" onClick={() => retryOutbox(a.context_id!)}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Reenviar
                      </Button>
                    )}
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
