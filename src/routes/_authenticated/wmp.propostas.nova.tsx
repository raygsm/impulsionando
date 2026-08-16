import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { createWmpProposalDraft, listWmpServices, sendWmpProposal } from '@/lib/wmp/proposals.functions'
import { getWmpCorporateProposalPrefill, markWmpCorporateDateQuoted } from '@/lib/wmp/corporate-proposal.functions'

export const Route = createFileRoute('/_authenticated/wmp/propostas/nova')({ component: Page })

type Service = { code: string; name: string; description: string | null }

const moneyToCents = (value: string) => Math.max(0, Math.round((Number(value.replace(',', '.')) || 0) * 100))
const centsToMoney = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)

function Page() {
  const [services, setServices] = useState<Service[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [service, setService] = useState('DJ')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [audience, setAudience] = useState('')
  const [value, setValue] = useState('')
  const [internalCost, setInternalCost] = useState('')
  const [otherOperationalCost, setOtherOperationalCost] = useState('')
  const [djCount, setDjCount] = useState('0')
  const [foodProvided, setFoodProvided] = useState(false)
  const [parkingProvided, setParkingProvided] = useState(false)
  const [proposal, setProposal] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [prefillBusy, setPrefillBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [briefingDateId, setBriefingDateId] = useState<string | null>(null)
  const [briefingId, setBriefingId] = useState<string | null>(null)

  useEffect(() => {
    listWmpServices().then((rows: any) => {
      setServices(rows)
      if (rows?.[0]?.code) setService(rows[0].code)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = new URLSearchParams(window.location.search).get('briefing_date_id')
    if (!id) return
    setBriefingDateId(id)
    setPrefillBusy(true)
    setMessage('')
    void getWmpCorporateProposalPrefill({ data: { briefing_date_id: id } })
      .then((prefill: any) => {
        setBriefingId(prefill.briefing_id)
        setName(prefill.client?.company || prefill.client?.name || '')
        setEmail(prefill.client?.email || '')
        setPhone(prefill.client?.phone || '')
        setDocument(prefill.client?.document || '')
        setEventName(prefill.client?.company ? `${prefill.client.company} — ${prefill.event?.type || 'Evento'}` : (prefill.event?.type || 'Evento WMP'))
        setEventDate(prefill.event?.event_date || '')
        setLocation([prefill.event?.venue_name, prefill.event?.venue_address, prefill.event?.venue_bairro, prefill.event?.venue_city, prefill.event?.venue_state].filter(Boolean).join(' · '))
        setAudience(prefill.event?.audience ? String(prefill.event.audience) : '')
        setMessage('Dados carregados da agenda corporativa. Revise serviço, escopo, preço e custos antes de salvar a proposta preliminar.')
      })
      .catch((err: any) => setMessage(err?.message ?? 'Não foi possível carregar os dados da agenda corporativa.'))
      .finally(() => setPrefillBusy(false))
  }, [])

  const financials = useMemo(() => {
    const total = moneyToCents(value)
    const internal = moneyToCents(internalCost)
    const djQty = Math.max(0, Math.floor(Number(djCount) || 0))
    const food = foodProvided ? 0 : djQty * 5000
    const parking = parkingProvided ? 0 : djQty * 5000
    const miscOperational = moneyToCents(otherOperationalCost)
    const operational = food + parking + miscOperational
    const grossMarginPct = total > 0 ? ((total - internal) / total) * 100 : 0
    const netMarginPct = total > 0 ? ((total - internal - operational) / total) * 100 : 0
    const ok = total > 0 && grossMarginPct >= 10 && netMarginPct >= 15
    return { total, internal, food, parking, miscOperational, operational, grossMarginPct, netMarginPct, ok, djQty }
  }, [value, internalCost, otherOperationalCost, djCount, foodProvided, parkingProvided])

  async function createProposal(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (financials.total <= 0) throw new Error('Informe um valor total maior que zero.')
      const row: any = await createWmpProposalDraft({ data: {
        title: `${eventName} — ${name}`,
        briefing_id: briefingId || undefined,
        client_snapshot: { name, email, phone: phone || null, document: document || null },
        event_snapshot: {
          event_name: eventName,
          service,
          event_date: eventDate || null,
          location: location || null,
          audience: audience ? Number(audience) : null,
          briefing_date_id: briefingDateId,
        },
        commercial_summary: {
          service,
          total_cents: financials.total,
          subtotal_cents: financials.total,
          internal_cost_cents: financials.internal,
          operational_cost_cents: financials.operational,
          dj_count: financials.djQty,
          dj_food_allowance_cents: financials.food,
          dj_parking_allowance_cents: financials.parking,
          other_operational_cost_cents: financials.miscOperational,
          contractor_provides_food: foodProvided,
          contractor_provides_parking: parkingProvided,
          gross_margin_pct_preview: Number(financials.grossMarginPct.toFixed(2)),
          net_operating_margin_pct_preview: Number(financials.netMarginPct.toFixed(2)),
        },
      } })
      setProposal(row)
      if (briefingDateId) {
        await markWmpCorporateDateQuoted({ data: { briefing_date_id: briefingDateId, proposal_id: row.id } })
      }
      if (!financials.ok) {
        setMessage('Proposta salva, porém bloqueada para envio: ajuste os valores até atingir pelo menos 10% de margem bruta e 15% de margem líquida operacional.')
      } else if (briefingDateId) {
        setMessage('Proposta preliminar criada e a data corporativa foi marcada como QUOTED.')
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'Não foi possível gerar a proposta.')
    } finally {
      setBusy(false)
    }
  }

  async function sendNow() {
    setBusy(true)
    setMessage('')
    try {
      const result: any = await sendWmpProposal({ data: { proposal_id: proposal.id } })
      setMessage(result?.delivery?.sent > 0 ? 'Proposta enviada com sucesso.' : 'Proposta registrada para envio. O canal de entrega ainda não confirmou o disparo.')
    } catch (err: any) {
      const raw = String(err?.message ?? '')
      setMessage(raw.includes('wmp_margin_guardrail_failed')
        ? 'Envio bloqueado pela proteção de margem da WMP. Revise preço, custos internos e custos operacionais.'
        : raw || 'Falha ao enviar a proposta.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="mx-auto max-w-5xl space-y-6 p-6">
    <div className="flex flex-wrap gap-2 text-sm"><a className="rounded-md border px-3 py-2" href="/wmp/propostas">Todas</a><a className="rounded-md border px-3 py-2" href="/wmp/propostas/enviadas">Enviadas</a><a className="rounded-md border px-3 py-2" href="/wmp/propostas/aceitas">Aceitas</a>{briefingDateId&&<a className="rounded-md border px-3 py-2" href="/wmp/operacao?area=agenda">Voltar à agenda</a>}</div>
    <div><p className="text-sm text-muted-foreground">WMP — Wagner Miller Produções</p><h1 className="text-3xl font-semibold">Nova proposta comercial preliminar</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Primeiro registre serviço, data e preço. O contrato formal só avança depois do aceite comercial. A proteção financeira bloqueia propostas abaixo de 10% de margem bruta ou 15% de margem líquida operacional.</p></div>

    {prefillBusy&&<div className="flex items-center gap-2 rounded-lg border p-4 text-sm"><Loader2 className="size-4 animate-spin"/>Carregando dados da agenda corporativa...</div>}

    {!proposal ? <form onSubmit={createProposal} className="grid gap-4 rounded-xl border bg-card p-6 md:grid-cols-2">
      <label className="space-y-1"><span className="text-sm font-medium">Potencial cliente *</span><input required value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">E-mail *</span><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">WhatsApp</span><input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">CPF/CNPJ</span><input value={document} onChange={e=>setDocument(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">Serviço *</span><select required value={service} onChange={e=>setService(e.target.value)} className="w-full rounded-md border px-3 py-2">{services.length ? services.map(s=><option key={s.code} value={s.code}>{s.name}</option>) : <option value="DJ">DJ profissional</option>}</select></label>
      <label className="space-y-1"><span className="text-sm font-medium">Evento *</span><input required value={eventName} onChange={e=>setEventName(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">Data</span><input type="date" value={eventDate} onChange={e=>setEventDate(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">Local</span><input value={location} onChange={e=>setLocation(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">Público estimado</span><input type="number" min="1" value={audience} onChange={e=>setAudience(e.target.value)} className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">Valor total ao cliente (R$) *</span><input required inputMode="decimal" value={value} onChange={e=>setValue(e.target.value)} placeholder="0,00" className="w-full rounded-md border px-3 py-2"/></label>

      <div className="md:col-span-2 mt-2 border-t pt-5"><h2 className="font-semibold">Custos e proteção de margem</h2><p className="mt-1 text-xs text-muted-foreground">Informe custos reais. Equipamentos e mão de obra devem permanecer separados nos itens da proposta; estes campos consolidam a proteção financeira.</p></div>
      <label className="space-y-1"><span className="text-sm font-medium">Custo interno total (R$)</span><input inputMode="decimal" value={internalCost} onChange={e=>setInternalCost(e.target.value)} placeholder="0,00" className="w-full rounded-md border px-3 py-2"/></label>
      <label className="space-y-1"><span className="text-sm font-medium">Outros custos operacionais (R$)</span><input inputMode="decimal" value={otherOperationalCost} onChange={e=>setOtherOperationalCost(e.target.value)} placeholder="0,00" className="w-full rounded-md border px-3 py-2"/></label>

      <div className="md:col-span-2 rounded-lg border bg-muted/30 p-4">
        <h3 className="font-medium">Logística obrigatória por DJ</h3>
        <p className="mt-1 text-xs text-muted-foreground">Padrão WMP: R$ 50 de alimentação + R$ 50 de estacionamento por DJ. Quando o contratante fornecer diretamente um item, o respectivo valor é deduzido.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="space-y-1"><span className="text-sm">Quantidade de DJs</span><input type="number" min="0" value={djCount} onChange={e=>setDjCount(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2"/></label>
          <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={foodProvided} onChange={e=>setFoodProvided(e.target.checked)}/>Contratante fornece alimentação</label>
          <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={parkingProvided} onChange={e=>setParkingProvided(e.target.checked)}/>Contratante fornece estacionamento</label>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Alimentação: {centsToMoney(financials.food)} · Estacionamento: {centsToMoney(financials.parking)} · Custo operacional total: {centsToMoney(financials.operational)}</div>
      </div>

      <div className={`md:col-span-2 rounded-lg border p-4 ${financials.ok ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
        <div className="flex items-start gap-3">
          {financials.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0"/> : <AlertTriangle className="mt-0.5 size-5 shrink-0"/>}
          <div><p className="font-medium">{financials.ok ? 'Margens dentro da política WMP' : 'Atenção à proteção de margem'}</p><p className="mt-1 text-sm">Margem bruta: <strong>{financials.grossMarginPct.toFixed(2)}%</strong> (mínimo 10%) · Margem líquida operacional: <strong>{financials.netMarginPct.toFixed(2)}%</strong> (mínimo 15%).</p><p className="mt-1 text-xs text-muted-foreground">A proposta pode ser salva para revisão, mas o banco bloqueia o envio quando os limites mínimos não forem atendidos.</p></div>
        </div>
      </div>

      <div className="md:col-span-2 flex justify-end"><button disabled={busy || prefillBusy || financials.total <= 0} className="rounded-md bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50">{busy ? 'Gerando...' : 'Salvar proposta preliminar'}</button></div>
    </form> : <div className="space-y-4 rounded-xl border bg-card p-6">
      <div><p className="text-sm text-muted-foreground">Proposta gerada</p><p className="font-mono text-lg font-semibold">{proposal.proposal_number}</p><p className="text-sm">Status: {proposal.status}</p></div>
      <div className={`rounded-lg border p-4 ${financials.ok ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}><p className="font-medium">Margem bruta {financials.grossMarginPct.toFixed(2)}% · líquida operacional {financials.netMarginPct.toFixed(2)}%</p>{!financials.ok && <p className="mt-1 text-sm">O envio está bloqueado até os custos/preço serem revisados em uma nova versão.</p>}</div>
      <p>Deseja enviar imediatamente esta proposta comercial preliminar para <strong>{email}</strong>?</p>
      <div className="flex flex-wrap gap-3"><button disabled={busy || !financials.ok} onClick={sendNow} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy ? 'Enviando...' : 'Sim, enviar por e-mail'}</button><a href="/wmp/propostas" className="rounded-md border px-4 py-2">Agora não</a></div>
    </div>}
    {message && <div className="rounded-lg border p-4 text-sm">{message}</div>}
  </div>
}
