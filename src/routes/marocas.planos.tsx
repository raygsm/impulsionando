import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X, ArrowRight } from "lucide-react";
import { marocasPlanos } from "@/components/marocas/marocasPlanos";
import { MarocasShell } from "@/components/marocas/MarocasShell";

const CANONICAL = "/marocas/planos";

export const Route = createFileRoute("/marocas/planos")({
  head: () => ({
    meta: [
      { title: "Planos para bares, restaurantes e delivery — Marocas" },
      { name: "description", content: "Compare os planos Marocas para food service: Balcão (cardápio digital), Salão (operação completa) e Rede (franquias e dark kitchens)." },
      { property: "og:title", content: "Planos Marocas — Balcão, Salão e Rede" },
      { property: "og:description", content: "Do cardápio digital ao dashboard consolidado para redes de restaurantes." },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Planos" }]}>
      <section className="container mx-auto px-4 md:px-6 py-12 text-center max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Planos Marocas</p>
        <h1 className="text-4xl md:text-5xl font-bold mt-2">Sua operação de food service, do balcão à rede</h1>
        <p className="text-muted-foreground mt-4">
          Três níveis para bares, restaurantes, cafeterias, hamburguerias, pizzarias, delivery e dark kitchens.
          Sem taxa por pedido, sem intermediário, preparado para comandas por pulseira numerada.
        </p>
      </section>

      <section className="container mx-auto px-4 md:px-6 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {marocasPlanos.map((plano) => (
            <div
              key={plano.id}
              className={`rounded-2xl border p-6 bg-card flex flex-col ${plano.destaque ? "border-2 border-primary shadow-xl relative" : ""}`}
            >
              {plano.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Mais escolhido
                </span>
              )}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{plano.tagline}</div>
              <h2 className="text-2xl font-bold mt-1">{plano.nome}</h2>
              <p className="text-sm text-muted-foreground mt-2">{plano.resumo}</p>

              <div className="mt-5 pb-5 border-b">
                <div className="text-2xl font-bold">{plano.preco}</div>
                {plano.precoNota && <div className="text-xs text-muted-foreground mt-1">{plano.precoNota}</div>}
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Indicado para</div>
                <p className="text-sm">{plano.publico}</p>
              </div>

              <div className="mt-4 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Inclui</div>
                <ul className="space-y-1.5 text-sm">
                  {plano.inclui.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>

                {plano.naoInclui && plano.naoInclui.length > 0 && (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">Não inclui</div>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {plano.naoInclui.map((item) => (
                        <li key={item} className="flex gap-2">
                          <X className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <Link
                to="/marocas/contratar/$plano"
                params={{ plano: plano.id }}
                className={`block text-center mt-6 rounded-md px-4 py-3 font-semibold transition ${
                  plano.destaque
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border hover:bg-muted"
                }`}
              >
                {plano.ctaLabel} <ArrowRight className="inline h-4 w-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">Diferenciais por plano</h2>
          <div className="space-y-8">
            {marocasPlanos.map((plano) => (
              <div key={plano.id} className="rounded-2xl bg-card border p-6">
                <h3 className="font-bold text-lg">{plano.nome}</h3>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  {plano.diferenciais.map((d) => (
                    <div key={d.titulo} className="rounded-lg border p-4">
                      <div className="font-semibold text-sm">{d.titulo}</div>
                      <div className="text-sm text-muted-foreground mt-1">{d.descricao}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-8">Perguntas frequentes</h2>
        {marocasPlanos.map((plano) => (
          <div key={plano.id} className="mb-8">
            <h3 className="font-semibold text-primary mb-3">{plano.nome}</h3>
            <div className="space-y-3">
              {plano.faq.map((f) => (
                <details key={f.q} className="rounded-lg border p-4 group">
                  <summary className="font-medium cursor-pointer">{f.q}</summary>
                  <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>
    </MarocasShell>
  );
}
