/* eslint-disable @typescript-eslint/no-explicit-any -- untrusted webhook JSON is reduced to an allow-listed summary. */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const GITHUB_WEBHOOK_EVENTS = new Set([
  "installation",
  "installation_repositories",
  "push",
  "pull_request",
  "issues",
  "check_run",
  "check_suite",
  "workflow_run",
  "workflow_job",
]);

export function verifyGitHubWebhook(
  raw: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature?.startsWith("sha256=") || secret.length < 20) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function hashWebhookPayload(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function extractWebhookSummary(payload: any) {
  return {
    repository: payload?.repository?.full_name ?? null,
    sender: payload?.sender?.login ?? null,
    action: typeof payload?.action === "string" ? payload.action.slice(0, 100) : null,
  };
}
