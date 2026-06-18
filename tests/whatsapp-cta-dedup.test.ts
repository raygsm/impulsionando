/**
 * Testes da deduplicação:
 *  - cliques repetidos no mesmo CTA dentro de 2s
 *  - evento `whatsapp_cta_sent` único ao retornar várias vezes para a aba
 *  - cooldown de 30s entre envios presumidos
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// --- mocks de globais antes de importar o módulo ---
class FakeStorage {
  store = new Map<string, string>();
  getItem(k: string) { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string) { this.store.set(k, String(v)); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

type Listener = (ev: { type: string }) => void;
const docListeners: Record<string, Listener[]> = {};
const fakeDoc = {
  visibilityState: "visible" as "visible" | "hidden",
  addEventListener(type: string, fn: Listener) {
    (docListeners[type] ??= []).push(fn);
  },
};
function dispatch(type: string) {
  for (const fn of docListeners[type] ?? []) fn({ type });
}

const storage = new FakeStorage();
vi.stubGlobal("window", { localStorage: storage, location: { pathname: "/test" } });
vi.stubGlobal("document", fakeDoc);
vi.stubGlobal("localStorage", storage);

// silenciar analytics (GA inexistente nos testes)
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import {
  trackWhatsAppCTA,
  installWhatsAppReturnTracking,
  readWhatsAppLocalMetrics,
  clearWhatsAppLocalMetrics,
} from "@/lib/whatsapp-cta";

function countEvents(event: string) {
  return readWhatsAppLocalMetrics().filter((e) => e.event === event).length;
}

beforeEach(() => {
  storage.clear();
  // limpa listeners do `installWhatsAppReturnTracking`
  for (const k of Object.keys(docListeners)) docListeners[k] = [];
  // permite reinstalar o listener em cada teste
  (window as unknown as { __waReturnInstalled?: boolean }).__waReturnInstalled = false;
  fakeDoc.visibilityState = "visible";
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("dedup de cliques", () => {
  it("ignora cliques repetidos no mesmo CTA dentro de 2s", () => {
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "Falar agora" });
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "Falar agora" });
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "Falar agora" });
    expect(countEvents("whatsapp_cta_click")).toBe(1);
  });

  it("conta novamente depois da janela de 2s", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "Falar" });
    vi.setSystemTime(new Date("2026-01-01T10:00:03Z")); // +3s
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "Falar" });
    expect(countEvents("whatsapp_cta_click")).toBe(2);
  });

  it("conta cliques em CTAs diferentes mesmo dentro de 2s", () => {
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "A" });
    trackWhatsAppCTA("whatsapp_fab_click", { origin: "fab", ctaText: "B" });
    expect(countEvents("whatsapp_cta_click")).toBe(1);
    expect(countEvents("whatsapp_fab_click")).toBe(1);
  });
});

describe("dedup do whatsapp_cta_sent", () => {
  it("registra apenas 1 envio mesmo após múltiplos retornos à aba", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));

    installWhatsAppReturnTracking();

    // clique → marca pending
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "Falar" });
    expect(countEvents("whatsapp_cta_click")).toBe(1);

    // usuário sai para o WhatsApp
    fakeDoc.visibilityState = "hidden";
    dispatch("visibilitychange");

    // volta após 10s (>= 8s) — deve disparar 1 sent
    vi.setSystemTime(new Date("2026-01-01T10:00:10Z"));
    fakeDoc.visibilityState = "visible";
    dispatch("visibilitychange");
    expect(countEvents("whatsapp_cta_sent")).toBe(1);

    // sai e volta de novo várias vezes — não pode contar de novo (pending foi consumido)
    for (let i = 1; i <= 3; i++) {
      fakeDoc.visibilityState = "hidden";
      dispatch("visibilitychange");
      vi.setSystemTime(new Date(`2026-01-01T10:00:${10 + 15 * i}Z`));
      fakeDoc.visibilityState = "visible";
      dispatch("visibilitychange");
    }
    expect(countEvents("whatsapp_cta_sent")).toBe(1);
  });

  it("não conta envio se o usuário voltou rápido (< 8s)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T11:00:00Z"));
    installWhatsAppReturnTracking();
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "X" });

    fakeDoc.visibilityState = "hidden";
    dispatch("visibilitychange");
    vi.setSystemTime(new Date("2026-01-01T11:00:03Z")); // 3s
    fakeDoc.visibilityState = "visible";
    dispatch("visibilitychange");

    expect(countEvents("whatsapp_cta_sent")).toBe(0);
  });

  it("aplica cooldown de 30s entre chamadas diretas de whatsapp_cta_sent", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    trackWhatsAppCTA("whatsapp_cta_sent", { origin: "hero" });
    trackWhatsAppCTA("whatsapp_cta_sent", { origin: "hero" }); // bloqueado
    vi.setSystemTime(new Date("2026-01-01T12:00:10Z"));
    trackWhatsAppCTA("whatsapp_cta_sent", { origin: "hero" }); // bloqueado (10s)
    vi.setSystemTime(new Date("2026-01-01T12:00:35Z"));
    trackWhatsAppCTA("whatsapp_cta_sent", { origin: "hero" }); // permitido (35s)
    expect(countEvents("whatsapp_cta_sent")).toBe(2);
  });

  it("um novo clique + retorno conta um novo envio (sem cooldown global de clique)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T13:00:00Z"));
    installWhatsAppReturnTracking();

    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "X" });
    fakeDoc.visibilityState = "hidden";
    dispatch("visibilitychange");
    vi.setSystemTime(new Date("2026-01-01T13:00:10Z"));
    fakeDoc.visibilityState = "visible";
    dispatch("visibilitychange");
    expect(countEvents("whatsapp_cta_sent")).toBe(1);

    // 1 minuto depois — novo clique + novo retorno
    vi.setSystemTime(new Date("2026-01-01T13:01:10Z"));
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "X" });
    fakeDoc.visibilityState = "hidden";
    dispatch("visibilitychange");
    vi.setSystemTime(new Date("2026-01-01T13:01:25Z"));
    fakeDoc.visibilityState = "visible";
    dispatch("visibilitychange");
    expect(countEvents("whatsapp_cta_sent")).toBe(2);
  });
});

describe("clearWhatsAppLocalMetrics", () => {
  it("limpa também o buffer de pendentes", () => {
    trackWhatsAppCTA("whatsapp_cta_click", { origin: "hero", ctaText: "X" });
    expect(readWhatsAppLocalMetrics().length).toBeGreaterThan(0);
    clearWhatsAppLocalMetrics();
    expect(readWhatsAppLocalMetrics().length).toBe(0);
  });
});
