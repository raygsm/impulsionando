#!/usr/bin/env node
import net from 'node:net';

const TIMEOUT_MS = Number(process.env.SUPABASE_POOLER_VERIFY_TIMEOUT_MS ?? 10000);

function env(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

const host = env('PGHOST');
const portRaw = env('PGPORT');
const user = env('PGUSER');
const password = env('PGPASSWORD');
const database = env('PGDATABASE');

for (const [name, value] of [
  ['PGHOST', host],
  ['PGPORT', portRaw],
  ['PGUSER', user],
  ['PGPASSWORD', password],
  ['PGDATABASE', database],
]) {
  if (!value) fail(`${name} is required for Supabase pooler verification`);
}

const port = Number(portRaw);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  fail(`PGPORT must be an integer between 1 and 65535; received ${portRaw}`);
}

await new Promise((resolve, reject) => {
  const socket = net.createConnection({ host, port });
  const timer = setTimeout(() => {
    socket.destroy(new Error(`Timed out connecting to ${host}:${port} after ${TIMEOUT_MS}ms`));
  }, TIMEOUT_MS);

  socket.once('connect', () => {
    clearTimeout(timer);
    socket.end();
    resolve();
  });

  socket.once('error', (error) => {
    clearTimeout(timer);
    reject(error);
  });
}).catch((error) => {
  fail(`Unable to reach Supabase pooler at ${host}:${port}: ${error.message}`);
});

console.log(`Supabase pooler TCP connection verified at ${host}:${port}.`);
