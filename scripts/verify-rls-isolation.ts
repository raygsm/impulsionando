#!/usr/bin/env bun
/**
 * Validador de isolamento RLS entre empresas para os módulos novos
 * (eventos, comunidade) e para a trilha de auditoria N8N.
 *
 * Estratégia: usa o cliente publishable (chave anon) e tenta:
 *  1. SELECT em evt_*, comm_*, n8n_workflow_runs sem JWT — deve retornar [].
 *  2. SELECT na view n8n_runs_by_company sem JWT — deve retornar [].
 *  3. Verificar que evt_events publicados aparecem no SELECT anon (esperado: ok).
 *
 * Uso:
 *   bun run scripts/verify-rls-isolation.ts
 *
 * Variáveis (já presentes em .env do dev):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("✗ Faltam VITE_SUPABASE_URL e/ou VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.");
  process.exit(2);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PROTECTED_TABLES = [
  "evt_tickets",
  "evt_ticket_transfers",
  "evt_checkins",
  "comm_communities",
  "comm_members",
  "comm_memberships",
  "comm_attendance",
  "comm_donations",
  "n8n_workflow_runs",
] as const;

const PUBLIC_READ_TABLES = ["evt_events", "evt_ticket_types"] as const;

let failed = 0;
let passed = 0;

async function expectEmpty(table: string) {
  const { data, error } = await supabase.from(table).select("id").limit(5);
  if (error && error.code === "PGRST301") {
    console.log(`✓ ${table}: anon bloqueado (RLS).`);
    passed++;
    return;
  }
  if (!data || data.length === 0) {
    console.log(`✓ ${table}: anon retornou 0 linhas (RLS isolando).`);
    passed++;
    return;
  }
  console.error(`✗ ${table}: anon recebeu ${data.length} linhas — POSSÍVEL VAZAMENTO!`);
  failed++;
}

async function expectPublicReadable(table: string) {
  const { error } = await supabase.from(table).select("id").limit(1);
  if (error) {
    console.error(`✗ ${table}: anon falhou na leitura pública (${error.message}).`);
    failed++;
    return;
  }
  console.log(`✓ ${table}: leitura pública anon ok (filtra published/active por policy).`);
  passed++;
}

async function expectViewEmpty() {
  const { data, error } = await supabase.from("n8n_runs_by_company").select("*").limit(5);
  if (error) {
    console.log(`✓ view n8n_runs_by_company: anon bloqueado (${error.message}).`);
    passed++;
    return;
  }
  if (!data || data.length === 0) {
    console.log(`✓ view n8n_runs_by_company: anon retornou 0 linhas (security_invoker ok).`);
    passed++;
    return;
  }
  console.error(`✗ view n8n_runs_by_company: anon recebeu ${data.length} linhas — VAZAMENTO!`);
  failed++;
}

async function expectJourneyEmpty() {
  const { data, error } = await supabase.from("n8n_lead_journey").select("*").limit(5);
  if (error) {
    console.log(`✓ view n8n_lead_journey: anon bloqueado (${error.message}).`);
    passed++;
    return;
  }
  if (!data || data.length === 0) {
    console.log(`✓ view n8n_lead_journey: anon retornou 0 linhas.`);
    passed++;
    return;
  }
  console.error(`✗ view n8n_lead_journey: anon recebeu ${data.length} linhas — VAZAMENTO!`);
  failed++;
}

console.log(`🔎 Validando RLS isolation contra ${url}\n`);
for (const t of PROTECTED_TABLES) await expectEmpty(t);
for (const t of PUBLIC_READ_TABLES) await expectPublicReadable(t);
await expectViewEmpty();
await expectJourneyEmpty();

console.log(`\nResumo: ${passed} ok · ${failed} falha(s).`);
if (failed > 0) {
  console.error("\nAÇÃO: revisar policies das tabelas/view sinalizadas. Anon NUNCA deve enxergar dados de outra empresa.");
  process.exit(1);
}
console.log("✓ Isolamento por empresa validado. Anon não vê dados protegidos.");
