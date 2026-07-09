import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Users, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_CASES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/cases")({
  head: () => ({
    meta: [
      { title: "Cases WMP — eventos, festivais, casamentos e corporativos" },
      { name: "description", content: "Portfólio WMP: festivais, corporativos, casamentos, shows e formaturas. Estrutura, público, local e destaque técnico de cada evento." },
      { property: "og:title", content: "Cases WMP — 850+ eventos entregues" },
      { property: "og:description", content: "Do casamento em Grumari ao festival com 8.000 pessoas. Portfólio comprovado, técnica documentada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WmpCases,
});

const CATEGORIAS = ["Todos", "Corporativo", "Casamento", "Festival", "Show", "Formatura"] as const;

function WmpCases() {
  const [filtro, setFiltro] = useState<(typeof CATEGORIAS)[number]>("Todos");
  const list = useMemo(
    () => (filtro === "Todos" ? WMP_CASES : WMP_CASES.filter((c) => c.categoria === filtro)),
    [filtro],
  );

  return (
    <WmpShell breadcrumbs={[{ label: "Cases" }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-10 text-center">
          <span className="wmp-chip mb-4"><Sparkles className="size-3" /> Portfólio</span>
          <h1 className="wmp-display text-4xl md:text-6xl mb-4">Eventos que a WMP entregou</h1>
          <p className="opacity-80 text-lg max-w-2xl mx-auto">
            Cada case aqui foi acompanhado por briefing técnico, laudo de dB e plano B documentado.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFiltro(c)}
              className={filtro === c ? "wmp-cta" : "wmp-cta wmp-cta-outline"}
              style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((c) => (
            <article key={c.titulo} className="wmp-surface p-6 flex flex-col">
              <div className="aspect-video rounded-lg mb-4" style={{ background: "var(--gradient-wmp-stage)" }} />
              <span className="wmp-chip text-xs w-fit mb-3">{c.categoria}</span>
              <h2 className="wmp-display text-xl mb-2">{c.titulo}</h2>
              <p className="text-sm opacity-75 mb-4 flex-1">{c.destaque}</p>
              <dl className="grid grid-cols-3 gap-2 text-xs opacity-80 border-t pt-3" style={{ borderColor: "var(--wmp-border)" }}>
                <div className="flex items-center gap-1"><Users className="size-3" />{c.publico}</div>
                <div className="flex items-center gap-1"><MapPin className="size-3" />{c.local.split(",")[0]}</div>
                <div className="flex items-center gap-1"><Calendar className="size-3" />{c.ano}</div>
              </dl>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/wmp/orcamento" className="wmp-cta">
            Quero um evento assim <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </WmpShell>
  );
}
