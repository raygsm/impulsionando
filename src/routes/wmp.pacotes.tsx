import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, ArrowRight, Package } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_PACOTES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/pacotes")({
  head: () => ({
    meta: [
      { title: "Serviços e configurações de produção — WMP" },
      { name: "description", content: "Configurações de referência para eventos WMP. Som, luz, DJs, audiovisual, estrutura e operação são dimensionados conforme briefing e disponibilidade." },
      { property: "og:title", content: "Serviços WMP — produção sob medida" },
      { property: "og:description", content: "Conheça configurações de referência e solicite uma proposta baseada nas necessidades reais do seu evento." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://wmp.impulsionando.com.br/pacotes" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://wmp.impulsionando.com.br/pacotes" }],
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
              provider: { "@type": "Organization", name: "Wagner Miller Produções" },
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
    <WmpShell breadcrumbs={[{ label: "Serviços" }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-5xl px-6 pb-12 pt-16 text-center">
          <span className="wmp-chip mb-4"><Package className="size-3" /> Configurações de referência</span>
          <h1 className="wmp-display mb-4 text-4xl md:text-6xl">Comece por uma configuração. A proposta nasce do briefing.</h1>
          <p className="mx-auto max-w-2xl text-lg opacity-80">
            As opções abaixo organizam escopos frequentes, mas não representam preço fechado nem disponibilidade garantida. O Milito e a equipe WMP dimensionam serviço, equipamentos, parceiros e logística conforme cada evento.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {WMP_PACOTES.map((p) => (
            <div
              key={p.slug}
              className="wmp-surface relative flex flex-col p-8"
              style={p.destaque ? { borderColor: "var(--wmp-gold)", borderWidth: 2 } : undefined}
            >
              {p.destaque && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 wmp-chip text-xs"
                  style={{ background: "var(--gradient-wmp-cta)", color: "var(--wmp-bg)", borderColor: "var(--wmp-gold)" }}
                >
                  Configuração ampliada
                </span>
              )}
              <h2 className="wmp-display mb-1 text-2xl">{p.nome}</h2>
              <p className="mb-4 text-sm opacity-70">{p.publico}</p>
              <div className="mb-6">
                <span className="text-xs opacity-60">Condição comercial</span>
                <div className="wmp-display mt-1 text-2xl" style={{ color: "var(--wmp-gold)" }}>{p.preco_a_partir}</div>
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--wmp-gold)" }} />
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
          <h2 className="wmp-display mb-3 text-2xl">Precisa de uma composição diferente?</h2>
          <p className="mb-5 opacity-80">
            Multiambientes, ativações corporativas, formatos especiais, shows e outras necessidades podem ser estruturados a partir do briefing, sempre sujeitos a análise, disponibilidade e proposta comercial.
          </p>
          <Link to="/wmp/orcamento" className="wmp-cta">
            Montar proposta sob medida <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </WmpShell>
  );
}
