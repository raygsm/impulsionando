#!/usr/bin/env bun
/**
 * Validador ponta a ponta do endpoint público de logs N8N.
 *
 * Cobre:
 *  - assinatura HMAC válida → 200
 *  - assinatura ausente/inválida → 401
 *  - body inválido (schema Zod) com HMAC ok → 422
 *  - replay com mesmo idempotency_key → 200 sem duplicar linha
 *  - leitura via anon de n8n_workflow_runs continua bloqueada por RLS
 *
 * Uso:
 *   IMPULSIONANDO_WEBHOOK_SECRET=... bun run scripts/verify-n8n-hook.ts [baseUrl]
 *
 * baseUrl padrão: http://localhost:8080 (dev). Em produção:
 *   bun run scripts/verify-n8n-hook.ts https://impulsionando.com.br
 */
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const baseUrl = (process.argv[2] ?? "http://localhost:8080").replace(/\/$/, "");
const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET ?? "";
const supaUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supaKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

if (!secret) {
  console.error("✗ Faltou IMPULSIONANDO_WEBHOOK_SECRET no ambiente.");
  process.exit(2);
}

const endpoint = `${baseUrl}/api/public/hooks/n8n-log`;
let pass = 0;
let fail = 0;

function sign(body: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function post(body: string, headers: Record<string, string>) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
  const text = await res.text();
  return { status: res.status, text };
}

function assertEq(label: string, got: number, want: number) {
  if (got === want) {
    console.log(`✓ ${label} → ${got}`);
    pass++;
  } else {
    console.error(`✗ ${label} → esperado ${want}, recebido ${got}`);
    fail++;
  }
}

const runId = `verify-${Date.now()}`;
const validPayload = {
  workflow_name: "verify-script",
  regua: "captacao" as const,
  event_name: "verify.run",
  step: "validate",
  status: "ok" as const,
  channel: "internal" as const,
  idempotency_key: runId,
  payload: { source: "verify-n8n-hook.ts" },
};
const validBody = JSON.stringify(validPayload);

console.log(`🔎 ${endpoint}\n`);

// 1) HMAC válido
{
  const r = await post(validBody, { "x-impulsionando-signature": sign(validBody) });
  assertEq("HMAC válido", r.status, 200);
}

// 2) Sem assinatura
{
  const r = await post(validBody, {});
  assertEq("Sem assinatura → 401", r.status, 401);
}

// 3) Assinatura errada
{
  const r = await post(validBody, { "x-impulsionando-signature": "deadbeef" });
  assertEq("Assinatura inválida → 401", r.status, 401);
}

// 4) Body inválido com HMAC ok
{
  const bad = JSON.stringify({ workflow_name: "x" }); // faltam campos obrigatórios
  const r = await post(bad, { "x-impulsionando-signature": sign(bad) });
  assertEq("Body inválido → 422", r.status, 422);
}

// 5) Replay com mesmo idempotency_key
{
  const r = await post(validBody, { "x-impulsionando-signature": sign(validBody) });
  assertEq("Replay (mesmo idempotency_key) → 200", r.status, 200);
}

// 6) Idempotência: anon não pode ler, mas se houver service role no env, conferimos contagem
if (supaUrl && supaKey) {
  const anon = createClient(supaUrl, supaKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon
    .from("n8n_workflow_runs")
    .select("id")
    .eq("idempotency_key", runId);
  if (error) {
    console.log(`✓ anon bloqueado de ler n8n_workflow_runs (${error.message})`);
    pass++;
  } else if (!data || data.length === 0) {
    console.log("✓ anon não recebe linhas de n8n_workflow_runs (RLS ok).");
    pass++;
  } else {
    console.error(`✗ anon leu ${data.length} linha(s) de n8n_workflow_runs — VAZAMENTO!`);
    fail++;
  }
}

const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (supaUrl && service) {
  const admin = createClient(supaUrl, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin
    .from("n8n_workflow_runs")
    .select("id")
    .eq("idempotency_key", runId);
  if (error) {
    console.error(`✗ service role falhou ao consultar idempotência: ${error.message}`);
    fail++;
  } else if (data && data.length === 1) {
    console.log("✓ idempotência respeitada: exatamente 1 linha após replay.");
    pass++;
  } else {
    console.error(`✗ idempotência quebrada: ${data?.length ?? 0} linhas encontradas.`);
    fail++;
  }
} else {
  console.log("ℹ SUPABASE_SERVICE_ROLE_KEY ausente — pulei o check de contagem.");
}

console.log(`\nResumo: ${pass} ok · ${fail} falha(s).`);
process.exit(fail > 0 ? 1 : 0);
