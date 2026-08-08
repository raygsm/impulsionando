#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function fail(message) {
  console.error(`::error::${message}`);
  process.exitCode = 1;
}

function readProjectIdFromConfig() {
  const configPath = resolve(repoRoot, 'supabase/config.toml');
  const content = readFileSync(configPath, 'utf8');
  const match = content.match(/^project_id\s*=\s*"([^"]+)"\s*$/m);
  if (!match) throw new Error('supabase/config.toml does not declare project_id');
  return match[1];
}

function env(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function hostFromUrl(name, value) {
  try {
    return new URL(value).hostname;
  } catch {
    fail(`${name} is not a valid URL`);
    return '';
  }
}

const expectedProjectId = readProjectIdFromConfig();
const required = [
  'SUPABASE_PROJECT_ID',
  'VITE_SUPABASE_PROJECT_ID',
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'PGHOST',
  'PGPORT',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE',
];

for (const name of required) {
  if (!env(name)) fail(`${name} is required for apply-supabase-migrations.yml`);
}

for (const name of ['SUPABASE_PROJECT_ID', 'VITE_SUPABASE_PROJECT_ID']) {
  const value = env(name);
  if (value && value !== expectedProjectId) {
    fail(`${name} (${value}) does not match supabase/config.toml project_id (${expectedProjectId})`);
  }
}

for (const name of ['SUPABASE_URL', 'VITE_SUPABASE_URL']) {
  const value = env(name);
  if (!value) continue;
  const host = hostFromUrl(name, value);
  if (host && !host.includes(expectedProjectId)) {
    fail(`${name} host (${host}) does not include expected project id (${expectedProjectId})`);
  }
}

const pgPort = Number(env('PGPORT'));
if (!Number.isInteger(pgPort) || pgPort < 1 || pgPort > 65535) {
  fail(`PGPORT must be an integer between 1 and 65535; received ${env('PGPORT') || '<empty>'}`);
}

const pgHost = env('PGHOST');
if (pgHost && !/[a-z0-9.-]+/i.test(pgHost)) {
  fail('PGHOST contains invalid characters');
}

if (process.exitCode) process.exit(process.exitCode);

console.log(`Supabase target verified for project ${expectedProjectId}.`);
