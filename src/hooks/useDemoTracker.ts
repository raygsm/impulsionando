import { useEffect, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  startDemoSession,
  logDemoAction,
  endDemoSession,
} from "@/lib/demo-track.functions";

/**
 * Hook leve para tracking de demo por nicho.
 * - Tenta iniciar sessão no mount (silencioso se anônimo).
 * - Expõe log(module, actionKey, weight) para registrar interações.
 * - Encerra sessão no unmount e grava snapshot do score.
 */
export function useDemoTracker(nicheSlug: string) {
  const start = useServerFn(startDemoSession);
  const log = useServerFn(logDemoAction);
  const end = useServerFn(endDemoSession);
  const sessionIdRef = useRef<string | null>(null);
  const queueRef = useRef<Array<{ module: string; actionKey: string; weight: number }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ua = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
        const { sessionId } = await start({ data: { nicheSlug, userAgent: ua } });
        if (cancelled) return;
        sessionIdRef.current = sessionId;
        // Drena fila acumulada antes da sessão existir
        const queued = queueRef.current.splice(0);
        for (const q of queued) {
          await log({ data: { sessionId, ...q } }).catch(() => {});
        }
      } catch {
        // Ignora — usuário anônimo ou sem rede; demo continua usável.
      }
    })();
    return () => {
      cancelled = true;
      const sid = sessionIdRef.current;
      if (!sid) return;
      end({ data: { sessionId: sid } }).catch(() => {});
    };
  }, [nicheSlug, start, log, end]);

  const track = useCallback(
    (module: string, actionKey: string, weight = 1) => {
      const sid = sessionIdRef.current;
      if (!sid) {
        queueRef.current.push({ module, actionKey, weight });
        return;
      }
      log({ data: { sessionId: sid, module, actionKey, weight } }).catch(() => {});
    },
    [log],
  );

  return { track };
}
