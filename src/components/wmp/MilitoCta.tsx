import { Sparkles, Camera, FileText } from 'lucide-react'

export function MilitoCta() {
  return (
    <section className="wmp-surface mx-auto w-full max-w-full overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
        <Sparkles className="size-7 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <h2 className="wmp-display break-words text-xl leading-tight sm:text-2xl md:text-3xl">Conte seu evento ao Millito</h2>
            <p className="max-w-3xl break-words text-sm leading-6 opacity-80 sm:text-base sm:leading-7">
              Envie informações e fotos do local. O Millito qualifica o evento, interpreta ambiente e materiais, sugere um setup com nível de confiança e prepara sua proposta para revisão.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 text-xs opacity-80 sm:flex sm:flex-wrap">
            <span className="wmp-chip min-h-10 min-w-0 justify-center sm:justify-start"><Camera className="size-3 shrink-0" />Analisar local</span>
            <span className="wmp-chip min-h-10 min-w-0 justify-center sm:justify-start"><Sparkles className="size-3 shrink-0" />Sugerir setup</span>
            <span className="wmp-chip min-h-10 min-w-0 justify-center sm:justify-start"><FileText className="size-3 shrink-0" />Preparar proposta</span>
          </div>
          <a href="/wmp/orcamento" className="wmp-cta inline-flex min-h-12 w-full items-center justify-center px-4 py-3 text-center sm:w-auto">
            Quero montar meu evento com o Millito
          </a>
        </div>
      </div>
    </section>
  )
}
