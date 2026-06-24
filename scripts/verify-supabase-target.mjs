import { readFileSync } from "node:fs";

const config = readFileSync("supabase/config.toml", "utf8");
const match = config.match(/^\s*project_id\s*=\s*"([^"]+)"/m);

if (!match) {
  console.error("::error::supabase/config.toml does not declare project_id.");
  process.exit(1);
}

const expectedProjectId = match[1];

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function assertProjectId(name, value) {
  if (!value) return;
  if (value !== expectedProjectId) {
    fail(`${name} points to ${value}, but supabase/config.toml expects ${expectedProjectId}. Refusing to run against the wrong Supabase project.`);
  }
}

function assertSupabaseUrl(name, value) {
  if (!value) return;
  let host;
  try {
    host = new URL(value).hostname;
  } catch {
    fail(`${name} is not a valid URL.`);
  }

  const expectedHost = `${expectedProjectId}.supabase.co`;
  if (host !== expectedHost) {
    fail(`${name} points to ${host}, but supabase/config.toml expects ${expectedHost}. Refusing to run against the wrong Supabase project.`);
  }
}

assertProjectId("SUPABASE_PROJECT_ID", process.env.SUPABASE_PROJECT_ID);
assertProjectId("VITE_SUPABASE_PROJECT_ID", process.env.VITE_SUPABASE_PROJECT_ID);
assertSupabaseUrl("SUPABASE_URL", process.env.SUPABASE_URL);
assertSupabaseUrl("VITE_SUPABASE_URL", process.env.VITE_SUPABASE_URL);

console.log(`Supabase target verified: ${expectedProjectId}`);
