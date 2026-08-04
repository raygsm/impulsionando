import { z } from "zod";
import { GITHUB_WRITE_ACTIONS, type GitHubRepositoryRef, type GitHubWriteAction } from "./types.ts";

export const GITHUB_MASTER_EMAIL = "raygs@hotmail.com";
export const DEFAULT_GITHUB_REPOSITORY = "raygsm/impulsionando";

const SegmentSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_.-]+$/);

export function parseRepository(value: string): GitHubRepositoryRef {
  const [owner, repo, ...extra] = value.trim().split("/");
  if (extra.length > 0) throw new Error("invalid_repository");
  return {
    owner: SegmentSchema.parse(owner),
    repo: SegmentSchema.parse(repo),
    fullName: `${owner}/${repo}`,
  };
}

export function assertRepositoryAllowed(repository: string, allowlist: readonly string[]) {
  const parsed = parseRepository(repository);
  const normalized = new Set(allowlist.map((item) => item.toLowerCase()));
  if (!normalized.has(parsed.fullName.toLowerCase())) throw new Error("repository_not_allowed");
  return parsed;
}

export function isGitHubMasterEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === GITHUB_MASTER_EMAIL;
}

export function assertWriteAction(value: string): asserts value is GitHubWriteAction {
  if (!(GITHUB_WRITE_ACTIONS as readonly string[]).includes(value)) {
    throw new Error("github_write_action_not_allowed");
  }
}

export function sanitizeGitHubError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/gh[opsu]_[A-Za-z0-9_]+/g, "[REDACTED_TOKEN]")
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, "[REDACTED_KEY]")
    .slice(0, 500);
}
