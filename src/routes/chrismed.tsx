/**
 * /chrismed — layout do tenant CHRISMED.
 * Onda V2: /chrismed passa a ser a Home editorial (chrismed.index.tsx),
 * portanto o redirect anterior foi removido. Este arquivo é apenas o
 * outlet do subtree /chrismed/*.
 */
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';

export const Route = createFileRoute('/chrismed')({
  component: ChrismedLayout,
});

function ChrismedLayout() {
  return (
    <ChrismedShell>
      <Outlet />
    </ChrismedShell>
  );
}
