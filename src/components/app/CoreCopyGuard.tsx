import { useEffect } from "react";

/**
 * CoreCopyGuard — blindagem client-side contra cópia casual do core
 * Impulsionando (impulsionando.com.br). NÃO substitui proteção jurídica
 * nem impede um dev determinado; é dissuasor visual + fricção.
 *
 * Ativa APENAS no domínio institucional do core; tenants, subdomínios
 * de cliente, previews Lovable e localhost ficam livres para não
 * quebrar operação, DevTools e QA.
 *
 * Bloqueia (no core):
 *  - menu de contexto (botão direito)
 *  - seleção de texto fora de inputs/textareas/[contenteditable]
 *  - copiar/recortar/arrastar conteúdo textual
 *  - atalhos de salvar/ver-fonte/print/imprimir/devtools
 *
 * Deixa passar interação em campos de formulário e áreas com o
 * atributo `data-allow-copy` (para blocos onde queremos permitir
 * cópia — ex.: código de erro, cupom, telefone).
 */

const CORE_HOSTS = new Set<string>([
  "impulsionando.com.br",
  "www.impulsionando.com.br",
]);

function isCoreHost(host: string): boolean {
  return CORE_HOSTS.has(host.toLowerCase());
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

export function CoreCopyGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isCoreHost(window.location.hostname)) return;

    const prevent = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      // F12 — DevTools
      if (k === "f12") {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + Shift + (I | J | C) — DevTools / inspecionar
      if (mod && e.shiftKey && (k === "i" || k === "j" || k === "c")) {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + (S | U | P) — salvar página / ver fonte / imprimir
      if (mod && (k === "s" || k === "u" || k === "p")) {
        e.preventDefault();
        return;
      }

      // Ctrl/Cmd + (C | X | A) fora de campos editáveis
      if (mod && (k === "c" || k === "x" || k === "a")) {
        if (!isEditable(e.target)) e.preventDefault();
      }
    };

    // CSS: bloqueia seleção fora de áreas permitidas.
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-core-copy-guard", "true");
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

    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("selectstart", prevent);
    document.addEventListener("keydown", onKey);

    // Aviso legal no console (dissuasor para curiosos técnicos).
    try {
      const title = "background:#0F172A;color:#fff;font-size:16px;padding:8px 14px;border-radius:6px";
      const body = "color:#0F172A;font-size:12px;line-height:1.5";
      // eslint-disable-next-line no-console
      console.log("%c⛔ Impulsionando — Código protegido", title);
      // eslint-disable-next-line no-console
      console.log(
        "%cEste é o core proprietário da Impulsionando Tecnologia.\n" +
          "Cópia, engenharia reversa, redistribuição ou uso do código-fonte\n" +
          "sem autorização por escrito viola contrato e a Lei 9.609/98 (LSI)\n" +
          "e a Lei 9.610/98 (LDA). Acessos são registrados.",
        body,
      );
    } catch {
      /* noop */
    }

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("selectstart", prevent);
      document.removeEventListener("keydown", onKey);
      styleEl.remove();
    };
  }, []);

  return null;
}
