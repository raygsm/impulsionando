// Marketplace Interno B2B do Ecossistema — busca + criação de pedido + indicação.
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useSuspenseQuery, queryOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ecoSearchListings, ecoCreateRequest, ecoCreateReferral,
} from '@/lib/eco-marketplace.functions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

const NICHES = [
  { v: '', l: 'Todos os nichos' },
  { v: 'juridico', l: 'Jurídico' },
  { v: 'contabil', l: 'Contábil' },
  { v: 'tecnologia', l: 'Tecnologia' },
  { v: 'marketing', l: 'Marketing' },
  { v: 'design', l: 'Design' },
  { v: 'saude', l: 'Saúde' },
  { v: 'educacao', l: 'Educação' },
  { v: 'imobiliario', l: 'Imobiliário' },
  { v: 'restaurante', l: 'Alimentação' },
  { v: 'eventos', l: 'Eventos' },
  { v: 'rh', l: 'RH e Talentos' },
  { v: 'consultoria', l: 'Consultoria' },
]

const listingsQuery = (fetcher: () => Promise<any[]>, key: string) =>
  queryOptions({ queryKey: ['eco-listings', key], queryFn: fetcher })

export function MarketplacePage() {
  const search = useServerFn(ecoSearchListings)
  const createReq = useServerFn(ecoCreateRequest)
  const refer = useServerFn(ecoCreateReferral)
  const qc = useQueryClient()

  const [query, setQuery] = useState('')
  const [niche, setNiche] = useState('')
  const filtersKey = `${query}|${niche}`

  const { data: listings } = useSuspenseQuery(
    listingsQuery(() => search({ data: { query: query || undefined, niche: niche || undefined } }), filtersKey),
  )

  const [reqOpen, setReqOpen] = useState<{ companyId: string; companyName: string } | null>(null)
  const [reqTitle, setReqTitle] = useState('')
  const [reqScope, setReqScope] = useState('')
  const [reqBudget, setReqBudget] = useState('')
  const [reqDeadline, setReqDeadline] = useState('')
  const [reqNda, setReqNda] = useState(false)

  const onCreateRequest = async () => {
    if (!reqOpen) return
    try {
      await createReq({
        data: {
          title: reqTitle,
          scope: reqScope,
          target_niche: niche || undefined,
          budget_cents: reqBudget ? Math.round(parseFloat(reqBudget) * 100) : undefined,
          deadline: reqDeadline || undefined,
          nda_required: reqNda,
          invited_providers: [],
        },
      })
      toast.success(`Pedido enviado para ${reqOpen.companyName}`)
      setReqOpen(null); setReqTitle(''); setReqScope(''); setReqBudget(''); setReqDeadline(''); setReqNda(false)
    } catch (e) {
      toast.error('Falha ao enviar pedido', { description: String((e as Error).message) })
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Marketplace Interno</h1>
        <p className="text-sm text-muted-foreground">
          Encontre e contrate empresas do ecossistema Impulsionando. Toda contratação inclui
          contrato digital e, opcionalmente, NDA — com Taxa de Intermediação Digital transparente.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
        <Input
          placeholder="Buscar por título, descrição ou tag…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); qc.invalidateQueries({ queryKey: ['eco-listings'] }) }}
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={niche}
          onChange={(e) => { setNiche(e.target.value); qc.invalidateQueries({ queryKey: ['eco-listings'] }) }}
        >
          {NICHES.map((n) => <option key={n.v} value={n.v}>{n.l}</option>)}
        </select>
      </div>

      {listings.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhuma empresa encontrada com esses filtros.
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((l: any) => {
          const company = l.companies ?? {}
          const rating = Number(company.rating_avg ?? 0)
          return (
            <Card key={l.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{l.title}</CardTitle>
                  <Badge variant="secondary">{l.niche}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{company.name ?? 'Empresa do ecossistema'}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <p className="text-sm line-clamp-3">{l.description}</p>
                {rating > 0 && (
                  <div className="text-xs text-muted-foreground" title="Avaliações visíveis apenas a membros do ecossistema">
                    ★ {rating.toFixed(1)} · {company.rating_count ?? 0} avaliações
                  </div>
                )}
                <div className="flex gap-2 flex-wrap mt-auto">
                  <Button size="sm" onClick={() => setReqOpen({ companyId: l.company_id, companyName: company.name ?? 'Empresa' })}>
                    Solicitar proposta
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      const email = window.prompt('E-mail de quem deve receber a indicação:')
                      if (!email) return
                      await refer({ data: { referred_company_id: l.company_id, target_email: email } })
                      toast.success('Indicação registrada')
                    } catch (e) { toast.error('Falha na indicação', { description: String((e as Error).message) }) }
                  }}>Indicar</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!reqOpen} onOpenChange={(o) => !o && setReqOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar proposta — {reqOpen?.companyName}</DialogTitle>
            <DialogDescription>
              Descreva o escopo. A empresa receberá seu pedido e poderá enviar uma proposta com valor e prazo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} /></div>
            <div><Label>Escopo detalhado</Label><Textarea rows={5} value={reqScope} onChange={(e) => setReqScope(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Orçamento (R$)</Label><Input type="number" value={reqBudget} onChange={(e) => setReqBudget(e.target.value)} /></div>
              <div><Label>Prazo</Label><Input type="date" value={reqDeadline} onChange={(e) => setReqDeadline(e.target.value)} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={reqNda} onCheckedChange={(v) => setReqNda(v === true)} />
              Exigir Acordo de Sigilo (NDA) antes da execução
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqOpen(null)}>Cancelar</Button>
            <Button onClick={onCreateRequest} disabled={!reqTitle || !reqScope}>Enviar pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
