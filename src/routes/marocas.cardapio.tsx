import { useMemo, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Search, Clock, ChevronDown, X } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { marocasCategorias, marocasItens, type MarocasCategoriaId } from "@/components/marocas/foodMenu";
import { formatBRL } from "@/components/marocas/useMarocasCart";

const CANONICAL = "/marocas/cardapio";

export const Route = createFileRoute("/marocas/cardapio")({
  validateSearch: (s: Record<string, unknown>) => ({
    cat: (s.cat as MarocasCategoriaId | undefined) ?? undefined,
    q: (s.q as string | undefined) ?? undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cardápio — Marocas" },
      { name: "description", content: "Explore o cardápio Marocas: entradas, hambúrgueres, pizzas, pratos, bebidas e sobremesas. Peça delivery, retirada ou no salão." },
      { property: "og:title", content: "Cardápio — Marocas" },
      { property: "og:description", content: "Explore o cardápio Marocas e peça em 2 cliques." },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: CardapioPage,
});

function CardapioPage() {
  const { cat, q } = useSearch({ from: "/marocas/cardapio" });
  const [busca, setBusca] = useState(q ?? "");
  const [filtro, setFiltro] = useState<MarocasCategoriaId | "todos">(cat ?? "todos");
  const [ordem, setOrdem] = useState<"padrao" | "preco-asc" | "preco-desc" | "rapido">("padrao");

  const itens = useMemo(() => {
    let base = marocasItens.slice();
    if (filtro !== "todos") base = base.filter((i) => i.categoria === filtro);
    if (busca.trim()) {
      const t = busca.toLowerCase();
      base = base.filter((i) => i.nome.toLowerCase().includes(t) || i.descricao.toLowerCase().includes(t));
    }
    if (ordem === "preco-asc") base.sort((a, b) => a.precoBase - b.precoBase);
    if (ordem === "preco-desc") base.sort((a, b) => b.precoBase - a.precoBase);
    if (ordem === "rapido") base.sort((a, b) => a.tempoPreparoMin - b.tempoPreparoMin);
    return base;
  }, [filtro, busca, ordem]);

  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Cardápio" }]}>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Cardápio</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {itens.length} {itens.length === 1 ? "item" : "itens"} disponíveis agora
            </p>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar prato, ingrediente..."
              inputMode="search"
              className="w-full sm:w-80 rounded-lg border pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Buscar no cardápio"
            />
            {busca && (
              <button onClick={() => setBusca("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1" aria-label="Limpar busca">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filtros categoria */}
        <div className="mt-6 -mx-4 md:mx-0 overflow-x-auto">
          <div className="flex gap-2 px-4 md:px-0 pb-2">
            <button
              onClick={() => setFiltro("todos")}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm border ${filtro === "todos" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
              aria-pressed={filtro === "todos"}
            >
              Todos
            </button>
            {marocasCategorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setFiltro(c.id)}
                aria-pressed={filtro === c.id}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm border flex items-center gap-1.5 ${filtro === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
              >
                <span>{c.emoji}</span> {c.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Ordenar */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <label htmlFor="ordem" className="text-muted-foreground">Ordenar por</label>
          <div className="relative">
            <select
              id="ordem"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as typeof ordem)}
              className="appearance-none rounded-md border pl-3 pr-8 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="padrao">Recomendados</option>
              <option value="preco-asc">Menor preço</option>
              <option value="preco-desc">Maior preço</option>
              <option value="rapido">Preparo mais rápido</option>
            </select>
            <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Grid */}
        {itens.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed p-10 text-center">
            <p className="font-semibold">Nada encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente outra categoria ou remova a busca.
            </p>
            <button
              onClick={() => {
                setBusca("");
                setFiltro("todos");
              }}
              className="mt-4 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {itens.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/marocas/cardapio/$slug"
                  params={{ slug: item.slug }}
                  className={`group rounded-2xl border overflow-hidden bg-card block hover:shadow-md transition ${!item.disponivel ? "opacity-60" : ""}`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    {!item.disponivel && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="rounded-md bg-background text-foreground px-3 py-1 text-xs font-semibold">
                          Esgotado hoje
                        </span>
                      </div>
                    )}
                    {item.tags?.[0] && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {item.tags[0].replace("-", " ")}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold">{item.nome}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-8">{item.descricao}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold">{formatBRL(item.precoBase)}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.tempoPreparoMin} min
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MarocasShell>
  );
}
