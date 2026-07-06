/**
 * /chrismed — Home institucional CrisMed.
 * Redireciona /chrismed exato para a Dra. Cristiane Alencar (autoridade médica).
 * Como este arquivo é o layout de /chrismed/*, precisamos redirecionar SOMENTE
 * quando o pathname bater exatamente em /chrismed — caso contrário o beforeLoad
 * dispara também nas rotas filhas e causa loop de redirecionamento (ERR_TOO_MANY_REDIRECTS).
 */
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/chrismed')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/chrismed' || location.pathname === '/chrismed/') {
      throw redirect({ to: '/chrismed/dra-cristiane' });
    }
  },
  component: () => <Outlet />,
});
