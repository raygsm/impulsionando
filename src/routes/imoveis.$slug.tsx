/**
 * Public real-estate vitrine: listagem da imobiliária pelo slug público.
 *
 * Rota: /imoveis/$slug
 *
 * - Lista de imóveis ativos/publicados/aprovados da imobiliária
 * - Filtros (operação, tipo, cidade, quartos, preço, texto livre)
 * - CTA "Cadastrar minha busca" -> /api/public/realestate/saved-search
 * - Tela de sucesso / erro consistente após envio
 */
import { createFileRoute, Link, useSearch, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { listPublicProperties } from '@/lib/realestate-public.functions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Bed, Bath, Car, Ruler, MapPin, Search } from 'lucide-react'

const SearchSchema = z.object({
  operation: z.enum(['venda', 'locacao', 'venda_ou_locacao']).optional(),
  city: z.string().optional(),
  q: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(6).max(48).default(12),
  sort: z.enum(['recent', 'price_asc', 'price_desc']).default('recent'),
})

export const Route = createFileRoute('/imoveis/$slug')({
  validateSearch: (s) => SearchSchema.parse(s),
  head: ({ params }) => ({
    meta: [
      { title: `Imóveis disponíveis — ${params.slug}` },
      { name: 'description', content: 'Veja imóveis disponíveis para venda e locação. Cadastre sua busca e seja avisado de novidades.' },
    ],
  }),
  component: VitrinePage,
})

function brl(n?: number | null) {
  if (!n) return null
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function firstPhoto(photos: any): string | null {
  if (!photos) return null
  const arr = Array.isArray(photos) ? photos : []
  if (!arr.length) return null
  const p = arr[0]
  if (typeof p === 'string') return p
  if (p && typeof p === 'object') return p.url ?? p.src ?? p.path ?? null
  return null
}

function VitrinePage() {
  const { slug } = Route.useParams()
  const search = useSearch({ from: '/imoveis/$slug' })
  const navigate = useNavigate({ from: '/imoveis/$slug' })
  const fetchList = useServerFn(listPublicProperties)
  const operation = search.operation ?? 'venda_ou_locacao'
  const q = search.q ?? ''
  const city = search.city ?? ''
  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 12
  const sort = search.sort ?? 'recent'

  function update(next: Partial<typeof search> & { resetPage?: boolean }) {
    const { resetPage, ...patch } = next as any
    navigate({
      search: (prev: any) => ({ ...prev, ...patch, ...(resetPage ? { page: 1 } : {}) }),
      replace: true,
    })
  }

  const queryArgs = useMemo(
    () => ({ slug, operation: operation as any, city: city || undefined, q: q || undefined, page, pageSize, sort }),
    [slug, operation, city, q, page, pageSize, sort],
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vitrine-public', queryArgs],
    queryFn: () => fetchList({ data: queryArgs }),
  })

  const company = data?.company
  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (!isLoading && !company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold">Vitrine não encontrada</h1>
        <p className="text-muted-foreground">A imobiliária <strong>{slug}</strong> não está disponível.</p>
        <Link to="/" className="text-primary underline">Voltar à página inicial</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{company?.name ?? 'Imóveis disponíveis'}</h1>
            <p className="text-sm text-muted-foreground">Encontre seu próximo imóvel ou cadastre sua busca.</p>
          </div>
          <SavedSearchDialog slug={slug} companyName={company?.name ?? ''} />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-6">
        <Card className="p-4 mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs">Operação</Label>
            <Select value={operation} onValueChange={(v) => { setOperation(v); setPage(1) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="venda_ou_locacao">Todos</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="locacao">Locação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cidade</Label>
            <Input value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }} placeholder="Ex.: São Paulo" />
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs">Buscar</Label>
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Título, bairro, código..." />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => setPage(1)}><Search className="h-4 w-4 mr-2" />Filtrar</Button>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando imóveis...
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-destructive">Erro ao carregar imóveis. Tente novamente.</div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            Nenhum imóvel encontrado com esses filtros.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p: any) => {
                const photo = firstPhoto(p.photos)
                const price = p.operation === 'locacao' ? brl(p.rent_price) : brl(p.sale_price ?? p.rent_price)
                return (
                  <Link
                    key={p.id}
                    to="/imoveis/$slug/$propertyId"
                    params={{ slug, propertyId: p.id }}
                    className="block group"
                  >
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                      <div className="aspect-[4/3] bg-muted relative">
                        {photo ? (
                          <img src={photo} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem foto</div>
                        )}
                        <Badge className="absolute top-2 left-2 bg-primary/90">
                          {p.operation === 'locacao' ? 'Locação' : p.operation === 'venda' ? 'Venda' : 'Disponível'}
                        </Badge>
                      </div>
                      <div className="p-3 space-y-1">
                        <h3 className="font-medium line-clamp-1 group-hover:text-primary">{p.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {p.neighborhood ? `${p.neighborhood}, ` : ''}{p.city ?? '—'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                          {p.bedrooms ? <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.bedrooms}</span> : null}
                          {p.bathrooms ? <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.bathrooms}</span> : null}
                          {p.parking_spots ? <span className="flex items-center gap-1"><Car className="h-3 w-3" />{p.parking_spots}</span> : null}
                          {p.area_useful ? <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{p.area_useful}m²</span> : null}
                        </div>
                        <div className="pt-2 font-semibold">{price ?? 'Consulte'}</div>
                        {p.reference_code ? <div className="text-[10px] text-muted-foreground">Ref. {p.reference_code}</div> : null}
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-muted-foreground">
                Mostrando {rows.length} de {total} imóveis · Página {page}/{totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CTA: cadastrar busca (modal + sucesso/erro)
// ---------------------------------------------------------------------------

function SavedSearchDialog({ slug, companyName }: { slug: string; companyName: string }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ matchesCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    contactName: '', contactEmail: '', contactPhone: '',
    operation: 'venda' as 'venda' | 'locacao' | 'venda_ou_locacao',
    city: '', neighborhood: '', priceMax: '', bedroomsMin: '0', notes: '', hp: '',
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/public/realestate/saved-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companySlug: slug,
          contactName: form.contactName,
          contactEmail: form.contactEmail || undefined,
          contactPhone: form.contactPhone || undefined,
          operation: form.operation,
          cities: form.city ? [form.city] : [],
          neighborhoods: form.neighborhood ? [form.neighborhood] : [],
          priceMax: form.priceMax ? Number(form.priceMax) : null,
          bedroomsMin: Number(form.bedroomsMin || 0),
          notes: form.notes || undefined,
          source: 'vitrine.saved-search',
          hp: form.hp,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.message || body?.error || 'Erro ao enviar')
      setSuccess({ matchesCount: body.matchesCount ?? 0 })
    } catch (err: any) {
      setError(err?.message ?? 'Erro inesperado. Tente novamente.')
    } finally { setSubmitting(false) }
  }

  function reset() {
    setSuccess(null); setError(null)
    setForm({ contactName: '', contactEmail: '', contactPhone: '', operation: 'venda',
      city: '', neighborhood: '', priceMax: '', bedroomsMin: '0', notes: '', hp: '' })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild><Button>Cadastrar minha busca</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        {success ? (
          <div className="space-y-3 text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">✓</div>
            <DialogHeader>
              <DialogTitle>Busca cadastrada!</DialogTitle>
              <DialogDescription>
                Encontramos <strong>{success.matchesCount}</strong> imóveis compatíveis no estoque.
                A equipe da {companyName} foi notificada e entrará em contato.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setOpen(false)} className="w-full">Fechar</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <DialogHeader>
              <DialogTitle>Cadastrar minha busca</DialogTitle>
              <DialogDescription>Receba avisos quando novos imóveis combinarem com seu perfil.</DialogDescription>
            </DialogHeader>
            <input type="text" name="hp" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />
            <div className="grid gap-2">
              <Label htmlFor="ss-name">Nome *</Label>
              <Input id="ss-name" required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label htmlFor="ss-email">E-mail</Label><Input id="ss-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="ss-phone">Telefone/WhatsApp</Label><Input id="ss-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Operação</Label>
                <Select value={form.operation} onValueChange={(v) => setForm({ ...form, operation: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="venda_ou_locacao">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Quartos mín.</Label><Input type="number" min={0} value={form.bedroomsMin} onChange={(e) => setForm({ ...form, bedroomsMin: e.target.value })} /></div>
              <div className="space-y-1"><Label>Preço máx.</Label><Input type="number" min={0} value={form.priceMax} onChange={(e) => setForm({ ...form, priceMax: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-1"><Label>Bairro</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            {error && <div className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</div>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cadastrar busca
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">Ao enviar você concorda em receber comunicações da {companyName}.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
