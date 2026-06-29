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
  const list = useServerFn(listStatusWebhookDispatches)
  const { data, isLoading } = useQuery({
    queryKey: ['status-webhook-dispatches', webhook?.id],
    queryFn: () => list({ data: { webhook_id: webhook!.id, limit: 50 } }),
    enabled: !!webhook,
  })
  if (!webhook) return null
  const items = (data?.items ?? []) as Array<{
    id: string
    reference_key: string
    event_kind: string
    status_code: number | null
    ok: boolean
    error: string | null
    created_at: string
  }>
  return (
    <Dialog open={!!webhook} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Logs — {webhook.label}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum disparo registrado ainda.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto text-xs">
            <table className="w-full">
              <thead className="text-left text-muted-foreground border-b sticky top-0 bg-background">
                <tr>
                  <th className="py-1 pr-2">Quando</th>
                  <th className="py-1 pr-2">Evento</th>
                  <th className="py-1 pr-2">HTTP</th>
                  <th className="py-1 pr-2">Erro</th>
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
