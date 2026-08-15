import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Package, Plus, RefreshCw, Search, Send } from 'lucide-react'
import { getWmpOperations, updateWmpEquipment } from '@/lib/wmp/management.functions'
import { requestWmpEquipmentReference } from '@/lib/wmp/equipment.functions'

export const Route = createFileRoute('/_authenticated/wmp/equipamentos')({ component: WmpEquipmentPage })

type Ops = Record<string, any[]>
const cents = (value: string) => Math.round(Math.max(0, Number(value.replace(',', '.')) || 0) * 100)
const brl = (value: number | null | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(value) || 0) / 100)

function WmpEquipmentPage() {
  const [data, setData] = useState<Ops>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [referenceType, setReferenceType] = useState<'MANUFACTURER' | 'MODEL'>('MODEL')
  const [referenceName, setReferenceName] = useState('')
  const [referenceManufacturer, setReferenceManufacturer] = useState('')
  const [referenceCategory, setReferenceCategory] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [requestBusy, setRequestBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await getWmpOperations({ data: {} }) as Ops)
    } catch (cause: any) {
      setError(cause?.message ?? 'Falha ao carregar o catálogo de equipamentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return (data.equipment ?? []).filter((row) => {
      if (category && row.category !== category) return false
      if (!q) return true
      return [row.name, row.code, row.manufacturer, row.model, row.owner_name]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(q))
    })
  }, [data.equipment, query, category])

  async function submitReference(event: React.FormEvent) {
    event.preventDefault()
    if (!referenceName.trim()) return
    setRequestBusy(true)
    setError(null)
    try {
      await requestWmpEquipmentReference({
        data: {
          request_type: referenceType,
          requested_name: referenceName.trim(),
          manufacturer_id: referenceType === 'MODEL' && referenceManufacturer ? referenceManufacturer : undefined,
          category: referenceType === 'MODEL' && referenceCategory ? referenceCategory : undefined,
          reference_url: referenceUrl.trim() || undefined,
        },
      })
      setReferenceName('')
      setReferenceUrl('')
      await load()
    } catch (cause: any) {
      setError(cause?.message ?? 'Não foi possível registrar a solicitação de curadoria.')
    } finally {
      setRequestBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">WMP — Wagner Miller Produções</p>
          <h1 className="text-3xl font-semibold tracking-tight">Equipamentos e locações</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Catálogo canônico com categoria, fabricante, modelo, proprietário, beneficiário, custos e valor comercial. Equipamento e mão de obra permanecem separados.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"><RefreshCw className="size-4" /> Atualizar</button>
      </header>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Equipamentos" value={data.equipment?.length ?? 0} loading={loading} />
        <Metric label="Fabricantes ativos" value={data.manufacturers?.length ?? 0} loading={loading} />
        <Metric label="Modelos ativos" value={data.models?.length ?? 0} loading={loading} />
        <Metric label="Curadorias pendentes" value={(data.referenceRequests ?? []).filter((row) => row.status === 'PENDING').length} loading={loading} />
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_320px]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por equipamento, código, fabricante, modelo ou proprietário" className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm" />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">Todas as categorias</option>
            {(data.categories ?? []).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold">Catálogo operacional</h2>
          <p className="mt-1 text-xs text-muted-foreground">Alterações são validadas no servidor contra as referências canônicas da WMP.</p>
        </div>
        {loading ? <div className="p-10 text-sm text-muted-foreground">Carregando equipamentos...</div> : rows.length === 0 ? <div className="p-10 text-sm text-muted-foreground">Nenhum equipamento corresponde aos filtros.</div> : (
          <table className="w-full min-w-[1500px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="p-3">Equipamento</th><th>Categoria</th><th>Fabricante</th><th>Modelo</th><th>Proprietário</th><th>Beneficiário</th><th>Qtd.</th><th>Custo</th><th>Locação</th><th>Status</th></tr></thead>
            <tbody>{rows.map((row) => <EquipmentRow key={row.id} row={row} data={data} onDone={load} onError={setError} />)}</tbody>
          </table>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
        <form onSubmit={submitReference} className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2"><Plus className="size-5" /><h2 className="font-semibold">Solicitar nova referência</h2></div>
          <p className="mt-1 text-xs text-muted-foreground">Quando fabricante ou modelo não existir, solicite inclusão. O item só entra no catálogo principal após curadoria.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium">Tipo<select value={referenceType} onChange={(event) => setReferenceType(event.target.value as 'MANUFACTURER' | 'MODEL')} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="MODEL">Modelo</option><option value="MANUFACTURER">Fabricante</option></select></label>
            <label className="text-xs font-medium">Nome solicitado<input required minLength={2} value={referenceName} onChange={(event) => setReferenceName(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>
            {referenceType === 'MODEL' && <>
              <label className="text-xs font-medium">Categoria<select value={referenceCategory} onChange={(event) => setReferenceCategory(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">Selecione</option>{(data.categories ?? []).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
              <label className="text-xs font-medium">Fabricante<select value={referenceManufacturer} onChange={(event) => setReferenceManufacturer(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">Selecione</option>{(data.manufacturers ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            </>}
            <label className="text-xs font-medium sm:col-span-2">URL de referência (opcional)<input type="url" value={referenceUrl} onChange={(event) => setReferenceUrl(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="https://fabricante.com/produto" /></label>
          </div>
          <button disabled={requestBusy || !referenceName.trim()} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"><Send className="size-4" /> Enviar para curadoria</button>
        </form>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-5"><h2 className="font-semibold">Fila de curadoria</h2><p className="mt-1 text-xs text-muted-foreground">Histórico de fabricantes e modelos solicitados pela gestão.</p></div>
          <div className="max-h-[420px] divide-y overflow-y-auto">{(data.referenceRequests ?? []).length === 0 ? <p className="p-5 text-sm text-muted-foreground">Nenhuma solicitação registrada.</p> : (data.referenceRequests ?? []).map((item) => <div key={item.id} className="grid gap-1 p-4 text-sm sm:grid-cols-[120px_1fr_120px]"><span className="text-xs font-medium">{item.request_type}</span><div><b>{item.requested_name}</b><div className="text-xs text-muted-foreground">{item.category || 'Sem categoria'}{item.reference_url ? ` · ${item.reference_url}` : ''}</div></div><span className="text-xs font-semibold">{item.status}</span></div>)}</div>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{loading ? '…' : value}</p></div>
}

function EquipmentRow({ row, data, onDone, onError }: { row: any; data: Ops; onDone: () => Promise<void>; onError: (value: string | null) => void }) {
  const [busy, setBusy] = useState(false)
  const models = (data.models ?? []).filter((model) => model.category === row.category && (!row.manufacturer_id || model.manufacturer_id === row.manufacturer_id))
  async function patch(value: Record<string, unknown>) {
    setBusy(true)
    onError(null)
    try {
      await updateWmpEquipment({ data: { id: row.id, ...value } as any })
      await onDone()
    } catch (cause: any) {
      onError(cause?.message ?? 'Não foi possível atualizar o equipamento.')
    } finally {
      setBusy(false)
    }
  }
  return <tr className={`border-b last:border-0 ${busy ? 'opacity-60' : ''}`}>
    <td className="p-3"><b>{row.name}</b><div className="text-xs text-muted-foreground">{row.code}</div></td>
    <td><select disabled={busy} value={row.category} onChange={(event) => void patch({ category: event.target.value, model_id: null })} className="max-w-56 rounded border bg-background px-2 py-1">{(data.categories ?? []).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></td>
    <td><select disabled={busy} value={row.manufacturer_id ?? ''} onChange={(event) => void patch({ manufacturer_id: event.target.value || null, model_id: null })} className="max-w-52 rounded border bg-background px-2 py-1"><option value="">Sem fabricante</option>{(data.manufacturers ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td>
    <td><select disabled={busy} value={row.model_id ?? ''} onChange={(event) => void patch({ model_id: event.target.value || null })} className="max-w-56 rounded border bg-background px-2 py-1"><option value="">Sem modelo</option>{models.map((item) => <option key={item.id} value={item.id}>{item.model}{item.submodel ? ` · ${item.submodel}` : ''}</option>)}</select></td>
    <td><div className="flex min-w-52 gap-2"><select disabled={busy} value={row.owner_type} onChange={(event) => void patch({ owner_type: event.target.value })} className="rounded border bg-background px-2 py-1"><option value="WMP">WMP</option><option value="DJ">DJ</option><option value="PARTNER">Parceiro</option><option value="THIRD_PARTY">Terceiro</option></select><input disabled={busy} defaultValue={row.owner_name ?? ''} placeholder="Nome" className="w-28 rounded border bg-background px-2 py-1" onBlur={(event) => void patch({ owner_name: event.target.value.trim() || null })} /></div></td>
    <td><select disabled={busy} value={row.beneficiary_kind ?? ''} onChange={(event) => void patch({ beneficiary_kind: event.target.value || null })} className="rounded border bg-background px-2 py-1"><option value="">Automático</option><option value="WMP">WMP</option><option value="DJ">DJ</option><option value="OWNER">Proprietário</option></select></td>
    <td><input disabled={busy} aria-label="Quantidade" defaultValue={row.quantity_available ?? 0} type="number" min="0" className="w-20 rounded border bg-background px-2 py-1" onBlur={(event) => void patch({ quantity_available: Number(event.target.value) })} /></td>
    <td><input disabled={busy} aria-label="Custo interno" defaultValue={((row.internal_cost_cents ?? 0) / 100).toFixed(2)} inputMode="decimal" className="w-28 rounded border bg-background px-2 py-1" title={brl(row.internal_cost_cents)} onBlur={(event) => void patch({ internal_cost_cents: cents(event.target.value) })} /></td>
    <td><input disabled={busy} aria-label="Valor de locação" defaultValue={((row.commercial_value_cents ?? 0) / 100).toFixed(2)} inputMode="decimal" className="w-28 rounded border bg-background px-2 py-1" title={brl(row.commercial_value_cents)} onBlur={(event) => void patch({ commercial_value_cents: cents(event.target.value) })} /></td>
    <td><select disabled={busy} value={row.status} onChange={(event) => void patch({ status: event.target.value })} className="rounded border bg-background px-2 py-1"><option value="AVAILABLE">AVAILABLE</option><option value="UNAVAILABLE">UNAVAILABLE</option><option value="MAINTENANCE">MAINTENANCE</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></td>
  </tr>
}
