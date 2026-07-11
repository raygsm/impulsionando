import { useSyncExternalStore } from 'react';
import type { OliverContextEventDetail } from '@/content/chrismed/oliver-contexts';

type OliverState = {
  open: boolean;
  context: OliverContextEventDetail | null;
  info: string | null;
  trigger: HTMLElement | null;
};

const listeners = new Set<() => void>();

let state: OliverState = {
  open: false,
  context: null,
  info: null,
  trigger: null,
};

const serverState: OliverState = {
  open: false,
  context: null,
  info: null,
  trigger: null,
};

function getActiveTrigger(trigger?: HTMLElement | null) {
  if (trigger) return trigger;
  if (typeof document === 'undefined') return null;
  const active = document.activeElement;
  return active instanceof HTMLElement ? active : null;
}

function emit(next: Partial<OliverState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function openChrismedOliver(options: { trigger?: HTMLElement | null } = {}) {
  emit({ open: true, info: null, trigger: getActiveTrigger(options.trigger) });
}

export function closeChrismedOliver() {
  emit({ open: false, info: null });
}

export function resetChrismedOliver() {
  emit({ open: false, context: null, info: null, trigger: null });
}

export function clearChrismedOliverRouteState() {
  emit({ context: null, info: null });
}

export function setChrismedOliverContext(context: OliverContextEventDetail | null) {
  emit({ context, info: null });
}

export function setChrismedOliverInfo(info: string | null) {
  emit({ info });
}

export function focusChrismedOliverTrigger() {
  if (typeof window === 'undefined') return;
  const trigger = state.trigger;
  window.setTimeout(() => {
    if (trigger && document.contains(trigger)) {
      trigger.focus({ preventScroll: true });
      return;
    }
    document.querySelector<HTMLElement>('[data-chrismed-oliver-fixed-launcher]')?.focus({ preventScroll: true });
  }, 0);
}

export function useChrismedOliverState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => serverState,
  );
}