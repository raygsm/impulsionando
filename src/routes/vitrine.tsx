/**
 * /vitrine — Listagem pública das empresas (tenants Impulsionando).
 * Filtros: busca livre, segmento, cidade, UF, nota mínima e ordenação.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useDeferredValue, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { getPublicVitrine } from "@/lib/consumer.functions";
import {
  MapPin, Sparkles, Crown, ArrowRight, Building2, Star, Search,
  Globe, Instagram, MessageCircle,
} from "lucide-react";

type VitrineCompany = {
  id: string;
  public_slug: string | null;
  name: string;
  trade_name: string | null;
  segment: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  tagline: string | null;
  description: string | null;
  address_city: string | null;
  address_state: string | null;
  address_neighborhood: string | null;
  primary_color: string | null;
  website: string | null;
  instagram: string | null;
  whatsapp: string | null;
  rating_avg: number | null;
  rating_count: number | null;
};

const SEGMENTS = [
  { value: "", label: "Todos" },
  { value: "saude", label: "Saúde" },
  { value: "medico-hospitalar", label: "Médico-hospitalar" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "imobiliaria", label: "Imobiliária" },
  { value: "eventos", label: "Eventos" },
  { value: "restaurante", label: "Restaurantes" },
  { value: "bar", label: "Bares" },
  { value: "fitness", label: "Fitness" },
  { value: "beleza", label: "Beleza" },
];

const SEGMENT_LABEL: Record<string, string> = Object.fromEntries(
  SEGMENTS.filter((s) => s.value).map((s) => [s.value, s.label]),
);

export const Route = createFileRoute("/vitrine")({
  head: () => ({
    meta: [
      { title: "Vitrine de parceiros Impulsionando — encontre clínicas, distribuidoras, imobiliárias e mais" },
      { name: "description", content: "Explore os parceiros conectados ao ecossistema Impulsionando: saúde, médico-hospitalar, hospedagem, imobiliárias, eventos e mais. Busca por nome, segmento e cidade." },
      { property: "og:title", content: "Vitrine Impulsionando — parceiros do ecossistema" },
      { property: "og:description", content: "Clínicas, distribuidoras, imobiliárias, hospedagem, eventos e mais — todos no padrão Impulsionando." },
      { property: "og:url", content: "https://impulsionando.com.br/vitrine" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/vitrine" }],
  }),
  component: VitrinePage,
});

function VitrinePage() {
  const fetchFn = useServerFn(getPublicVitrine);
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateUf] = useState("");
  const [sort, setSort] = useState<"rating" | "recent" | "name">("rating");
  const [minRating, setMinRating] = useState<number>(0);

  const deferredQ = useDeferredValue(q);

  const query = useQuery({
    queryKey: ["public-vitrine", segment, city, state, deferredQ, sort],
    queryFn: () =>
      fetchFn({
        data: {
          segment: segment || undefined,
          city: city || undefined,
          state: state || undefined,
          q: deferredQ || undefined,
          sort,
          limit: 120,
        },
      }),
  });

  const companies = useMemo<VitrineCompany[]>(() => {
    const all = (query.data?.companies ?? []) as VitrineCompany[];
    if (minRating <= 0) return all;
    return all.filter((c) => Number(c.rating_avg ?? 0) >= minRating);
  }, [query.data, minRating]);

  const ufOptions = useMemo(() => {
    const set = new Set<string>();
    (query.data?.companies ?? []).forEach((c: VitrineCompany) => {
      if (c.address_state) set.add(c.address_state.toUpperCase());
    });
    return Array.from(set).sort();
  }, [query.data]);

  const clearFilters = () => {
    setQ(""); setSegment(""); setCity(""); setStateUf(""); setMinRating(0); setSort("rating");
  };

  const activeFilters = [segment, city, state, deferredQ, minRating > 0 ? `${minRating}+` : ""].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
            <Badge className="bg-white/15 text-primary-foreground border-0 mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Vitrine de parceiros
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Conheça os parceiros do ecossistema Impulsionando
            </h1>
            <p className="mt-4 text-white/85 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Clínicas, distribuidoras médico-hospitalares, imobiliárias, hospedagem, eventos e muito mais —
              todos operando no mesmo padrão de qualidade, com Clube Premium por <strong>R$ 9,99/mês</strong>.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                <Link to="/clube"><Crown className="w-4 h-4" /> Virar Premium</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white gap-2">
                <Link to="/consumidor">Saber mais <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FILTROS */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-5 flex flex-col gap-4 shadow-sm">
            {/* Linha 1: busca + cidade + UF */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_140px] gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, descrição ou cidade…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              <Input
                placeholder="Filtrar por cidade…"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-10"
              />
              <Select value={state || "ALL"} onValueChange={(v) => setStateUf(v === "ALL" ? "" : v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas UFs</SelectItem>
                  {ufOptions.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Linha 2: segmentos */}
            <div className="flex gap-2 flex-wrap">
              {SEGMENTS.map((s) => (
                <Button
                  key={s.value || "all"}
                  size="sm"
                  variant={segment === s.value ? "default" : "outline"}
                  onClick={() => setSegment(s.value)}
                  className="rounded-full"
                >
                  {s.label}
                </Button>
              ))}
            </div>

            {/* Linha 3: nota + ordenação */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Nota mínima</span>
                {[0, 3, 4, 4.5].map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={minRating === n ? "default" : "outline"}
                    onClick={() => setMinRating(n)}
                    className="h-7 px-2.5 text-xs"
                  >
                    {n === 0 ? "Todas" : `${n}+`}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-xs text-muted-foreground">Ordenar</span>
                <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                  <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Melhor avaliados</SelectItem>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="name">Nome (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
                {activeFilters > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs">
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>
                {query.isLoading
                  ? "Carregando parceiros…"
                  : `${companies.length} ${companies.length === 1 ? "parceiro encontrado" : "parceiros encontrados"}`}
              </span>
              {query.isFetching && !query.isLoading && <span>· atualizando…</span>}
            </div>
          </Card>
        </section>

        {/* GRID */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
          {query.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-32 bg-muted animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-muted rounded animate-pulse w-full" />
                    <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
                  </div>
                </Card>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-lg">Nenhum parceiro encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ajuste os filtros, troque o segmento ou diminua a nota mínima.
              </p>
              {activeFilters > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                  Limpar filtros
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((c) => (
                <VitrineCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function VitrineCard({ c }: { c: VitrineCompany }) {
  const avg = Number(c.rating_avg ?? 0);
  const cnt = Number(c.rating_count ?? 0);
  const segLabel = c.segment ? (SEGMENT_LABEL[c.segment] ?? c.segment) : null;
  const accent = c.primary_color || undefined;
  const initial = (c.trade_name || c.name || "?").trim().charAt(0).toUpperCase();
  const locationLine = [c.address_neighborhood, c.address_city, c.address_state]
    .filter(Boolean)
    .join(" · ");

  const CardBody = (
    <Card className="group h-full overflow-hidden flex flex-col border-border/60 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
      {/* Capa */}
      <div
        className="relative h-32 sm:h-36 overflow-hidden"
        style={accent ? { background: `linear-gradient(135deg, ${accent} 0%, color-mix(in oklab, ${accent} 60%, #ffffff) 100%)` } : undefined}
      >
        {c.cover_image_url ? (
          <img
            src={c.cover_image_url}
            alt={`${c.trade_name || c.name} — capa`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary to-primary/70" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        {segLabel && (
          <Badge className="absolute top-3 left-3 bg-white/95 text-foreground border-0 shadow-sm">
            {segLabel}
          </Badge>
        )}
        {cnt > 0 && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {avg.toFixed(1)}
            <span className="text-muted-foreground font-normal">({cnt})</span>
          </div>
        )}
      </div>

      {/* Identidade + Conteúdo */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 -mt-10 mb-3">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-background ring-4 ring-background shadow-md overflow-hidden grid place-items-center">
            {c.logo_url ? (
              <img src={c.logo_url} alt={`${c.trade_name || c.name} — logo`} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full grid place-items-center text-xl font-bold text-white"
                style={{ background: accent || "hsl(var(--primary))" }}
              >
                {initial}
              </div>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors">
          {c.trade_name || c.name}
        </h3>
        {c.tagline && (
          <p className="mt-1 text-sm text-muted-foreground leading-snug line-clamp-2">{c.tagline}</p>
        )}
        {c.description && (
          <p className="mt-2 text-sm text-foreground/75 leading-relaxed line-clamp-3">{c.description}</p>
        )}

        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          {locationLine ? (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{locationLine}</span>
            </span>
          ) : <span className="text-muted-foreground/60">Localização não informada</span>}

          <div className="flex items-center gap-1 shrink-0">
            {c.website && (
              <a href={c.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                 className="p-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors" aria-label="Site">
                <Globe className="w-3.5 h-3.5" />
              </a>
            )}
            {c.instagram && (
              <a href={c.instagram.startsWith("http") ? c.instagram : `https://instagram.com/${c.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                 className="p-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors" aria-label="Instagram">
                <Instagram className="w-3.5 h-3.5" />
              </a>
            )}
            {c.whatsapp && (
              <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                 className="p-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors" aria-label="WhatsApp">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (!c.public_slug) {
    return <div className="block">{CardBody}</div>;
  }
  return (
    <Link to="/vitrine/$slug" params={{ slug: c.public_slug }} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
      {CardBody}
    </Link>
  );
}
