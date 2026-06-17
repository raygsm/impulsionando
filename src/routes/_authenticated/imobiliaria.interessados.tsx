import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { listVitrineInterests, updateVitrineInterest, exportVitrineDataset } from '@/lib/realestate-vitrine.functions'
import { listVitrineEmailLog, resendVitrineEmail } from '@/lib/realestate-vitrine-resend.functions'
import { useActiveCompany } from '@/hooks/use-active-company'
import { PageHeader, EmptyState } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Phone, Mail, MessageSquare, Home, Send, Download, FileText } from 'lucide-react'

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
  const fetchExport = useServerFn(exportVitrineDataset)
  const [status, setStatus] = useState('todos')
  const [exportStatus, setExportStatus] = useState('todos')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [emailFrom, setEmailFrom] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [exporting, setExporting] = useState<null | 'csv' | 'pdf'>(null)
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number; exportId: string | null }>({ done: 0, total: 0, exportId: null })
  const pageSize = 25
  const EXPORT_CHUNK = 1000
  const EXPORT_MAX_PAGES = 20

  async function fetchAllForExport(format: 'csv' | 'pdf') {
    if (!companyId) return null
    const exportId = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string
    setExportProgress({ done: 0, total: 0, exportId })
    const allRows: any[] = []
    let columns: { key: string; label: string }[] = []
    let total = 0
    let finished = false
    for (let p = 1; p <= EXPORT_MAX_PAGES && !finished; p++) {
      const isLastPossible = p === EXPORT_MAX_PAGES
      const r = await fetchExport({
        data: {
          companyId, dataset: 'interests', status: exportStatus, search,
          from: from || undefined, to: to || undefined,
          emailFrom: emailFrom || undefined, emailTo: emailTo || undefined,
          page: p, pageSize: EXPORT_CHUNK, exportId, format, isFinal: false,
        },
      })
      columns = r.columns
      total = r.total
      allRows.push(...r.rows)
      setExportProgress({ done: allRows.length, total: r.total, exportId })
      if (r.rows.length < EXPORT_CHUNK || isLastPossible) finished = true
    }
    // finalize log
    await fetchExport({
      data: {
        companyId, dataset: 'interests', status: exportStatus, search,
        from: from || undefined, to: to || undefined,
        emailFrom: emailFrom || undefined, emailTo: emailTo || undefined,
        page: 1, pageSize: EXPORT_CHUNK, exportId, format, isFinal: true,
      },
    }).catch(() => {/* best-effort finalize */})
    return { rows: allRows, columns, total, exportId }
  }

  async function handleExportCsv() {
    setExporting('csv')
    try {
      const r = await fetchAllForExport('csv')
      if (!r) return
      const header = r.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(';')
      const esc = (v: unknown) => { if (v == null) return ''; const s = String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
      const body = r.rows.map((row: any) => r.columns.map((c) => esc(row[c.key])).join(';')).join('\n')
      const csv = '\uFEFF' + header + '\n' + body
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `interessados-${r.exportId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`${r.rows.length} de ${r.total} registro(s) — export ${r.exportId.slice(0, 8)}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao exportar')
    } finally { setExporting(null); setExportProgress({ done: 0, total: 0, exportId: null }) }
  }

  async function handleExportPdf() {
    setExporting('pdf')
    try {
      const r = await fetchAllForExport('pdf')
      if (!r) return
      const [{ default: jsPDF }, autoTableMod] = await Promise.all([
        import('jspdf'), import('jspdf-autotable'),
      ])
      const autoTable = (autoTableMod as any).default ?? autoTableMod
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      doc.setFontSize(14)
      doc.text('Interessados da vitrine', 40, 40)
      doc.setFontSize(8)
      doc.text(`Export ID: ${r.exportId}`, 40, 54)
      doc.text(`Status: ${exportStatus} · Criação: ${from || '—'} → ${to || '—'} · E-mail: ${emailFrom || '—'} → ${emailTo || '—'} · ${r.rows.length}/${r.total} registros`, 40, 66)
      const head = [r.columns.map((c) => c.label)]
      const body = r.rows.map((row: any) => r.columns.map((c) => {
        const v = row[c.key]
        if (v == null) return ''
        const s = typeof v === 'string' ? v : String(v)
        return s.length > 80 ? s.slice(0, 77) + '…' : s
      }))
      autoTable(doc, { head, body, startY: 78, styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak' }, headStyles: { fillColor: [30, 64, 175] } })
      doc.save(`interessados-${r.exportId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success(`PDF gerado — export ${r.exportId.slice(0, 8)}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao gerar PDF')
    } finally { setExporting(null); setExportProgress({ done: 0, total: 0, exportId: null }) }
  }

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
        <div className="min-w-[150px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="min-w-[150px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Até</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Exportar (filtro)</label>
          <Select value={exportStatus} onValueChange={setExportStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="em_atendimento">Em atendimento</SelectItem>
              <SelectItem value="respondido">Respondido</SelectItem>
              <SelectItem value="convertido">Convertido</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
              <SelectItem value="enviado">E-mail enviado</SelectItem>
              <SelectItem value="falha">E-mail com falha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">{total} registro(s)</span>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!!exporting}>
            {exporting === 'csv' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={!!exporting}>
            {exporting === 'pdf' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1" />}
            PDF
          </Button>
        </div>
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
                  <ResendEmailButton companyId={companyId!} contactEmail={r.contact_email} />
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

function ResendEmailButton({ companyId, contactEmail }: { companyId: string; contactEmail?: string | null }) {
  const [open, setOpen] = useState(false)
  const fetchLogs = useServerFn(listVitrineEmailLog)
  const fetchResend = useServerFn(resendVitrineEmail)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vitrine-email-log', companyId, contactEmail, open],
    enabled: open,
    queryFn: () => fetchLogs({ data: { companyId, templatePrefix: 'realestate-vitrine-interest', limit: 20 } }),
  })
  const [busy, setBusy] = useState<string | null>(null)
  async function resend(id: string) {
    setBusy(id)
    try {
      const r = await fetchResend({ data: { companyId, emailLogId: id } })
      if (r.status === 'queued') toast.success(`E-mail reenviado para ${r.recipient}`)
      else if (r.status === 'suppressed') toast.warning(`Destinatário ${r.recipient} suprimido — registrado, não enviado.`)
      else toast.error(`Falha: ${(r as any).error}`)
      refetch()
    } catch (e: any) { toast.error(e?.message ?? 'Erro ao reenviar') }
    finally { setBusy(null) }
  }
  const filtered = contactEmail
    ? (data?.rows ?? []).filter((r: any) => r.recipient_email === contactEmail)
    : (data?.rows ?? [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Send className="h-3 w-3 mr-1" />Reenviar e-mail</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de e-mails da vitrine</DialogTitle>
          <DialogDescription>Status, supressão e reenvio — tudo é registrado em <code>email_send_log</code>.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">Nenhum e-mail registrado para este interessado.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {filtered.map((row: any) => (
              <div key={row.id} className="flex items-center justify-between border rounded p-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{row.template_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {row.recipient_email} · {new Date(row.created_at).toLocaleString('pt-BR')}
                  </div>
                  {row.error_message ? <div className="text-xs text-destructive truncate">{row.error_message}</div> : null}
                </div>
                <Badge variant="outline" className="mx-2">{row.status}</Badge>
                <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => resend(row.id)}>
                  {busy === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reenviar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
