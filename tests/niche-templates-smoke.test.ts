import { describe, it, expect } from "vitest";

/**
 * Conceptual tests for the niche-template smoke workflow
 * (`runNicheTemplatesSmoke` in src/lib/demos.functions.ts).
 *
 * We simulate executeSmokeOnce semantics in memory to validate that:
 *  - cada nicho gera uma empresa, aplica o template e enxerga os módulos,
 *  - purge final remove company_modules e companies (sem vazamento),
 *  - batch contabiliza ok/fail corretamente.
 */

const TEMPLATES: Record<string, string[]> = {
  saude: ["crm", "agenda", "financeiro", "area_cliente", "automacao", "bi", "fidelizacao"],
  bares: ["pdv", "estoque", "delivery", "fidelizacao", "financeiro", "bi", "automacao"],
  cervejarias: ["erp", "estoque", "commerce", "financeiro", "crm", "bi"],
  servicos: ["crm", "agenda", "financeiro", "automacao", "bi", "area_cliente"],
  ecommerce: ["commerce", "estoque", "crm", "financeiro", "automacao", "fidelizacao", "bi"],
};

type Store = {
  companies: Map<string, { niche: string }>;
  companyModules: Set<string>; // `${companyId}:${slug}`
};

function newStore(): Store {
  return { companies: new Map(), companyModules: new Set() };
}

function smokeOnce(store: Store, niche: string, label: string) {
  const steps: { key: string; ok: boolean }[] = [];
  const companyId = `co-${Math.random().toString(36).slice(2, 8)}`;
  try {
    store.companies.set(companyId, { niche });
    steps.push({ key: "empresa_criada", ok: true });

    const slugs = TEMPLATES[niche] ?? [];
    if (slugs.length === 0) throw new Error("nicho_sem_template");
    for (const s of slugs) store.companyModules.add(`${companyId}:${s}`);
    steps.push({ key: "nicho_template_aplicado", ok: true });

    // valida
    const got = Array.from(store.companyModules)
      .filter((k) => k.startsWith(`${companyId}:`))
      .map((k) => k.split(":")[1])
      .sort();
    if (got.length !== slugs.length) {
      steps.push({ key: "valida_modulos", ok: false });
      return { success: false, steps, companyId, label };
    }
    steps.push({ key: "valida_modulos", ok: true });
    return { success: steps.every((s) => s.ok), steps, companyId, label };
  } finally {
    // purge
    for (const k of Array.from(store.companyModules)) {
      if (k.startsWith(`${companyId}:`)) store.companyModules.delete(k);
    }
    store.companies.delete(companyId);
  }
}

function batch(store: Store) {
  const targets = Object.keys(TEMPLATES);
  const results = targets.map((n) => smokeOnce(store, n, n));
  const ok = results.filter((r) => r.success).length;
  return { results, okCount: ok, failCount: results.length - ok };
}

describe("Niche templates smoke — purge + recriação por nicho", () => {
  it("executa smoke para todos os 5 nichos premium", () => {
    const store = newStore();
    const r = batch(store);
    expect(r.results.length).toBe(5);
    expect(r.okCount).toBe(5);
    expect(r.failCount).toBe(0);
  });

  it("não deixa empresas ou módulos após purge", () => {
    const store = newStore();
    batch(store);
    expect(store.companies.size).toBe(0);
    expect(store.companyModules.size).toBe(0);
  });

  it("cada smoke registra step nicho_template_aplicado=ok", () => {
    const store = newStore();
    const r = batch(store);
    for (const res of r.results) {
      const step = res.steps.find((s) => s.key === "nicho_template_aplicado");
      expect(step?.ok).toBe(true);
    }
  });

  it("falha com nicho desconhecido sem corromper estado", () => {
    const store = newStore();
    const r = smokeOnce(store, "inexistente", "fake");
    expect(r.success).toBe(false);
    expect(store.companies.size).toBe(0);
    expect(store.companyModules.size).toBe(0);
  });

  it("execuções repetidas (10x) continuam idempotentes — sem vazamento entre runs", () => {
    const store = newStore();
    for (let i = 0; i < 10; i++) batch(store);
    expect(store.companies.size).toBe(0);
    expect(store.companyModules.size).toBe(0);
  });
});
