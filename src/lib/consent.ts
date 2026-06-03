// Centraliza leitura/escrita do consentimento LGPD e dispara evento global
// para que módulos como analytics reajam em tempo real.

export const CONSENT_STORAGE_KEY = "lgpd-consent-v1";
export const CONSENT_EVENT = "lgpd:consent-changed";

export interface ConsentState {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string;
  version: string;
}

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function emitConsentChanged(state: ConsentState) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
}

export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
