/* eslint-disable @typescript-eslint/no-explicit-any -- external GitHub REST responses are compacted before returning. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertGitHubStaff, auditGitHubOperation } from "./audit.server";
import { githubRequest } from "./client.server";
import { DEFAULT_GITHUB_REPOSITORY, parseRepository } from "./policy";

const ReadSchema = z.object({
  repository: z.string().default(DEFAULT_GITHUB_REPOSITORY),
  kind: z.enum(["repository", "pull_requests", "issues", "checks", "actions"]),
  ref: z.string().max(200).default("main"),
  limit: z.number().int().min(1).max(100).default(30),
});

function compact(kind: string, value: any): unknown {
  if (kind === "repository")
    return {
      fullName: value.full_name,
      private: value.private,
      defaultBranch: value.default_branch,
      visibility: value.visibility,
      archived: value.archived,
      updatedAt: value.updated_at,
    };
  if (kind === "pull_requests")
    return value.map((x: any) => ({
      number: x.number,
      title: x.title,
      state: x.state,
      draft: x.draft,
      author: x.user?.login,
      head: x.head?.ref,
      base: x.base?.ref,
      updatedAt: x.updated_at,
    }));
  if (kind === "issues")
    return value
      .filter((x: any) => !x.pull_request)
      .map((x: any) => ({
        number: x.number,
        title: x.title,
        state: x.state,
        author: x.user?.login,
        labels: x.labels?.map((label: any) => label.name),
        updatedAt: x.updated_at,
      }));
  if (kind === "checks")
    return (value.check_runs ?? []).map((x: any) => ({
      id: x.id,
      name: x.name,
      status: x.status,
      conclusion: x.conclusion,
      startedAt: x.started_at,
      completedAt: x.completed_at,
    }));
  return (value.workflow_runs ?? []).map((x: any) => ({
    id: x.id,
    name: x.name,
    event: x.event,
    status: x.status,
    conclusion: x.conclusion,
    branch: x.head_branch,
    sha: x.head_sha?.slice(0, 12),
    createdAt: x.created_at,
  }));
}

export const readGitHubResource = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReadSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertGitHubStaff(context.supabase, context.userId);
    const repo = parseRepository(data.repository);
    const base = `/repos/${repo.owner}/${repo.repo}`;
    const path =
      data.kind === "repository"
        ? base
        : data.kind === "pull_requests"
          ? `${base}/pulls?state=all&per_page=${data.limit}`
          : data.kind === "issues"
            ? `${base}/issues?state=all&per_page=${data.limit}`
            : data.kind === "checks"
              ? `${base}/commits/${encodeURIComponent(data.ref)}/check-runs?per_page=${data.limit}`
              : `${base}/actions/runs?per_page=${data.limit}`;
    try {
      const result = await githubRequest<any>(data.repository, path);
      await auditGitHubOperation({
        actorId: context.userId,
        operation: `read.${data.kind}`,
        repository: data.repository,
        outcome: "succeeded",
        metadata: { limit: data.limit },
      });
      return compact(data.kind, result);
    } catch (error) {
      await auditGitHubOperation({
        actorId: context.userId,
        operation: `read.${data.kind}`,
        repository: data.repository,
        outcome: "failed",
      });
      throw error;
    }
  });
