/**
 * Teste de regra de produto:
 *   "Comunicação ao cliente é pós-visita, não operação de cozinha."
 *
 * Garante via análise estática que:
 *   1. `notifyItemReady` NÃO importa canais ao cliente
 *      (sendRestaurantEmail / sendWhatsappText / sendSms) dentro do seu corpo.
 *   2. O template `restaurant-order-ready` é marcado como USO INTERNO.
 *   3. A régua pós-visita usa o template `restaurant-postvisit-thanks`
 *      e respeita uma janela mínima por nicho.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("restaurant — regra: comunicação só no pós-visita", () => {
  it("notifyItemReady não envia e-mail/WhatsApp/SMS ao cliente", () => {
    const src = read("src/lib/restaurant-customer-notify.server.ts");
    const fn = src.split("export async function notifyItemReady")[1]?.split("export async function ")[0] ?? "";
    expect(fn).not.toMatch(/sendRestaurantEmail\s*\(/);
    expect(fn).not.toMatch(/sendWhatsappText\s*\(/);
    expect(fn).not.toMatch(/sendSms\s*\(/);
    // Deve manter o lock idempotente.
    expect(fn).toMatch(/notified_ready_at/);
    // Deve devolver flag interna.
    expect(fn).toMatch(/internal:\s*true/);
  });

  it("template restaurant-order-ready é marcado como interno", () => {
    const src = read("src/lib/email-templates/restaurant-order-ready.tsx");
    expect(src).toMatch(/USO INTERNO/i);
    expect(src).toMatch(/sinal interno de sal[ãa]o/i);
  });

  it("régua pós-visita usa template restaurant-postvisit-thanks", () => {
    const src = read("src/lib/restaurant-postvisit.server.ts");
    expect(src).toMatch(/templateName:\s*["']restaurant-postvisit-thanks["']/);
    expect(src).toMatch(/postVisitDelayHours/);
    expect(src).toMatch(/bill_not_closed_yet/);
  });

  it("setItemStatus 'entregue' não dispara canal ao cliente", () => {
    const src = read("src/lib/restaurant-kitchen.functions.ts");
    expect(src).not.toMatch(/sendRestaurantEmail\s*\(/);
    expect(src).not.toMatch(/sendWhatsappText\s*\(/);
    expect(src).toMatch(/notifyItemReady/);
    expect(src).toMatch(/sinal interno|SINAL INTERNO/);
  });

  it("registry inclui o template pós-visita", () => {
    const src = read("src/lib/email-templates/registry.ts");
    expect(src).toMatch(/restaurant-postvisit-thanks/);
  });
});

describe("restaurant — timing pós-visita por nicho", () => {
  it("default 24h, cervejaria 36h, café 18h", async () => {
    const mod = await import("../src/lib/restaurant-postvisit.server");
    expect(mod.postVisitDelayHours()).toBe(24);
    expect(mod.postVisitDelayHours("bares-restaurantes")).toBe(24);
    expect(mod.postVisitDelayHours("cervejaria")).toBe(36);
    expect(mod.postVisitDelayHours("cafe-confeitaria")).toBe(18);
    expect(mod.postVisitDelayHours("desconhecido")).toBe(24);
  });
});
