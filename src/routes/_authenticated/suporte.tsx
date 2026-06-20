import { createFileRoute } from '@tanstack/react-router'
import { SupportPage } from '@/components/support/SupportPage'
import { reportError } from '@/lib/report-error'

export const Route = createFileRoute('/_authenticated/suporte')({
  component: () => <SupportPage audience="customer" />,
  head: () => ({ meta: [{ title: 'Suporte — Impulsionando' }] }),
  errorComponent: ({ error }) => {
    reportError(error, { route: 'suporte' })
    return <div className="p-6"><h1 className="text-xl font-semibold">Erro</h1><p className="text-sm text-muted-foreground mt-2">{String((error as Error)?.message ?? error)}</p></div>
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})
