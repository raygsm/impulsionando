import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Copy, Clock, Users, Flame } from "lucide-react";
import { FOOD_PROMOCOES, FOOD_COMBOS, formatBRL, getProduto } from "@/data/foodservice-menu";

export const Route = createFileRoute("/foodservice/promocoes")({
  head: () => ({
    meta: [
      { title: "Promoções, Combos e Happy Hour — Casa Impulsiona" },
      { name: "description", content: "Combos, happy hour, primeira compra, indique amigo, cupom aniversariante e mais. Todas as ofertas ativas da Casa Impulsiona." },
      { property: "og:title", content: "Promoções e Combos — Casa Impulsiona" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice/promocoes" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice/promocoes" }],
  }),
  component: PromocoesPage,
});

function PromocoesPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-[color:var(--fs-brick)] to-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Ofertas ativas</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2">Promoções, combos e happy hour</h1>
          <p className="mt-3 text-white/85 max-w-2xl">
            Ofertas rotativas atualizadas em tempo real. Cupons, primeira compra, happy hour
            e o Domingo em Família — tudo integrado ao seu programa de fidelidade Impulsionando.
          </p>
        </div>
      </section>

      {/* Combos */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="font-serif text-3xl font-bold">Combos</h2>
        <p className="text-sm text-black/60 mt-1">Escolha o combo perfeito e economize.</p>
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {FOOD_COMBOS.map((c) => {
            const desconto = Math.round(((c.precoOriginal - c.preco) / c.precoOriginal) * 100);
            return (
              <div key={c.slug} className="group rounded-2xl overflow-hidden bg-white border border-black/5 hover:shadow-xl transition grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto overflow-hidden">
                  <img src={c.imagem} alt={c.nome} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                </div>
                <div className="p-6">
                  {c.destaque && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--fs-amber)]/10 text-[color:var(--fs-amber)] text-xs font-bold px-3 py-1">
                      <Flame className="h-3 w-3" /> Destaque
                    </span>
                  )}
                  <h3 className="font-serif font-bold text-xl mt-2">{c.nome}</h3>
                  <p className="text-sm text-black/70 mt-2">{c.descricao}</p>
                  <div className="mt-3 text-xs text-black/60 space-y-1">
                    {c.itens.map((slug) => {
                      const p = getProduto(slug);
                      return p ? <div key={slug}>· {p.nome}</div> : null;
                    })}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-2xl font-bold text-[color:var(--fs-brick)]">{formatBRL(c.preco)}</span>
                    <span className="text-sm text-black/40 line-through">{formatBRL(c.precoOriginal)}</span>
                    <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-100 rounded px-2 py-0.5">-{desconto}%</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-black/60">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.serve}</span>
                  </div>
                  <Link to="/foodservice/delivery" className="mt-5 inline-flex items-center justify-center gap-2 w-full bg-[color:var(--fs-amber)] text-white px-5 py-2.5 rounded-md font-semibold hover:opacity-90">
                    Pedir combo
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Promoções */}
      <section className="bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <h2 className="font-serif text-3xl font-bold">Ofertas e cupons</h2>
          <p className="text-sm text-black/60 mt-1">Aplicados automaticamente no carrinho ou com código.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {FOOD_PROMOCOES.map((p) => (
              <div key={p.slug} className={`rounded-xl p-6 border-2 ${p.destaque ? "border-dashed border-[color:var(--fs-amber)] bg-[color:var(--fs-cream)]" : "border-black/5 bg-white"}`}>
                <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--fs-amber)] font-bold">
                  <Gift className="h-3 w-3" /> {tipoLabel(p.tipo)}
                </div>
                <h3 className="font-serif font-bold text-lg mt-2">{p.titulo}</h3>
                <p className="text-sm text-black/70 mt-2">{p.chamada}</p>
                <p className="text-xs text-black/50 mt-2">{p.descricao}</p>

                {p.desconto && (
                  <div className="mt-4 text-lg font-bold text-[color:var(--fs-brick)]">{p.desconto}</div>
                )}
                {p.codigo && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(p.codigo!)}
                    className="mt-3 w-full inline-flex items-center justify-between gap-2 rounded-md border border-dashed border-[color:var(--fs-amber)] px-3 py-2 text-sm hover:bg-[color:var(--fs-amber)]/10"
                  >
                    <span className="text-xs text-black/60">Copiar cupom</span>
                    <code className="font-mono font-bold text-[color:var(--fs-brick)] inline-flex items-center gap-1">
                      {p.codigo} <Copy className="h-3 w-3" />
                    </code>
                  </button>
                )}
                {p.validade && (
                  <div className="mt-3 text-xs text-black/60 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {p.validade}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14 text-center">
        <h2 className="font-serif text-2xl font-bold">Quer receber promoções antes de todo mundo?</h2>
        <p className="text-sm text-black/60 mt-2 max-w-xl mx-auto">
          Ative o programa de fidelidade Casa Impulsiona e receba cupons personalizados no WhatsApp,
          selecionados pelo Impulsionito com base no seu histórico.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/foodservice/fidelidade" className="bg-[color:var(--fs-brick)] text-white px-6 py-3 rounded-md font-semibold">Entrar no clube</Link>
          <Link to="/foodservice/cardapio" className="border border-black/10 px-6 py-3 rounded-md font-semibold hover:bg-black/5">Ver cardápio</Link>
        </div>
      </section>
    </>
  );
}

function tipoLabel(t: string) {
  const m: Record<string, string> = {
    "desconto": "Desconto",
    "cupom": "Cupom",
    "happy-hour": "Happy Hour",
    "combo": "Combo",
    "primeira-compra": "Primeira compra",
  };
  return m[t] ?? t;
}
