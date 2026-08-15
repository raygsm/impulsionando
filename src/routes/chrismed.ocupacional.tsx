import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/chrismed/ocupacional')({
  beforeLoad: () => {
    throw redirect({ to: '/chrismed/medicina-ocupacional' });
  },
});
