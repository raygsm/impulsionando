/**
 * Testes das regras por rota/variante e do resumo diário.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

class FakeStorage {
  store = new Map<string, string>();
  getItem(k: string) { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string) { this.store.set(k, String(v)); }
  removeItem(k: string) { this.store.delete(k); }
}
const storage = new FakeStorage();
vi.stubGlobal("window", { localStorage: storage, location: { pathname: "/x" } });
vi.stubGlobal("document", { addEventListener: () => {}, visibilityState: "visible" });
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import {
  evaluateAlertRules,
  ruleScope,
  shouldNotifyAlertNow,
  buildDailySummary,
  renderDailySummary,
  dailySummaryAlreadySent,
  markDailySummarySent,
  type AlertRule,
  type BufferedEvent,
} from "@/lib/whatsapp-cta";

beforeEach(() => { storage.store.clear(); });

function ev(over: Partial<BufferedEvent>): BufferedEvent {
  return {
    ts: Date.now(),
    event: "whatsapp_cta_click",
    origin: "hero",
    path: "/orcamento",
    ...over,
  };
}

describe("evaluateAlertRules", () => {
  const rules: AlertRule[] = [
    { id: "r1", route: "/orcamento", minCtr: 10, minSendRate: 0, windowHours: 24, minSamples: 2, enabled: true },
    { id: "r2", variant: "B", minCtr: 0, minSendRate: 50, windowHours: 24, minSamples: 2, enabled: true },
    { id: "r3", route: "/x", minCtr: 99, minSendRate: 0, windowHours: 24, minSamples: 1, enabled: false },
  ];

  it("filtra eventos pela rota da regra", () => {
    const events = [
      ev({ event: "whatsapp_cta_impression", path: "/orcamento" }),
      ev({ event: "whatsapp_cta_impression", path: "/orcamento" }),
      ev({ event: "whatsapp_cta_impression", path: "/outro" }),
      ev({ event: "whatsapp_cta_click", path: "/orcamento" }),
    ];
    const [r1] = evaluateAlertRules(events, [rules[0]]);
    expect(r1.impressions).toBe(2);
    expect(r1.clicks).toBe(1);
    expect(r1.ctr).toBeCloseTo(50, 1); // não dispara porque > 10%
    expect(r1.ctrBelow).toBe(false);
  });

  it("dispara quando CTR fica abaixo do limite por rota", () => {
    const events = [
      ev({ event: "whatsapp_cta_impression", path: "/orcamento" }),
      ev({ event: "whatsapp_cta_impression", path: "/orcamento" }),
      ev({ event: "whatsapp_cta_impression", path: "/orcamento" }),
      ev({ event: "whatsapp_cta_impression", path: "/orcamento" }),
      // sem cliques → CTR 0
    ];
    const [r1] = evaluateAlertRules(events, [rules[0]]);
    expect(r1.ctrBelow).toBe(true);
    expect(r1.triggered).toBe(true);
  });

  it("filtra por variante", () => {
    const events = [
      ev({ event: "whatsapp_cta_click", variant: "A" }),
      ev({ event: "whatsapp_cta_click", variant: "A" }),
      ev({ event: "whatsapp_cta_click", variant: "B" }),
      ev({ event: "whatsapp_cta_click", variant: "B" }),
      // 0 sends para variante B → send rate 0
    ];
    const [r2] = evaluateAlertRules(events, [rules[1]]);
    expect(r2.clicks).toBe(2);
    expect(r2.sends).toBe(0);
    expect(r2.sendBelow).toBe(true);
  });

  it("ignora regras desabilitadas", () => {
    const evals = evaluateAlertRules([ev({})], rules);
    expect(evals.find((e) => e.rule.id === "r3")).toBeUndefined();
  });
});

describe("ruleScope", () => {
  it("monta chave estável para cooldown", () => {
    expect(ruleScope({ route: "/x", variant: "A" })).toBe("route:/x|variant:A");
    expect(ruleScope({ route: "/x" })).toBe("route:/x");
    expect(ruleScope({})).toBe("global");
  });
});

describe("shouldNotifyAlertNow por escopo", () => {
  it("cooldowns são independentes entre escopos", () => {
    expect(shouldNotifyAlertNow("global")).toBe(true);
    expect(shouldNotifyAlertNow("global")).toBe(false); // bloqueado
    expect(shouldNotifyAlertNow("route:/x")).toBe(true); // escopo distinto, permitido
    expect(shouldNotifyAlertNow("route:/x")).toBe(false);
  });
});

describe("buildDailySummary + renderDailySummary", () => {
  it("agrega por CTA hash dentro do dia", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const t = today.getTime();
    const events: BufferedEvent[] = [
      { ts: t, event: "whatsapp_cta_impression", origin: "hero", path: "/", ctaHash: "abc" },
      { ts: t, event: "whatsapp_cta_impression", origin: "hero", path: "/", ctaHash: "abc" },
      { ts: t, event: "whatsapp_cta_click", origin: "hero", path: "/", ctaHash: "abc" },
      { ts: t, event: "whatsapp_cta_sent", origin: "hero", path: "/", ctaHash: "abc" },
      { ts: t, event: "whatsapp_cta_click", origin: "fab", path: "/x", ctaHash: "xyz" },
      // fora do dia
      { ts: t - 48 * 3600_000, event: "whatsapp_cta_click", origin: "x", path: "/", ctaHash: "abc" },
    ];
    const s = buildDailySummary(events, [], today);
    expect(s.totals.impressions).toBe(2);
    expect(s.totals.clicks).toBe(2);
    expect(s.totals.sends).toBe(1);
    const abc = s.rows.find((r) => r.ctaHash === "abc")!;
    expect(abc.impressions).toBe(2);
    expect(abc.clicks).toBe(1);
    expect(abc.sends).toBe(1);
    expect(abc.ctr).toBeCloseTo(50, 1);
    expect(abc.sendRate).toBeCloseTo(100, 1);
    const r = renderDailySummary(s);
    expect(r.title).toContain(s.date);
    expect(r.body).toContain("abc");
    expect(r.body).toContain("xyz");
  });

  it("respeita marcação de envio diário (dedup do summary)", () => {
    expect(dailySummaryAlreadySent()).toBe(false);
    markDailySummarySent();
    expect(dailySummaryAlreadySent()).toBe(true);
  });
});
