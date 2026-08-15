import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle2, FileSignature, Loader2, ShieldCheck } from 'lucide-react'
import { WmpShell } from '@/components/wmp/WmpShell'
import { loadPublicWmpContract, signPublicWmpContract } from '@/lib/wmp/contracts.functions'

export const Route = createFileRoute('/wmp/contrato/$token')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Contrato WMP — revisão e assinatura' }, { name: 'robots', content: 'noindex, nofollow, noarchive' }] }),
  component: ContractPage,
})

function money(cents: unknown) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100)
}

function ContractPage() {
  const { token } = Route.useParams()
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const row = await loadPublicWmpContract({ data: { token } })
        if (!row) { setError('Este link de contrato é inválido, expirou ou foi cancelado.'); return }
        setContract(row)
        setName(String(row.client?.name ?? row.client?.razao_social ?? ''))
        setSigned(row.status === 'SIGNED')
      } catch (err: any) {
        setError(err?.message ?? 'Não foi possível carregar o contrato.')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  async function sign() {
    if (!accepted || name.trim().length < 3) return
    setSigning(true); setError('')
    try {
      const result: any = await signPublicWmpContract({ data: { token, signer_name: name, signer_document: document || undefined, user_agent: navigator.userAgent } })
      if (result?.ok) { setSigned(true); setContract((current: any) => ({ ...current, status: 'SIGNED', signed_at: result.signed_at })) }
      else setError('A assinatura não foi concluída.')
    } catch (err: any) {
      const raw = String(err?.message ?? '')
      setError(raw.includes('expired_token') ? 'O link de assinatura expirou. Solicite um novo link à WMP.' : raw || 'Não foi possível assinar o contrato.')
    } finally { setSigning(false) }
  }

  return <WmpShell breadcrumbs={[{ label: 'Contrato' }]}>
    <section className="mx-auto max-w-4xl px-5 py-12 md:py-16">
      {loading ? <div className="flex items-center justify-center gap-2 py-20 text-sm opacity-70"><Loader2 className="size-5 animate-spin"/>Carregando contrato...</div> : error && !contract ? <div className="wmp-surface p-8 text-center"><ShieldCheck className="mx-auto size-9" style={{ color: 'var(--wmp-gold)' }}/><h1 className="wmp-display mt-4 text-2xl">Contrato indisponível</h1><p className="mt-3 text-sm opacity-75">{error}</p></div> : contract ? <div className="space-y-6">
        <header className="wmp-surface p-6 md:p-8">
          <div className="flex items-start gap-3"><FileSignature className="mt-1 size-7 shrink-0" style={{ color: 'var(--wmp-gold)' }}/><div><p className="text-xs uppercase tracking-[0.14em] opacity-60">WMP — Wagner Miller Produções</p><h1 className="wmp-display mt-1 text-3xl">Contrato {contract.contract_number}</h1><p className="mt-2 text-sm opacity-70">Revise integralmente as condições abaixo antes de assinar.</p></div></div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="wmp-surface p-5"><p className="text-xs uppercase tracking-wide opacity-60">Contratante</p><p className="mt-2 font-semibold">{contract.client?.name ?? contract.client?.razao_social ?? 'Cliente'}</p><p className="text-sm opacity-70">{contract.client?.email ?? ''}</p></div>
          <div className="wmp-surface p-5"><p className="text-xs uppercase tracking-wide opacity-60">Evento</p><p className="mt-2 font-semibold">{contract.event?.event_name ?? contract.event?.evento_tipo ?? 'Evento WMP'}</p><p className="text-sm opacity-70">{contract.event?.event_date ?? contract.event?.evento_data ?? 'Data conforme proposta'}{contract.event?.location ? ` · ${contract.event.location}` : ''}</p></div>
        </section>

        <section className="wmp-surface p-6"><h2 className="wmp-display text-xl">Condição comercial aceita</h2><div className="mt-4 grid gap-3 text-sm md:grid-cols-2"><div><span className="opacity-60">Serviço</span><div className="font-medium">{contract.commercial?.service ?? contract.commercial?.servico ?? 'Conforme proposta'}</div></div><div><span className="opacity-60">Valor</span><div className="font-medium">{money(contract.commercial?.total_cents ?? contract.commercial?.valor_total_cents)}</div></div></div></section>

        <section className="space-y-3">
          {(contract.clauses ?? []).map((clause: any, index: number) => <article key={`${clause.clause_key}-${clause.version}-${index}`} className="wmp-surface p-6"><div className="text-xs font-medium uppercase tracking-wide opacity-55">Cláusula {index + 1} · versão {clause.version}</div><h2 className="wmp-display mt-2 text-xl">{clause.title}</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 opacity-85">{clause.body}</div></article>)}
        </section>

        {signed ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6"><div className="flex gap-3"><CheckCircle2 className="size-6 shrink-0"/><div><h2 className="font-semibold">Contrato assinado</h2><p className="mt-1 text-sm">A assinatura foi registrada com data, contrato e evidência de aceite. A WMP dará continuidade à operação do evento.</p></div></div></div> : <section className="wmp-surface p-6 md:p-8"><h2 className="wmp-display text-2xl">Assinatura eletrônica</h2><p className="mt-2 text-sm opacity-75">Ao confirmar, você declara que leu as condições apresentadas nesta página e manifesta concordância expressa com este contrato.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="space-y-1"><span className="text-sm font-medium">Nome completo do signatário *</span><input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2"/></label><label className="space-y-1"><span className="text-sm font-medium">CPF/CNPJ do signatário</span><input value={document} onChange={e=>setDocument(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2"/></label></div><label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} className="mt-1"/><span>Li integralmente o contrato exibido acima e concordo expressamente com suas condições.</span></label>{error && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">{error}</div>}<button type="button" disabled={!accepted || name.trim().length < 3 || signing} onClick={()=>void sign()} className="wmp-cta mt-6 disabled:opacity-50">{signing ? <><Loader2 className="size-4 animate-spin"/>Registrando...</> : <><FileSignature className="size-4"/>Assinar contrato</>}</button></section>}
      </div> : null}
    </section>
  </WmpShell>
}
