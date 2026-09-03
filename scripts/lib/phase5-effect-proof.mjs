/**
 * Staging-only helper: prove job effects without printing secrets.
 * Prefers service_role RPC/table; falls back to internal worker logs on the clean host.
 */
import { spawnSync } from "node:child_process";

const CLEAN_HOST = "2.25.123.224";
const SSH_KEY = process.env.SSH_KEY || `${process.env.HOME}/.ssh/id_ed25519_impulsionando`;

export function ssh(remote) {
  const r = spawnSync(
    "ssh",
    [
      "-i",
      SSH_KEY,
      "-o",
      "BatchMode=yes",
      "-o",
      "StrictHostKeyChecking=accept-new",
      `root@${CLEAN_HOST}`,
      remote,
    ],
    { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
  );
  if (r.status !== 0) {
    throw new Error(`ssh_failed status=${r.status} stderr=${(r.stderr || "").slice(0, 200)}`);
  }
  return r.stdout;
}

export function workerLogsMentionJob(jobId) {
  const out = ssh(
    `docker service logs --since 15m reengineering-worker 2>&1 | grep -F ${JSON.stringify(jobId)} | grep -c smoke_echo || true`,
  );
  return Number(out.trim() || 0) > 0;
}

export function workerHealth() {
  const out = ssh(
    `CID=$(docker ps -q --filter label=com.docker.swarm.service.name=reengineering-worker | head -n1); test -n "$CID" && docker exec "$CID" node -e 'fetch("http://127.0.0.1:3200/health").then(r=>r.text()).then(t=>process.stdout.write(t))'`,
  );
  return JSON.parse(out);
}

export async function readEffectRow(admin, scopeKey) {
  const rpc = await admin.rpc("get_reengineering_job_effect", { p_scope_key: scopeKey });
  if (!rpc.error) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    return { row: row ?? null, source: "rpc", error: null };
  }
  const table = await admin
    .from("reengineering_job_effects")
    .select("scope_key, job_id, effect_type")
    .eq("scope_key", scopeKey)
    .maybeSingle();
  if (!table.error) {
    return { row: table.data ?? null, source: "table", error: null };
  }
  return {
    row: null,
    source: "denied",
    error: `rpc=${rpc.error.code || rpc.error.message};table=${table.error.code || table.error.message}`,
  };
}
