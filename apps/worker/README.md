# @impulsionando/worker — Phase 5 seed

Independent Node process (not co-started with TanStack SSR).

```bash
pnpm install --filter @impulsionando/worker...
pnpm --filter @impulsionando/worker start:dev
```

Emits JSON heartbeat every `WORKER_HEARTBEAT_MS` (default 60s).

**Not yet:** pgmq consumer, job handlers, prod deploy.
