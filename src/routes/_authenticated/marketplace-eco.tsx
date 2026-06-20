import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { MarketplacePage } from '@/components/marketplace-eco/MarketplacePage'
import { reportError } from '@/lib/report-error'

export const Route = createFileRoute('/_authenticated/marketplace-eco')({
  component: () => (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Carregando marketplace…</div>}>
      <MarketplacePage />
    </Suspense>
  ),
  head: () => ({ meta: [{ title: 'Marketplace Interno — Impulsionando' }] }),
  errorComponent: ({ error }) => {
    reportError(error, { route: 'marketplace-eco' })
    return <div className="p-6"><h1 className="text-xl font-semibold">Erro</h1><p className="text-sm text-muted-foreground mt-2">{String((error as Error)?.message ?? error)}</p></div>
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})
