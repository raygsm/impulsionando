import { describe, it, expect, beforeEach, vi } from "vitest";

// jsdom-less: stub window/localStorage manually antes de importar o módulo.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

const storage = new MemoryStorage();
// @ts-expect-error test stub
globalThis.window = { localStorage: storage, location: { pathname: "/test" } };

import {
  resolveDemoNicho,
  getDemoNichoLink,
  readDemoFallbackLog,
  NICHO_ALIASES,
  SUPPORTED_DEMOS,
} from "../src/lib/demoResolver";

describe("demoResolver — resolução de aliases", () => {
  beforeEach(() => {
    storage.clear();
    vi.restoreAllMocks();
  });

  it("resolve slug suportado sem alias e sem fallback", () => {
    for (const slug of SUPPORTED_DEMOS) {
      const r = resolveDemoNicho(slug);
      expect(r.slug).toBe(slug);
      expect(r.isFallback).toBe(false);
      expect(r.isAlias).toBe(false);
    }
  });

  it("aplica alias declarado marcando isAlias=true e isFallback=false", () => {
    const cases: Array<[string, string]> = [
      ["clinicas-medicas", "saude"],
      ["restaurantes", "bar"],
      ["cervejaria", "microcervejarias"],
      ["ecommerce", "comercio"],
      ["academia", "saude"],
      ["escolas", "comunidade"],
      ["escritorio-advocacia", "servicos"],
    ];
    for (const [alias, expected] of cases) {
      const r = resolveDemoNicho(alias);
      expect(r.slug, `alias ${alias}`).toBe(expected);
      expect(r.isAlias, `alias ${alias}`).toBe(true);
      expect(r.isFallback, `alias ${alias}`).toBe(false);
    }
  });

  it("normaliza acentos, caixa e espaços antes de resolver", () => {
    expect(resolveDemoNicho("Clínica Médica").slug).toBe("saude");
    expect(resolveDemoNicho("  BARES  ").slug).toBe("bar");
    expect(resolveDemoNicho("E-COMMERCE").slug).toBe("comercio");
  });

  it("todo valor de NICHO_ALIASES aponta para um SUPPORTED_DEMOS", () => {
    for (const [alias, target] of Object.entries(NICHO_ALIASES)) {
      expect(SUPPORTED_DEMOS, `${alias} → ${target}`).toContain(target);
    }
  });

  it("getDemoNichoLink retorna rota tipada /demo/nicho/$slug", () => {
    const link = getDemoNichoLink("saude");
    expect(link.to).toBe("/demo/nicho/$slug");
    expect(link.params).toEqual({ slug: "saude" });
    expect(link.isFallback).toBe(false);
  });
});

describe("demoResolver — fallback + telemetria", () => {
  beforeEach(() => {
    storage.clear();
    vi.restoreAllMocks();
  });

  it("alias desconhecido cai em 'servicos', marca isFallback=true e emite console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = resolveDemoNicho("nicho-fantasma-999");
    expect(r.slug).toBe("servicos");
    expect(r.isFallback).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    const [tag, payload] = warn.mock.calls[0];
    expect(tag).toBe("[demo-fallback]");
    expect(payload).toMatchObject({
      requested: "nicho-fantasma-999",
      slug: "servicos",
      reason: "unknown-slug",
    });
  });

  it("entrada vazia/undefined também dispara fallback com reason=empty", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = resolveDemoNicho("");
    expect(r.slug).toBe("servicos");
    expect(r.isFallback).toBe(true);
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][1]).toMatchObject({ reason: "empty" });
  });

  it("grava evento no buffer localStorage para inspeção posterior", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveDemoNicho("slug-invalido-abc");
    resolveDemoNicho("outro-slug-xyz");
    const log = readDemoFallbackLog();
    expect(log.length).toBe(2);
    // Mais recente vem primeiro
    expect(log[0].requested).toBe("outro-slug-xyz");
    expect(log[0].slug).toBe("servicos");
    expect(log[1].requested).toBe("slug-invalido-abc");
  });

  it("alias válido NÃO dispara warn nem grava buffer", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveDemoNicho("clinicas-medicas");
    resolveDemoNicho("bar");
    expect(warn).not.toHaveBeenCalled();
    expect(readDemoFallbackLog()).toEqual([]);
  });
});

describe("demoResolver — integração com verify-niche-destinations", () => {
  it("todos subnichos declarados em MACRO_NICHOS resolvem sem fallback", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../src/components/marketing/nichoMacros.ts"),
      "utf8",
    );
    // Mesma extração do scripts/verify-niche-destinations.mjs: só o array `slugs`.
    const macroRe = /\{\s*[\s\S]*?slug:\s*"([^"]+)"[\s\S]*?slugs:\s*\[([^\]]*)\]/g;
    const subs = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = macroRe.exec(src)) !== null) {
      for (const s of m[2].matchAll(/"([^"]+)"/g)) subs.add(s[1]);
    }
    expect(subs.size).toBeGreaterThan(0);
    for (const slug of subs) {
      const r = resolveDemoNicho(slug);
      expect(
        r.isFallback,
        `subnicho "${slug}" caiu em fallback — falta alias em demoResolver`,
      ).toBe(false);
    }
  });
});
