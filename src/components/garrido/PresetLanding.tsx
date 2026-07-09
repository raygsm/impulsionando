/**
 * PresetLanding — Landings de finalidade/categoria da Garrido.
 *
 * Cada leaf (`/garrido/comprar`, `/garrido/alugar`, etc.) renderiza este
 * componente com um preset. Assim as landings ficam finas (~40 linhas),
 * mantendo SEO exclusivo por rota e reaproveitando a lógica de listagem.
 */
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  IMOVEIS,
  formatBRL,
  type Imovel,
  type ImovelFinalidade,
  type ImovelCategoria,
  type ImovelTag,
} from "@/data/garrido-imoveis";
import { GarridoBreadcrumbs, type Crumb } from "./Breadcrumbs";
import { MapPin, BedDouble, Bath, Car, Ruler, ArrowRight, SlidersHorizontal } from "lucide-react";

export interface PresetLandingProps {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs: Crumb[];
  filter: (i: Imovel) => boolean;
  buscarSearch: Record<string, string | number>;
  buscarLabel?: string;
  emptyMessage?: string;
  extraCta?: { to: string; label: string; secondary?: boolean }[];
}

export function PresetLanding({
  eyebrow,
  title,
  description,
  breadcrumbs,
  filter,
  buscarSearch,
  buscarLabel = "Ver todos os filtros",
  emptyMessage = "Ainda não temos imóveis publicados nesta categoria — cadastre seu interesse.",
  extraCta,
}: PresetLandingProps) {
  const lista = useMemo(() => IMOVEIS.filter(filter), [filter]);

  return (
    <>
      <GarridoBreadcrumbs items={breadcrumbs} />

      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
          {eyebrow}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[color:var(--garrido-ink)] mt-2">
          {title}
        </h1>
        <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">{description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/garrido/buscar"
            search={buscarSearch as any}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 bg-[color:var(--garrido-ink)] text-white font-bold text-sm hover:brightness-125 min-h-11"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> {buscarLabel}
          </Link>
          {extraCta?.map((cta) => (
            <Link
              key={cta.to + cta.label}
              to={cta.to}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-semibold text-sm min-h-11 ${
                cta.secondary
                  ? "border border-[color:var(--garrido-ink)]/20 hover:bg-white"
                  : "bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] hover:brightness-110"
              }`}
            >
              {cta.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-slate-600" aria-live="polite">
            <span className="font-semibold text-[color:var(--garrido-ink)]">{lista.length}</span>{" "}
            {lista.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </div>
        </div>

        {lista.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-black/10">
            <div className="font-semibold text-[color:var(--garrido-ink)]">
              Sem imóveis publicados agora
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{emptyMessage}</p>
            <Link
              to="/garrido/contato"
              className="mt-4 inline-block rounded-md bg-[color:var(--garrido-ink)] text-white text-sm font-semibold px-4 py-2 min-h-11"
            >
              Cadastrar interesse
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lista.map((i) => (
              <PresetCard key={i.slug} i={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function PresetCard({ i }: { i: Imovel }) {
  const preco =
    i.precoVenda
      ? { label: "Venda", value: formatBRL(i.precoVenda) }
      : i.precoAluguel
      ? { label: "Aluguel/mês", value: formatBRL(i.precoAluguel) }
      : i.precoTemporada
      ? { label: "Diária", value: formatBRL(i.precoTemporada) }
      : { label: "Consulta", value: "Sob consulta" };
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
      </div>
      <div className="p-4">
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden /> {i.bairro} · {i.cidade}/{i.uf}
        </div>
        <div className="font-semibold text-[color:var(--garrido-ink)] mt-1 line-clamp-2">
          {i.titulo}
        </div>
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

/** Helpers de filtro compartilhados */
export const byFinalidade = (f: ImovelFinalidade) => (i: Imovel) => i.finalidade.includes(f);
export const byCategoria = (c: ImovelCategoria) => (i: Imovel) => i.categoria === c;
export const byTag = (t: ImovelTag) => (i: Imovel) => i.tags.includes(t);
