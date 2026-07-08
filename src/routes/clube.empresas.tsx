import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Star, MessageCircle, Calendar, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TENANT_MODELS } from "@/data/tenant-registry";
import { SectionHeader } from "@/components/impulsionando";

export const Route = createFileRoute("/clube/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas participantes — Clube Impulsionando" },
      { name: "description", content: "Todos os modelos oficiais de segmento do Ecossistema Impulsionando: saúde, nutracêuticos, imóveis, eventos, delivery, property management e mais." },
      { property: "og:title", content: "Empresas participantes — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/empresas" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/empresas" }],
  }),
  component: ClubeEmpresas,
});

function ClubeEmpresas() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <SectionHeader
        eyebrow="Empresas participantes"
        title="Todo o Ecossistema Impulsionando"
        description="Dados vindos direto de TENANT_MODELS — a mesma fonte que alimenta a Vitrine e o Impulsionito. Cada empresa é o modelo oficial do seu segmento."
        align="left"
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {TENANT_MODELS.map((t) => {
          const compra = t.impulsionitoDimensoes.includes("produtos");
          const agenda = t.impulsionitoDimensoes.includes("servicos") || t.impulsionitoDimensoes.includes("consultas") || t.impulsionitoDimensoes.includes("reservas");
          return (
            <article key={t.slug} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 flex flex-col">
              <header className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-semibold text-lg">
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-1">
                  {t.segmentLabel}
                </span>
              </header>
              <h2 className="font-serif text-xl mb-1">{t.name}</h2>
              <p className="text-sm opacity-80 leading-relaxed mb-3">{t.description}</p>

              {t.semantica.tags && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.semantica.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs opacity-75 flex-1">
                {t.semantica.regioes?.[0] && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {t.semantica.regioes.join(", ")}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary" /> 4,8
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button asChild size="sm" className="col-span-2 gap-1">
                  <Link to={t.route}>
                    Conhecer <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
                {compra && (
                  <Button asChild size="sm" variant="outline" className="gap-1">
                    <Link to={t.route}>
                      <ShoppingBag className="w-3.5 h-3.5" /> Comprar
                    </Link>
                  </Button>
                )}
                {agenda && (
                  <Button asChild size="sm" variant="outline" className="gap-1">
                    <Link to={t.route}>
                      <Calendar className="w-3.5 h-3.5" /> Agendar
                    </Link>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline" className={`gap-1 ${!compra && !agenda ? "col-span-2" : ""}`}>
                  <a href="https://wa.me/5521993075000" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
