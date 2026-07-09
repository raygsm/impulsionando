import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, ArrowRight } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_FAQ } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — WMP" },
      { name: "description", content: "Respostas objetivas sobre orçamento, ART, laudo de dB, plano B, pagamentos, rede de parceiros e atendimento fora do Rio." },
      { property: "og:title", content: "FAQ WMP — tudo o que você precisa saber antes de contratar" },
      { property: "og:description", content: "Prazos, garantias, ART, laudo de dB, sinal, plano B e mais." },
      { property: "og:type", content: "website" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: WMP_FAQ.map((f) => ({
            "@type": "Question",
            name: f.pergunta,
            acceptedAnswer: { "@type": "Answer", text: f.resposta },
          })),
        }),
      },
    ],
  }),
  component: WmpFaqPage,
});

function WmpFaqPage() {
  return (
    <WmpShell breadcrumbs={[{ label: "FAQ" }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
          <span className="wmp-chip mb-4"><HelpCircle className="size-3" /> Perguntas frequentes</span>
          <h1 className="wmp-display text-4xl md:text-5xl mb-4">Antes de você perguntar…</h1>
          <p className="opacity-80">Respostas diretas às dúvidas mais comuns de quem contrata a WMP.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="wmp-surface p-2 md:p-4">
          {WMP_FAQ.map((f, i) => (
            <details
              key={f.pergunta}
              className="group p-5 border-b last:border-0"
              style={{ borderColor: "var(--wmp-border)" }}
              open={i === 0}
            >
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                <span className="wmp-display text-lg">{f.pergunta}</span>
                <span
                  className="shrink-0 size-6 rounded-full flex items-center justify-center text-sm transition group-open:rotate-45"
                  style={{ background: "var(--wmp-surface-2)", color: "var(--wmp-gold)" }}
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm opacity-80 leading-relaxed">{f.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-24 text-center">
        <div className="wmp-surface p-8">
          <h2 className="wmp-display text-2xl mb-3">Sua dúvida não está aqui?</h2>
          <p className="opacity-80 mb-5">Envie o briefing — respondemos em até 24h com esclarecimentos e proposta.</p>
          <Link to="/wmp/orcamento" className="wmp-cta">
            Falar com a WMP <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </WmpShell>
  );
}
