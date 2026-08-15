import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, MapPin } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { WmpShell } from '@/components/wmp/WmpShell'
import { getWhereaboutsRequest, publishWhereabouts } from '@/lib/wmp/whereabouts.server'

const loadRequest = createServerFn({ method: 'GET' })
  .inputValidator((d: { token: string }) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => getWhereaboutsRequest(data.token))

const saveWhereabouts = createServerFn({ method: 'POST' })
  .inputValidator((d: { token: string; venue_name: string; venue_address: string; start_time: string; end_time?: string }) => z.object({
    token: z.string().uuid(),
    venue_name: z.string().trim().min(2).max(160),
    venue_address: z.string().trim().min(5).max(300),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  }).parse(d))
  .handler(async ({ data }) => publishWhereabouts(data))

export const Route = createFileRoute('/wmp/onde-estou/atualizar')({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === 'string' ? search.token : '' }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ deps }) => {
    if (!deps.token) return { request: null }
    try { return { request: await loadRequest({ data: { token: deps.token } }) } }
    catch { return { request: null } }
  },
  component: UpdateWhereaboutsPage,
})

function UpdateWhereaboutsPage() {
  const { request } = Route.useLoaderData()
  const { token } = Route.useSearch()
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const dateLabel = useMemo(() => request?.publication_date ? new Date(`${request.publication_date}T12:00:00-03:00`).toLocaleDateString('pt-BR') : '', [request])

  if (!request || request.expired) {
    return <WmpShell><section className="mx-auto max-w-xl px-6 py-24"><div className="wmp-surface p-8 text-center"><h1 className="wmp-display text-2xl">Link indisponível</h1><p className="mt-3 text-sm opacity-75">Este link é inválido ou expirou. O Milito enviará um novo link na próxima atualização diária.</p></div></section></WmpShell>
  }

  if (done || request.status === 'COMPLETED') {
    return <WmpShell><section className="mx-auto max-w-xl px-6 py-24"><div className="wmp-surface p-8 text-center"><CheckCircle2 className="mx-auto size-12" style={{ color: 'var(--wmp-gold)' }} /><h1 className="wmp-display mt-4 text-2xl">Onde Estou atualizado.</h1><p className="mt-3 text-sm opacity-75">Obrigado, Wagner. O Milito já publicou a informação no site da WMP.</p></div></section></WmpShell>
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await saveWhereabouts({ data: { token, venue_name: venueName, venue_address: venueAddress, start_time: startTime, end_time: endTime || undefined } })
      setDone(true)
    } catch (e: any) {
      setError(e?.message ?? 'Não foi possível salvar. Confira os dados e tente novamente.')
    } finally { setBusy(false) }
  }

  return <WmpShell breadcrumbs={[{ label: 'Onde Estou' }, { label: 'Atualizar' }]}>
    <section className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <div className="wmp-surface p-6 md:p-8">
        <div className="mb-6"><span className="wmp-chip mb-3"><MapPin className="size-3" /> Atualização diária</span><h1 className="wmp-display text-3xl">Onde Estou — {dateLabel}</h1><p className="mt-2 text-sm opacity-75">Preencha somente o local, endereço e horário. Ao salvar, o Milito publica automaticamente no site.</p></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="mb-1 block text-sm font-medium">Nome do local *</span><input required value={venueName} onChange={e=>setVenueName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-3 text-base" placeholder="Ex.: Hotel Windsor Leme" /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Endereço *</span><input required value={venueAddress} onChange={e=>setVenueAddress(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-3 text-base" placeholder="Rua, número, bairro, cidade" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1 flex items-center gap-1 text-sm font-medium"><Clock3 className="size-4"/>Início *</span><input required type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-3 text-base" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Término</span><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-3 text-base" /></label>
          </div>
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">{error}</div>}
          <button disabled={busy} className="wmp-cta w-full justify-center disabled:opacity-60">{busy ? 'Publicando...' : 'Salvar e publicar no site'}</button>
        </form>
      </div>
    </section>
  </WmpShell>
}
