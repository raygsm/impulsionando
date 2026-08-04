export const GITHUB_WRITE_ACTIONS = [
  "issue.create",
  "branch.create",
  "pull_request.create_draft",
] as const;

export type GitHubWriteAction = (typeof GITHUB_WRITE_ACTIONS)[number];

export type GitHubRepositoryRef = {
  owner: string;
  repo: string;
  fullName: string;
};

export type GitHubApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executing"
  | "executed"
  | "failed";

export type GitHubApprovalRequest = {
  id: string;
  requested_by: string;
  repository: string;
  action: GitHubWriteAction;
  payload: Record<string, unknown>;
  rationale: string;
  status: GitHubApprovalStatus;
  idempotency_key: string;
  approved_by: string | null;
  approved_at: string | null;
  decision_note: string | null;
  executed_at: string | null;
  result_summary: Record<string, unknown> | null;
  error_code: string | null;
  created_at: string;
  updated_at: string;
};
