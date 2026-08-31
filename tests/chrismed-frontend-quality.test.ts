import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const layout = readFileSync("src/routes/chrismed.tsx", "utf8");
const offers = readFileSync("src/routes/chrismed.ofertas.tsx", "utf8");
const tokens = readFileSync("src/styles/tokens-tenants.css", "utf8");
const shell = readFileSync("src/components/chrismed/ChrismedShell.tsx", "utf8");

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("CHRISMED frontend quality contract", () => {
  it("keeps canonical CHRISMED identity in the offers journey", () => {
    expect(offers).toContain("Modalidades de atendimento · CHRISMED");
    expect(offers).toContain("Dra. Christiane Alencar");
    expect(offers).not.toContain("CrisMed");
    expect(offers).not.toContain("Cristiane Alencar");
  });

  it("never exposes a raw route exception to patients", () => {
    expect(layout).toContain("errorComponent: ChrismedRouteError");
    expect(layout).toContain("Não foi possível concluir esta etapa agora");
    expect(layout).not.toMatch(/\{\s*error\.message\s*\}/);
  });

  it("activates CHRISMED tokens on the shell so forest bands are not transparent", () => {
    expect(shell).toContain('data-tenant="chrismed"');
    expect(shell).toContain('root.setAttribute("data-tenant", "chrismed")');
  });

  it("protects form controls from dark-surface color inheritance", () => {
    expect(layout).toContain('[data-tenant="chrismed"] input');
    expect(layout).toContain('[data-tenant="chrismed"] textarea');
    expect(layout).toContain('[data-tenant="chrismed"] select');
    expect(layout).toContain('color: var(--chrismed-ink)');
    expect(layout).toContain('background-color: #fff');
    expect(layout).toContain('input::placeholder');
  });

  it("keeps essential CHRISMED palette pairs at WCAG AA body-text contrast", () => {
    expect(contrast("#071C18", "#FDFCFB")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#3F4A47", "#FDFCFB")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#596660", "#FDFCFB")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#E4B54A", "#071C18")).toBeGreaterThanOrEqual(4.5);
  });

  it("retains the canonical palette tokens used by the contrast contract", () => {
    expect(tokens).toContain("--chrismed-forest-deep:   #071C18;");
    expect(tokens).toContain("--chrismed-ivory:      #FDFCFB;");
    expect(tokens).toContain("--chrismed-graphite:   #3F4A47;");
    expect(tokens).toContain("--chrismed-mist:       #596660;");
    expect(tokens).toContain("--chrismed-amber:         #E4B54A;");
  });

  it("provides explicit friendly loading, empty and failure states for offers", () => {
    expect(offers).toContain("Carregando modalidades disponíveis");
    expect(offers).toContain("Não foi possível carregar as modalidades agora");
    expect(offers).toContain("Nenhuma modalidade ativa neste filtro no momento");
    expect(offers).toContain("console.error('[CHRISMED] Falha ao carregar modalidades'");
  });
});
