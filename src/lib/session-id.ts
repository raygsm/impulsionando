/**
 * Session / correlation ID compartilhado por todos os eventos GA4 do core
 * Impulsionando. Permite rastrear a jornada de um mesmo visitante
 * (CTA → checkout → lead_submit) e calcular conversão fim-a-fim.
 *
 * Regras:
 *  - Persistido em `sessionStorage` — vive enquanto a aba está aberta.
 *  - Pré-hidratação por `localStorage` (visitor_id) para reconhecer o
 *    mesmo dispositivo em novas sessões.
 *  - Renovado automaticamente após 30 min de inatividade.
 */

const SESSION_KEY = "imp_session_id";
const VISITOR_KEY = "imp_visitor_id";
const LAST_SEEN_KEY = "imp_session_last_seen";
const IDLE_MS = 30 * 60 * 1000;

function rand(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try { return (crypto as Crypto).randomUUID(); } catch { /* noop */ }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let v = window.localStorage.getItem(VISITOR_KEY);
    if (!v) { v = "v_" + rand(); window.localStorage.setItem(VISITOR_KEY, v); }
    return v;
  } catch { return "no_ls"; }
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(LAST_SEEN_KEY) ?? 0);
    let sid = window.sessionStorage.getItem(SESSION_KEY);
    if (!sid || (last && now - last > IDLE_MS)) {
      sid = "s_" + rand();
      window.sessionStorage.setItem(SESSION_KEY, sid);
    }
    window.sessionStorage.setItem(LAST_SEEN_KEY, String(now));
    return sid;
  } catch {
    return "no_ss";
  }
}

export function getVisitorId(): string { return ensureVisitorId(); }

/** Snapshot leve para debug/painel. */
export function getIdentity() {
  return { session_id: getSessionId(), visitor_id: getVisitorId() };
}
