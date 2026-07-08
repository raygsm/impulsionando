import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Clock, Users, Flame, Leaf, WheatOff, Bike, Store, UtensilsCrossed, ShieldCheck, Plus, Minus } from "lucide-react";
import { getProduto, FOOD_PRODUTOS, formatBRL } from "@/data/foodservice-menu";

export const Route = createFileRoute("/foodservice/produto/$slug")({
  loader: ({ params }) => {
    const produto = getProduto(params.slug);
    if (!produto) throw notFound();
    return { produto };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Item não encontrado" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.produto;
    const url = `https://impulsionando.com.br/foodservice/produto/${params.slug}`;
    return {
      meta: [
        { title: `${p.nome} — Casa Impulsiona` },
        { name: "description", content: p.descricao },
        { property: "og:title", content: p.nome },
        { property: "og:description", content: p.descricao },
        { property: "og:image", content: p.imagem },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MenuItem",
          name: p.nome, description: p.descricao, image: p.imagem,
          offers: { "@type": "Offer", price: p.preco, priceCurrency: "BRL", availability: p.disponivel ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
          nutrition: p.calorias ? { "@type": "NutritionInformation", calories: `${p.calorias} kcal` } : undefined,
          suitableForDiet: p.dieta?.map((d) => `https://schema.org/${d === "vegano" ? "VeganDiet" : d === "vegetariano" ? "VegetarianDiet" : d === "sem-gluten" ? "GlutenFreeDiet" : "LowFatDiet"}`),
        }),
      }],
    };
  },
  notFoundComponent: NotFoundProduto,
  component: ProdutoPage,
});

function NotFoundProduto() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-bold">Item não encontrado</h1>
      <p className="text-black/60 mt-3">Esse prato pode ter saído do cardápio.</p>
      <Link to="/foodservice/cardapio" className="mt-6 inline-flex items-center gap-2 bg-[color:var(--fs-brick)] text-white px-5 py-3 rounded-md font-semibold">
        Ver cardápio
      </Link>
    </div>
  );
}

function ProdutoPage() {
  const { produto: p } = Route.useLoaderData();
  const [qtd, setQtd] = useState(1);
  const [adicionais, setAdicionais] = useState<Set<string>>(new Set());

  const totalAdicionais = (p.adicionais ?? [])
    .filter((a: { nome: string; preco: number }) => adicionais.has(a.nome))
    .reduce((s: number, a: { nome: string; preco: number }) => s + a.preco, 0);
  const total = (p.preco + totalAdicionais) * qtd;

  const relacionados = FOOD_PRODUTOS.filter((r) => r.slug !== p.slug && (r.categoria === p.categoria || p.harmonizacao?.includes(r.slug))).slice(0, 4);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Link to="/foodservice/cardapio" className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-[color:var(--fs-brick)]">
          <ArrowLeft className="h-4 w-4" /> Voltar ao cardápio
        </Link>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-10">
        <div className="rounded-2xl overflow-hidden bg-white border border-black/5">
          <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover aspect-square" />
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {p.maisPedido && <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--fs-amber)]/10 text-[color:var(--fs-amber)] text-xs font-bold px-3 py-1"><Flame className="h-3 w-3" /> Mais pedido</span>}
            {p.novo && <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">Novo</span>}
            {p.dieta?.includes("vegetariano") && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1"><Leaf className="h-3 w-3" /> Vegetariano</span>}
            {p.dieta?.includes("vegano") && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1"><Leaf className="h-3 w-3" /> Vegano</span>}
            {p.dieta?.includes("sem-gluten") && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold px-3 py-1"><WheatOff className="h-3 w-3" /> Sem glúten</span>}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold mt-3">{p.nome}</h1>
          <p className="text-black/70 mt-3">{p.descricaoLonga ?? p.descricao}</p>

          <div className="mt-5 flex flex-wrap gap-5 text-sm text-black/70">
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {p.tempoPreparo}</span>
            {p.serve && <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> Serve {p.serve}</span>}
            {p.calorias && <span>{p.calorias} kcal</span>}
          </div>

          <div className="mt-6 rounded-xl bg-white border border-black/5 p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[color:var(--fs-brick)]">{formatBRL(p.preco)}</span>
              <span className="text-sm text-black/50">unidade</span>
            </div>

            {p.adicionais && p.adicionais.length > 0 && (
              <div className="mt-5">
                <div className="text-sm font-semibold mb-2">Adicionais</div>
                <div className="space-y-2">
                  {p.adicionais.map((a: { nome: string; preco: number }) => (
                    <label key={a.nome} className="flex items-center justify-between gap-3 text-sm cursor-pointer p-2 rounded hover:bg-black/5">
                      <span className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={adicionais.has(a.nome)}
                          onChange={() => {
                            const next = new Set(adicionais);
                            if (next.has(a.nome)) next.delete(a.nome);
                            else next.add(a.nome);
                            setAdicionais(next);
                          }}
                          className="h-4 w-4 accent-[color:var(--fs-brick)]"
                        />
                        {a.nome}
                      </span>
                      <span className="font-semibold">{a.preco > 0 ? `+ ${formatBRL(a.preco)}` : "Grátis"}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-md border border-black/10">
                <button type="button" aria-label="Diminuir" onClick={() => setQtd(Math.max(1, qtd - 1))} className="p-2 hover:bg-black/5">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold">{qtd}</span>
                <button type="button" aria-label="Aumentar" onClick={() => setQtd(qtd + 1)} className="p-2 hover:bg-black/5">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Link
                to="/foodservice/delivery"
                className="flex-1 text-center inline-flex items-center justify-center gap-2 bg-[color:var(--fs-amber)] text-white px-5 py-3 rounded-md font-semibold hover:opacity-90"
              >
                Adicionar · {formatBRL(total)}
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-black/60">
              {p.canaisDisponiveis.includes("delivery") && <span className="inline-flex items-center gap-1"><Bike className="h-3 w-3" /> Delivery</span>}
              {p.canaisDisponiveis.includes("retirada") && <span className="inline-flex items-center gap-1"><Store className="h-3 w-3" /> Retirada</span>}
              {p.canaisDisponiveis.includes("salao") && <span className="inline-flex items-center gap-1"><UtensilsCrossed className="h-3 w-3" /> Salão</span>}
            </div>
          </div>

          {p.ingredientes && (
            <div className="mt-6">
              <div className="text-sm font-semibold">Ingredientes</div>
              <div className="text-sm text-black/70 mt-1">{p.ingredientes.join(" · ")}</div>
            </div>
          )}

          {p.alergenos && (
            <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <ShieldCheck className="inline h-4 w-4 mr-1" />
              Contém alérgenos: {p.alergenos.join(", ")}. Em caso de restrição, informe o atendimento.
            </div>
          )}
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="bg-white border-t border-black/5">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="font-serif text-2xl font-bold">Combina com este prato</h2>
            <p className="text-sm text-black/60 mt-1">Sugestões do Impulsionito com base em harmonização e categoria.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {relacionados.map((r) => (
                <Link
                  key={r.slug}
                  to="/foodservice/produto/$slug"
                  params={{ slug: r.slug }}
                  className="group rounded-lg overflow-hidden bg-[color:var(--fs-cream)] border border-black/5 hover:shadow-lg transition"
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={r.imagem} alt={r.nome} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold line-clamp-2 group-hover:text-[color:var(--fs-brick)]">{r.nome}</div>
                    <div className="text-sm font-bold text-[color:var(--fs-brick)] mt-1">{formatBRL(r.preco)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
