import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  listStatusWebhooks,
  upsertStatusWebhook,
  deleteStatusWebhook,
  listStatusWebhookDispatches,
  triggerStatusWebhooksTick,
  testStatusWebhook,
  redispatchStatusWebhookEvent,
  redispatchFailedStatusWebhookDispatches,
  listPendingStatusWebhookRetries,
  cancelStatusWebhookRetry,
  cancelAllStatusWebhookRetries,
  getStatusWebhooksHealth,
} from '@/lib/status-webhooks.functions'

export const Route = createFileRoute('/_authenticated/admin/status-webhooks')({
  component: AdminStatusWebhooksPage,
})

type Hook = {
  id: string
  label: string
  url: string
  kind: 'slack' | 'discord' | 'generic'
  secret: string | null
  notify_incidents: boolean
  notify_maintenance: boolean
  services: string[] | null
  categories: string[] | null
  min_severity: 'info' | 'minor' | 'major' | 'critical' | null
  max_retries: number | null
  active: boolean

  last_dispatch_at: string | null
  last_status_code: number | null
  last_error: string | null
}

function AdminStatusWebhooksPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const list = useServerFn(listStatusWebhooks)
  const upsert = useServerFn(upsertStatusWebhook)
  const remove = useServerFn(deleteStatusWebhook)
  const trigger = useServerFn(triggerStatusWebhooksTick)
  const testFn = useServerFn(testStatusWebhook)

  const { data, isLoading } = useQuery({
    queryKey: ['status-webhooks'],
    queryFn: () => list(),
  })

  const [editing, setEditing] = useState<Partial<Hook> | null>(null)
  const [logsFor, setLogsFor] = useState<Hook | null>(null)

  const save = useMutation({
    mutationFn: (payload: any) => upsert({ data: payload }),
    onSuccess: () => {
      toast.success('Webhook salvo')
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['status-webhooks'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success('Webhook removido')
      qc.invalidateQueries({ queryKey: ['status-webhooks'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const run = useMutation({
    mutationFn: () => trigger(),
    onSuccess: (r: any) =>
      r?.ok
        ? toast.success(`Disparo executado (HTTP ${r.status})`)
        : toast.error(`Falhou (HTTP ${r?.status ?? 'n/a'})`),
    onError: (e: any) => toast.error(e.message),
  })

  const test = useMutation({
    mutationFn: (id: string) => testFn({ data: { id } }),
    onSuccess: (r: any) => {
      if (r?.ok) toast.success(`Ping enviado (HTTP ${r.status})`)
      else toast.error(`Ping falhou (HTTP ${r?.status ?? 'n/a'}) — ${r?.error ?? ''}`)
      qc.invalidateQueries({ queryKey: ['status-webhooks'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const items = (data?.items ?? []) as Hook[]

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Webhooks de Status</h1>
          <p className="text-muted-foreground">
            Encaminhe incidentes e janelas de manutenção para Slack, Discord ou endpoints HTTP.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? 'Executando…' : 'Disparar agora'}
          </Button>
          <Button
            onClick={() =>
              setEditing({
                label: '',
                url: '',
                kind: 'slack',
                notify_incidents: true,
                notify_maintenance: true,
                services: [],
                categories: [],
                min_severity: 'info',
                max_retries: 3,
                active: true,

              })
            }
          >
            Novo webhook
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum webhook cadastrado. Crie um para distribuir eventos do Status para Slack,
              Discord ou seu sistema interno.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-3">Label</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Filtros</th>
                    <th className="py-2 pr-3">Serviços</th>
                    <th className="py-2 pr-3">Categorias</th>
                    <th className="py-2 pr-3">Sev. mín.</th>
                    <th className="py-2 pr-3">Status</th>

                    <th className="py-2 pr-3">Último envio</th>
                    <th className="py-2 pr-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">
                        {h.label}
                        {!h.active && (
                          <Badge variant="secondary" className="ml-2">
                            inativo
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 capitalize">{h.kind}</td>
                      <td className="py-2 pr-3">
                        {h.notify_incidents && (
                          <Badge variant="outline" className="mr-1">
                            incidentes
                          </Badge>
                        )}
                        {h.notify_maintenance && (
                          <Badge variant="outline">manutenções</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {(h.services ?? []).length === 0
                          ? 'todos'
                          : (h.services ?? []).join(', ')}
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {(h.categories ?? []).length === 0
                          ? 'todas'
                          : (h.categories ?? []).join(', ')}
                      </td>
                      <td className="py-2 pr-3 text-xs uppercase">{h.min_severity ?? 'info'}</td>
                      <td className="py-2 pr-3">

                        {h.last_status_code ? (
                          <Badge variant={h.last_error ? 'destructive' : 'default'}>
                            HTTP {h.last_status_code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {h.last_dispatch_at
                          ? new Date(h.last_dispatch_at).toLocaleString('pt-BR')
                          : '—'}
                      </td>
                      <td className="py-2 pr-3 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => test.mutate(h.id)}
                          disabled={test.isPending}
                        >
                          {test.isPending ? '…' : 'Testar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setLogsFor(h)}>
                          Logs
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(h)}>
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Remover webhook "${h.label}"?`)) del.mutate(h.id)
                          }}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PendingRetriesCard />

      <EditDialog
        open={!!editing}
        value={editing}
        onClose={() => setEditing(null)}
        onSave={(v) => save.mutate(v)}
        saving={save.isPending}
      />
      <LogsDialog webhook={logsFor} onClose={() => setLogsFor(null)} />
    </div>
  )
}

function PendingRetriesCard() {
  const qc = useQueryClient()
  const listPending = useServerFn(listPendingStatusWebhookRetries)
  const cancelFn = useServerFn(cancelStatusWebhookRetry)
  const cancelAllFn = useServerFn(cancelAllStatusWebhookRetries)
  const listHooks = useServerFn(listStatusWebhooks)
  const [webhookFilter, setWebhookFilter] = useState<string>('all')

  const { data: hooksData } = useQuery({
    queryKey: ['status-webhooks-min'],
    queryFn: () => listHooks(),
  })
  const { data, isLoading } = useQuery({
    queryKey: ['status-webhook-pending-retries'],
    queryFn: () => listPending({ data: { limit: 200 } }),
    refetchInterval: 30_000,
  })
  const cancel = useMutation({
    mutationFn: (dispatch_id: string) => cancelFn({ data: { dispatch_id } }),
    onSuccess: () => {
      toast.success('Retry cancelado')
      qc.invalidateQueries({ queryKey: ['status-webhook-pending-retries'] })
    },
    onError: (e: any) => toast.error(e.message),
  })
  const cancelAll = useMutation({
    mutationFn: (webhook_id?: string) =>
      cancelAllFn({ data: webhook_id ? { webhook_id } : {} }),
    onSuccess: (r: any) => {
      toast.success(`${r?.cancelled ?? 0} retries cancelados`)
      qc.invalidateQueries({ queryKey: ['status-webhook-pending-retries'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const allItems = (data?.items ?? []) as Array<{
    id: string
    webhook_id: string
    webhook_label: string
    reference_key: string
    event_kind: string
    retry_count: number | null
    next_retry_at: string | null
    status_code: number | null
    error: string | null
  }>
  const items =
    webhookFilter === 'all' ? allItems : allItems.filter((r) => r.webhook_id === webhookFilter)
  const hooks = (hooksData?.items ?? []) as Array<{ id: string; label: string }>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>Retries pendentes ({items.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={webhookFilter} onValueChange={setWebhookFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por webhook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os webhooks</SelectItem>
                {hooks.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="destructive"
              disabled={cancelAll.isPending || items.length === 0}
              onClick={() => {
                const target = webhookFilter === 'all' ? undefined : webhookFilter
                if (
                  confirm(
                    target
                      ? 'Cancelar TODOS os retries deste webhook?'
                      : 'Cancelar TODOS os retries pendentes?',
                  )
                )
                  cancelAll.mutate(target)
              }}
            >
              Cancelar todos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum retry agendado no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b">
                <tr>
                  <th className="py-2 pr-3">Próximo retry</th>
                  <th className="py-2 pr-3">Webhook</th>
                  <th className="py-2 pr-3">Evento</th>
                  <th className="py-2 pr-3">Ref.</th>
                  <th className="py-2 pr-3">Tentativa</th>
                  <th className="py-2 pr-3">Último HTTP</th>
                  <th className="py-2 pr-3">Erro</th>
                  <th className="py-2 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-xs">
                      {r.next_retry_at
                        ? new Date(r.next_retry_at).toLocaleString('pt-BR')
                        : '—'}
                    </td>
                    <td className="py-2 pr-3">{r.webhook_label}</td>
                    <td className="py-2 pr-3 text-xs">{r.event_kind}</td>
                    <td className="py-2 pr-3 text-xs truncate max-w-[220px]">
                      {r.reference_key}
                    </td>
                    <td className="py-2 pr-3 text-xs">{(r.retry_count ?? 0) + 1}</td>
                    <td className="py-2 pr-3 text-xs">
                      {r.status_code ? `HTTP ${r.status_code}` : '—'}
                    </td>
                    <td className="py-2 pr-3 text-xs text-destructive truncate max-w-[260px]">
                      {r.error ?? '—'}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Cancelar este retry agendado?')) cancel.mutate(r.id)
                        }}
                        disabled={cancel.isPending}
                      >
                        Cancelar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EditDialog({
  open,
  value,
  onClose,
  onSave,
  saving,
}: {
  open: boolean
  value: Partial<Hook> | null
  onClose: () => void
  onSave: (v: any) => void
  saving: boolean
}) {
  const [form, setForm] = useState<any>(value ?? {})
  // resync on open
  useState(() => setForm(value ?? {}))
  if (!open || !value) return null
  const v = { ...value, ...form }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{value?.id ? 'Editar webhook' : 'Novo webhook'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Label</Label>
            <Input
              value={v.label ?? ''}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div>
            <Label>URL</Label>
            <Input
              value={v.url ?? ''}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={v.kind ?? 'slack'}
                onValueChange={(k) => setForm({ ...form, kind: k })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="generic">Genérico (JSON)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Secret (HMAC, genérico)</Label>
              <Input
                value={v.secret ?? ''}
                onChange={(e) => setForm({ ...form, secret: e.target.value })}
                placeholder="opcional"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={v.notify_incidents ?? true}
                onCheckedChange={(c) => setForm({ ...form, notify_incidents: c })}
              />
              Incidentes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={v.notify_maintenance ?? true}
                onCheckedChange={(c) => setForm({ ...form, notify_maintenance: c })}
              />
              Manutenções
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={v.active ?? true}
                onCheckedChange={(c) => setForm({ ...form, active: c })}
              />
              Ativo
            </label>
          </div>
          <div>
            <Label>Filtro de serviços (slugs separados por vírgula)</Label>
            <Input
              value={(v.services ?? []).join(',')}
              onChange={(e) =>
                setForm({
                  ...form,
                  services: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="vazio = todos"
            />
          </div>
          <div>
            <Label>Filtro de categorias (seções, separadas por vírgula)</Label>
            <Input
              value={(v.categories ?? []).join(',')}
              onChange={(e) =>
                setForm({
                  ...form,
                  categories: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="vazio = todas (ex: API, Site, Pagamentos)"
            />
          </div>
          <div>
            <Label>Severidade mínima (incidentes)</Label>
            <Select
              value={v.min_severity ?? 'info'}
              onValueChange={(s) => setForm({ ...form, min_severity: s })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">info — tudo</SelectItem>
                <SelectItem value="minor">minor ou acima</SelectItem>
                <SelectItem value="major">major ou acima</SelectItem>
                <SelectItem value="critical">apenas critical</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizações, manutenções e resoluções sempre são entregues.
            </p>
          </div>
          <div>
            <Label>Tentativas máximas (auto-retry)</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={v.max_retries ?? 3}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_retries: Math.max(0, Math.min(10, Number(e.target.value) || 0)),
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Falhas são reagendadas automaticamente com backoff 5/15/45/120 min. 0 desativa retry.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSave({
                id: value?.id,
                label: v.label,
                url: v.url,
                kind: v.kind ?? 'slack',
                secret: v.secret || null,
                notify_incidents: v.notify_incidents ?? true,
                notify_maintenance: v.notify_maintenance ?? true,
                services: v.services ?? [],
                categories: v.categories ?? [],
                min_severity: v.min_severity ?? 'info',
                max_retries: typeof v.max_retries === 'number' ? v.max_retries : 3,
                active: v.active ?? true,
              })
            }
            disabled={saving || !v.label || !v.url}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LogsDialog({ webhook, onClose }: { webhook: Hook | null; onClose: () => void }) {
  const qc = useQueryClient()
  const list = useServerFn(listStatusWebhookDispatches)
  const redispatch = useServerFn(redispatchStatusWebhookEvent)
  const bulkRedispatch = useServerFn(redispatchFailedStatusWebhookDispatches)
  const [statusFilter, setStatusFilter] = useState<'all' | 'failed' | 'ok'>('all')
  const [kindFilter, setKindFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['status-webhook-dispatches', webhook?.id],
    queryFn: () => list({ data: { webhook_id: webhook!.id, limit: 100 } }),
    enabled: !!webhook,
  })
  const replay = useMutation({
    mutationFn: (dispatch_id: string) => redispatch({ data: { dispatch_id } }),
    onSuccess: (r: any) => {
      if (r?.ok) toast.success(`Reenvio OK (HTTP ${r.status})`)
      else toast.error(`Reenvio falhou (HTTP ${r?.status ?? 'n/a'}) — ${r?.error ?? ''}`)
      qc.invalidateQueries({ queryKey: ['status-webhook-dispatches', webhook?.id] })
      qc.invalidateQueries({ queryKey: ['status-webhooks'] })
    },
    onError: (e: any) => toast.error(e.message),
  })
  const bulk = useMutation({
    mutationFn: () => bulkRedispatch({ data: { webhook_id: webhook!.id, limit: 20 } }),
    onSuccess: (r: any) => {
      if (r?.total === 0) toast.info('Nenhuma falha para reenviar.')
      else if (r?.ok) toast.success(`Reenvio em lote: ${r.okCount}/${r.total} OK`)
      else toast.warning(`Reenvio parcial: ${r.okCount} OK, ${r.failCount} falhas`)
      qc.invalidateQueries({ queryKey: ['status-webhook-dispatches', webhook?.id] })
      qc.invalidateQueries({ queryKey: ['status-webhooks'] })
    },
    onError: (e: any) => toast.error(e.message),
  })
  if (!webhook) return null
  const allItems = (data?.items ?? []) as Array<{
    id: string
    reference_key: string
    event_kind: string
    status_code: number | null
    ok: boolean
    error: string | null
    created_at: string
  }>
  const kinds = Array.from(new Set(allItems.map((d) => d.event_kind))).sort()
  const q = search.trim().toLowerCase()
  const items = allItems
    .filter((d) =>
      statusFilter === 'all' ? true : statusFilter === 'failed' ? !d.ok : d.ok,
    )
    .filter((d) => (kindFilter === 'all' ? true : d.event_kind === kindFilter))
    .filter((d) =>
      q ? d.reference_key.toLowerCase().includes(q) || d.event_kind.toLowerCase().includes(q) : true,
    )
  const failedCount = allItems.filter((d) => !d.ok).length

  const exportCsv = () => {
    const header = ['quando', 'evento', 'reference_key', 'http', 'ok', 'erro']
    const rows = items.map((d) => [
      new Date(d.created_at).toISOString(),
      d.event_kind,
      d.reference_key,
      String(d.status_code ?? ''),
      d.ok ? '1' : '0',
      (d.error ?? '').replace(/[\r\n]+/g, ' '),
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `status-webhook-${webhook.label.replace(/\W+/g, '_')}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={!!webhook} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Logs — {webhook.label}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({allItems.length})</SelectItem>
                <SelectItem value="failed">Falhas ({failedCount})</SelectItem>
                <SelectItem value="ok">OK ({allItems.length - failedCount})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kindFilter} onValueChange={setKindFilter}>
              <SelectTrigger className="h-8 w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {kinds.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar reference_key…"
              className="h-8 w-[200px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={exportCsv}
              disabled={items.length === 0}
            >
              Exportar CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (failedCount === 0) return toast.info('Nenhuma falha para reenviar.')
                if (confirm(`Reenviar últimas ${Math.min(failedCount, 20)} falhas?`)) bulk.mutate()
              }}
              disabled={bulk.isPending || failedCount === 0}
            >
              {bulk.isPending ? 'Reenviando…' : `Reenviar falhas (${Math.min(failedCount, 20)})`}
            </Button>
          </div>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum disparo no filtro atual.</p>


        ) : (
          <div className="max-h-[60vh] overflow-y-auto text-xs">
            <table className="w-full">
              <thead className="text-left text-muted-foreground border-b sticky top-0 bg-background">
                <tr>
                  <th className="py-1 pr-2">Quando</th>
                  <th className="py-1 pr-2">Evento</th>
                  <th className="py-1 pr-2">HTTP</th>
                  <th className="py-1 pr-2">Erro</th>
                  <th className="py-1 pr-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 align-top">
                    <td className="py-1 pr-2 whitespace-nowrap">
                      {new Date(d.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-1 pr-2">
                      <div>{d.event_kind}</div>
                      <div className="text-muted-foreground">{d.reference_key}</div>
                    </td>
                    <td className="py-1 pr-2">
                      <Badge variant={d.ok ? 'default' : 'destructive'}>
                        {d.status_code ?? '—'}
                      </Badge>
                    </td>
                    <td className="py-1 pr-2 text-destructive max-w-[280px] break-words">
                      {d.error ?? ''}
                    </td>
                    <td className="py-1 pr-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => replay.mutate(d.id)}
                        disabled={replay.isPending}
                      >
                        {replay.isPending ? '…' : 'Reenviar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
