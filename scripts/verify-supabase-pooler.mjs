const host = process.env.PGHOST || "";
const port = process.env.PGPORT || "";
const user = process.env.PGUSER || "";
const database = process.env.PGDATABASE || "";

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

if (!host || !port || !user || !database) {
  fail("Missing PGHOST/PGPORT/PGUSER/PGDATABASE secrets.");
}

if (/^db\.[a-z0-9-]+\.supabase\.co$/i.test(host)) {
  fail("PGHOST is the direct Supabase database host, which requires IPv6 on GitHub runners. Use the IPv4 Transaction pooler host from Supabase Dashboard > Connect > Transaction pooler.");
}

if (!/pooler\.supabase\.com$/i.test(host)) {
  fail("PGHOST must be the Supabase Transaction pooler host ending in pooler.supabase.com.");
}

if (port !== "6543") {
  fail("PGPORT must be 6543 for the Supabase Transaction pooler.");
}

if (!/^postgres\.[a-z0-9]+$/i.test(user)) {
  fail("PGUSER must use the Transaction pooler format postgres.<project-ref>, not plain postgres.");
}

console.log(`Supabase Transaction pooler verified: ${host}:${port}/${database}`);
