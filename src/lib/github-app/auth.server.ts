/* eslint-disable @typescript-eslint/no-explicit-any -- migration RPC/config shapes are validated at the boundary. */
import { createSign } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertRepositoryAllowed, DEFAULT_GITHUB_REPOSITORY } from "./policy";

const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";
const PRIVATE_KEY_SECRET_NAME = "GITHUB_APP_PRIVATE_KEY";

type GitHubAppConfig = {
  appId: string;
  installationId: string;
  repositoryAllowlist: string[];
};

type InstallationToken = {
  token: string;
  expiresAt: number;
};

type PermissionProfile = "read" | "issue_write" | "branch_write" | "draft_pull_request_write";

const tokenCache = new Map<string, InstallationToken>();
let configCache: { value: GitHubAppConfig; expiresAt: number } | undefined;

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function createAppJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey.replace(/\\n/g, "\n"), "base64url");
  return `${unsigned}.${signature}`;
}

function permissionsFor(profile: PermissionProfile): Record<string, "read" | "write"> {
  if (profile === "issue_write") return { issues: "write" };
  if (profile === "branch_write") return { contents: "write" };
  if (profile === "draft_pull_request_write") {
    return { contents: "read", pull_requests: "write" };
  }
  return {
    actions: "read",
    checks: "read",
    contents: "read",
    issues: "read",
    pull_requests: "read",
  };
}

async function getVaultSecret(name: typeof PRIVATE_KEY_SECRET_NAME): Promise<string> {
  const { data, error } = await (supabaseAdmin as any).rpc("get_github_app_vault_secret", {
    _name: name,
  });
  if (error || typeof data !== "string" || data.length < 32) {
    throw new Error("github_app_secret_unavailable");
  }
  return data;
}

export async function getGitHubAppConfig(): Promise<GitHubAppConfig> {
  if (configCache && configCache.expiresAt > Date.now()) return configCache.value;

  const { data, error } = await (supabaseAdmin as any)
    .from("core_integrations")
    .select("config,is_active")
    .eq("slug", "github-app")
    .maybeSingle();
  if (error) throw new Error("github_app_config_unavailable");

  const dbConfig = (data?.config ?? {}) as Record<string, unknown>;
  const appId = String(dbConfig.app_id ?? process.env.GITHUB_APP_ID ?? "").trim();
  const installationId = String(
    dbConfig.installation_id ?? process.env.GITHUB_APP_INSTALLATION_ID ?? "",
  ).trim();
  const repositoryAllowlist = Array.isArray(dbConfig.repository_allowlist)
    ? dbConfig.repository_allowlist.map(String)
    : [DEFAULT_GITHUB_REPOSITORY];

  if (!data?.is_active || !/^\d+$/.test(appId) || !/^\d+$/.test(installationId)) {
    throw new Error("github_app_not_configured");
  }
  repositoryAllowlist.forEach((repository) =>
    assertRepositoryAllowed(repository, repositoryAllowlist),
  );

  const value = { appId, installationId, repositoryAllowlist };
  configCache = { value, expiresAt: Date.now() + 60_000 };
  return value;
}

export async function getInstallationToken(
  repository: string,
  profile: PermissionProfile = "read",
): Promise<string> {
  const config = await getGitHubAppConfig();
  const parsed = assertRepositoryAllowed(repository, config.repositoryAllowlist);
  const cacheKey = `${config.installationId}:${parsed.fullName.toLowerCase()}:${profile}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 120_000) return cached.token;

  const privateKey = await getVaultSecret(PRIVATE_KEY_SECRET_NAME);
  const jwt = createAppJwt(config.appId, privateKey);
  const response = await fetch(
    `${GITHUB_API}/app/installations/${config.installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        "User-Agent": "impulsionito-github-app",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
      body: JSON.stringify({
        repositories: [parsed.repo],
        permissions: permissionsFor(profile),
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error(`github_installation_token_http_${response.status}`);
  const body = (await response.json()) as { token?: string; expires_at?: string };
  if (!body.token || !body.expires_at) throw new Error("github_installation_token_invalid");

  const entry = { token: body.token, expiresAt: new Date(body.expires_at).getTime() };
  tokenCache.set(cacheKey, entry);
  return entry.token;
}

export const githubApiHeaders = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "User-Agent": "impulsionito-github-app",
  "X-GitHub-Api-Version": GITHUB_API_VERSION,
});
