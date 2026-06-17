import { useEffect, useState, useCallback } from "react";

export interface WhiteLabelConfig {
  enabled: boolean;
  brandName: string;
  primaryColor: string;
  tagline: string;
  logoText: string;
}

const KEY = "contab-whitelabel";
const DEFAULT: WhiteLabelConfig = {
  enabled: false,
  brandName: "Contabilidade Horizonte",
  primaryColor: "#0EA5E9",
  tagline: "Sua contabilidade inteligente",
  logoText: "CH",
};

function load(): WhiteLabelConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function useContabWhiteLabel() {
  const [config, setConfig] = useState<WhiteLabelConfig>(DEFAULT);

  useEffect(() => {
    setConfig(load());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setConfig(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<WhiteLabelConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setConfig(DEFAULT);
  }, []);

  return { config, update, reset };
}
