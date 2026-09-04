import { describe, expect, it } from "vitest";
import { healthPayload } from "./env";

describe("health identity", () => {
  it("exposes gitSha from env", () => {
    process.env.GIT_SHA = "deadbeefcafebabe";
    const payload = healthPayload();
    expect(payload.gitSha).toBe("deadbeefcafebabe");
    expect(payload.gitSha).not.toBe("latest");
    expect(payload.service).toBe("impulsionando-app-web");
  });
});
