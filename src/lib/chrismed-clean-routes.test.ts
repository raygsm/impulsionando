import { describe, expect, it } from "vitest";
import { toChrismedInternalPathname, toChrismedPublicPathname } from "./chrismed-clean-paths";

describe("CHRISMED clean route mapping", () => {
  it("maps every public CHRISMED route to the internal route tree", () => {
    expect(toChrismedInternalPathname("chrismed.impulsionando.com.br", "/")).toBe("/chrismed");
    expect(toChrismedInternalPathname("chrismed.impulsionando.com.br", "/agendar")).toBe(
      "/chrismed/agendar",
    );
    expect(
      toChrismedInternalPathname("chrismed.impulsionando.com.br", "/ocupacional/agendar"),
    ).toBe("/chrismed/ocupacional/agendar");
    expect(toChrismedInternalPathname("chrismed.impulsionando.com.br", "/termos")).toBe(
      "/chrismed/termos",
    );
  });

  it("keeps auth, APIs and management routes outside the public mapping", () => {
    expect(toChrismedInternalPathname("chrismed.impulsionando.com.br", "/auth")).toBe("/auth");
    expect(toChrismedInternalPathname("chrismed.impulsionando.com.br", "/dashboard")).toBe(
      "/dashboard",
    );
    expect(toChrismedInternalPathname("chrismed.impulsionando.com.br", "/api/health")).toBe(
      "/api/health",
    );
  });

  it("keeps other hosts isolated", () => {
    expect(toChrismedInternalPathname("impulsionando.com.br", "/agendar")).toBe("/agendar");
    expect(toChrismedPublicPathname("impulsionando.com.br", "/chrismed/agendar")).toBe(
      "/chrismed/agendar",
    );
  });

  it("removes the internal prefix only on the official CHRISMED host", () => {
    expect(toChrismedPublicPathname("chrismed.impulsionando.com.br", "/chrismed")).toBe("/");
    expect(toChrismedPublicPathname("chrismed.impulsionando.com.br", "/chrismed/agendar")).toBe(
      "/agendar",
    );
  });
});
