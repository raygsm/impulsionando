/**
 * /vitrine — Listagem pública das empresas participantes (bares, restaurantes, etc.).
 * Anônimo pode navegar; filtros por segmento e cidade. CTA para virar Premium.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { getPublicVitrine } from "@/lib/consumer.functions";
import { MapPin, Sparkles, Crown, ArrowRight, Building2 } from "lucide-react";

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

  const q = useQuery({
    queryKey: ["public-vitrine", segment, city],
    queryFn: () => fetchFn({ data: { segment: segment || undefined, city: city || undefined, limit: 80 } }),
  });

  const companies = q.data?.companies ?? [];

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
          <Card className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex gap-2 flex-wrap">
              {SEGMENTS.map((s) => (
                <Button key={s.value} size="sm" variant={segment === s.value ? "default" : "outline"} onClick={() => setSegment(s.value)}>
                  {s.label}
                </Button>
              ))}
            </div>
            <div className="sm:ml-auto sm:w-64">
              <Input placeholder="Filtrar por cidade…" value={city} onChange={(e) => setCity(e.target.value)} />
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
              <p className="text-sm text-muted-foreground mt-1">Tente outro segmento ou cidade.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {companies.map((c: any) => (
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
                    {(c.address_city || c.address_state) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {c.address_city}{c.address_state ? `, ${c.address_state}` : ""}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
