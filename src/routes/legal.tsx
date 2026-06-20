// Página pública /legal — Termos, Privacidade, NDA, Contrato B2B, Cookies, DPA.
import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Doc = { id: string; kind: string; title: string; body_md: string; version: string; effective_at: string }

const KINDS = [
  { v: 'terms', l: 'Termos de Uso' },
  { v: 'privacy', l: 'Privacidade (LGPD)' },
  { v: 'nda', l: 'NDA' },
  { v: 'contract_b2b', l: 'Contrato B2B' },
  { v: 'cookies', l: 'Cookies' },
  { v: 'dpa', l: 'DPA' },
]

export const Route = createFileRoute('/legal')({
  component: LegalPage,
  head: () => ({
    meta: [
      { title: 'Documentos Legais — Impulsionando' },
      { name: 'description', content: 'Termos de Uso, Política de Privacidade (LGPD), NDA, Contrato B2B, Cookies e DPA do ecossistema Impulsionando.' },
      { property: 'og:title', content: 'Documentos Legais — Impulsionando' },
      { property: 'og:description', content: 'Transparência total: todos os documentos legais do ecossistema.' },
    ],
  }),
})

function LegalPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('eco_legal_documents')
        .select('id, kind, title, body_md, version, effective_at')
        .eq('is_current', true)
        .is('niche', null)
        .order('kind')
      setDocs((data ?? []) as any)
      setLoading(false)
    })()
  }, [])

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">Documentos Legais</h1>
        <p className="text-sm text-muted-foreground">
          Estes documentos regem a relação entre a Impulsionando, seus tenants (empresas), prestadores
          e consumidores finais. Versões atuais sempre disponíveis aqui.
        </p>
      </header>

      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
        <Tabs defaultValue="terms">
          <TabsList className="flex-wrap h-auto">
            {KINDS.map((k) => <TabsTrigger key={k.v} value={k.v}>{k.l}</TabsTrigger>)}
          </TabsList>
          {KINDS.map((k) => {
            const doc = docs.find((d) => d.kind === k.v)
            return (
              <TabsContent key={k.v} value={k.v}>
                <Card>
                  <CardHeader>
                    <CardTitle>{doc?.title ?? k.l}</CardTitle>
                    {doc && <p className="text-xs text-muted-foreground">Versão {doc.version} · vigente desde {new Date(doc.effective_at).toLocaleDateString('pt-BR')}</p>}
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{doc?.body_md ?? 'Documento não encontrado.'}</pre>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      <footer className="mt-12 text-xs text-muted-foreground space-y-1">
        <p>Contato do Encarregado de Dados (DPO): dpo@impulsionando.com.br</p>
        <p>Aceite eletrônico com valor jurídico — MP 2.200-2/2001 e Lei 14.063/2020.</p>
      </footer>
    </div>
  )
}
