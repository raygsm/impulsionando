import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TENANT_MODELS } from "@/data/tenant-registry";
import { CLUBE_CATEGORIAS } from "@/data/clube-mocks";
import { SectionHeader } from "@/components/impulsionando";

export const Route = createFileRoute("/clube/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar no Clube — Impulsionando" },
      { name: "description", content: "Busca inteligente por empresa, produto, serviço, evento, imóvel, delivery, voucher e promoção." },
      { property: "og:title", content: "Buscar no Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/buscar" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/buscar" }],
  }),
  component: ClubeBuscar,
});

const TIPOS = ["empresa", "produto", "serviço", "evento", "imóvel", "delivery", "voucher", "promoção"];

function ClubeBuscar() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-6">
        <SectionHeader
          eyebrow="Busca inteligente"
          title="Encontre o que faz sentido para o seu momento"
          description="Combine CEP, cidade, categoria, avaliação, faixa de preço e disponibilidade. A busca cobre empresas, produtos, serviços, imóveis, eventos, delivery, vouchers e promoções."
          align="left"
        />
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <Card className="p-5 md:p-6">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={(e) => e.preventDefault()}>
            <label className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              <Input placeholder="O que você procura?" className="pl-9" />
            </label>
            <label className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              <Input placeholder="CEP ou Cidade" className="pl-9" />
            </label>
            <Button className="gap-2"><Filter className="w-4 h-4" /> Filtros</Button>
          </form>

          <div className="flex flex-wrap gap-2 mt-4">
            {TIPOS.map((t) => (
              <span key={t} className="text-xs rounded-full border border-border px-3 py-1 opacity-80 capitalize">
                {t}
              </span>
            ))}
          </div>

          <div className="grid md:grid-cols-4 gap-3 mt-6 text-xs">
            <div className="rounded-lg border border-border p-3">
              <div className="opacity-60 mb-1">Categoria</div>
              <select className="w-full bg-transparent">
                <option>Todas</option>
                {CLUBE_CATEGORIAS.map((c) => <option key={c.slug}>{c.label}</option>)}
              </select>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="opacity-60 mb-1">Avaliação mínima</div>
              <select className="w-full bg-transparent">
                <option>Qualquer</option><option>4+ estrelas</option><option>4,5+ estrelas</option>
              </select>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="opacity-60 mb-1">Faixa de preço</div>
              <select className="w-full bg-transparent">
                <option>Todos</option><option>Acessível</option><option>Médio</option><option>Premium</option>
              </select>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="opacity-60 mb-1">Distância</div>
              <select className="w-full bg-transparent">
                <option>Sem limite</option><option>Até 5 km</option><option>Até 15 km</option>
              </select>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <SectionHeader eyebrow="Resultados de exemplo" title="Empresas do Ecossistema" align="left" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {TENANT_MODELS.filter((t) => t.segment !== "white-label").map((t) => (
            <Link
              key={t.slug}
              to={t.route}
              className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-primary/40 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-semibold">
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-1">
                  {t.segmentLabel}
                </span>
              </div>
              <div className="font-serif text-base">{t.name}</div>
              <div className="text-xs opacity-70 mt-1">{t.tagline}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                Conhecer <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
