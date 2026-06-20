/**
 * /vitrine — Listagem pública das empresas participantes (bares, restaurantes, etc.).
 * Anônimo pode navegar; filtros por segmento e cidade. CTA para virar Premium.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { getPublicVitrine } from "@/lib/consumer.functions";
import { MapPin, Sparkles, Crown, ArrowRight, Building2, Star } from "lucide-react";

const SEGMENTS = [
  { value: "", label: "Todos" },
  { value: "restaurante", label: "Restaurantes" },
  { value: "bar", label: "Bares" },
  { value: "fitness", label: "Fitness" },
  { value: "saude", label: "Saúde" },
  { value: "beleza", label: "Beleza" },
];

export const Route = createFileRoute("/vitrine")({
  head: () => ({
    meta: [
      { title: "Vitrine — Bares, restaurantes e parceiros | Impulsionando" },
      { name: "description", content: "Descubra bares, restaurantes e parceiros da rede Impulsionando. Reserve, peça e ganhe benefícios exclusivos como Consumidor Premium." },
      { property: "og:title", content: "Vitrine de parceiros — Impulsionando" },
      { property: "og:description", content: "Bares, restaurantes e parceiros conectados à rede Impulsionando." },
      { property: "og:url", content: "https://impulsionando.com.br/vitrine" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/vitrine" }],
  }),
  component: VitrinePage,
});

function VitrinePage() {
  const fetchFn = useServerFn(getPublicVitrine);
  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<"rating" | "recent" | "name">("rating");
  const [minRating, setMinRating] = useState<number>(0);

  const q = useQuery({
    queryKey: ["public-vitrine", segment, city, sort],
    queryFn: () => fetchFn({ data: { segment: segment || undefined, city: city || undefined, sort, limit: 120 } }),
  });

  const companies = useMemo(() => {
    const all = q.data?.companies ?? [];
    if (minRating <= 0) return all;
    return all.filter((c: { rating_avg: number | null }) => Number(c.rating_avg ?? 0) >= minRating);
  }, [q.data, minRating]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <Badge className="bg-white/15 text-primary-foreground border-0 mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Vitrine de parceiros
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Descubra bares, restaurantes e parceiros da rede
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              Reserve mesa, faça pedidos via QR Code, acumule benefícios e desbloqueie vantagens com o Clube Premium por <strong>R$ 9,99/mês</strong>.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                <Link to="/clube"><Crown className="w-4 h-4" /> Virar Premium</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white gap-2">
                <Link to="/consumidor">Saber mais <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex gap-2 flex-wrap">
                {SEGMENTS.map((s) => (
                  <Button key={s.value} size="sm" variant={segment === s.value ? "default" : "outline"} onClick={() => setSegment(s.value)}>
                    {s.label}
                  </Button>
                ))}
              </div>
              <div className="sm:ml-auto sm:w-56">
                <Input placeholder="Filtrar por cidade…" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ordenar por</span>
                <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                  <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Melhor avaliados</SelectItem>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="name">Nome (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Nota mínima</span>
                {[0, 3, 4, 4.5].map((n) => (
                  <Button key={n} size="sm" variant={minRating === n ? "default" : "outline"} onClick={() => setMinRating(n)}>
                    {n === 0 ? "Todas" : `${n}+`}
                  </Button>
                ))}
              </div>
              {q.isFetching && <span className="text-xs text-muted-foreground sm:ml-auto">Atualizando…</span>}
            </div>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          {q.isLoading ? (
            <p className="text-center text-muted-foreground py-12">Carregando parceiros…</p>
          ) : companies.length === 0 ? (
            <Card className="p-10 text-center">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">Nenhum parceiro encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">Tente outro segmento, cidade ou diminua a nota mínima.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {companies.map((c: { id: string; public_slug: string; name: string; trade_name: string | null; segment: string | null; logo_url: string | null; address_city: string | null; address_state: string | null; rating_avg: number | null; rating_count: number | null }) => {
                const avg = Number(c.rating_avg ?? 0);
                const cnt = Number(c.rating_count ?? 0);
                return (
                  <Link key={c.id} to="/vitrine/$slug" params={{ slug: c.public_slug }} className="group">
                    <Card className="p-5 h-full hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate group-hover:text-primary">{c.trade_name || c.name}</h3>
                          {c.segment && <Badge variant="outline" className="mt-1 text-xs">{c.segment}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {(c.address_city || c.address_state) ? (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {c.address_city}{c.address_state ? `, ${c.address_state}` : ""}
                          </span>
                        ) : <span />}
                        {cnt > 0 && (
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {avg.toFixed(1)}
                            <span className="text-muted-foreground font-normal">({cnt})</span>
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
