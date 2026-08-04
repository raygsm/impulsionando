import { describe, expect, it } from "vitest";
import { assertRepositoryAllowed, isGitHubMasterEmail, sanitizeGitHubError } from "./policy";

describe("GitHub App policy", () => {
  it("uses an exact master identity", () => {
    expect(isGitHubMasterEmail("raygs@hotmail.com")).toBe(true);
    expect(isGitHubMasterEmail("raygs+admin@hotmail.com")).toBe(false);
    expect(isGitHubMasterEmail("attacker@example.com")).toBe(false);
  });
  it("rejects repositories outside the allowlist", () => {
    expect(() => assertRepositoryAllowed("other/repo", ["raygsm/impulsionando"])).toThrow(
      "repository_not_allowed",
    );
  });
  it("redacts credentials from errors", () => {
    expect(sanitizeGitHubError(new Error("ghp_abcdefghijklmnop"))).not.toContain("ghp_");
    expect(
      sanitizeGitHubError(new Error("-----BEGIN PRIVATE KEY-----abc-----END PRIVATE KEY-----")),
    ).toContain("REDACTED");
  });
});
