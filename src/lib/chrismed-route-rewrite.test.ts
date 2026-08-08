import { describe, expect, it } from "vitest";
import { chrismedRouteInput, chrismedRouteOutput } from "./chrismed-route-rewrite";

describe("CHRISMED route rewrite", () => {
  it("maps clean public URLs to the internal route tree", () => {
    expect(chrismedRouteInput({
      url: new URL("https://chrismed.impulsionando.com.br/agendar?utm_source=google"),
    })?.href).toBe("https://chrismed.impulsionando.com.br/chrismed/agendar?utm_source=google");
    expect(chrismedRouteInput({
      url: new URL("https://chrismed.impulsionando.com.br/ocupacional/agendar"),
    })?.pathname).toBe("/chrismed/ocupacional/agendar");
  });

  it("publishes internal CHRISMED routes without the duplicated prefix", () => {
    expect(chrismedRouteOutput({
      url: new URL("https://chrismed.impulsionando.com.br/chrismed/internacional"),
    })?.href).toBe("https://chrismed.impulsionando.com.br/internacional");
    expect(chrismedRouteOutput({
      url: new URL("https://chrismed.impulsionando.com.br/chrismed"),
    })?.href).toBe("https://chrismed.impulsionando.com.br/");
  });

  it("does not rewrite auth, administration, APIs or other tenants", () => {
    expect(chrismedRouteInput({ url: new URL("https://chrismed.impulsionando.com.br/auth") }))
      .toBeUndefined();
    expect(chrismedRouteInput({ url: new URL("https://chrismed.impulsionando.com.br/admin") }))
      .toBeUndefined();
    expect(chrismedRouteInput({ url: new URL("https://chrismed.impulsionando.com.br/api/health") }))
      .toBeUndefined();
    expect(chrismedRouteInput({ url: new URL("https://impulsionando.com.br/agendar") }))
      .toBeUndefined();
  });
});
