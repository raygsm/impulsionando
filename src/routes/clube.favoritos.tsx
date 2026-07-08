import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowRight, Building2, Package, Wrench, CalendarDays, Building } from "lucide-react";
import { SectionHeader } from "@/components/impulsionando";
import { CLUBE_FAVORITOS } from "@/data/clube-mocks";

export const Route = createFileRoute("/clube/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Clube Impulsionando" },
      { name: "description", content: "Empresas, produtos, serviços, eventos e imóveis salvos como favoritos no Clube Impulsionando." },
      { property: "og:title", content: "Favoritos — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/favoritos" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/favoritos" }],
  }),
  component: ClubeFavoritos,
});

const ICONS = {
  empresa: Building2,
  produto: Package,
  servico: Wrench,
  evento: CalendarDays,
  imovel: Building,
} as const;

function ClubeFavoritos() {
  const groups = (["empresa", "produto", "servico", "evento", "imovel"] as const).map((tipo) => ({
    tipo,
    list: CLUBE_FAVORITOS.filter((f) => f.tipo === tipo),
  }));

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <SectionHeader
        eyebrow="Favoritos"
        title="Tudo que você marcou para voltar"
        description="Organize empresas, produtos, serviços, eventos e imóveis do Ecossistema em um só lugar."
        align="left"
      />

      <div className="grid gap-8 mt-6">
        {groups.map(({ tipo, list }) => {
          const Icon = ICONS[tipo];
          return (
            <section key={tipo}>
              <h2 className="flex items-center gap-2 font-serif text-xl mb-3 capitalize">
                <Icon className="w-5 h-5 text-primary" /> {tipo}s
                <span className="opacity-60 text-sm">({list.length})</span>
              </h2>
              {list.length === 0 ? (
                <p className="opacity-60 text-sm">Nada favoritado ainda.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {list.map((f) => (
                    <Link
                      key={f.id}
                      to={f.href}
                      className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 hover:border-primary/40 transition flex items-center gap-3"
                    >
                      <Heart className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{f.titulo}</div>
                        <div className="text-xs opacity-70 truncate">{f.contexto}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-60" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
