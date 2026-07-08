/**
 * Testes de deprecatedSubdomainRedirect — garantem que qualquer path do
 * host legado é redirecionado para o subdomínio oficial preservando
 * pathname, search e hash.
 */
import { describe, expect, it } from "vitest";
import { deprecatedSubdomainRedirect } from "./subdomain";

const base = { protocol: "https:", pathname: "/", search: "", hash: "" };

describe("deprecatedSubdomainRedirect", () => {
  it("root do subdomínio legado", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.impulsionando.com.br" }))
      .toBe("https://colors.impulsionando.com.br/");
  });

  it("preserva path", () => {
    expect(deprecatedSubdomainRedirect({
      ...base,
      hostname: "colorssaude.impulsionando.com.br",
      pathname: "/colors/super-green-black",
    })).toBe("https://colors.impulsionando.com.br/colors/super-green-black");
  });

  it("preserva query e hash", () => {
    expect(deprecatedSubdomainRedirect({
      ...base,
      hostname: "colorssaude.impulsionando.com.br",
      pathname: "/colors",
      search: "?utm_source=email&utm_campaign=x",
      hash: "#produtos",
    })).toBe("https://colors.impulsionando.com.br/colors?utm_source=email&utm_campaign=x#produtos");
  });

  it("cobre também o alias colors-saude", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors-saude.impulsionando.com.br" }))
      .toBe("https://colors.impulsionando.com.br/");
  });

  it("retorna null para subdomínio oficial", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colors.impulsionando.com.br" }))
      .toBeNull();
  });

  it("retorna null para host fora do domínio raiz", () => {
    expect(deprecatedSubdomainRedirect({ ...base, hostname: "colorssaude.outro-dominio.com" }))
      .toBeNull();
  });

  it("mantém http:// quando o request original é http", () => {
    expect(deprecatedSubdomainRedirect({
      ...base,
      protocol: "http:",
      hostname: "colorssaude.impulsionando.com.br",
    })).toBe("http://colors.impulsionando.com.br/");
  });
});
