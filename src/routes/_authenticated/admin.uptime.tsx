import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import {
  getUptimeOverview,
  upsertUptimeTarget,
  deleteUptimeTarget,
  toggleUptimeTargetPaused,
} from '@/lib/uptime.functions'
import { PageHeader, StatCard } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Activity, CheckCircle2, AlertTriangle, Pencil, Trash2, Plus, X, Pause, Play } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/admin/uptime')({
  head: () => ({ meta: [{ title: 'Uptime — Impulsionando Tecnologia' }] }),
  component: AdminUptimePage,
})

function fmt(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR')
}

type EditState = {
  original_url: string | null
  url: string
  label: string
  alert_emails: string
  alert_whatsapps: string
  alert_after_seconds: string
  paused: boolean
  show_on_public: boolean
  sort_order: string
}

function AdminUptimePage() {
  const fn = useServerFn(getUptimeOverview)
  const upsertFn = useServerFn(upsertUptimeTarget)
  const deleteFn = useServerFn(deleteUptimeTarget)
  const toggleFn = useServerFn(toggleUptimeTargetPaused)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-uptime'],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  })

  const [edit, setEdit] = useState<EditState | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-uptime'] })

  const upsert = useMutation({
    mutationFn: (p: EditState) =>
      upsertFn({
        data: {
          url: p.url,
          original_url: p.original_url,
          label: p.label,
          alert_emails: p.alert_emails,
          alert_whatsapps: p.alert_whatsapps,
          alert_after_seconds: p.alert_after_seconds ? Number(p.alert_after_seconds) : null,
          paused: p.paused,
          show_on_public: p.show_on_public,
          sort_order: p.sort_order ? Number(p.sort_order) : 100,
        },
      }),
    onSuccess: () => {
      toast.success('Alvo salvo')
      setEdit(null)
      invalidate()
    },
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao salvar'),
  })

  const remove = useMutation({
    mutationFn: (url: string) => deleteFn({ data: { url } }),
    onSuccess: () => {
      toast.success('Alvo removido')
      invalidate()
    },
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao remover'),
  })

  const togglePause = useMutation({
    mutationFn: (args: { url: string; paused: boolean }) => toggleFn({ data: args }),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao alternar'),
  })

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>

  const state = (data?.state ?? []) as any[]
  const recent = data?.recent ?? []
  const uptime24h = data?.uptime24h ?? {}
  const activeState = state.filter((s) => !s.paused)
  const allUp = activeState.every((s) => s.is_up)
  const downCount = activeState.filter((s) => !s.is_up).length
  const pausedCount = state.filter((s) => s.paused).length

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Monitoramento de Uptime"
        description="Verificação a cada 5 minutos com alertas por e-mail e WhatsApp. Controle quais serviços aparecem em /status."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={allUp ? CheckCircle2 : AlertTriangle}
          label="Status geral"
          value={allUp ? 'Todos no ar' : `${downCount} fora do ar`}
        />
        <StatCard icon={Activity} label="Monitorando" value={activeState.length} />
        <StatCard icon={Pause} label="Pausados" value={pausedCount} />
        <StatCard icon={Activity} label="Últ. 100 checks" value={recent.length} />
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
                label: '',
                alert_emails: '',
                alert_whatsapps: '',
                alert_after_seconds: '',
                paused: false,
                show_on_public: true,
                sort_order: '100',
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
                className={`flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border ${s.paused ? 'opacity-60' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{s.label || s.url}</div>
                    {s.label ? <span className="text-xs text-muted-foreground truncate">({s.url})</span> : null}
                    {!s.show_on_public ? <Badge variant="outline" className="text-[10px]">oculto em /status</Badge> : null}
                    {s.paused ? <Badge variant="secondary" className="text-[10px]">pausado</Badge> : null}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ordem #{s.sort_order ?? 100} · Desde {fmt(s.since)} · Última {fmt(s.last_check_at)}
                  </div>
                  {s.last_error && !s.is_up && !s.paused ? (
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
                  <Badge variant={s.paused ? 'secondary' : s.is_up ? 'default' : 'destructive'}>
                    {s.paused ? 'Pausado' : s.is_up ? 'No ar' : 'Fora do ar'}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    title={s.paused ? 'Retomar monitoramento' : 'Pausar monitoramento'}
                    onClick={() => togglePause.mutate({ url: s.url, paused: !s.paused })}
                  >
                    {s.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setEdit({
                        original_url: s.url,
                        url: s.url,
                        label: s.label ?? '',
                        alert_emails: (s.alert_emails ?? []).join(', '),
                        alert_whatsapps: (s.alert_whatsapps ?? []).join(', '),
                        alert_after_seconds: s.alert_after_seconds ? String(s.alert_after_seconds) : '',
                        paused: !!s.paused,
                        show_on_public: s.show_on_public !== false,
                        sort_order: String(s.sort_order ?? 100),
                      })
                    }
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
              <Input value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} />
            </div>
            <div>
              <Label>Rótulo amigável (exibido em /status)</Label>
              <Input
                value={edit.label}
                onChange={(e) => setEdit({ ...edit, label: e.target.value })}
                placeholder="Ex.: API Pública, Site Marketing"
              />
            </div>
            <div>
              <Label>Ordem (menor aparece primeiro)</Label>
              <Input
                value={edit.sort_order}
                onChange={(e) => setEdit({ ...edit, sort_order: e.target.value })}
                inputMode="numeric"
              />
            </div>
            <div>
              <Label>E-mails de alerta (vírgula)</Label>
              <Input
                value={edit.alert_emails}
                onChange={(e) => setEdit({ ...edit, alert_emails: e.target.value })}
                placeholder="alerta@empresa.com"
              />
            </div>
            <div>
              <Label>WhatsApps (E.164, sem +)</Label>
              <Input
                value={edit.alert_whatsapps}
                onChange={(e) => setEdit({ ...edit, alert_whatsapps: e.target.value })}
                placeholder="5521999990000"
              />
            </div>
            <div>
              <Label>Alertar após (segundos)</Label>
              <Input
                value={edit.alert_after_seconds}
                onChange={(e) => setEdit({ ...edit, alert_after_seconds: e.target.value })}
                inputMode="numeric"
                placeholder="opcional"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <div className="text-sm font-medium">Mostrar em /status</div>
                <div className="text-xs text-muted-foreground">Visível ao público</div>
              </div>
              <Switch
                checked={edit.show_on_public}
                onCheckedChange={(v) => setEdit({ ...edit, show_on_public: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <div className="text-sm font-medium">Pausar monitoramento</div>
                <div className="text-xs text-muted-foreground">Não verifica nem alerta</div>
              </div>
              <Switch
                checked={edit.paused}
                onCheckedChange={(v) => setEdit({ ...edit, paused: v })}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={() => upsert.mutate(edit)} disabled={upsert.isPending}>
              {upsert.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimas 100 verificações</h2>
          <button onClick={() => refetch()} className="text-xs text-primary hover:underline">
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
              {recent.map((r: any, i: number) => (
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
