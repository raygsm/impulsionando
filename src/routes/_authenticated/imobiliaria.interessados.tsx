import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { listVitrineInterests, updateVitrineInterest } from '@/lib/realestate-vitrine.functions'
import { useActiveCompany } from '@/hooks/use-active-company'
import { PageHeader, EmptyState } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Phone, Mail, MessageSquare, Home } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/imobiliaria/interessados')({
  head: () => ({ meta: [{ title: 'Interessados — Vitrine imobiliária' }] }),
  component: Page,
})

const STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'novo', label: 'Novo' },
  { value: 'em_atendimento', label: 'Em atendimento' },
  { value: 'respondido', label: 'Respondido' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'arquivado', label: 'Arquivado' },
]

const STATUS_BADGE: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  em_atendimento: 'bg-amber-100 text-amber-800',
  respondido: 'bg-emerald-100 text-emerald-800',
  convertido: 'bg-violet-100 text-violet-800',
  perdido: 'bg-zinc-100 text-zinc-700',
  arquivado: 'bg-zinc-100 text-zinc-500',
}

const KIND_LABEL: Record<string, string> = {
  interesse: 'Interesse', visita: 'Visita', avaliacao: 'Avaliação', contato: 'Contato', proposta: 'Proposta',
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

function Page() {
  const { companyId } = useActiveCompany()
  const qc = useQueryClient()
  const fetchList = useServerFn(listVitrineInterests)
  const fetchUpdate = useServerFn(updateVitrineInterest)
  const [status, setStatus] = useState('todos')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const { data, isLoading } = useQuery({
    queryKey: ['vitrine-interests', companyId, status, search, page],
    enabled: !!companyId,
    queryFn: () => fetchList({ data: { companyId, status, search, page, pageSize } }),
    refetchInterval: 15000,
  })

  const update = useMutation({
    mutationFn: (vars: { id: string; status?: string }) =>
      fetchUpdate({ data: { id: vars.id, companyId, status: vars.status as any } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitrine-interests'] })
      qc.invalidateQueries({ queryKey: ['vitrine-counters'] })
      toast.success('Atualizado')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao atualizar'),
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Interessados da vitrine"
        description="Todo cliente que demonstra interesse na vitrine aparece aqui. Atualiza automaticamente a cada 15s."
      />

      <Card className="p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label>
          <Input placeholder="Nome, e-mail ou telefone" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground ml-auto">{total} registro(s)</div>
      </Card>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
      ) : rows.length === 0 ? (
        <EmptyState title="Nenhum interessado" description="Quando um cliente clicar em ‘Tenho interesse’ na vitrine, ele aparece aqui." />
      ) : (
        <div className="space-y-3">
          {rows.map((r: any) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[260px] flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold">{r.contact_name}</div>
                    <Badge className={STATUS_BADGE[r.status] ?? ''}>{STATUS.find((s) => s.value === r.status)?.label ?? r.status}</Badge>
                    <Badge variant="outline">{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                    <span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {r.contact_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {r.contact_email}</span>}
                    {r.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {r.contact_phone}</span>}
                    {r.contact_whatsapp && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> WA: {r.contact_whatsapp}</span>}
                  </div>
                  {r.property && (
                    <div className="text-sm mt-2 inline-flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      <span className="font-medium">{r.property.reference_code ? `${r.property.reference_code} — ` : ''}{r.property.title}</span>
                    </div>
                  )}
                  {r.message && <p className="text-sm mt-2 p-2 bg-muted rounded">{r.message}</p>}
                </div>
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <Select value={r.status} onValueChange={(v) => update.mutate({ id: r.id, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS.filter((s) => s.value !== 'todos').map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}
    </div>
  )
}
