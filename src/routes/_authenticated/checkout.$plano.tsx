/**
 * Paid checkout — Pix manual com identificação por centavos únicos.
 *
 * Quando o Mercado Pago for habilitado em /finance/integracoes, esta página
 * passará a mostrar também o card transparente do MP acima do Pix manual.
 * O fluxo de liberação (confirmPixCharge / webhook MP) já é o mesmo.
 */
import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { listPublicPlans } from '@/lib/contratar.functions'
import { useCurrentUser } from '@/hooks/use-current-user'
import { PixCheckoutCard } from '@/components/payments/PixCheckoutCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, Info } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/checkout/$plano')({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: 'Checkout — Impulsionando' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
})

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function CheckoutPage() {
  const { plano } = useParams({ from: '/_authenticated/checkout/$plano' })
  const fetchPlans = useServerFn(listPublicPlans)
  const { data: plans, isLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => fetchPlans(),
  })
  const { data: user } = useCurrentUser()

  const plan = plans?.find((p: any) => p.code === plano)
  const baseCents = plan
    ? Math.round(
        (Number(plan.setup_fee || 0) + Number(plan.recurring_amount || 0)) * 100,
      )
    : 0

  return (
    <main className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/minha-assinatura">
            <ArrowLeft className="w-4 h-4 mr-1" /> Minha assinatura
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary" />
          Checkout
        </h1>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Carregando plano…
          </CardContent>
        </Card>
      ) : !plan ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Plano <code>{plano}</code> não encontrado.{' '}
            <Link to="/contratar" className="underline">
              Ver planos disponíveis
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant="secondary">mensal</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded border border-border p-3">
                  <div className="text-muted-foreground text-xs">Setup</div>
                  <div className="font-semibold">{formatBRL(Number(plan.setup_fee || 0))}</div>
                </div>
                <div className="rounded border border-border p-3">
                  <div className="text-muted-foreground text-xs">Mensalidade</div>
                  <div className="font-semibold">
                    {formatBRL(Number(plan.recurring_amount || 0))}
                  </div>
                </div>
                <div className="rounded border border-primary/30 bg-primary/5 p-3">
                  <div className="text-muted-foreground text-xs">Total agora</div>
                  <div className="font-bold text-primary">{formatBRL(baseCents / 100)}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1 pt-2">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Setup + 1ª mensalidade nesta cobrança. Próximas mensalidades vencem
                conforme contrato.
              </p>
            </CardContent>
          </Card>

          <PixCheckoutCard
            planCode={plan.code}
            baseAmountCents={baseCents}
            description={`Impulsionando ${plan.code}`}
            initialPayer={{
              name: user?.user?.email ?? '',
              email: user?.user?.email ?? '',
            }}
          />

          <p className="text-center text-xs text-muted-foreground">
            Cartão / parcelado entrará em breve via Mercado Pago. Para habilitá-lo,
            acesse <Link to="/finance/integracoes" className="underline">Financeiro › Integrações</Link>.
          </p>
        </>
      )}
    </main>
  )
}
