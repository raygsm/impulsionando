/* eslint-disable @typescript-eslint/no-explicit-any -- GitHub REST payloads and not-yet-generated migration tables are runtime-validated. */
import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertGitHubStaff, auditGitHubOperation } from "./audit.server";
import { getGitHubAppConfig } from "./auth.server";
import { githubRequest } from "./client.server";
import {
  assertRepositoryAllowed,
  DEFAULT_GITHUB_REPOSITORY,
  isGitHubMasterEmail,
  parseRepository,
  sanitizeGitHubError,
} from "./policy";

const BranchName = z
  .string()
  .min(1)
  .max(200)
  .regex(/^(?!\/|.*(?:\.\.|\/\/|@\{|\\))[A-Za-z0-9._/-]+$/)
  .refine((name) => !["main", "master", "develop", "production"].includes(name.toLowerCase()));
const Payload = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("issue.create"),
    payload: z.object({
      title: z.string().min(1).max(256),
      body: z.string().max(20_000).default(""),
      labels: z.array(z.string().max(100)).max(20).default([]),
    }),
  }),
  z.object({
    action: z.literal("branch.create"),
    payload: z.object({ branch: BranchName, base: BranchName.or(z.literal("main")) }),
  }),
  z.object({
    action: z.literal("pull_request.create_draft"),
    payload: z.object({
      title: z.string().min(1).max(256),
      body: z.string().max(20_000).default(""),
      head: BranchName,
      base: z.string().min(1).max(200).default("main"),
    }),
  }),
]);
const RequestSchema = z
  .object({
    repository: z.string().default(DEFAULT_GITHUB_REPOSITORY),
    rationale: z.string().min(10).max(2000),
  })
  .and(Payload);

async function requireMaster(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !isGitHubMasterEmail(data.user?.email))
    throw new Error("github_master_approval_required");
}

export const requestGitHubWrite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertGitHubStaff(context.supabase, context.userId);
    const config = await getGitHubAppConfig();
    assertRepositoryAllowed(data.repository, config.repositoryAllowlist);
    const idempotency = createHash("sha256")
      .update(JSON.stringify([context.userId, data.repository, data.action, data.payload]))
      .digest("hex");
    const { data: row, error } = await (context.supabase as any)
      .from("github_app_approval_requests")
      .insert({
        requested_by: context.userId,
        repository: data.repository,
        action: data.action,
        payload: data.payload,
        rationale: data.rationale,
        idempotency_key: idempotency,
      })
      .select("id,status,created_at")
      .single();
    if (error)
      throw new Error(
        error.code === "23505" ? "github_request_already_exists" : "github_request_failed",
      );
    await auditGitHubOperation({
      actorId: context.userId,
      operation: data.action,
      repository: data.repository,
      approvalRequestId: row.id,
      outcome: "allowed",
      metadata: { phase: "requested" },
    });
    return row;
  });

export const listGitHubWriteRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(100).default(50) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase as any)
      .from("github_app_approval_requests")
      .select(
        "id,requested_by,repository,action,payload,rationale,status,approved_by,approved_at,decision_note,executed_at,result_summary,error_code,created_at,updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error("github_request_list_failed");
    return rows ?? [];
  });

export const decideGitHubWrite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireMaster(context.userId);
    const { data: row, error } = await (context.supabase as any)
      .from("github_app_approval_requests")
      .update({
        status: data.decision,
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
        decision_note: data.note ?? null,
      })
      .eq("id", data.id)
      .eq("status", "pending")
      .select("id,status,repository,action")
      .single();
    if (error || !row) throw new Error("github_request_not_pending");
    await auditGitHubOperation({
      actorId: context.userId,
      operation: row.action,
      repository: row.repository,
      approvalRequestId: row.id,
      outcome: data.decision === "approved" ? "allowed" : "denied",
      metadata: { phase: "decision" },
    });
    return { id: row.id, status: row.status };
  });

async function executeAction(row: any) {
  const repo = parseRepository(row.repository);
  const base = `/repos/${repo.owner}/${repo.repo}`;
  if (row.action === "issue.create") {
    const result = await githubRequest<any>(row.repository, `${base}/issues`, {
      method: "POST",
      profile: "issue_write",
      body: row.payload,
    });
    return { number: result.number, url: result.html_url };
  }
  if (row.action === "branch.create") {
    const source = await githubRequest<any>(
      row.repository,
      `${base}/git/ref/heads/${encodeURIComponent(row.payload.base)}`,
    );
    const result = await githubRequest<any>(row.repository, `${base}/git/refs`, {
      method: "POST",
      profile: "branch_write",
      body: { ref: `refs/heads/${row.payload.branch}`, sha: source.object.sha },
    });
    return { ref: result.ref, sha: result.object.sha };
  }
  const result = await githubRequest<any>(row.repository, `${base}/pulls`, {
    method: "POST",
    profile: "draft_pull_request_write",
    body: { ...row.payload, draft: true },
  });
  return { number: result.number, url: result.html_url, draft: true };
}

export const executeApprovedGitHubWrite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireMaster(context.userId);
    const { data: row } = await (supabaseAdmin as any)
      .from("github_app_approval_requests")
      .update({ status: "executing" })
      .eq("id", data.id)
      .eq("status", "approved")
      .select("*")
      .single();
    if (!row) throw new Error("github_request_not_approved");
    try {
      const result = await executeAction(row);
      await (supabaseAdmin as any)
        .from("github_app_approval_requests")
        .update({
          status: "executed",
          executed_at: new Date().toISOString(),
          result_summary: result,
        })
        .eq("id", row.id)
        .eq("status", "executing");
      await auditGitHubOperation({
        actorId: context.userId,
        operation: row.action,
        repository: row.repository,
        approvalRequestId: row.id,
        outcome: "succeeded",
      });
      return { id: row.id, status: "executed", result };
    } catch (error) {
      const code = sanitizeGitHubError(error).split(":")[0].slice(0, 100);
      await (supabaseAdmin as any)
        .from("github_app_approval_requests")
        .update({ status: "failed", error_code: code })
        .eq("id", row.id)
        .eq("status", "executing");
      await auditGitHubOperation({
        actorId: context.userId,
        operation: row.action,
        repository: row.repository,
        approvalRequestId: row.id,
        outcome: "failed",
        metadata: { errorCode: code },
      });
      throw new Error(code);
    }
  });
