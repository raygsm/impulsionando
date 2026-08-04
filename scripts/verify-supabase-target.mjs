const required = [
  "PGHOST",
  "PGPORT",
  "PGUSER",
  "PGPASSWORD",
  "PGDATABASE",
  "SUPABASE_PROJECT_ID",
  "VITE_SUPABASE_PROJECT_ID",
  "SUPABASE_URL",
  "VITE_SUPABASE_URL",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  throw new Error(`Missing required deployment variables: ${missing.join(", ")}`);
}

const projectId = process.env.SUPABASE_PROJECT_ID.trim();
const publicProjectId = process.env.VITE_SUPABASE_PROJECT_ID.trim();
if (projectId !== publicProjectId) {
  throw new Error("Supabase project IDs do not match");
}

const expectedHost = `${projectId}.supabase.co`;
for (const name of ["SUPABASE_URL", "VITE_SUPABASE_URL"]) {
  const hostname = new URL(process.env[name]).hostname;
  if (hostname !== expectedHost) {
    throw new Error(`${name} does not target the configured Supabase project`);
  }
}

const databaseUser = process.env.PGUSER.trim();
const databaseHost = process.env.PGHOST.trim();
const directTarget = databaseHost === `db.${projectId}.supabase.co` && databaseUser === "postgres";
const poolerTarget = databaseUser === `postgres.${projectId}`;
if (!directTarget && !poolerTarget) {
  throw new Error("Database credentials do not target the configured Supabase project");
}

console.log(`Supabase target verified for project ${projectId}`);
