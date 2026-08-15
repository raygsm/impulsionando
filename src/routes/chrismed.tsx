/**
 * /chrismed — layout do tenant CHRISMED.
 * Onda V2: /chrismed passa a ser a Home editorial (chrismed.index.tsx),
 * portanto o redirect anterior foi removido. Este arquivo é o outlet do
 * subtree /chrismed/* e concentra as protecoes visuais transversais.
 */
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';

export const Route = createFileRoute('/chrismed')({
  component: ChrismedLayout,
  errorComponent: ChrismedRouteError,
});

function ChrismedRouteError() {
  return (
    <ChrismedShell>
      <main className="min-h-[62vh] bg-[var(--chrismed-ivory)] px-6 py-20 text-[var(--chrismed-ink)]">
        <section className="mx-auto max-w-2xl rounded-3xl border border-[var(--chrismed-sand)] bg-white p-8 text-center shadow-[var(--chrismed-shadow-md)] md:p-12">
          <img
            src="/brand/chrismed/logo-horizontal.webp"
            alt="CHRISMED"
            className="mx-auto mb-8 h-12 w-auto object-contain"
          />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--chrismed-mist)]">
            Atendimento CHRISMED
          </p>
          <h1 className="chrismed-serif text-3xl font-semibold text-[var(--chrismed-forest-deep)] md:text-4xl">
            Não foi possível concluir esta etapa agora
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--chrismed-graphite)]">
            Seus dados permanecem protegidos. Atualize a página para tentar novamente ou retorne ao início da CHRISMED.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[var(--chrismed-forest-deep)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--chrismed-forest)] focus-visible:outline-none"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="rounded-xl border border-[var(--chrismed-forest)] bg-white px-6 py-3 font-semibold text-[var(--chrismed-forest-deep)] transition hover:bg-[var(--chrismed-forest-mist)]"
            >
              Voltar ao início
            </a>
          </div>
        </section>
      </main>
    </ChrismedShell>
  );
}

function ChrismedLayout() {
  return (
    <ChrismedShell>
      <style>{`
        [data-tenant="chrismed"] #chrismed-main .container {
          margin-left: auto;
          margin-right: auto;
          box-sizing: border-box;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }

        /* Contrato transversal de legibilidade CHRISMED.
           Componentes interativos nunca herdam texto claro de bandas
           escuras quando possuem sua propria superficie clara. */
        [data-tenant="chrismed"] input,
        [data-tenant="chrismed"] textarea,
        [data-tenant="chrismed"] select {
          color: var(--chrismed-ink);
          background-color: #fff;
          border-color: var(--chrismed-sand);
          caret-color: var(--chrismed-forest-deep);
        }
        [data-tenant="chrismed"] input::placeholder,
        [data-tenant="chrismed"] textarea::placeholder {
          color: var(--chrismed-mist);
          opacity: 1;
        }
        [data-tenant="chrismed"] select option {
          color: var(--chrismed-ink);
          background: #fff;
        }
        [data-tenant="chrismed"] :is(input, textarea, select, button, a)[disabled],
        [data-tenant="chrismed"] [aria-disabled="true"] {
          cursor: not-allowed;
          opacity: .62;
        }

        /* Neutraliza a antiga regra de descendencia ampla das bandas
           verde-floresta quando um card/controle cria uma superficie clara. */
        [data-tenant="chrismed"] :is(.chrismed-page-forest, .chrismed-band-forest)
          :is([class*="bg-white"], [class*="bg-[var(--chrismed-ivory)]"], [class*="bg-[var(--chrismed-bone)]"]),
        [data-tenant="chrismed"] :is(.chrismed-page-forest, .chrismed-band-forest)
          :is([class*="bg-white"], [class*="bg-[var(--chrismed-ivory)]"], [class*="bg-[var(--chrismed-bone)]"]) :is(p, li, dd, label, span) {
          color: var(--chrismed-graphite) !important;
        }
        [data-tenant="chrismed"] :is(.chrismed-page-forest, .chrismed-band-forest)
          :is([class*="bg-white"], [class*="bg-[var(--chrismed-ivory)]"], [class*="bg-[var(--chrismed-bone)]"]) :is(h1, h2, h3, h4, h5, h6, strong) {
          color: var(--chrismed-forest-deep) !important;
        }
        [data-tenant="chrismed"] :is(.chrismed-page-forest, .chrismed-band-forest)
          :is([class*="bg-white"], [class*="bg-[var(--chrismed-ivory)]"], [class*="bg-[var(--chrismed-bone)]"]) a:not(.chrismed-cta) {
          color: var(--chrismed-forest-deep) !important;
        }

        /* CTAs e badges devem manter seu foreground explicito mesmo quando
           inseridos em bandas que definem cor para descendentes. */
        [data-tenant="chrismed"] .chrismed-cta,
        [data-tenant="chrismed"] .chrismed-cta * {
          color: var(--chrismed-amber) !important;
        }
        [data-tenant="chrismed"] .chrismed-cta .chrismed-cta-lead {
          color: var(--chrismed-ivory) !important;
        }
        [data-tenant="chrismed"] .chrismed-cta:hover,
        [data-tenant="chrismed"] .chrismed-cta:hover * {
          color: #fff !important;
        }

        /* Texto essencial nao pode desaparecer por opacidade herdada. */
        [data-tenant="chrismed"] :is(label, legend, th) {
          color: var(--chrismed-forest-deep);
        }
        [data-tenant="chrismed"] [role="alert"] {
          font-weight: 500;
        }

        @media (min-width: 768px) {
          [data-tenant="chrismed"] #chrismed-main .container {
            padding-left: 2.5rem;
            padding-right: 2.5rem;
          }
        }

        @media (min-width: 1280px) {
          [data-tenant="chrismed"] #chrismed-main .container {
            padding-left: 2.5rem;
            padding-right: 2.5rem;
          }
        }
      `}</style>
      <Outlet />
    </ChrismedShell>
  );
}
