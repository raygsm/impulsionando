import { describe, expect, it } from "vitest";
import { resolveTenantPathFromHost } from "@impulsionando/tenant-host";

describe("Phase 4B — tenant-host contract", () => {
  it("TH-01: garrido subdomain → /garrido", () => {
    expect(resolveTenantPathFromHost("garrido.impulsionando.com.br")).toBe("/garrido");
  });

  it("TH-02: chrismed custom domain → /chrismed", () => {
    expect(resolveTenantPathFromHost("agenda.chrismed.com.br")).toBe("/chrismed");
  });

  it("TH-03: unknown host → null", () => {
    expect(resolveTenantPathFromHost("unknown-tenant-xyz.impulsionando.com.br")).toBe(
      "/vitrine/unknown-tenant-xyz",
    );
  });

  it("TH-04: reserved subdomain api → null", () => {
    expect(resolveTenantPathFromHost("api.impulsionando.com.br")).toBeNull();
  });
});
