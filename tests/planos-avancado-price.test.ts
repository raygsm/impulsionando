import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(resolve(__dirname, "../src/routes/planos.tsx"), "utf8");

describe("Plano Avançado (Full) — preço 2× salário mínimo", () => {
  it("define monthly como wage * 2 para o plano Avançado", () => {
    const avancadoBlock = SRC.split('name: "Avançado"')[1] ?? "";
    expect(avancadoBlock).toMatch(/monthly:\s*wage\s*\*\s*2/);
  });

  it("nunca volta a renderizar 'sob consulta' para o plano Avançado (monthly !== null)", () => {
    const avancadoBlock = SRC.split('name: "Avançado"')[1]?.split("];")[0] ?? "";
    expect(avancadoBlock).not.toMatch(/monthly:\s*null/);
  });

  it("expõe '2× salário mínimo' (ou '2 salários mínimos') na descrição/comparativo", () => {
    expect(SRC).toMatch(/2[×x]\s*salário mínimo|2 salários mínimos|2 SM/i);
  });

  it("tabela comparativa COMPARE inclui a linha de Preço mensal com '2× salário mínimo'", () => {
    expect(SRC).toMatch(/feature:\s*"Preço mensal"[\s\S]*2[×x]\s*salário mínimo/);
  });

  it("setup do Avançado permanece em wage * 2", () => {
    expect(SRC).toMatch(/Avançado:\s*wage\s*\*\s*2/);
  });
});
