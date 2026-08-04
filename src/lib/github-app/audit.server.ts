/* eslint-disable @typescript-eslint/no-explicit-any -- migration tables are intentionally accessed before generated DB types are refreshed. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function auditGitHubOperation(input: {
  actorId?: string | null;
  operation: string;
  repository?: string | null;
  approvalRequestId?: string | null;
  outcome: "allowed" | "denied" | "succeeded" | "failed";
  metadata?: Record<string, unknown>;
}) {
  const safeMetadata = Object.fromEntries(
    Object.entries(input.metadata ?? {}).filter(
      ([key]) => !/(token|secret|key|authorization|body|payload)/i.test(key),
    ),
  );
  await (supabaseAdmin as any).from("github_app_audit_log").insert({
    actor_id: input.actorId ?? null,
    operation: input.operation,
    repository: input.repository ?? null,
    approval_request_id: input.approvalRequestId ?? null,
    outcome: input.outcome,
    metadata: safeMetadata,
  });
}

export async function assertGitHubStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error || !data) throw new Error("github_access_denied");
}
