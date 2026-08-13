import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getWmpProposal, sendWmpProposal } from '@/lib/wmp/proposals.functions'

export const Route = createFileRoute('/_authenticated/wmp/propostas/$id')({ component: Page })

function money(cents: unknown) { return (Number(cents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function Page() {
  const { id } = Route.useParams()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function load() { try { setData(await getWmpProposal({ data: { proposal_id: id } })); setError('') } catch (e: any) { setError(e?.message ?? 'Falha ao carregar proposta.') } }
  useEffect(() => { void load() }, [id])

  async function send() { setBusy(true); setMessage(''); try { const r: any = await sendWmpProposal({ data: { proposal_id: id } }); setMessage(r?.delivery?.sent > 0 ? 'Proposta enviada com sucesso.' : 'Envio registrado, aguardando confirmação do canal.'); await load() } catch (e: any) { setMessage(e?.message ?? 'Falha no envio.') } finally { setBusy(false) } }

  if (error) return <div className="mx-auto max-w-5xl p-6"><div className="rounded-lg border p-4">{error}</div></div>
  if (!data) return <div className="mx-auto max-w-5xl p-6 text-sm text-muted-foreground">Carregando proposta...</div>

  const p = data.proposal
  const client = p.client_snapshot ?? {}
  const event = p.event_snapshot ?? {}
  const commercial = p.commercial_summary ?? {}
  const canSend = !['ACCEPTED','SIGNED','WON','CANCELLED'].includes(p.status)

  return <div className="mx-auto max-w-5xl p-6 space-y-6">
    <div className="flex flex-wrap gap-2 text-sm"><a className="rounded-md border px-3 py-2" href="/wmp/propostas">Todas</a><a className="rounded-md border px-3 py-2" href="/wmp/propostas/enviadas">Enviadas</a><a className="rounded-md border px-3 py-2" href="/wmp/propostas/aceitas">Aceitas</a><a className="rounded-md border px-3 py-2" href="/wmp/propostas/nova">Nova proposta</a></div>
    <header><p className="text-sm text-muted-foreground">WMP — Wagner Miller Produções</p><h1 className="text-3xl font-semibold">{p.proposal_number}</h1><p className="mt-1">{p.title}</p></header>
    <div className="grid gap-4 md:grid-cols-3">
      <section className="rounded-xl border bg-card p-5"><p className="text-xs uppercase text-muted-foreground">Status</p><p className="mt-2 font-semibold">{p.status}</p><p className="mt-1 text-sm">Versão V{p.current_version}</p></section>
      <section className="rounded-xl border bg-card p-5"><p className="text-xs uppercase text-muted-foreground">Cliente</p><p className="mt-2 font-semibold">{client.name ?? '—'}</p><p className="text-sm">{client.email ?? '—'}</p></section>
      <section className="rounded-xl border bg-card p-5"><p className="text-xs uppercase text-muted-foreground">Valor</p><p className="mt-2 text-xl font-semibold">{money(commercial.total_cents ?? commercial.valor_total_cents)}</p></section>
    </div>
    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Evento</h2><dl className="mt-4 grid gap-3 md:grid-cols-2 text-sm"><div><dt className="text-muted-foreground">Nome</dt><dd>{event.event_name ?? event.nome ?? '—'}</dd></div><div><dt className="text-muted-foreground">Serviço</dt><dd>{event.service ?? event.servico ?? commercial.service ?? '—'}</dd></div><div><dt className="text-muted-foreground">Data</dt><dd>{event.event_date ?? event.datas ?? '—'}</dd></div><div><dt className="text-muted-foreground">Local</dt><dd>{event.location ?? event.local ?? '—'}</dd></div></dl></section>
    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Histórico de versões</h2><div className="mt-3 space-y-2">{data.versions.map((v: any)=><div key={v.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm"><span>V{v.version} · {v.status} · {v.legal_terms_version ?? 'sem versão jurídica'}</span><span>{money(v.total_cents)}</span></div>)}</div></section>
    {canSend && <div className="rounded-xl border p-5"><p className="mb-3">Enviar esta proposta para <strong>{client.email ?? 'o e-mail cadastrado'}</strong>?</p><button onClick={send} disabled={busy} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy ? 'Enviando...' : 'Enviar proposta por e-mail'}</button></div>}
    {message && <div className="rounded-lg border p-4 text-sm">{message}</div>}
  </div>
}
