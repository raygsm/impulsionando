/**
 * Sandbox de estado client-side para demos interativas (Afiliados, Checkout, Eventos).
 *
 * - Persiste no localStorage por chave de namespace.
 * - Dispara evento custom "imp:demo-sandbox-changed" para sincronizar abas/componentes.
 * - Nunca toca banco. Reversível por reset().
 */
import { useEffect, useState, useCallback } from "react";

const EVT = "imp:demo-sandbox-changed";

function read<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
  } catch {
    /* ignore */
  }
}

export function useDemoState<T>(key: string, initial: T) {
  const fullKey = `imp.demo.${key}`;
  const [value, setValue] = useState<T>(() => read(fullKey, initial));

  useEffect(() => {
    const sync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.key === fullKey) setValue(read(fullKey, initial));
    };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(fullKey, v);
        return v;
      });
    },
    [fullKey],
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(fullKey);
      window.dispatchEvent(new CustomEvent(EVT, { detail: { key: fullKey } }));
      setValue(initial);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  return [value, set, reset] as const;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
