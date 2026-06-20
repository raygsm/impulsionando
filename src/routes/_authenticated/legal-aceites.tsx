// Histórico de aceites legais do usuário — direito de portabilidade LGPD.
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { Suspense } from 'react'
import { myLegalAcceptances } from '@/lib/legal-acceptance.functions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { reportError } from '@/lib/report-error'

export const Route = createFileRoute('/_authenticated/legal-aceites')({
  component: () => (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Carregando…</div>}>
      <Page />
    </Suspense>
  ),
  head: () => ({ meta: [{ title: 'Meus Aceites Legais — Impulsionando' }] }),
  errorComponent: ({ error }) => {
    reportError(error, { route: 'legal-aceites' })
    return <div className="p-6">Erro: {String((error as Error)?.message ?? error)}</div>
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})

const q = (fn: () => Promise<any[]>) => queryOptions({ queryKey: ['my-acceptances'], queryFn: fn })

function Page() {
  const fetcher = useServerFn(myLegalAcceptances)
  const { data: rows } = useSuspenseQuery(q(() => fetcher({ data: undefined as any })))

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'meus-aceites.json'; a.click()
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Meus Aceites Legais</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de cada documento que você aceitou, com hash, IP e versão — exigência LGPD.
          </p>
        </div>
        <Button variant="outline" onClick={exportJson}>Exportar (LGPD)</Button>
      </header>
      <Card>
        <CardHeader><CardTitle>{rows.length} aceite(s) registrado(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum aceite ainda.</TableCell></TableRow>
              )}
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.document_kind}</TableCell>
                  <TableCell>{r.document_version}</TableCell>
                  <TableCell>{r.context}</TableCell>
                  <TableCell>{new Date(r.accepted_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{String(r.document_hash).slice(0, 12)}…</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
