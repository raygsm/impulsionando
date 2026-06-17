import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { listVitrineMessages, updateVitrineMessage } from '@/lib/realestate-vitrine.functions'
import { useActiveCompany } from '@/hooks/use-active-company'
import { PageHeader, EmptyState } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Phone, Mail, Home } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/imobiliaria/mensagens')({
  head: () => ({ meta: [{ title: 'Mensagens — Vitrine imobiliária' }] }),
  component: Page,
})

const STATUS = [
  { value: 'todos', label: 'Todas' },
  { value: 'nova', label: 'Nova' },
  { value: 'em_atendimento', label: 'Em atendimento' },
  { value: 'respondida', label: 'Respondida' },
  { value: 'arquivada', label: 'Arquivada' },
]
const STATUS_BADGE: Record<string, string> = {
  nova: 'bg-blue-100 text-blue-800',
  em_atendimento: 'bg-amber-100 text-amber-800',
  respondida: 'bg-emerald-100 text-emerald-800',
  arquivada: 'bg-zinc-100 text-zinc-500',
}
const KIND: Record<string, string> = {
  interesse: 'Interesse', visita: 'Visita', avaliacao: 'Avaliação', contato: 'Contato',
  busca: 'Busca salva', mensagem: 'Mensagem', proposta: 'Proposta',
}

function fmtDate(iso?: string | null) { return iso ? new Date(iso).toLocaleString('pt-BR') : '—' }

function Page() {
  const { companyId } = useActiveCompany()
  const qc = useQueryClient()
  const fetchList = useServerFn(listVitrineMessages)
  const fetchUpdate = useServerFn(updateVitrineMessage)
  const [status, setStatus] = useState('todos')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const { data, isLoading } = useQuery({
    queryKey: ['vitrine-messages', companyId, status, search, page],
    enabled: !!companyId,
    queryFn: () => fetchList({ data: { companyId, status, search, page, pageSize } }),
    refetchInterval: 15000,
  })

  const update = useMutation({
    mutationFn: (vars: { id: string; status: string }) => fetchUpdate({ data: { id: vars.id, companyId, status: vars.status as any } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitrine-messages'] })
      qc.invalidateQueries({ queryKey: ['vitrine-counters'] })
      toast.success('Atualizado')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro'),
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Mensagens da vitrine" description="Toda ação pública gera uma mensagem interna. Atualiza a cada 15s." />

      <Card className="p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label>
          <Input placeholder="Assunto, nome ou e-mail" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground ml-auto">{total} mensagem(ns)</div>
      </Card>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
      ) : rows.length === 0 ? (
        <EmptyState title="Sem mensagens" description="As mensagens criadas pelas ações da vitrine aparecem aqui." />
      ) : (
        <div className="space-y-3">
          {rows.map((m: any) => (
            <Card key={m.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold">{m.subject}</div>
                    <Badge className={STATUS_BADGE[m.status] ?? ''}>{STATUS.find((s) => s.value === m.status)?.label ?? m.status}</Badge>
                    <Badge variant="outline">{KIND[m.request_kind] ?? m.request_kind}</Badge>
                    <Badge variant="outline">{m.channel}</Badge>
                    <span className="text-xs text-muted-foreground">{fmtDate(m.created_at)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>{m.contact_name}</span>
                    {m.contact_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {m.contact_email}</span>}
                    {m.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {m.contact_phone}</span>}
                  </div>
                  {m.property && (
                    <div className="text-sm mt-2 inline-flex items-center gap-1">
                      <Home className="h-3 w-3" /> {m.property.reference_code ? `${m.property.reference_code} — ` : ''}{m.property.title}
                    </div>
                  )}
                  <p className="text-sm mt-2 whitespace-pre-wrap">{m.body}</p>
                </div>
                <div className="min-w-[180px]">
                  <Select value={m.status} onValueChange={(v) => update.mutate({ id: m.id, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS.filter((s) => s.value !== 'todos').map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
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
