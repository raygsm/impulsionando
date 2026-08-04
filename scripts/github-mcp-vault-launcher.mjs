import { spawn } from "node:child_process";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Supabase server bootstrap is not configured");
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

const configResponse = await fetch(
  `${url}/rest/v1/core_integrations?slug=eq.github-app&select=config,is_active`,
  { headers },
);
if (!configResponse.ok) throw new Error("GitHub App configuration is unavailable");
const [row] = await configResponse.json();
if (
  !row?.is_active ||
  !/^\d+$/.test(String(row.config?.app_id)) ||
  !/^\d+$/.test(String(row.config?.installation_id))
) {
  throw new Error("GitHub App IDs are not configured");
}
const secretResponse = await fetch(`${url}/rest/v1/rpc/get_github_app_vault_secret`, {
  method: "POST",
  headers,
  body: JSON.stringify({ _name: "GITHUB_APP_PRIVATE_KEY" }),
});
if (!secretResponse.ok) throw new Error("GitHub App private key is unavailable");
let privateKey = await secretResponse.json();

const child = spawn(
  "docker",
  [
    "run",
    "--rm",
    "-i",
    "-e",
    "GITHUB_APP_ID",
    "-e",
    "GITHUB_APP_INSTALLATION_ID",
    "-e",
    "GITHUB_APP_PRIVATE_KEY",
    "-e",
    "GITHUB_READ_ONLY",
    "-e",
    "GITHUB_TOOLSETS",
    "ghcr.io/github/github-mcp-server:v1.0.5",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      GITHUB_APP_ID: String(row.config.app_id),
      GITHUB_APP_INSTALLATION_ID: String(row.config.installation_id),
      GITHUB_APP_PRIVATE_KEY: privateKey,
      GITHUB_READ_ONLY: "1",
      GITHUB_TOOLSETS: "context,repos,issues,pull_requests,actions",
    },
  },
);
privateKey = undefined;
child.on("exit", (code, signal) => (process.exitCode = code ?? (signal ? 1 : 0)));
