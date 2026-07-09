import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { IMOVEIS, formatBRL, CIDADES, BAIRROS, type Imovel } from "@/data/garrido-imoveis";
import { Search, MapPin, BedDouble, Bath, Car, Ruler, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { GarridoBreadcrumbs, buildGarridoBreadcrumbJsonLd } from "@/components/garrido/Breadcrumbs";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  finalidade: fallback(z.string(), "").default(""),
  categoria: fallback(z.string(), "").default(""),
  cidade: fallback(z.string(), "").default(""),
  bairro: fallback(z.string(), "").default(""),
  tag: fallback(z.string(), "").default(""),
  quartos: fallback(z.number(), 0).default(0),
  vagas: fallback(z.number(), 0).default(0),
  areaMin: fallback(z.number(), 0).default(0),
  precoMax: fallback(z.number(), 0).default(0),
  ordem: fallback(z.string(), "recentes").default("recentes"),
});

export const Route = createFileRoute("/garrido/buscar")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Buscar imóveis — Imobiliária Garrido" },
      {
        name: "description",
        content:
          "Filtre imóveis por finalidade, cidade, bairro, quartos, vagas, área e preço. Curadoria Garrido para comprar, alugar, temporada, lançamentos, comercial e rural.",
      },
      { property: "og:title", content: "Buscar imóveis — Imobiliária Garrido" },
      {
        property: "og:description",
        content: "Filtre por finalidade, cidade, bairro, quartos, vagas, área e preço.",
      },
      { property: "og:url", content: "https://impulsionando.com.br/garrido/buscar" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/garrido/buscar" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          buildGarridoBreadcrumbJsonLd([
            { label: "Início", to: "/garrido" },
            { label: "Buscar imóveis" },
          ]),
        ),
      },
    ],
  }),
  component: BuscarPage,
});

function BuscarPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/garrido/buscar" });

  const [q, setQ] = useState(s.q);
  const [finalidade, setFinalidade] = useState(s.finalidade);
  const [categoria, setCategoria] = useState(s.categoria);
  const [cidade, setCidade] = useState(s.cidade);
  const [bairro, setBairro] = useState(s.bairro);
  const [tag, setTag] = useState(s.tag);
  const [quartos, setQuartos] = useState<number>(s.quartos || 0);
  const [vagas, setVagas] = useState<number>(s.vagas || 0);
  const [areaMin, setAreaMin] = useState<number>(s.areaMin || 0);
  const [precoMax, setPrecoMax] = useState<number>(s.precoMax || 0);
  const [ordem, setOrdem] = useState<string>(s.ordem);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sincroniza estado -> URL (debounced) para links compartilháveis e SEO.
  useEffect(() => {
    const t = window.setTimeout(() => {
      navigate({
        search: {
          q, finalidade, categoria, cidade, bairro, tag,
          quartos, vagas, areaMin, precoMax, ordem,
        },
        replace: true,
      });
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, finalidade, categoria, cidade, bairro, tag, quartos, vagas, areaMin, precoMax, ordem]);

  const resultados = useMemo(() => {
    let list: Imovel[] = [...IMOVEIS];
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter((i) =>
        [i.titulo, i.bairro, i.cidade, i.uf, i.cep, i.slug].some((v) => v.toLowerCase().includes(qq)),
      );
    }
    if (finalidade) list = list.filter((i) => i.finalidade.includes(finalidade as any));
    if (categoria) list = list.filter((i) => i.categoria === categoria);
    if (cidade) list = list.filter((i) => i.cidade === cidade);
    if (bairro) list = list.filter((i) => i.bairro === bairro);
    if (tag) list = list.filter((i) => i.tags.includes(tag as any));
    if (quartos > 0) list = list.filter((i) => i.quartos >= quartos);
    if (vagas > 0) list = list.filter((i) => i.vagas >= vagas);
    if (areaMin > 0) list = list.filter((i) => i.areaUtil >= areaMin);
    if (precoMax > 0)
      list = list.filter((i) => (i.precoVenda ?? i.precoAluguel ?? Infinity) <= precoMax);

    switch (ordem) {
      case "menor-preco":
        list.sort(
          (a, b) => (a.precoVenda ?? a.precoAluguel ?? Infinity) - (b.precoVenda ?? b.precoAluguel ?? Infinity),
        );
        break;
      case "maior-preco":
        list.sort((a, b) => (b.precoVenda ?? b.precoAluguel ?? 0) - (a.precoVenda ?? a.precoAluguel ?? 0));
        break;
      case "maior-area":
        list.sort((a, b) => b.areaUtil - a.areaUtil);
        break;
    }
    return list;
  }, [q, finalidade, categoria, cidade, bairro, tag, quartos, vagas, areaMin, precoMax, ordem]);

  const limparFiltros = () => {
    setQ(""); setFinalidade(""); setCategoria(""); setCidade(""); setBairro("");
    setTag(""); setQuartos(0); setVagas(0); setAreaMin(0); setPrecoMax(0); setOrdem("recentes");
  };

  return (
    <>
      <GarridoBreadcrumbs
        items={[
          { label: "Início", to: "/garrido" },
          { label: "Buscar imóveis" },
        ]}
      />

      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[color:var(--garrido-ink)]">
            Buscar imóveis
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Use os filtros para encontrar o imóvel ideal — os filtros são salvos na URL para compartilhar.
          </p>

          {/* Barra de busca livre */}
          <div className="mt-6 bg-white rounded-xl p-3 shadow-sm border border-black/5 flex flex-col md:flex-row gap-2">
            <label className="flex-1 flex items-center gap-2 bg-[color:var(--garrido-cream)] rounded-lg px-3 py-2.5">
              <Search className="h-4 w-4 text-slate-500" aria-hidden />
              <span className="sr-only">Buscar</span>
              <input
                className="flex-1 bg-transparent outline-none text-sm min-h-8"
                placeholder="Bairro, cidade, CEP ou código do imóvel"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden rounded-lg px-4 py-2.5 border border-black/10 font-semibold inline-flex items-center justify-center gap-2 min-h-11"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filtros
            </button>
          </div>

          <div className="mt-6 grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Filtros */}
            <aside
              className={
                mobileFiltersOpen
                  ? "fixed inset-0 z-50 bg-black/50 lg:static lg:bg-transparent"
                  : "hidden lg:block"
              }
              aria-label="Filtros"
            >
              <div
                className={
                  mobileFiltersOpen
                    ? "absolute right-0 top-0 h-full w-full max-w-xs bg-white p-4 overflow-y-auto lg:static lg:max-w-none lg:p-0"
                    : ""
                }
              >
                <div className="lg:sticky lg:top-24 bg-white rounded-xl border border-black/5 shadow-sm p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-[color:var(--garrido-ink)]">Filtros</h2>
                    <button
                      className="lg:hidden p-1 min-h-11 min-w-11"
                      onClick={() => setMobileFiltersOpen(false)}
                      aria-label="Fechar filtros"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  <Field label="Finalidade">
                    <select value={finalidade} onChange={(e) => setFinalidade(e.target.value)} className="input">
                      <option value="">Qualquer</option>
                      <option value="venda">Comprar</option>
                      <option value="aluguel">Alugar</option>
                      <option value="temporada">Temporada</option>
                      <option value="lancamento">Lançamentos</option>
                    </select>
                  </Field>

                  <Field label="Categoria">
                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input">
                      <option value="">Qualquer</option>
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="cobertura">Cobertura</option>
                      <option value="comercial">Comercial</option>
                      <option value="rural">Rural</option>
                      <option value="terreno">Terreno</option>
                    </select>
                  </Field>

                  <Field label="Cidade">
                    <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="input">
                      <option value="">Todas</option>
                      {CIDADES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Bairro">
                    <select value={bairro} onChange={(e) => setBairro(e.target.value)} className="input">
                      <option value="">Todos</option>
                      {BAIRROS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Diferencial">
                    <select value={tag} onChange={(e) => setTag(e.target.value)} className="input">
                      <option value="">Qualquer</option>
                      <option value="alto-padrao">Alto padrão</option>
                      <option value="vista-mar">Vista mar</option>
                      <option value="mobiliado">Mobiliado</option>
                      <option value="oportunidade">Oportunidade</option>
                      <option value="lancamento">Lançamento</option>
                    </select>
                  </Field>

                  <Field label={`Mín. quartos: ${quartos || "qualquer"}`}>
                    <input
                      type="range" min={0} max={5} value={quartos}
                      onChange={(e) => setQuartos(Number(e.target.value))}
                      className="w-full accent-[color:var(--garrido-gold)]"
                      aria-label="Mínimo de quartos"
                    />
                  </Field>

                  <Field label={`Mín. vagas: ${vagas || "qualquer"}`}>
                    <input
                      type="range" min={0} max={4} value={vagas}
                      onChange={(e) => setVagas(Number(e.target.value))}
                      className="w-full accent-[color:var(--garrido-gold)]"
                      aria-label="Mínimo de vagas"
                    />
                  </Field>

                  <Field label={`Área mínima: ${areaMin > 0 ? `${areaMin}m²` : "qualquer"}`}>
                    <input
                      type="range" min={0} max={500} step={10} value={areaMin}
                      onChange={(e) => setAreaMin(Number(e.target.value))}
                      className="w-full accent-[color:var(--garrido-gold)]"
                      aria-label="Área mínima em metros quadrados"
                    />
                  </Field>

                  <Field label={`Preço máximo: ${precoMax ? formatBRL(precoMax) : "sem limite"}`}>
                    <input
                      type="range" min={0} max={10_000_000} step={50_000} value={precoMax}
                      onChange={(e) => setPrecoMax(Number(e.target.value))}
                      className="w-full accent-[color:var(--garrido-gold)]"
                      aria-label="Preço máximo"
                    />
                  </Field>

                  <button
                    type="button" onClick={limparFiltros}
                    className="w-full text-xs text-[color:var(--garrido-ink)] font-semibold py-2.5 border border-black/10 rounded-md hover:bg-[color:var(--garrido-cream)] min-h-11"
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            </aside>

            {/* Resultados */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="text-sm text-slate-600" aria-live="polite">
                  <span className="font-semibold text-[color:var(--garrido-ink)]">
                    {resultados.length}
                  </span>{" "}
                  {resultados.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
                </div>
                <label className="text-xs flex items-center gap-2">
                  Ordenar
                  <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="input py-1.5">
                    <option value="recentes">Mais recentes</option>
                    <option value="menor-preco">Menor preço</option>
                    <option value="maior-preco">Maior preço</option>
                    <option value="maior-area">Maior área</option>
                  </select>
                </label>
              </div>

              {resultados.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-black/10">
                  <Search className="h-8 w-8 text-slate-300 mx-auto mb-3" aria-hidden />
                  <div className="font-semibold text-[color:var(--garrido-ink)]">
                    Nenhum imóvel encontrado
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Tente ampliar os filtros ou cadastre seu interesse — avisamos assim que
                    entrar um imóvel dentro do perfil.
                  </p>
                  <div className="mt-4 flex justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={limparFiltros}
                      className="rounded-md border border-black/10 text-sm font-semibold px-4 py-2 min-h-11"
                    >
                      Limpar filtros
                    </button>
                    <Link
                      to="/garrido/contato"
                      className="rounded-md bg-[color:var(--garrido-ink)] text-white text-sm font-semibold px-4 py-2 min-h-11"
                    >
                      Cadastrar interesse
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {resultados.map((i) => (
                    <Card key={i.slug} i={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <style>{`.input{width:100%;border:1px solid rgba(0,0,0,.1);border-radius:8px;padding:.55rem .7rem;font-size:.875rem;background:#fff;min-height:2.5rem;}`}</style>
      </section>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600 block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Card({ i }: { i: Imovel }) {
  const preco =
    i.precoVenda ? { label: "Venda", value: formatBRL(i.precoVenda) } :
    i.precoAluguel ? { label: "Aluguel/mês", value: formatBRL(i.precoAluguel) } :
    i.precoTemporada ? { label: "Diária", value: formatBRL(i.precoTemporada) } :
    { label: "Consulta", value: "Sob consulta" };
  return (
    <Link
      to="/garrido/imovel/$slug"
      params={{ slug: i.slug }}
      className="group bg-white rounded-xl overflow-hidden border border-black/5 hover:shadow-xl hover:-translate-y-0.5 transition"
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={i.fotos[0]}
          alt={i.titulo}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <span className="absolute top-3 left-3 rounded-md bg-white/95 text-[color:var(--garrido-ink)] text-[10px] uppercase tracking-wider px-2 py-1 font-bold shadow-sm">
          {i.finalidade[0] === "venda"
            ? "Venda"
            : i.finalidade[0] === "aluguel"
            ? "Aluguel"
            : i.finalidade[0] === "temporada"
            ? "Temporada"
            : "Lançamento"}
        </span>
      </div>
      <div className="p-4">
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden /> {i.bairro} · {i.cidade}/{i.uf}
        </div>
        <h3 className="font-semibold text-[color:var(--garrido-ink)] mt-1 line-clamp-2">{i.titulo}</h3>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
          {i.quartos > 0 && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" aria-hidden /> {i.quartos}Q
            </span>
          )}
          {i.banheiros > 0 && (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" aria-hidden /> {i.banheiros}
            </span>
          )}
          {i.vagas > 0 && (
            <span className="inline-flex items-center gap-1">
              <Car className="h-3.5 w-3.5" aria-hidden /> {i.vagas}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" aria-hidden /> {i.areaUtil}m²
          </span>
        </div>
        <div className="mt-3 border-t pt-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{preco.label}</div>
            <div className="font-bold text-[color:var(--garrido-ink)]">{preco.value}</div>
          </div>
          <span className="text-xs font-semibold text-[color:var(--garrido-gold)] group-hover:translate-x-1 transition inline-flex items-center gap-1">
            Ver <ArrowRight className="h-3 w-3" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
