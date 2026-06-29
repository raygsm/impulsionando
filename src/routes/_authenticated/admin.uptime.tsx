import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import {
  getUptimeOverview,
  upsertUptimeTarget,
  deleteUptimeTarget,
} from '@/lib/uptime.functions'
import { PageHeader, StatCard } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Activity, CheckCircle2, AlertTriangle, Pencil, Trash2, Plus, X } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/admin/uptime')({
  head: () => ({ meta: [{ title: 'Uptime — Impulsionando Tecnologia' }] }),
  component: AdminUptimePage,
})

function fmt(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR')
}

type TargetRow = {
  url: string
  is_up: boolean
  since: string | null
  last_check_at: string | null
  last_error: string | null
  alert_emails: string[] | null
}

type EditState = {
  original_url: string | null // null = new
  url: string
  alert_emails: string
  alert_whatsapps: string
  alert_after_seconds: string
}

function AdminUptimePage() {
  const fn = useServerFn(getUptimeOverview)
  const upsertFn = useServerFn(upsertUptimeTarget)
  const deleteFn = useServerFn(deleteUptimeTarget)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-uptime'],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  })

  const [edit, setEdit] = useState<EditState | null>(null)

  const upsert = useMutation({
    mutationFn: (payload: EditState) =>
      upsertFn({
        data: {
          url: payload.url,
          original_url: payload.original_url,
          alert_emails: payload.alert_emails,
          alert_whatsapps: payload.alert_whatsapps,
          alert_after_seconds: payload.alert_after_seconds
            ? Number(payload.alert_after_seconds)
            : null,
        },
      }),
    onSuccess: () => {
      toast.success('Alvo salvo')
      setEdit(null)
      qc.invalidateQueries({ queryKey: ['admin-uptime'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao salvar'),
  })

  const remove = useMutation({
    mutationFn: (url: string) => deleteFn({ data: { url } }),
    onSuccess: () => {
      toast.success('Alvo removido')
      qc.invalidateQueries({ queryKey: ['admin-uptime'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao remover'),
  })

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>

  const state = (data?.state ?? []) as TargetRow[]
  const recent = data?.recent ?? []
  const uptime24h = data?.uptime24h ?? {}
  const allUp = state.every((s) => s.is_up)
  const downCount = state.filter((s) => !s.is_up).length

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Monitoramento de Uptime"
        description="Verificação a cada 5 minutos com alertas por e-mail e WhatsApp."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={allUp ? CheckCircle2 : AlertTriangle}
          label="Status geral"
          value={allUp ? 'Todos no ar' : `${downCount} fora do ar`}
        />
        <StatCard icon={Activity} label="URLs monitoradas" value={state.length} />
        <StatCard
          icon={Activity}
          label="Verificações (últimas 100)"
          value={recent.length}
        />
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">URLs monitoradas</h2>
          <Button
            size="sm"
            onClick={() =>
              setEdit({
                original_url: null,
                url: 'https://',
                alert_emails: '',
                alert_whatsapps: '',
                alert_after_seconds: '',
              })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar alvo
          </Button>
        </div>

        <div className="space-y-3">
          {state.map((s) => {
            const u = uptime24h[s.url]
            return (
              <div
                key={s.url}
                className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.url}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Desde {fmt(s.since)} · Última verificação {fmt(s.last_check_at)}
                  </div>
                  {s.last_error && !s.is_up ? (
                    <div className="text-xs text-destructive mt-1">Erro: {s.last_error}</div>
                  ) : null}
                  {(s.alert_emails?.length ?? 0) > 0 ? (
                    <div className="text-xs text-muted-foreground mt-1">
                      Alertas: {s.alert_emails!.join(', ')}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Uptime 24h</div>
                    <div className="text-sm font-medium">{u ? `${u.pct}%` : '—'}</div>
                  </div>
                  <Badge variant={s.is_up ? 'default' : 'destructive'}>
                    {s.is_up ? 'No ar' : 'Fora do ar'}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const full = state.find((x) => x.url === s.url) as any
                      setEdit({
                        original_url: s.url,
                        url: s.url,
                        alert_emails: (full?.alert_emails ?? []).join(', '),
                        alert_whatsapps: (full?.alert_whatsapps ?? []).join(', '),
                        alert_after_seconds: full?.alert_after_seconds
                          ? String(full.alert_after_seconds)
                          : '',
                      })
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Remover monitoramento de ${s.url}?`)) remove.mutate(s.url)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )
          })}
          {state.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma URL cadastrada.</div>
          ) : null}
        </div>
      </Card>

      {edit ? (
        <Card className="p-6 space-y-4 border-primary/40">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {edit.original_url ? 'Editar alvo' : 'Novo alvo'}
            </h3>
            <Button size="icon" variant="ghost" onClick={() => setEdit(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>URL (https://...)</Label>
              <Input
                value={edit.url}
                onChange={(e) => setEdit({ ...edit, url: e.target.value })}
              />
            </div>
            <div>
              <Label>E-mails de alerta (separados por vírgula)</Label>
              <Input
                value={edit.alert_emails}
                onChange={(e) => setEdit({ ...edit, alert_emails: e.target.value })}
                placeholder="alerta@empresa.com, on-call@empresa.com"
              />
            </div>
            <div>
              <Label>WhatsApps (E.164, sem +)</Label>
              <Input
                value={edit.alert_whatsapps}
                onChange={(e) => setEdit({ ...edit, alert_whatsapps: e.target.value })}
                placeholder="5521999990000, 5521988880000"
              />
            </div>
            <div>
              <Label>Alertar após (segundos consecutivos)</Label>
              <Input
                value={edit.alert_after_seconds}
                onChange={(e) => setEdit({ ...edit, alert_after_seconds: e.target.value })}
                placeholder="opcional"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancelar
            </Button>
            <Button onClick={() => upsert.mutate(edit)} disabled={upsert.isPending}>
              {upsert.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimas 100 verificações</h2>
          <button
            onClick={() => refetch()}
            className="text-xs text-primary hover:underline"
          >
            Atualizar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2">Quando</th>
                <th>URL</th>
                <th>Status</th>
                <th>HTTP</th>
                <th>Latência</th>
                <th>Erro</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 whitespace-nowrap">{fmt(r.checked_at)}</td>
                  <td className="truncate max-w-[220px]">{r.url}</td>
                  <td>
                    <Badge variant={r.is_up ? 'default' : 'destructive'}>
                      {r.is_up ? 'OK' : 'Falha'}
                    </Badge>
                  </td>
                  <td>{r.http_status ?? '—'}</td>
                  <td>{r.response_ms ? `${r.response_ms} ms` : '—'}</td>
                  <td className="text-xs text-muted-foreground truncate max-w-[260px]">
                    {r.error_message ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
