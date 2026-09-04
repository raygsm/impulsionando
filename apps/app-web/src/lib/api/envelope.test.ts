import { describe, expect, it } from "vitest";
import { ApiClientError, parseErrorEnvelope } from "@impulsionando/api-client";

describe("API error envelopes", () => {
  it("maps 401", () => {
    const err = parseErrorEnvelope(
      { error: { code: "UNAUTHENTICATED", message: "no session", correlationId: "c1" } },
      401,
      "fallback",
    );
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.unauthenticated).toBe(true);
    expect(err.correlationId).toBe("c1");
  });

  it("maps 403", () => {
    const err = parseErrorEnvelope(
      { error: { code: "FORBIDDEN", message: "no membership", correlationId: "c2" } },
      403,
      "fallback",
    );
    expect(err.forbidden).toBe(true);
  });

  it("maps 404 / 409 / 503", () => {
    expect(parseErrorEnvelope({ error: { code: "NOT_FOUND", message: "x", correlationId: "c" } }, 404, "f").notFound).toBe(
      true,
    );
    expect(parseErrorEnvelope({ error: { code: "CONFLICT", message: "x", correlationId: "c" } }, 409, "f").conflict).toBe(
      true,
    );
    expect(
      parseErrorEnvelope(
        { error: { code: "TENANT_ENTITLEMENTS_UNAVAILABLE", message: "x", correlationId: "c" } },
        503,
        "f",
      ).degraded,
    ).toBe(true);
  });
});
