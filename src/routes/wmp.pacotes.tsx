import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, ArrowRight, Package } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_PACOTES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/pacotes")({
  head: () => ({
    meta: [
      { title: "Pacotes de produção de eventos — WMP" },
      { name: "description", content: "Pacotes Essencial, Premium e Show para produção de eventos: som, luz, palco, telão e coordenação. Preços de referência e escopo detalhado." },
      { property: "og:title", content: "Pacotes WMP — som, luz e palco para todo porte de evento" },
      { property: "og:description", content: "Do Essencial ao Show/Festival. Escopo transparente, laudo de dB, ART e plano B documentado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: WMP_PACOTES.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Service",
              name: `WMP ${p.nome}`,
              description: p.bullets.join(" · "),
              audience: p.publico,
              offers: { "@type": "Offer", priceCurrency: "BRL", price: p.preco_a_partir },
            },
          })),
        }),
      },
    ],
  }),
  component: WmpPacotes,
});

function WmpPacotes() {
  return (
    <WmpShell breadcrumbs={[{ label: "Pacotes" }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-12 text-center">
          <span className="wmp-chip mb-4"><Package className="size-3" /> Pacotes comerciais</span>
          <h1 className="wmp-display text-4xl md:text-6xl mb-4">Escolha o porte. O escopo é transparente.</h1>
          <p className="opacity-80 text-lg max-w-2xl mx-auto">
            Três pacotes de referência para acelerar sua decisão. Todos personalizáveis
            no briefing — o pré-diagnóstico acústico ajusta potência, iluminação e equipe.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {WMP_PACOTES.map((p) => (
            <div
              key={p.slug}
              className="wmp-surface p-8 flex flex-col relative"
              style={p.destaque ? { borderColor: "var(--wmp-gold)", borderWidth: 2 } : undefined}
            >
              {p.destaque && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 wmp-chip text-xs"
                  style={{ background: "var(--gradient-wmp-cta)", color: "var(--wmp-bg)", borderColor: "var(--wmp-gold)" }}
                >
                  Mais contratado
                </span>
              )}
              <h2 className="wmp-display text-2xl mb-1">{p.nome}</h2>
              <p className="text-sm opacity-70 mb-4">{p.publico}</p>
              <div className="mb-6">
                <span className="text-xs opacity-60 block">a partir de</span>
                <span className="wmp-display text-3xl" style={{ color: "var(--wmp-gold)" }}>{p.preco_a_partir}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="size-4 mt-0.5 shrink-0" style={{ color: "var(--wmp-gold)" }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link to="/wmp/orcamento" className={p.destaque ? "wmp-cta" : "wmp-cta wmp-cta-outline"}>
                <Sparkles className="size-4" /> {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="wmp-surface p-8 text-center">
          <h2 className="wmp-display text-2xl mb-3">Precisa de algo fora desses pacotes?</h2>
          <p className="opacity-80 mb-5">
            Estruturas híbridas, multi-palcos, roadshows corporativos, eventos de nicho —
            fazemos proposta personalizada em até 24h.
          </p>
          <Link to="/wmp/orcamento" className="wmp-cta">
            Montar orçamento sob medida <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </WmpShell>
  );
}
