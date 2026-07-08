import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Search, Filter, Flame, Leaf, WheatOff, Milk, Clock } from "lucide-react";
import { FOOD_CATEGORIAS, FOOD_PRODUTOS, formatBRL, type FoodDiet } from "@/data/foodservice-menu";

const searchSchema = z.object({
  cat: z.string().optional(),
  q: z.string().optional(),
  dieta: z.string().optional(),
});

export const Route = createFileRoute("/foodservice/cardapio")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Cardápio Digital — Casa Impulsiona" },
      { name: "description", content: "Cardápio completo: entradas, hambúrgueres, pizzas, principais, saladas, cervejas, drinks e vinhos. Filtre por categoria, restrições alimentares e ocasião." },
      { property: "og:title", content: "Cardápio Casa Impulsiona" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice/cardapio" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice/cardapio" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Menu",
        name: "Cardápio Casa Impulsiona",
        hasMenuSection: FOOD_CATEGORIAS.map((c) => ({
          "@type": "MenuSection", name: c.nome, description: c.descricao,
        })),
      }),
    }],
  }),
  component: CardapioPage,
});

const DIETAS: { key: FoodDiet; label: string; icon: any }[] = [
  { key: "vegetariano", label: "Vegetariano", icon: Leaf },
  { key: "vegano", label: "Vegano", icon: Leaf },
  { key: "sem-gluten", label: "Sem glúten", icon: WheatOff },
  { key: "sem-lactose", label: "Sem lactose", icon: Milk },
  { key: "fit", label: "Fit", icon: Flame },
];

function CardapioPage() {
  const { cat, q, dieta } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [busca, setBusca] = useState(q ?? "");

  const filtrados = useMemo(() => {
    return FOOD_PRODUTOS.filter((p) => {
      if (cat && p.categoria !== cat) return false;
      if (dieta && !p.dieta?.includes(dieta as FoodDiet)) return false;
      if (busca && !`${p.nome} ${p.descricao}`.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [cat, dieta, busca]);

  const agrupados = useMemo(() => {
    const grupos = new Map<string, typeof FOOD_PRODUTOS>();
    for (const p of filtrados) {
      if (!grupos.has(p.categoria)) grupos.set(p.categoria, []);
      grupos.get(p.categoria)!.push(p);
    }
    return Array.from(grupos.entries()).sort(([a], [b]) => {
      const ca = FOOD_CATEGORIAS.find((c) => c.slug === a)?.ordem ?? 99;
      const cb = FOOD_CATEGORIAS.find((c) => c.slug === b)?.ordem ?? 99;
      return ca - cb;
    });
  }, [filtrados]);

  return (
    <>
      {/* Hero */}
      <section className="bg-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Cardápio digital</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2">Cardápio completo</h1>
          <p className="mt-3 text-white/80 max-w-2xl">
            {FOOD_PRODUTOS.length} itens em {FOOD_CATEGORIAS.length} categorias. Disponível no salão,
            balcão, delivery e retirada. Filtre por restrição alimentar ou busque pelo nome.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                type="search"
                placeholder="Buscar prato ou bebida..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  navigate({ search: (prev: any) => ({ ...prev, q: e.target.value || undefined }), replace: true });
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[color:var(--fs-amber)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="sticky top-[64px] z-30 bg-white/95 backdrop-blur border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto">
          <Filter className="h-4 w-4 text-black/50 shrink-0" />
          <button
            type="button"
            onClick={() => navigate({ search: (prev: any) => ({ ...prev, cat: undefined }) })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ${!cat ? "bg-[color:var(--fs-brick)] text-white" : "bg-black/5 hover:bg-black/10"}`}
          >
            Todas
          </button>
          {FOOD_CATEGORIAS.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => navigate({ search: (prev: any) => ({ ...prev, cat: c.slug }) })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ${cat === c.slug ? "bg-[color:var(--fs-brick)] text-white" : "bg-black/5 hover:bg-black/10"}`}
            >
              {c.nome}
            </button>
          ))}
          <span className="mx-2 h-4 w-px bg-black/10" aria-hidden />
          {DIETAS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => navigate({ search: (prev: any) => ({ ...prev, dieta: dieta === d.key ? undefined : d.key }) })}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ${dieta === d.key ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
            >
              <d.icon className="h-3 w-3" /> {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* Listagem */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {agrupados.length === 0 && (
          <div className="text-center py-20 text-black/50">
            Nenhum item encontrado com os filtros aplicados.
          </div>
        )}

        {agrupados.map(([catSlug, itens]) => {
          const catInfo = FOOD_CATEGORIAS.find((c) => c.slug === catSlug);
          return (
            <div key={catSlug} className="mb-12">
              <h2 className="font-serif text-2xl font-bold text-[color:var(--fs-brick)]">{catInfo?.nome}</h2>
              <p className="text-sm text-black/60">{catInfo?.descricao}</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {itens.map((p) => (
                  <Link
                    key={p.slug}
                    to="/foodservice/produto/$slug"
                    params={{ slug: p.slug }}
                    className="group flex gap-4 rounded-xl bg-white border border-black/5 p-4 hover:shadow-lg hover:border-[color:var(--fs-amber)]/40 transition"
                  >
                    <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                      <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-serif font-bold text-base leading-tight group-hover:text-[color:var(--fs-brick)]">{p.nome}</div>
                        {p.maisPedido && <Flame className="h-4 w-4 text-[color:var(--fs-amber)] shrink-0" aria-label="Mais pedido" />}
                      </div>
                      <p className="text-xs text-black/60 mt-1 line-clamp-2">{p.descricao}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-[color:var(--fs-brick)]">{formatBRL(p.preco)}</span>
                        <span className="text-[10px] text-black/50 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.tempoPreparo}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
