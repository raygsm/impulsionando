import { useEffect, type ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { ChrismedOliverPanel } from './ChrismedOliverPanel';
import {
  clearChrismedOliverRouteState,
  openChrismedOliver,
  resetChrismedOliver,
  setChrismedOliverContext,
} from './oliver-store';
import type { OliverContextEventDetail } from '@/content/chrismed/oliver-contexts';

export function ChrismedOliverProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onOpen = () => openChrismedOliver();
    const onContext = (event: Event) => {
      setChrismedOliverContext(
        ((event as CustomEvent).detail ?? null) as OliverContextEventDetail | null,
      );
    };

    window.addEventListener('chrismed:oliver:open', onOpen);
    window.addEventListener('chrismed:oliver:context', onContext as EventListener);
    return () => {
      window.removeEventListener('chrismed:oliver:open', onOpen);
      window.removeEventListener('chrismed:oliver:context', onContext as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!pathname.startsWith('/chrismed')) {
      resetChrismedOliver();
      return;
    }
    clearChrismedOliverRouteState();
  }, [pathname]);

  return (
    <>
      {children}
      <ChrismedOliverPanel />
    </>
  );
}