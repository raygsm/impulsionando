import { useEffect } from "react";

/**
 * CopyGuard — blindagem client-side contra cópia casual de qualquer
 * projeto do ecossistema Impulsionando (core + todos os tenants/clientes,
 * atuais e futuros). Ativa por padrão em produção; suspenso em ambientes
 * de desenvolvimento/preview para não travar QA.
 *
 * Bloqueia (visualmente / com fricção):
 *  - menu de contexto (botão direito)
 *  - seleção de texto fora de inputs/textareas/[contenteditable]
 *  - copiar/recortar/arrastar conteúdo textual
 *  - atalhos de salvar/ver-fonte/print/imprimir/devtools
 *
 * Reporta tentativas via GA4 (`copy_attempt`), buffer local
 * (`imp_copy_attempts`) e log no console. Áreas marcadas com
 * `data-allow-copy` (código de erro, cupom, telefone) continuam livres.
 */

// Hosts SEM proteção — preview interno, dev e localhost.
const UNPROTECTED_HOST_SUFFIX = [
  ".lovable.dev",
  "-preview--", // subdomínios id-preview--*.lovable.app etc.
];
const UNPROTECTED_HOSTS = new Set<string>(["localhost", "127.0.0.1", "0.0.0.0"]);

function isProtectedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (UNPROTECTED_HOSTS.has(h)) return false;
  if (h.endsWith(".lovable.dev")) return false;
  if (UNPROTECTED_HOST_SUFFIX.some((s) => h.includes(s))) return false;
  return true; // qualquer domínio de produção (core ou tenant)
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.closest) return false;
  if (el.closest("[data-allow-copy]")) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

type AttemptKind =
  | "contextmenu"
  | "copy"
  | "cut"
  | "dragstart"
  | "selectstart"
  | "devtools_shortcut"
  | "save_shortcut"
  | "view_source_shortcut"
  | "print_shortcut"
  | "select_all_shortcut"
  | "print_dialog"
  | "devtools_open";

const ATTEMPT_KEY = "imp_copy_attempts";
const ATTEMPT_MAX = 100;

function pushAttempt(kind: AttemptKind, extra: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const entry = {
    kind,
    ts: Date.now(),
    path: window.location.pathname,
    host: window.location.hostname,
    ua: navigator.userAgent,
    ref: document.referrer || null,
    ...extra,
  };
  try {
    const raw = window.localStorage.getItem(ATTEMPT_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push(entry);
    while (list.length > ATTEMPT_MAX) list.shift();
    window.localStorage.setItem(ATTEMPT_KEY, JSON.stringify(list));
  } catch { /* ignore quota */ }

  // GA4 (respeita consent mode; se negado, permanece no dataLayer).
  import("@/lib/analytics").then(({ trackEvent }) => {
    trackEvent("copy_attempt", entry as unknown as Record<string, unknown>);
  }).catch(() => { /* noop */ });

  try {
    // eslint-disable-next-line no-console
    console.warn("[Impulsionando] Tentativa de cópia registrada:", entry);
  } catch { /* noop */ }
}

export function readCopyAttempts(): Array<Record<string, unknown>> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ATTEMPT_KEY);
    return raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
  } catch { return []; }
}

export function clearCopyAttempts() {
  if (typeof window !== "undefined") window.localStorage.removeItem(ATTEMPT_KEY);
}

export function CoreCopyGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isProtectedHost(window.location.hostname)) return;

    const onContext = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      pushAttempt("contextmenu");
    };
    const onCopy = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      pushAttempt("copy");
    };
    const onCut = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      pushAttempt("cut");
    };
    const onDrag = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      pushAttempt("dragstart");
    };
    const onSelect = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      if (k === "f12") { e.preventDefault(); pushAttempt("devtools_shortcut", { key: "F12" }); return; }
      if (mod && e.shiftKey && (k === "i" || k === "j" || k === "c")) {
        e.preventDefault(); pushAttempt("devtools_shortcut", { key: `mod+shift+${k}` }); return;
      }
      if (mod && k === "s") { e.preventDefault(); pushAttempt("save_shortcut"); return; }
      if (mod && k === "u") { e.preventDefault(); pushAttempt("view_source_shortcut"); return; }
      if (mod && k === "p") { e.preventDefault(); pushAttempt("print_shortcut"); return; }
      if (mod && (k === "c" || k === "x") && !isEditable(e.target)) {
        e.preventDefault(); pushAttempt(k === "c" ? "copy" : "cut", { via: "shortcut" }); return;
      }
      if (mod && k === "a" && !isEditable(e.target)) {
        e.preventDefault(); pushAttempt("select_all_shortcut");
      }
    };

    const onBeforePrint = () => pushAttempt("print_dialog");

    // Heurística leve para DevTools aberto: detecta salto de resolução
    // (funciona quando o painel é ancorado no lado da janela).
    const devtoolsCheck = () => {
      try {
        const wDiff = window.outerWidth - window.innerWidth;
        const hDiff = window.outerHeight - window.innerHeight;
        if (wDiff > 160 || hDiff > 200) {
          const flagged = (window as unknown as { __impDevtoolsFlagged?: boolean }).__impDevtoolsFlagged;
          if (!flagged) {
            (window as unknown as { __impDevtoolsFlagged?: boolean }).__impDevtoolsFlagged = true;
            pushAttempt("devtools_open", { wDiff, hDiff });
          }
        }
      } catch { /* noop */ }
    };
    const devtoolsTimer = window.setInterval(devtoolsCheck, 4000);

    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-copy-guard", "true");
    styleEl.textContent = `
      html, body { -webkit-user-select: none; -ms-user-select: none; user-select: none; }
      input, textarea, select, [contenteditable="true"], [data-allow-copy], [data-allow-copy] * {
        -webkit-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      img, svg { -webkit-user-drag: none; user-drag: none; }
      @media print {
        body::before {
          content: "© Impulsionando Tecnologia — conteúdo protegido. Impressão bloqueada.";
          display: block; padding: 2rem; font-family: sans-serif; font-size: 14pt;
        }
        body > *:not(::before) { display: none !important; }
      }
    `;
    document.head.appendChild(styleEl);

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("dragstart", onDrag);
    document.addEventListener("selectstart", onSelect);
    document.addEventListener("keydown", onKey);
    window.addEventListener("beforeprint", onBeforePrint);

    try {
      const title = "background:#0F172A;color:#fff;font-size:16px;padding:8px 14px;border-radius:6px";
      const body = "color:#0F172A;font-size:12px;line-height:1.5";
      // eslint-disable-next-line no-console
      console.log("%c⛔ Impulsionando — Código protegido", title);
      // eslint-disable-next-line no-console
      console.log(
        "%cEcossistema Impulsionando Tecnologia (core + tenants).\n" +
          "Cópia, engenharia reversa, redistribuição ou uso não autorizado do\n" +
          "código-fonte viola contrato, Lei 9.609/98 (LSI) e Lei 9.610/98 (LDA).\n" +
          "Todas as tentativas de cópia/inspeção são registradas.",
        body,
      );
    } catch { /* noop */ }

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("dragstart", onDrag);
      document.removeEventListener("selectstart", onSelect);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.clearInterval(devtoolsTimer);
      styleEl.remove();
    };
  }, []);

  return null;
}
