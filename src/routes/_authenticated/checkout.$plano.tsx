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
import { useEffect, useState } from 'react'
import { listPublicPlans } from '@/lib/contratar.functions'
import { useCurrentUser } from '@/hooks/use-current-user'
import { PixCheckoutCard } from '@/components/payments/PixCheckoutCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, Info, Package, Sparkles } from 'lucide-react'
import {
  readCheckoutCart,
  summarizeCart,
  type CheckoutCart,
} from '@/hooks/useCheckoutCart'

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

function formatBRLCents(c: number) {
  return formatBRL(c / 100)
}

function CheckoutPage() {
  const { plano } = useParams({ from: '/_authenticated/checkout/$plano' })
  const fetchPlans = useServerFn(listPublicPlans)
  const { data: plans, isLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => fetchPlans(),
  })
  const { data: user } = useCurrentUser()

  // Carrinho persistido em /planos (ou simulador) — fonte da verdade do que será cobrado.
  const [cart, setCart] = useState<CheckoutCart | null>(null)
  useEffect(() => {
    setCart(readCheckoutCart(plano as CheckoutCart['planCode']))
  }, [plano])

  const plan = plans?.find((p: any) => p.code === plano)

  // Quando há carrinho, ele dita os preços. Caso contrário, fallback ao billing_plans.
  const setupCents = cart
    ? cart.setupCents
    : plan
      ? Math.round(Number(plan.setup_fee || 0) * 100)
      : 0
  const monthlyCents = cart
    ? cart.monthlyCents
    : plan
      ? Math.round(Number(plan.recurring_amount || 0) * 100)
      : 0
  const extrasMonthlyCents = cart?.extrasMonthlyCents ?? 0
  const recurringTotalCents = monthlyCents + extrasMonthlyCents
  const firstChargeCents = setupCents + recurringTotalCents
  const summary = cart ? summarizeCart(cart) : null
  const billingLabel = cart?.billing === 'annual' ? 'anual' : 'mensal'

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
        {cart && (
          <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {cart.origin === 'simulador' || cart.origin === 'demo'
              ? 'Setup vindo da sua simulação'
              : 'Setup vindo de Planos'}
            {cart.nicho ? ` · nicho ${cart.nicho}` : ''} ·
            <Link to="/planos" className="underline ml-1">editar</Link>
          </p>
        )}
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
            <Link to="/planos" className="underline">
              Ver planos disponíveis
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{cart?.planName ?? plan.name}</CardTitle>
                <Badge variant="secondary">{billingLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded border border-border p-3">
                  <div className="text-muted-foreground text-xs">Setup (única vez)</div>
                  <div className="font-semibold">{formatBRLCents(setupCents)}</div>
                </div>
                <div className="rounded border border-border p-3">
                  <div className="text-muted-foreground text-xs">
                    Mensalidade {cart?.billing === 'annual' ? '(rate anual)' : ''}
                  </div>
                  <div className="font-semibold">{formatBRLCents(monthlyCents)}</div>
                  {extrasMonthlyCents > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      + {formatBRLCents(extrasMonthlyCents)} em módulos extras
                    </div>
                  )}
                </div>
                <div className="rounded border border-primary/30 bg-primary/5 p-3">
                  <div className="text-muted-foreground text-xs">1ª cobrança (setup + 1ª mens.)</div>
                  <div className="font-bold text-primary">{formatBRLCents(firstChargeCents)}</div>
                </div>
              </div>

              {summary && (
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                  <div>
                    <strong className="text-foreground">Ciclo {billingLabel}:</strong>{' '}
                    setup + {summary.cycleMonths} mensalidades ={' '}
                    <strong className="text-foreground">
                      {formatBRLCents(summary.cycleTotalCents)}
                    </strong>
                  </div>
                  <div>
                    Recorrência mensal contínua após o ciclo:{' '}
                    {formatBRLCents(summary.recurringMonthlyCents)}/mês
                  </div>
                </div>
              )}

              {cart && (cart.modulesIncluded.length > 0 || cart.modulesExtra.length > 0) && (
                <div className="rounded-md border border-border p-3 space-y-2">
                  <div className="text-xs font-semibold inline-flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-primary" /> Módulos contratados
                  </div>
                  {cart.modulesIncluded.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cart.modulesIncluded.map((m) => (
                        <Badge key={`inc-${m}`} variant="secondary" className="text-[10px]">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {cart.modulesExtra.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        Extras (cobrados à parte)
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cart.modulesExtra.map((m) => (
                          <Badge key={`ext-${m}`} variant="outline" className="text-[10px]">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground flex items-start gap-1 pt-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Setup + 1ª mensalidade nesta cobrança. Próximas mensalidades vencem
                conforme contrato (ciclo mínimo de 90 dias no mensal).
              </p>
            </CardContent>
          </Card>

          <PixCheckoutCard
            planCode={plan.code}
            baseAmountCents={firstChargeCents}
            description={`Impulsionando ${cart?.planName ?? plan.name} (${billingLabel})`}
            initialPayer={{
              name: user?.user?.email ?? '',
              email: user?.user?.email ?? '',
            }}
          />

          <p className="text-center text-xs text-muted-foreground">
            Pagamentos processados via <strong>Mercado Pago</strong> — PIX, cartão e boleto.
            Configurações em{" "}
            <Link to="/finance/integracoes" className="underline">
              Financeiro › Integrações
            </Link>
            .
          </p>
        </>
      )}
    </main>
  )
}
