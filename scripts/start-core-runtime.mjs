import { spawn } from 'node:child_process';

const children = new Set();
let stopping = false;

function start(command, args, label) {
  const child = spawn(command, args, { stdio: 'inherit', env: process.env });
  children.add(child);
  child.on('exit', (code, signal) => {
    children.delete(child);
    if (!stopping && label === 'web') {
      console.error(`[Core Runtime] web exited code=${code} signal=${signal || ''}`);
      shutdown(code ?? 1);
    }
    if (!stopping && label === 'pulsonitor' && code && code !== 0) {
      console.error(`[Core Runtime] Pulsonitor exited code=${code}; web remains available.`);
    }
    if (!stopping && label === 'colors-automation' && code && code !== 0) {
      console.error(`[Core Runtime] Colors Automation exited code=${code}; web remains available.`);
    }
  });
  return child;
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try { child.kill('SIGTERM'); } catch {}
  }
  setTimeout(() => process.exit(exitCode), 1500).unref();
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

if (process.env.PULSONITOR_ENABLED === 'true') {
  start(process.execPath, ['scripts/pulsonitor-worker.mjs'], 'pulsonitor');
} else {
  console.log('[Core Runtime] Pulsonitor disabled; web runtime starting normally.');
}

if (process.env.COLORS_AUTOMATION_ENABLED !== 'false') {
  start(process.execPath, ['scripts/colors-automation-worker.mjs'], 'colors-automation');
}

start(process.execPath, ['.output/server/index.mjs'], 'web');
