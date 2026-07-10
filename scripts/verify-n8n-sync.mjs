#!/usr/bin/env node
// Verifica sincronização entre workflows N8N fonte (docs/n8n/workflows/**)
// e espelho público (public/downloads/n8n/**). Falha o CI em divergência.

import { readFileSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

const SRC = "docs/n8n/workflows";
const MIRROR = "public/downloads/n8n";

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.isFile() && e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

const srcFiles = await walk(SRC);
const problems = [];

for (const src of srcFiles) {
  const rel = relative(SRC, src);
  const mirror = join(MIRROR, rel);
  try {
    statSync(mirror);
  } catch {
    problems.push(`FALTA no espelho: ${mirror}`);
    continue;
  }
  if (md5(src) !== md5(mirror)) {
    problems.push(`DIVERGE: ${rel}`);
  }
}

if (problems.length) {
  console.error("Sincronização N8N com divergências:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}

console.log(`OK — ${srcFiles.length} workflows sincronizados.`);
