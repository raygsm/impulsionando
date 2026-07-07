#!/usr/bin/env bun
/**
 * Auditoria de consistência entre migrations em supabase/migrations/
 * e o schema real do banco (information_schema).
 *
 * Uso:
 *   bun scripts/audit-schema.ts
 *
 * Requer variáveis de ambiente:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Exit codes:
 *   0 - sem drift
 *   1 - drift detectado (tabelas órfãs ou migrations não aplicadas)
 *   2 - erro de execução
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const MIGRATIONS_DIR = "supabase/migrations";

async function extractTablesFromMigrations(): Promise<Set<string>> {
  const tables = new Set<string>();
  let files: string[] = [];
  try {
    files = await readdir(MIGRATIONS_DIR);
  } catch (e) {
    console.error(`❌ Não foi possível ler ${MIGRATIONS_DIR}:`, (e as Error).message);
    process.exit(2);
  }

  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();
  const createRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["`]?(\w+)["`]?/gi;
  const dropRegex = /drop\s+table\s+(?:if\s+exists\s+)?(?:public\.)?["`]?(\w+)["`]?/gi;

  for (const file of sqlFiles) {
    const content = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
    const lower = content.toLowerCase();
    for (const m of lower.matchAll(createRegex)) tables.add(m[1]);
    for (const m of lower.matchAll(dropRegex)) tables.delete(m[1]);
  }
  return tables;
}

async function fetchDbTables(): Promise<Set<string>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
    process.exit(2);
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .rpc("exec_sql", {
      sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    })
    .single();

  // Fallback: raw REST call se RPC não existir
  if (error) {
    const res = await fetch(`${url}/rest/v1/rpc/pg_tables?select=tablename&schemaname=eq.public`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      // Último fallback: cliente direto psql (se disponível)
      console.error("❌ Não foi possível listar tabelas via API. Rode com psql se necessário.");
      process.exit(2);
    }
    const rows = (await res.json()) as Array<{ tablename: string }>;
    return new Set(rows.map((r) => r.tablename));
  }
  const rows = data as unknown as Array<{ tablename: string }>;
  return new Set(rows.map((r) => r.tablename));
}

async function main() {
  console.log("🔍 Auditando consistência schema × migrations...\n");
  const [fromMigrations, fromDb] = await Promise.all([
    extractTablesFromMigrations(),
    fetchDbTables(),
  ]);

  const orphansInDb = [...fromDb].filter((t) => !fromMigrations.has(t)).sort();
  const missingInDb = [...fromMigrations].filter((t) => !fromDb.has(t)).sort();

  console.log(`📄 Tabelas declaradas em migrations: ${fromMigrations.size}`);
  console.log(`🗄️  Tabelas no banco (public):         ${fromDb.size}\n`);

  let hasIssues = false;

  if (orphansInDb.length > 0) {
    hasIssues = true;
    console.log("⚠️  Tabelas no banco SEM migration correspondente (drift):");
    for (const t of orphansInDb) console.log(`   - ${t}`);
    console.log();
  }

  if (missingInDb.length > 0) {
    hasIssues = true;
    console.log("⚠️  Migrations declaram tabelas AUSENTES no banco:");
    for (const t of missingInDb) console.log(`   - ${t}`);
    console.log();
  }

  if (!hasIssues) {
    console.log("✅ Schema e migrations consistentes.");
    process.exit(0);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error("❌ Falha na auditoria:", e);
  process.exit(2);
});
