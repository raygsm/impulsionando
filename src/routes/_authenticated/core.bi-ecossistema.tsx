import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { getEcosystemBI } from '@/lib/eco-bi.functions'
import { PageHeader, StatCard } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Store, Coins, LifeBuoy, FileSignature, ShieldCheck, Star, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/core/bi-ecossistema')({
  head: () => ({ meta: [{ title: 'BI Ecossistema — Impulsionando' }] }),
  component: Page,
})

const BRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Page() {
  const [days, setDays] = useState(30)
  const fn = useServerFn(getEcosystemBI)
  const { data, isLoading, error } = useQuery({
    queryKey: ['eco-bi', days],
    queryFn: () => fn({ data: { days } }),
    staleTime: 60_000,
  })

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="BI Ecossistema" description="Visão consolidada Impulsionando" />
        <Card className="p-6 text-sm text-destructive">
          {(error as Error).message.includes('Forbidden')
            ? 'Acesso restrito a admins do core.'
            : `Falha ao carregar: ${(error as Error).message}`}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="BI Ecossistema Impulsionando"
        description="KPIs consolidados de todos os tenants do core"
        action={
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              <TabsTrigger value="7">7d</TabsTrigger>
              <TabsTrigger value="30">30d</TabsTrigger>
              <TabsTrigger value="90">90d</TabsTrigger>
              <TabsTrigger value="365">12m</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Tenants</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Tenants ativos" value={String(data.tenants.ativos)} icon={Building2} />
              <StatCard label="Total" value={String(data.tenants.total)} icon={Building2} />
              <StatCard label="Novos no período" value={`+${data.tenants.novos}`} icon={Building2} />
              <StatCard label="Assinaturas Consumidor" value={String(data.monetizacao.assinaturasAtivas)} icon={Building2} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Marketplace Interno B2B
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="GMV" value={BRL(data.marketplace.gmvCents)} icon={Store} />
              <StatCard label="Taxa de Intermediação Digital" value={BRL(data.marketplace.feeCents)} icon={Coins} />
              <StatCard label="Contratações" value={String(data.marketplace.engagements)} icon={Store} />
              <StatCard
                label="Avaliação média"
                value={data.marketplace.ratingAvg ? data.marketplace.ratingAvg.toFixed(2) : '—'}
                icon={Star}
              />
              <StatCard label="Anúncios ativos" value={String(data.marketplace.listingsAtivos)} icon={Store} />
              <StatCard label="Solicitações novas" value={String(data.marketplace.requestsNovos)} icon={Store} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Suporte</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Tickets abertos" value={String(data.suporte.abertos)} icon={LifeBuoy} />
              <StatCard
                label="SLA estourado"
                value={String(data.suporte.slaBreaches)}
                icon={AlertTriangle}
              />
              <StatCard
                label="Resolução média"
                value={data.suporte.avgResolutionH ? `${data.suporte.avgResolutionH.toFixed(1)}h` : '—'}
                icon={LifeBuoy}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Jurídico & LGPD
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Documentos vigentes"
                value={String(data.juridico.documentosVigentes)}
                icon={FileSignature}
              />
              <StatCard label="Aceites no período" value={String(data.juridico.aceitesPeriodo)} icon={ShieldCheck} />
              <StatCard
                label="Contratos assinados"
                value={String(data.juridico.contratosAssinados)}
                icon={FileSignature}
              />
              <StatCard
                label="Consentimentos LGPD"
                value={`${data.lgpd.concedidos}/${data.lgpd.totalConsentimentos}`}
                icon={ShieldCheck}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Monetização Core
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Repasses pagos" value={BRL(data.monetizacao.payoutPagoCents)} icon={Coins} />
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            Janela: últimos {days} dias · base {new Date(data.since).toLocaleDateString('pt-BR')}
          </p>
        </>
      )}
    </div>
  )
}
