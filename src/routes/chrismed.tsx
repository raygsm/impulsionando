/**
 * /chrismed — layout do tenant CHRISMED.
 * Onda V2: /chrismed passa a ser a Home editorial (chrismed.index.tsx),
 * portanto o redirect anterior foi removido. Este arquivo é apenas o
 * outlet do subtree /chrismed/*.
 *
 * Padrão visual global CHRISMED:
 * - todo `.container` legado dentro do conteúdo público é centralizado;
 * - gutters laterais são consistentes e responsivos;
 * - larguras editoriais específicas (`max-w-*`) continuam respeitadas;
 * - o header público recebe uma camada de acabamento premium, compacta
 *   e responsiva, sem alterar rotas ou regras de negócio;
 * - a regra é estritamente escopada a `[data-tenant="chrismed"]`, sem
 *   interferir nos demais clientes do ecossistema Impulsionando.
 */
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';

export const Route = createFileRoute('/chrismed')({
  component: ChrismedLayout,
});

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

        /* =============================================================
           CHRISMED — acabamento premium do header público
           Mantém identidade forest/ivory/amber e reduz a ocupação
           horizontal/vertical do menu em desktop sem tocar nas rotas.
           ============================================================= */
        [data-tenant="chrismed"] [data-chrismed-header] {
          border-bottom-color: color-mix(in srgb, var(--chrismed-sand) 78%, transparent) !important;
          background:
            linear-gradient(180deg, rgba(253,252,251,0.985) 0%, rgba(248,247,244,0.965) 100%) !important;
          box-shadow:
            0 1px 0 rgba(11,42,36,0.04),
            0 14px 38px -22px rgba(7,28,24,0.38) !important;
          backdrop-filter: blur(18px) saturate(1.12);
        }

        [data-tenant="chrismed"] [data-chrismed-header] > div {
          width: min(100% - 2rem, 82rem) !important;
          max-width: 82rem !important;
        }

        [data-tenant="chrismed"] [data-chrismed-header] a,
        [data-tenant="chrismed"] [data-chrismed-header] button {
          -webkit-tap-highlight-color: transparent;
        }

        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] {
          position: relative;
          background: linear-gradient(180deg, rgba(255,255,255,0.78), rgba(253,252,251,0.44));
        }

        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"]::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: -1px;
          left: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(184,137,43,0.42), transparent);
          pointer-events: none;
        }

        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] a,
        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] button {
          border: 1px solid transparent;
          border-radius: 999px !important;
          letter-spacing: -0.01em;
          transition:
            color 180ms ease,
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease !important;
        }

        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] a:hover,
        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] button:hover {
          background: rgba(231,237,235,0.92) !important;
          border-color: rgba(184,137,43,0.24);
          box-shadow: 0 8px 20px -16px rgba(7,28,24,0.8);
          transform: translateY(-1px);
        }

        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Áreas de acesso CHRISMED"] {
          background:
            radial-gradient(circle at 12% 0%, rgba(228,181,74,0.08), transparent 28%),
            linear-gradient(90deg, var(--chrismed-forest-deep), #0a2a25 58%, #0d332d) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        }

        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Áreas de acesso CHRISMED"] a {
          transition:
            background-color 180ms ease,
            color 180ms ease,
            transform 180ms ease !important;
        }

        [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Áreas de acesso CHRISMED"] a:hover {
          background: rgba(255,255,255,0.095) !important;
        }

        [data-tenant="chrismed"] [data-chrismed-header] [aria-controls="chrismed-mobile-drawer"] {
          border: 1px solid rgba(11,42,36,0.10);
          background: rgba(255,255,255,0.70);
          box-shadow: 0 8px 24px -18px rgba(7,28,24,0.75);
        }

        [data-tenant="chrismed"] #chrismed-mobile-drawer aside {
          border-left: 1px solid rgba(217,211,203,0.9);
          background:
            linear-gradient(180deg, rgba(253,252,251,1) 0%, rgba(248,247,244,1) 100%) !important;
        }

        [data-tenant="chrismed"] #chrismed-mobile-drawer nav a,
        [data-tenant="chrismed"] #chrismed-mobile-drawer nav button {
          transition:
            background-color 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }

        [data-tenant="chrismed"] #chrismed-mobile-drawer nav a:hover,
        [data-tenant="chrismed"] #chrismed-mobile-drawer nav button:hover {
          transform: translateX(2px);
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

          [data-tenant="chrismed"] [data-chrismed-header] > div {
            grid-template-columns: 13.75rem minmax(0, 1fr) !important;
            gap: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] > div > a:first-child {
            height: 6rem !important;
            padding-right: 1.45rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] > div > a:first-child img {
            max-height: 3.55rem !important;
            width: auto !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] {
            height: 3.35rem !important;
            gap: 0.35rem !important;
            padding-left: 1.25rem !important;
            padding-right: 0.65rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] > div {
            gap: 0.05rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] a,
          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] button {
            padding: 0.46rem 0.62rem !important;
            font-size: 0.735rem !important;
            line-height: 1.1rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Áreas de acesso CHRISMED"] {
            height: 2.65rem !important;
            padding-left: 1.25rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Áreas de acesso CHRISMED"] a {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Áreas de acesso CHRISMED"] strong {
            font-size: 0.69rem !important;
            letter-spacing: 0.01em !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Áreas de acesso CHRISMED"] svg {
            width: 0.9rem !important;
            height: 0.9rem !important;
          }

          [data-tenant="chrismed"] #chrismed-main {
            padding-top: 6rem !important;
          }
        }

        @media (min-width: 1536px) {
          [data-tenant="chrismed"] [data-chrismed-header] > div {
            width: min(100% - 3rem, 84rem) !important;
            max-width: 84rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] a,
          [data-tenant="chrismed"] [data-chrismed-header] nav[aria-label="Navegação principal"] button {
            padding-left: 0.72rem !important;
            padding-right: 0.72rem !important;
            font-size: 0.76rem !important;
          }
        }

        @media (max-width: 1279px) {
          [data-tenant="chrismed"] [data-chrismed-header] > div {
            width: min(100% - 1.25rem, 72rem) !important;
            padding-top: 0.65rem !important;
            padding-bottom: 0.65rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] img[alt="CHRISMED"] {
            max-height: 2.85rem;
          }
        }

        @media (max-width: 639px) {
          [data-tenant="chrismed"] [data-chrismed-header] > div {
            width: calc(100% - 1rem) !important;
            gap: 0.5rem !important;
            padding-left: 0.25rem !important;
            padding-right: 0.25rem !important;
          }

          [data-tenant="chrismed"] [data-chrismed-header] img[alt="CHRISMED"] {
            max-width: min(58vw, 12rem);
            max-height: 2.5rem;
          }

          [data-tenant="chrismed"] #chrismed-mobile-drawer aside {
            width: min(100vw, 21rem) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-tenant="chrismed"] [data-chrismed-header] *,
          [data-tenant="chrismed"] #chrismed-mobile-drawer * {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
      <Outlet />
    </ChrismedShell>
  );
}