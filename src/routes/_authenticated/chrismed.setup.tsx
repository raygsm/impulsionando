import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

export const Route = createFileRoute('/_authenticated/chrismed/setup')({
  component: ChrismedSetup,
  head: () => ({
    meta: [
      { title: 'CHRISMED — Configuração & Saúde' },
      { name: 'description', content: 'Diagnóstico completo da integração CHRISMED com Mercado Pago e canais de comunicação.' },
    ],
  }),
});

type Check = { id: string; label: string; status: 'ok' | 'warn' | 'error'; detail: string; action?: string };
type Report = {
  company_id: string;
  webhook_url: string;
  summary: { ok: number; warn: number; error: number };
  checks: Check[];
};

function statusIcon(s: Check['status']) {
  if (s === 'ok') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (s === 'warn') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
}

function badgeVariant(s: Check['status']): 'default' | 'secondary' | 'destructive' {
  if (s === 'ok') return 'default';
  if (s === 'warn') return 'secondary';
  return 'destructive';
}

function ChrismedSetup() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  async function run() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chrismed-healthcheck', {
        method: 'GET',
        // edge function lê company_id da querystring
        body: undefined,
        headers: {},
      });
      if (error) throw error;
      // supabase-js .invoke não passa querystring; usar fetch direto
      const projUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl;
      const res = await fetch(`${projUrl}/functions/v1/chrismed-healthcheck?company_id=${CHRISMED_COMPANY_ID}`, {
        headers: { apikey: (supabase as unknown as { supabaseKey: string }).supabaseKey },
      });
      const json = (await res.json()) as Report;
      setReport(json);
      void data;
    } catch (e) {
      toast.error('Falha no healthcheck: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    run();
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  }

  const overall: Check['status'] = !report
    ? 'warn'
    : report.summary.error > 0
    ? 'error'
    : report.summary.warn > 0
    ? 'warn'
    : 'ok';

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CHRISMED — Setup & Saúde</h1>
          <p className="text-sm text-muted-foreground">
            Diagnóstico em tempo real da integração Mercado Pago e canais de comunicação
          </p>
        </div>
        <Button onClick={run} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Reverificar
        </Button>
      </div>

      {report && (
        <Card className={`border-l-4 ${overall === 'ok' ? 'border-l-emerald-600' : overall === 'warn' ? 'border-l-amber-500' : 'border-l-destructive'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {statusIcon(overall)}
              <div className="flex-1">
                <div className="font-semibold text-lg">
                  {overall === 'ok' && 'Tudo operacional'}
                  {overall === 'warn' && 'Operacional com avisos'}
                  {overall === 'error' && 'Bloqueios encontrados'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {report.summary.ok} OK · {report.summary.warn} avisos · {report.summary.error} erros
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook (cole no painel MP)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
            <code className="flex-1 text-xs break-all">{report?.webhook_url ?? '—'}</code>
            {report?.webhook_url && (
              <Button size="sm" variant="ghost" onClick={() => copy(report.webhook_url)}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {report?.checks.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="pt-0.5">{statusIcon(c.status)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{c.label}</div>
                    <Badge variant={badgeVariant(c.status)} className="uppercase text-xs">{c.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{c.detail}</div>
                  {c.action && (
                    <div className="mt-2 text-sm rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-amber-900 dark:text-amber-200">
                      <strong>Ação:</strong> {c.action}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {loading && !report && (
          <div className="text-center py-12 text-muted-foreground">Executando diagnóstico...</div>
        )}
      </div>
    </div>
  );
}
