import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createWmpProposalDraft, listWmpServices, sendWmpProposal } from '@/lib/wmp/proposals.functions'

export const Route = createFileRoute('/_authenticated/wmp/propostas/nova')({ component: Page })

type Service = { code: string; name: string; description: string | null }

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
  const [proposal, setProposal] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { listWmpServices().then((rows: any) => { setServices(rows); if (rows?.[0]?.code) setService(rows[0].code) }).catch(() => {}) }, [])

  async function createProposal(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    try {
      const cents = value ? Math.round(Number(value.replace(',','.')) * 100) : 0
      const row = await createWmpProposalDraft({ data: {
        title: `${eventName} — ${name}`,
        client_snapshot: { name, email, phone: phone || null, document: document || null },
        event_snapshot: { event_name: eventName, service, event_date: eventDate || null, location: location || null, audience: audience ? Number(audience) : null },
        commercial_summary: { service, total_cents: cents, subtotal_cents: cents },
      } })
      setProposal(row)
    } catch (err: any) { setMessage(err?.message ?? 'Não foi possível gerar a proposta.') }
    finally { setBusy(false) }
  }

  async function sendNow() {
    setBusy(true); setMessage('')
    try {
      const result: any = await sendWmpProposal({ data: { proposal_id: proposal.id } })
      setMessage(result?.delivery?.sent > 0 ? 'Proposta enviada com sucesso.' : 'Proposta registrada para envio. O canal de entrega ainda não confirmou o disparo.')
    } catch (err: any) { setMessage(err?.message ?? 'Falha ao enviar a proposta.') }
    finally { setBusy(false) }
  }

  return <div className="mx-auto max-w-4xl p-6 space-y-6">
    <div className="flex flex-wrap gap-2 text-sm"><a className="rounded-md border px-3 py-2" href="/wmp/propostas">Todas</a><a className="rounded-md border px-3 py-2" href="/wmp/propostas/enviadas">Enviadas</a><a className="rounded-md border px-3 py-2" href="/wmp/propostas/aceitas">Aceitas</a></div>
    <div><p className="text-sm text-muted-foreground">WMP — Wagner Miller Produções</p><h1 className="text-3xl font-semibold">Nova proposta</h1><p className="mt-1 text-sm text-muted-foreground">Cadastre o potencial cliente, o evento, o serviço e o valor. O CRM é criado automaticamente.</p></div>
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
      <label className="space-y-1"><span className="text-sm font-medium">Valor total (R$)</span><input inputMode="decimal" value={value} onChange={e=>setValue(e.target.value)} placeholder="0,00" className="w-full rounded-md border px-3 py-2"/></label>
      <div className="md:col-span-2 flex justify-end"><button disabled={busy} className="rounded-md bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50">{busy ? 'Gerando...' : 'Gerar proposta'}</button></div>
    </form> : <div className="rounded-xl border bg-card p-6 space-y-4">
      <div><p className="text-sm text-muted-foreground">Proposta gerada</p><p className="font-mono text-lg font-semibold">{proposal.proposal_number}</p><p className="text-sm">Status: {proposal.status}</p></div>
      <p>Deseja enviar imediatamente esta proposta para <strong>{email}</strong>?</p>
      <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={sendNow} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy ? 'Enviando...' : 'Sim, enviar por e-mail'}</button><a href="/wmp/propostas" className="rounded-md border px-4 py-2">Agora não</a></div>
    </div>}
    {message && <div className="rounded-lg border p-4 text-sm">{message}</div>}
  </div>
}
