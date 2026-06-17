/**
 * Public real-estate vitrine: ficha do imóvel.
 *
 * Rota: /imoveis/$slug/$propertyId
 *
 * - Fotos, descrição, características
 * - CTA "Tenho interesse" -> /api/public/realestate/interest
 * - Tela de sucesso / erro consistente
 */
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getPublicProperty } from '@/lib/realestate-public.functions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Bed, Bath, Car, Ruler, MapPin } from 'lucide-react'

export const Route = createFileRoute('/imoveis/$slug/$propertyId')({
  head: ({ params }) => ({
    meta: [
      { title: `Imóvel — ${params.propertyId.slice(0, 8)}` },
      { name: 'description', content: 'Detalhes do imóvel disponível para venda ou locação.' },
    ],
  }),
  component: PropertyPage,
})

function brl(n?: number | null) {
  if (!n) return null
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function photosOf(photos: any): string[] {
  if (!Array.isArray(photos)) return []
  return photos
    .map((p) => (typeof p === 'string' ? p : p?.url ?? p?.src ?? p?.path))
    .filter(Boolean) as string[]
}

function PropertyPage() {
  const { slug, propertyId } = Route.useParams()
  const fetchDetail = useServerFn(getPublicProperty)
  const { data, isLoading } = useQuery({
    queryKey: ['vitrine-public-property', slug, propertyId],
    queryFn: () => fetchDetail({ data: { slug, propertyId } }),
  })

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }
  const company = data?.company
  const property = data?.property as any
  if (!company || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold">Imóvel não encontrado</h1>
        <p className="text-muted-foreground">O imóvel pode ter sido removido ou está indisponível.</p>
        <Link to="/imoveis/$slug" params={{ slug }} className="text-primary underline">Ver outros imóveis</Link>
      </div>
    )
  }

  const photos = photosOf(property.photos)
  const price = property.operation === 'locacao' ? brl(property.rent_price) : brl(property.sale_price ?? property.rent_price)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/imoveis/$slug" params={{ slug }} className="text-sm text-primary hover:underline">← Voltar à vitrine</Link>
          <span className="text-sm text-muted-foreground">{company.name}</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2 aspect-video bg-muted rounded-lg overflow-hidden">
            {photos[0]
              ? <img src={photos[0]} alt={property.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem foto</div>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {photos.slice(1, 5).map((url, idx) => (
              <div key={idx} className="aspect-video bg-muted rounded overflow-hidden">
                <img src={url} alt={`Foto ${idx + 2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <Badge className="mb-2">{property.operation === 'locacao' ? 'Locação' : 'Venda'}</Badge>
              <h1 className="text-2xl font-semibold">{property.title}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {property.address_line ? `${property.address_line}, ` : ''}{property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city ?? ''} {property.state ?? ''}
              </p>
              {property.reference_code && <p className="text-xs text-muted-foreground mt-1">Referência: {property.reference_code}</p>}
            </div>

            <Card className="p-4 flex flex-wrap gap-4 text-sm">
              {property.bedrooms ? <span className="flex items-center gap-1"><Bed className="h-4 w-4 text-muted-foreground" />{property.bedrooms} quartos</span> : null}
              {property.bathrooms ? <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-muted-foreground" />{property.bathrooms} banheiros</span> : null}
              {property.parking_spots ? <span className="flex items-center gap-1"><Car className="h-4 w-4 text-muted-foreground" />{property.parking_spots} vagas</span> : null}
              {property.area_useful ? <span className="flex items-center gap-1"><Ruler className="h-4 w-4 text-muted-foreground" />{property.area_useful}m² úteis</span> : null}
              {property.area_total ? <span className="flex items-center gap-1"><Ruler className="h-4 w-4 text-muted-foreground" />{property.area_total}m² totais</span> : null}
            </Card>

            {property.description && (
              <Card className="p-4">
                <h2 className="font-medium mb-2">Descrição</h2>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{property.description}</p>
              </Card>
            )}
          </div>

          <aside className="space-y-3">
            <Card className="p-4 sticky top-4">
              <div className="text-2xl font-semibold">{price ?? 'Consulte'}</div>
              {property.condo_fee ? <div className="text-xs text-muted-foreground">Condomínio: {brl(property.condo_fee)}</div> : null}
              {property.iptu ? <div className="text-xs text-muted-foreground">IPTU: {brl(property.iptu)}</div> : null}
              <div className="mt-4 grid gap-2">
                <InterestDialog slug={slug} propertyId={propertyId} propertyTitle={property.title} companyName={company.name} kind="interesse" />
                <InterestDialog slug={slug} propertyId={propertyId} propertyTitle={property.title} companyName={company.name} kind="visita" variant="outline" />
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  )
}

function InterestDialog({
  slug, propertyId, propertyTitle, companyName, kind, variant,
}: {
  slug: string; propertyId: string; propertyTitle: string; companyName: string
  kind: 'interesse' | 'visita' | 'avaliacao' | 'contato' | 'proposta'
  variant?: 'default' | 'outline'
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    contactName: '', contactEmail: '', contactPhone: '', message: '', selectedKind: kind, hp: '',
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/public/realestate/interest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companySlug: slug,
          propertyId,
          kind: form.selectedKind,
          contactName: form.contactName,
          contactEmail: form.contactEmail || undefined,
          contactPhone: form.contactPhone || undefined,
          message: form.message || undefined,
          source: 'vitrine.property-detail',
          hp: form.hp,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.message || body?.error || 'Erro ao enviar')
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message ?? 'Erro inesperado. Tente novamente.')
    } finally { setSubmitting(false) }
  }

  function reset() {
    setSuccess(false); setError(null)
    setForm({ contactName: '', contactEmail: '', contactPhone: '', message: '', selectedKind: kind, hp: '' })
  }

  const ctaLabel =
    kind === 'visita' ? 'Agendar visita' :
    kind === 'avaliacao' ? 'Solicitar avaliação' :
    'Tenho interesse'

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild><Button variant={variant ?? 'default'}>{ctaLabel}</Button></DialogTrigger>
      <DialogContent>
        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">✓</div>
            <DialogHeader>
              <DialogTitle>Solicitação enviada!</DialogTitle>
              <DialogDescription>
                Recebemos sua manifestação de interesse em <strong>{propertyTitle}</strong>.
                A equipe da {companyName} entrará em contato em breve.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setOpen(false)} className="w-full">Fechar</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <DialogHeader>
              <DialogTitle>{ctaLabel}</DialogTitle>
              <DialogDescription>Sobre o imóvel: <strong>{propertyTitle}</strong></DialogDescription>
            </DialogHeader>
            <input type="text" name="hp" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />
            <div className="space-y-1"><Label>Nome *</Label><Input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
              <div className="space-y-1"><Label>Telefone/WhatsApp</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            </div>
            <div className="space-y-1">
              <Label>Tipo de contato</Label>
              <Select value={form.selectedKind} onValueChange={(v) => setForm({ ...form, selectedKind: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="interesse">Tenho interesse</SelectItem>
                  <SelectItem value="visita">Quero agendar visita</SelectItem>
                  <SelectItem value="avaliacao">Avaliação</SelectItem>
                  <SelectItem value="contato">Solicitar contato</SelectItem>
                  <SelectItem value="proposta">Fazer proposta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Mensagem</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            {error && <div className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</div>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">Informe e-mail ou telefone para que a imobiliária possa responder.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
