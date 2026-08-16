import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_CASES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/cases")({
  head: () => ({
    meta: [
      { title: "Cases WMP — portfólio validado" },
      { name: "description", content: "Portfólio público da WMP. Cases só são publicados após validação das informações e autorização de divulgação." },
      { property: "og:title", content: "Cases WMP — Wagner Miller Produções" },
      { property: "og:description", content: "Conheça a metodologia da WMP e, quando autorizados, cases reais de produção, DJs, som, luz e operação de eventos." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://wmp.impulsionando.com.br/cases" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://wmp.impulsionando.com.br/cases" }],
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
        <div className="mx-auto max-w-5xl px-6 pb-10 pt-16 text-center">
          <span className="wmp-chip mb-4"><Sparkles className="size-3" /> Portfólio validado</span>
          <h1 className="wmp-display mb-4 text-4xl md:text-6xl">Experiências documentadas, sem inventar credenciais.</h1>
          <p className="mx-auto max-w-2xl text-lg opacity-80">
            A WMP só publica números, clientes, imagens, público, equipamentos e resultados quando essas informações estiverem validadas e autorizadas para divulgação.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {WMP_CASES.length > 0 ? (
          <>
            <div className="mb-8 flex flex-wrap justify-center gap-2">
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <article key={`${c.titulo}-${c.ano}`} className="wmp-surface flex flex-col p-6">
                  <span className="wmp-chip mb-3 w-fit text-xs">{c.categoria}</span>
                  <h2 className="wmp-display mb-2 text-xl">{c.titulo}</h2>
                  <p className="mb-4 flex-1 text-sm opacity-75">{c.destaque}</p>
                  <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-xs opacity-80" style={{ borderColor: "var(--wmp-border)" }}>
                    <div><dt className="opacity-60">Público</dt><dd>{c.publico}</dd></div>
                    <div><dt className="opacity-60">Local</dt><dd>{c.local}</dd></div>
                    <div><dt className="opacity-60">Ano</dt><dd>{c.ano}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-4xl rounded-2xl border p-6 md:p-8" style={{ borderColor: "var(--wmp-border)", background: "var(--wmp-surface-2)" }}>
            <h2 className="wmp-display text-2xl">Portfólio público em homologação</h2>
            <p className="mt-3 leading-7 opacity-75">
              Os registros operacionais existem dentro do ecossistema WMP, mas nenhum case será transformado em prova social pública sem validação dos dados e autorização correspondente.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                "briefing e escopo técnico registrados",
                "serviços e equipamentos discriminados",
                "agenda, parceiros e responsáveis vinculados",
                "histórico comercial e operacional auditável",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm opacity-85"><CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: "var(--wmp-gold)" }} />{item}</div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <Link to="/wmp/orcamento" className="wmp-cta">
            Planejar meu evento <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </WmpShell>
  );
}
