import { useEffect } from 'react';

const ATTRIBUTION_KEY = 'anamadu.attribution.v1';
const SESSION_KEY = 'anamadu.annita.session.v1';
const LEGACY_SESSION_KEY = 'anamadu.anita.session.v1';

function readJson(key: string) {
  try { return JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { return {}; }
}

export function AnaMaduOurivesBridge() {
  useEffect(() => {
    const handler = async (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string; approved?: boolean; brief?: Record<string, unknown> }>).detail;
      if (detail?.type !== 'ourives' || detail.approved !== true || !detail.brief) return;

      const session = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY) ?? undefined;
      try {
        const response = await fetch('/api/anamadu/ourives-request', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            externalUserId: session,
            attribution: readJson(ATTRIBUTION_KEY),
            approved: true,
            brief: detail.brief,
          }),
        });
        if (!response.ok) throw new Error('ourives_persist_failed');
        const payload = await response.json();
        window.dispatchEvent(new CustomEvent('anamadu:ourives-persisted', { detail: payload }));
      } catch {
        window.dispatchEvent(new CustomEvent('anamadu:ourives-persist-failed'));
      }
    };

    window.addEventListener('anamadu:open-annita', handler as EventListener);
    return () => window.removeEventListener('anamadu:open-annita', handler as EventListener);
  }, []);

  return null;
}
