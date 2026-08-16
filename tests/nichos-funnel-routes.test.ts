import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_NICHE_GROUPS, PUBLIC_NICHES } from "../src/data/public-niche-catalog";
import { NICHO_DETAILS } from "../src/components/marketing/nichoDetails";
import { COMMERCIAL_NICHE_PLAYBOOK } from "../src/data/commercial-niche-playbook";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const CRITICAL = [
  "supermercados",
  "materiais-construcao",
  "corretoras-seguros-planos-saude",
  "farmacias",
  "padarias",
  "bares-restaurantes",
  "oficinas-autopecas",
  "academias-fitness",
  "hoteis-pousadas",
  "transportes-logistica",
] as const;

describe("Catálogo público unificado de nichos", () => {
  it("publica grupos e segmentos", () => {
    expect(PUBLIC_NICHE_GROUPS.length).toBeGreaterThan(0);
    expect(PUBLIC_NICHES.length).toBeGreaterThan(20);
  });

  it("não duplica slugs na lista pública plana", () => {
    const slugs = PUBLIC_NICHES.map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("mantém visíveis os segmentos críticos solicitados", () => {
    const slugs = new Set(PUBLIC_NICHES.map((n) => n.slug));
    expect(CRITICAL.filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it("todo segmento publicado tem fonte canônica ou playbook comercial", () => {
    const canonical = new Set(NICHO_DETAILS.map((n) => n.slug));
    const playbooks = new Set(COMMERCIAL_NICHE_PLAYBOOK.map((n) => n.slug));
    const orphan = PUBLIC_NICHES.filter((n) => !canonical.has(n.slug) && !playbooks.has(n.slug));
    expect(orphan).toEqual([]);
  });

  it("as três superfícies públicas usam a fonte única", () => {
    for (const rel of [
      "src/routes/escolher-nicho.tsx",
      "src/routes/nichos.index.tsx",
      "src/components/marketing/PublicHeader.tsx",
    ]) {
      expect(read(rel), `${rel} deve consumir PUBLIC_NICHE_*`).toContain("PUBLIC_NICHE");
    }
  });

  it("a rota individual aceita nichos canônicos e playbooks", () => {
    const source = read("src/routes/nichos.$slug.tsx");
    expect(source).toContain("findNicho");
    expect(source).toContain("findNichePlaybook");
  });
});
