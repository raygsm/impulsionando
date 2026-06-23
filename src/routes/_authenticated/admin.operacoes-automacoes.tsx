import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { listWebhookRuns, reprocessWebhookRun, webhookRunSummary } from '@/lib/webhook-monitor.functions';
import { listCoreFlags, updateCoreFlag } from '@/lib/core-admin.functions';
import { fetchN8nConsole, requeueFailedDispatch } from '@/lib/n8n-console.functions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/operacoes-automacoes')({
  head: () => ({ meta: [
    { title: 'Cockpit de Automações — Impulsionando' },
    { name: 'robots', content: 'noindex,nofollow' },
  ] }),
  component: OperacoesAutomacoes,
});

type Tab = 'workflows' | 'flags' | 'webhooks';

function OperacoesAutomacoes() {
  const [tab, setTab] = useState<Tab>('workflows');
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cockpit de Automações</h1>
        <p className="text-muted-foreground mt-1">
          Workflows N8N, feature flags do Core e inspetor de webhooks.
        </p>
      </header>

      <nav className="flex gap-2 border-b">
        {([
          ['workflows', 'Workflows N8N'],
          ['flags', 'Feature Flags'],
          ['webhooks', 'Webhooks'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === k ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'workflows' && <WorkflowsTab />}
      {tab === 'flags' && <FlagsTab />}
      {tab === 'webhooks' && <WebhooksTab />}
    </div>
  );
}

function WorkflowsTab() {
  const fetcher = useServerFn(fetchN8nConsole);
  const requeue = useServerFn(requeueFailedDispatch);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['n8n-console'],
    queryFn: () => fetcher({ data: {} }),
  });
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Execuções recentes</h2>
        <button type="button" onClick={() => refetch()} className="text-xs px-2 py-1 rounded border">
          Atualizar
        </button>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="rounded-lg border divide-y text-sm">
          {((data as any)?.runs ?? []).slice(0, 50).map((r: any) => (
            <div key={r.id} className="p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{r.workflow_name ?? r.workflow_id ?? r.id}</div>
                <div className="text-xs text-muted-foreground">
                  {r.status} · {new Date(r.started_at ?? r.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
              {r.status === 'failed' && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await requeue({ data: { id: r.id } });
                      toast.success('Re-enfileirado');
                      refetch();
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}
                  className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground"
                >
                  Reenfileirar
                </button>
              )}
            </div>
          ))}
          {!((data as any)?.runs ?? []).length && (
            <div className="p-4 text-sm text-muted-foreground">Sem execuções no momento.</div>
          )}
        </div>
      )}
    </div>
  );
}

function FlagsTab() {
  const list = useServerFn(listCoreFlags);
  const update = useServerFn(updateCoreFlag);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['core-flags'],
    queryFn: () => list(),
  });
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Feature flags do Core</h2>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="rounded-lg border divide-y text-sm">
          {(data as any[] ?? []).map((f) => (
            <div key={f.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{f.label ?? f.key}</div>
                <div className="text-xs text-muted-foreground">
                  {f.module_slug} · <code>{f.key}</code>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={!!f.default_value}
                  onChange={async (e) => {
                    try {
                      await update({ data: { id: f.id, patch: { default_value: e.target.checked } } });
                      toast.success('Atualizado');
                      refetch();
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }}
                />
                ativa
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WebhooksTab() {
  const list = useServerFn(listWebhookRuns);
  const summary = useServerFn(webhookRunSummary);
  const replay = useServerFn(reprocessWebhookRun);
  const [status, setStatus] = useState('');
  const [workflow, setWorkflow] = useState('');
  const { data: stats } = useQuery({ queryKey: ['webhook-summary'], queryFn: () => summary() });
  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ['webhook-runs', status, workflow],
    queryFn: () => list({ data: { status: status || undefined, workflow: workflow || undefined, limit: 100 } }),
  });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
        {stats && Object.entries(stats as Record<string, number>).map(([k, v]) => (
          <div key={k} className="rounded border p-2">
            <div className="text-muted-foreground capitalize">{k}</div>
            <div className="font-semibold text-base">{v}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm px-2 py-1 rounded border bg-background">
          <option value="">Todos status</option>
          <option value="success">success</option>
          <option value="error">error</option>
          <option value="retry">retry</option>
          <option value="pending">pending</option>
          <option value="running">running</option>
        </select>
        <input
          value={workflow}
          onChange={(e) => setWorkflow(e.target.value)}
          placeholder="workflow…"
          className="text-sm px-2 py-1 rounded border bg-background flex-1"
        />
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="rounded-lg border divide-y text-sm">
          {(rows as any[] ?? []).map((r) => (
            <div key={r.id} className="p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{r.workflow} · {r.event}</div>
                <div className="text-xs text-muted-foreground">
                  {r.status} · {r.http_method} {r.response_status ?? '-'} · tent. {r.attempts}
                </div>
                {r.last_error && <div className="text-xs text-destructive mt-1">{r.last_error}</div>}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await replay({ data: { id: r.id } });
                    toast.success('Reprocessado');
                    refetch();
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
                className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground"
              >
                Reenviar
              </button>
            </div>
          ))}
          {!((rows as any[]) ?? []).length && (
            <div className="p-4 text-sm text-muted-foreground">Sem webhooks no filtro.</div>
          )}
        </div>
      )}
    </div>
  );
}
