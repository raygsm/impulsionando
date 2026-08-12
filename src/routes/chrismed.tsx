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