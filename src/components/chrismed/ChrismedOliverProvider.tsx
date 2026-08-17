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

function shouldOpenOliverFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const value = (params.get('oliver') ?? '').trim().toLowerCase();
  return ['open', 'chat', 'conversar', '1', 'true'].includes(value);
}

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
    if (shouldOpenOliverFromUrl()) {
      requestAnimationFrame(() => openChrismedOliver());
    }
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
    if (shouldOpenOliverFromUrl()) {
      requestAnimationFrame(() => openChrismedOliver());
    }
  }, [pathname]);

  return (
    <>
      {children}
      <ChrismedOliverPanel />
    </>
  );
}
