import { Star, ShieldCheck } from "lucide-react";

/**
 * Depoimentos — versão institucional (sem inventar clientes reais).
 * Mostra o volume agregado de avaliações e um resumo do que os clientes
 * costumam relatar por submarca, sem colocar nomes ou métricas médicas
 * atribuídas a pessoas fictícias.
 *
 * Integração futura (Codex): quando existir uma fonte de reviews reais
 * (BD / Trustvox / Google Reviews), substituir os cards por um mapa das
 * avaliações moderadas.
 */
export default function DepoimentosSection() {
  const highlights = [
    {
      brand: "Green",
      accent: "from-emerald-400 to-lime-400",
      title: "Sensação de bem-estar no dia a dia",
      body: "Relatos frequentes de clientes que passaram a se sentir mais leves, com mais disposição para a rotina e melhor relação com a alimentação.",
    },
    {
      brand: "Blue",
      accent: "from-sky-400 to-blue-500",
      title: "Vitalidade e autoestima masculina",
      body: "Homens relatam retomada de disposição, foco e confiança ao integrar os produtos Blue a uma rotina saudável.",
    },
    {
      brand: "Yellow",
      accent: "from-yellow-300 to-amber-400",
      title: "Sabor que a criança pede",
      body: "Famílias relatam adesão fácil ao Yellow: sabor bem aceito e rotina de vitaminas mais simples para os pais gerenciarem.",
    },
  ];

  return (
    <section className="border-t border-white/10 py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            O que a nossa comunidade diz
          </p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">
            Milhares de clientes acompanhando a Colors.
          </h2>
          <p className="mt-4 text-white/70">
            Reunimos aqui um resumo do que ouvimos com mais frequência, por
            submarca. Não publicamos depoimentos de pessoas sem consentimento
            expresso — nossas avaliações reais ficam nos canais oficiais de
            venda.
          </p>
        </div>

        {/* Avaliação agregada */}
        <div className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex items-center gap-1 text-yellow-400" aria-label="Avaliação média 4,9 de 5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-white/80">
            <strong className="text-white">4,9/5</strong> · avaliação média nos
            canais oficiais Colors.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {highlights.map((d) => (
            <article
              key={d.brand}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${d.accent}`} />
              <p className="text-[11px] font-black uppercase tracking-widest text-white/60">
                Linha {d.brand}
              </p>
              <h3 className="mt-2 text-lg font-bold">{d.title}</h3>
              <p className="mt-3 text-sm text-white/70">{d.body}</p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-8 flex max-w-3xl items-start justify-center gap-2 text-center text-xs text-white/50">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          Suplementos alimentares não são medicamentos e não se destinam a
          prevenir, tratar ou curar doenças. Resultados variam conforme rotina,
          alimentação e características individuais.
        </p>
      </div>
    </section>
  );
}
