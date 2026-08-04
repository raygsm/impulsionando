import { assertRepositoryAllowed, sanitizeGitHubError } from "./policy";
import { getGitHubAppConfig, getInstallationToken, githubApiHeaders } from "./auth.server";

const GITHUB_API = "https://api.github.com";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  profile?: "read" | "issue_write" | "branch_write" | "draft_pull_request_write";
};

export async function githubRequest<T>(
  repository: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const config = await getGitHubAppConfig();
  assertRepositoryAllowed(repository, config.repositoryAllowlist);
  if (!path.startsWith("/") || path.includes("..")) throw new Error("invalid_github_api_path");

  const token = await getInstallationToken(repository, options.profile ?? "read");
  const response = await fetch(`${GITHUB_API}${path}`, {
    method: options.method ?? "GET",
    headers: githubApiHeaders(token),
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const requestId = response.headers.get("x-github-request-id") ?? "unknown";
    throw new Error(`github_api_${response.status}:${requestId}`);
  }
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(`github_api_invalid_json:${sanitizeGitHubError(error)}`);
  }
}
