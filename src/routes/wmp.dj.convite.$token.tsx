import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, Headphones, Loader2, MapPin, XCircle } from 'lucide-react'
import { WmpShell } from '@/components/wmp/WmpShell'
import { loadPublicWmpDjInvitation, respondPublicWmpDjInvitation } from '@/lib/wmp/dj-invitations.functions'

export const Route = createFileRoute('/wmp/dj/convite/$token')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Convite DJ — WMP' }, { name: 'robots', content: 'noindex, nofollow, noarchive' }] }),
  component: DjInvitePage,
})

const money = (cents: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100)
const date = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')

function DjInvitePage() {
  const { token } = Route.useParams()
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    void (async () => {
      try {
        const row = await loadPublicWmpDjInvitation({ data: { token } })
        if (!row) setError('Este convite é inválido ou expirou. Entre em contato com a WMP para receber um novo link.')
        else setInvite(row)
      } catch (err: any) { setError(err?.message ?? 'Não foi possível carregar o convite.') }
      finally { setLoading(false) }
    })()
  }, [token])

  async function respond(decision: 'ACCEPT' | 'DECLINE') {
    setBusy(true); setError('')
    try {
      const row = await respondPublicWmpDjInvitation({ data: { token, decision, reason: decision === 'DECLINE' ? reason || undefined : undefined } })
      setResult(row)
      setInvite((current: any) => ({ ...current, status: row.status }))
    } catch (err: any) {
      const raw = String(err?.message ?? '')
      setError(raw.includes('expired_token') ? 'O prazo deste convite expirou. Fale com a WMP para verificar a disponibilidade da data.' : raw || 'Não foi possível registrar sua resposta.')
    } finally { setBusy(false) }
  }

  return <WmpShell breadcrumbs={[{ label: 'Convite DJ' }]}>
    <section className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      {loading ? <div className="flex items-center justify-center gap-2 py-20 text-sm opacity-70"><Loader2 className="size-5 animate-spin"/>Carregando convite...</div> : !invite ? <div className="wmp-surface p-8 text-center"><Headphones className="mx-auto size-10" style={{ color: 'var(--wmp-gold)' }}/><h1 className="wmp-display mt-4 text-2xl">Convite indisponível</h1><p className="mt-3 text-sm opacity-75">{error}</p></div> : <div className="space-y-5">
        <header className="wmp-surface p-6 md:p-8"><div className="flex gap-3"><Headphones className="mt-1 size-7 shrink-0" style={{ color: 'var(--wmp-gold)' }}/><div><p className="text-xs uppercase tracking-[0.14em] opacity-60">WMP — Wagner Miller Produções</p><h1 className="wmp-display mt-1 text-3xl">Olá, {invite.partner_name}</h1><p className="mt-2 text-sm opacity-75">Você recebeu um convite para verificar disponibilidade e participar deste evento.</p></div></div></header>
        <section className="wmp-surface p-6"><h2 className="wmp-display text-2xl">{invite.event_name}</h2><div className="mt-5 grid gap-4 text-sm md:grid-cols-2"><div className="flex gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0"/><div><span className="opacity-60">Data</span><div className="font-medium">{date(invite.event_date)}</div></div></div><div className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0"/><div><span className="opacity-60">Local</span><div className="font-medium">{[invite.venue_name, invite.city, invite.state].filter(Boolean).join(' · ') || 'A confirmar'}</div></div></div><div><span className="opacity-60">Cachê</span><div className="font-medium">{money(invite.fee_cents)}</div></div><div><span className="opacity-60">Prazo de resposta</span><div className="font-medium">{invite.response_deadline ? new Date(invite.response_deadline).toLocaleString('pt-BR') : 'Conforme contato WMP'}</div></div></div></section>
        <section className="wmp-surface p-6"><h2 className="font-semibold">Logística</h2><div className="mt-3 grid gap-3 text-sm md:grid-cols-2"><div><span className="opacity-60">Alimentação</span><div>{invite.meal_provided_by_contractor ? 'Fornecida pelo contratante' : `${money(invite.meal_allowance_cents)} incluídos`}</div></div><div><span className="opacity-60">Estacionamento</span><div>{invite.parking_provided_by_contractor ? 'Fornecido pelo contratante' : `${money(invite.parking_allowance_cents)} incluídos`}</div></div></div></section>

        {result || ['ACCEPTED','DECLINED','CONFIRMED','COMPLETED'].includes(invite.status) ? <div className={`rounded-xl border p-6 ${invite.status === 'DECLINED' ? 'border-muted bg-muted/40' : 'border-emerald-500/30 bg-emerald-500/10'}`}>{invite.status === 'DECLINED' ? <div className="flex gap-3"><XCircle className="size-6 shrink-0"/><div><h2 className="font-semibold">Recusa registrada</h2><p className="mt-1 text-sm">A WMP foi informada e poderá buscar outro profissional para a data.</p></div></div> : <div className="flex gap-3"><CheckCircle2 className="size-6 shrink-0"/><div><h2 className="font-semibold">Disponibilidade confirmada</h2><p className="mt-1 text-sm">Sua resposta foi registrada. A WMP continuará a operação e fará a confirmação final conforme o evento.</p></div></div>}</div> : <section className="wmp-surface p-6"><h2 className="wmp-display text-xl">Responder convite</h2><p className="mt-2 text-sm opacity-75">Sua resposta será registrada imediatamente na agenda operacional da WMP.</p><label className="mt-5 block space-y-1"><span className="text-sm font-medium">Se não puder participar, você pode informar o motivo (opcional)</span><textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2" maxLength={500}/></label>{error && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">{error}</div>}<div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={()=>void respond('ACCEPT')} className="wmp-cta disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin"/> : <CheckCircle2 className="size-4"/>}Aceitar convite</button><button type="button" disabled={busy} onClick={()=>void respond('DECLINE')} className="wmp-cta wmp-cta-outline disabled:opacity-50"><XCircle className="size-4"/>Não posso nesta data</button></div></section>}
      </div>}
    </section>
  </WmpShell>
}
