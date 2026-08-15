import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileText, Loader2, Plus } from 'lucide-react'
import { activateWmpLegalClause, createWmpLegalClauseDraft, listWmpLegalClauses } from '@/lib/wmp/legal.functions'

export const Route = createFileRoute('/_authenticated/wmp/contratos/clausulas')({ component: LegalClausesPage })

type Clause = {
  id: string
  clause_key: string
  version: number
  title: string
  body: string
  status: string
  effective_from: string | null
  effective_until: string | null
  created_at: string
}

function LegalClausesPage() {
  const [rows, setRows] = useState<Clause[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try { setRows((await listWmpLegalClauses()) as Clause[]); setError('') }
    catch (err: any) { setError(err?.message ?? 'Não foi possível carregar as cláusulas.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const activeByKey = useMemo(() => {
    const map = new Map<string, Clause>()
    rows.filter(r => r.status === 'ACTIVE').forEach(r => map.set(r.clause_key, r))
    return map
  }, [rows])

  async function createDraft(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      await createWmpLegalClauseDraft({ data: { clause_key: key, title, body } })
      setKey(''); setTitle(''); setBody('')
      setMessage('Rascunho jurídico criado. Ele ainda NÃO participa de nenhum contrato até ser ativado explicitamente.')
      await load()
    } catch (err: any) { setError(err?.message ?? 'Não foi possível criar o rascunho.') }
    finally { setBusy(false) }
  }

  async function activate(id: string) {
    if (confirmId !== id) { setConfirmId(id); return }
    setBusy(true); setError(''); setMessage('')
    try {
      await activateWmpLegalClause({ data: { clause_id: id, confirm: true } })
      setConfirmId(null)
      setMessage('Versão ativada. A versão ativa anterior da mesma chave foi encerrada automaticamente e a ação foi auditada.')
      await load()
    } catch (err: any) { setError(err?.message ?? 'Não foi possível ativar a cláusula.') }
    finally { setBusy(false) }
  }

  return <main className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
    <header>
      <p className="text-sm text-muted-foreground">WMP — Wagner Miller Produções</p>
      <h1 className="text-3xl font-semibold tracking-tight">Cláusulas jurídicas dos contratos</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Esta área não gera texto jurídico. Ela registra, versiona e ativa somente o conteúdo revisado e aprovado pela gestão/assessoria jurídica. Contratos WMP permanecem bloqueados enquanto não houver cláusulas ativas.</p>
    </header>

    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-card p-5"><p className="text-xs uppercase text-muted-foreground">Chaves cadastradas</p><p className="mt-2 text-3xl font-semibold">{new Set(rows.map(r=>r.clause_key)).size}</p></div>
      <div className="rounded-xl border bg-card p-5"><p className="text-xs uppercase text-muted-foreground">Versões ativas</p><p className="mt-2 text-3xl font-semibold">{rows.filter(r=>r.status==='ACTIVE').length}</p></div>
      <div className={`rounded-xl border p-5 ${rows.some(r=>r.status==='ACTIVE')?'border-emerald-500/30 bg-emerald-500/10':'border-amber-500/30 bg-amber-500/10'}`}><p className="text-xs uppercase opacity-70">Situação contratual</p><p className="mt-2 font-semibold">{rows.some(r=>r.status==='ACTIVE')?'Há cláusulas ativas':'Emissão bloqueada'}</p></div>
    </div>

    <form onSubmit={createDraft} className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2"><Plus className="size-5"/><h2 className="font-semibold">Nova versão em rascunho</h2></div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1"><span className="text-sm font-medium">Chave da cláusula *</span><input required value={key} onChange={e=>setKey(e.target.value)} placeholder="ex.: cancelamento_cliente" className="w-full rounded-md border px-3 py-2"/><span className="block text-xs text-muted-foreground">Use a mesma chave para criar uma nova versão de uma cláusula existente.</span></label>
        <label className="space-y-1"><span className="text-sm font-medium">Título *</span><input required value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      </div>
      <label className="block space-y-1"><span className="text-sm font-medium">Texto jurídico aprovado *</span><textarea required minLength={20} maxLength={30000} rows={12} value={body} onChange={e=>setBody(e.target.value)} className="w-full rounded-md border px-3 py-2 font-mono text-sm"/><span className="block text-xs text-muted-foreground">Cole aqui somente a redação efetivamente revisada. O sistema não interpreta, completa ou corrige cláusulas.</span></label>
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy?<Loader2 className="size-4 animate-spin"/>:<FileText className="size-4"/>}Criar rascunho</button>
    </form>

    {error&&<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">{error}</div>}
    {message&&<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">{message}</div>}

    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="border-b p-5"><h2 className="font-semibold">Histórico versionado</h2></div>
      {loading?<div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Carregando...</div>:rows.length===0?<div className="p-6 text-sm text-muted-foreground">Nenhuma cláusula cadastrada. Por segurança, a emissão de contratos segue bloqueada.</div>:<div className="divide-y">{rows.map(row=><article key={row.id} className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{row.clause_key}</span><span className="rounded-full border px-2 py-0.5 text-xs">v{row.version}</span><span className={`rounded-full border px-2 py-0.5 text-xs ${row.status==='ACTIVE'?'border-emerald-500/30 bg-emerald-500/10':''}`}>{row.status}</span></div><h3 className="mt-2 font-semibold">{row.title}</h3><details className="mt-3"><summary className="cursor-pointer text-sm text-muted-foreground">Revisar texto completo</summary><div className="mt-3 whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-6">{row.body}</div></details><p className="mt-2 text-xs text-muted-foreground">Criada em {new Date(row.created_at).toLocaleString('pt-BR')}{row.effective_from?` · vigente desde ${new Date(row.effective_from).toLocaleString('pt-BR')}`:''}</p></div>
          <div className="shrink-0">{row.status!=='ACTIVE'&&<button type="button" disabled={busy} onClick={()=>void activate(row.id)} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${confirmId===row.id?'border-amber-500 bg-amber-500/10':''}`}>{confirmId===row.id?<><AlertTriangle className="size-4"/>Confirmar ativação</>:<><CheckCircle2 className="size-4"/>Ativar versão</>}</button>}{row.status==='ACTIVE'&&<div className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4"/>Versão vigente</div>}</div>
        </div>
        {activeByKey.get(row.clause_key)?.id===row.id&&<p className="mt-3 text-xs text-muted-foreground">Esta versão entra no snapshot de novos contratos gerados após o aceite comercial.</p>}
      </article>)}</div>}
    </section>
  </main>
}
