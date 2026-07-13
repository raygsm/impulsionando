/**
 * VitrineHighlight — bloco da Home institucional (Onda 2).
 *
 * Puxa até 8 parceiros da vitrine pública (companies_vitrine_public) e
 * mostra em grid enxuto, com CTA para /vitrine. Fecha a promessa da home
 * ("empresas reais rodando no Impulsionando") sem duplicar a página /vitrine.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicVitrine } from "@/lib/consumer.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Sparkles, Star, Building2 } from "lucide-react";

type Row = {
  id: string;
  public_slug: string | null;
  name: string;
  trade_name: string | null;
  segment: string | null;
  logo_url: string | null;
  tagline: string | null;
  address_city: string | null;
  address_state: string | null;
  primary_color: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  subdomain: string | null;
  domain: string | null;
};

function siteUrl(c: Row): string | null {
  if (c.domain) return c.domain.startsWith("http") ? c.domain : `https://${c.domain}`;
  if (c.subdomain) return `https://${c.subdomain}.impulsionando.com.br`;
  return null;
}

export function VitrineHighlight() {
  const fetchFn = useServerFn(getPublicVitrine);
  const { data, isLoading } = useQuery({
    queryKey: ["home-vitrine"],
    queryFn: () => fetchFn({ data: { sort: "rating", limit: 8 } }),
    staleTime: 5 * 60_000,
  });

  const companies = (data?.companies ?? []) as Row[];

  return (
    <section aria-labelledby="vitrine-title" className="section-block surface-2 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <Badge variant="outline" className="mb-2 gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Vitrine de parceiros
            </Badge>
            <h2 id="vitrine-title" className="text-2xl sm:text-3xl font-bold tracking-tight">
              Empresas reais rodando no Impulsionando
            </h2>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Clínicas, distribuidoras, imobiliárias, hospedagem, eventos e mais — todas no mesmo padrão de operação.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2 shrink-0">
            <Link to="/vitrine">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-5 h-40 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-60" />
            Os primeiros parceiros aparecem aqui em breve.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {companies.map((c) => <VitrineMiniCard key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function VitrineMiniCard({ c }: { c: Row }) {
  const accent = c.primary_color || undefined;
  const initial = (c.trade_name || c.name || "?").trim().charAt(0).toUpperCase();
  const location = [c.address_city, c.address_state].filter(Boolean).join(" · ");
  const avg = Number(c.rating_avg ?? 0);
  const cnt = Number(c.rating_count ?? 0);

  const body = (
    <Card className="group h-full p-5 flex flex-col hover:border-primary/40 hover:shadow-lg transition-all">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden grid place-items-center bg-muted">
          {c.logo_url ? (
            <img src={c.logo_url} alt={`${c.trade_name || c.name} — logo`} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full grid place-items-center text-lg font-bold text-white"
              style={{ background: accent || "hsl(var(--primary))" }}
            >
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight truncate group-hover:text-primary transition-colors">
            {c.trade_name || c.name}
          </h3>
          {c.segment && (
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">{c.segment}</p>
          )}
        </div>
        {cnt > 0 && (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {avg.toFixed(1)}
          </span>
        )}
      </div>

      {c.tagline && (
        <p className="mt-3 text-sm text-muted-foreground leading-snug line-clamp-2">{c.tagline}</p>
      )}

      <div className="mt-auto pt-4 text-xs text-muted-foreground">
        {location ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> {location}
          </span>
        ) : (
          <span className="opacity-60">Localização não informada</span>
        )}
      </div>
    </Card>
  );

  const url = siteUrl(c);
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir site de ${c.trade_name || c.name}`}
         className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {body}
      </a>
    );
  }
  if (c.public_slug) {
    return (
      <Link to="/vitrine/$slug" params={{ slug: c.public_slug }}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {body}
      </Link>
    );
  }
  return <div>{body}</div>;
}
