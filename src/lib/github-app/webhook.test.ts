import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { extractWebhookSummary, hashWebhookPayload, verifyGitHubWebhook } from "./webhook.server";

describe("GitHub webhook verification", () => {
  const secret = "a-strong-webhook-secret-value";
  const raw = JSON.stringify({
    action: "opened",
    repository: { full_name: "raygsm/impulsionando" },
    sender: { login: "octocat" },
  });
  it("accepts only the matching HMAC", () => {
    const signature = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
    expect(verifyGitHubWebhook(raw, signature, secret)).toBe(true);
    expect(verifyGitHubWebhook(`${raw}x`, signature, secret)).toBe(false);
  });
  it("stores only a digest and minimal summary", () => {
    expect(hashWebhookPayload(raw)).toHaveLength(64);
    expect(extractWebhookSummary(JSON.parse(raw))).toEqual({
      repository: "raygsm/impulsionando",
      sender: "octocat",
      action: "opened",
    });
  });
});
