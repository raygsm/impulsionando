/**
 * Phase 5F — optional journey worker hook.
 * Behind WORKER_JOURNEY_ENABLED (default false).
 * Does not alter 5B job-consumer behavior. Sink/noop only — no real sends.
 * Ticks never throw; any unexpected failure is logged once.
 */
import { JOURNEY_ENV_NAMES } from "@impulsionando/contracts";
import { createOnceLogger, schemaMissingErrorMessage } from "../schema-missing";

export type JourneyHandlerStats = {
  enabled: boolean;
  startedAt: string | null;
  ticks: number;
  degraded: boolean;
};

let stats: JourneyHandlerStats = {
  enabled: false,
  startedAt: null,
  ticks: 0,
  degraded: false,
};

let interval: ReturnType<typeof setInterval> | null = null;
const tickFailOnce = createOnceLogger("journey_handler_tick_failed");

export function isJourneyWorkerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[JOURNEY_ENV_NAMES.WORKER_ENABLED] === "true";
}

export function getJourneyHandlerStats(): JourneyHandlerStats {
  return { ...stats };
}

/**
 * No-op heartbeat loop proving the flag is wired.
 * Future: drain journey-related outbox/jobs. Never sends email/WhatsApp.
 */
export function startJourneyHandlerIfEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (!isJourneyWorkerEnabled(env)) {
    stats = { enabled: false, startedAt: null, ticks: 0, degraded: false };
    return false;
  }

  if (interval) return true;

  stats = {
    enabled: true,
    startedAt: new Date().toISOString(),
    ticks: 0,
    degraded: false,
  };

  const heartbeatMs = Number(env.WORKER_JOURNEY_HEARTBEAT_MS || 60_000);

  interval = setInterval(() => {
    try {
      stats.ticks += 1;
      if (stats.degraded) {
        stats.degraded = false;
        tickFailOnce.reset();
      }
      console.log(
        JSON.stringify({
          ok: true,
          service: "impulsionando-worker",
          event: "journey_handler_tick",
          ticks: stats.ticks,
          sink: true,
          at: new Date().toISOString(),
        }),
      );
    } catch (err) {
      stats.degraded = true;
      tickFailOnce.log(schemaMissingErrorMessage(err), {
        note: "Phase 5F journey handler tick failed — continuing; no provider sends",
      });
    }
  }, heartbeatMs);

  console.log(
    JSON.stringify({
      ok: true,
      service: "impulsionando-worker",
      event: "journey_handler_started",
      note: "Phase 5F sink/noop — no provider sends; WORKER_JOURNEY_ENABLED default off",
      at: new Date().toISOString(),
    }),
  );

  return true;
}

export function stopJourneyHandler(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  stats = { ...stats, enabled: false };
  tickFailOnce.reset();
}
