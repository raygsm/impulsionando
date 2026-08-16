import { describe, expect, it } from "vitest";
import { toColorsInternalPathname } from "./subdomain";

describe("Colors clean public path routing", () => {
  it("maps the Colors root to its internal namespace", () => {
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/")).toBe("/colors");
  });

  it("maps critical clean Colors pages to the internal namespace", () => {
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/super-green-black")).toBe("/colors/super-green-black");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/agenda")).toBe("/colors/agenda");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/eventos")).toBe("/colors/eventos");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/suporte")).toBe("/colors/suporte");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/afiliados")).toBe("/colors/afiliados");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/rastreio")).toBe("/colors/rastreio");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/entrar")).toBe("/colors/entrar");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/criar-conta")).toBe("/colors/criar-conta");
  });

  it("does not double-prefix internal Colors routes", () => {
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/colors/agenda")).toBe("/colors/agenda");
  });

  it("never rewrites APIs or static assets", () => {
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/api/public/webhooks/maisfy-colors")).toBe("/api/public/webhooks/maisfy-colors");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/assets/app.js")).toBe("/assets/app.js");
    expect(toColorsInternalPathname("colors.impulsionando.com.br", "/robots.txt")).toBe("/robots.txt");
  });

  it("does not rewrite another tenant host", () => {
    expect(toColorsInternalPathname("wmp.impulsionando.com.br", "/agenda")).toBe("/agenda");
  });
});
