/**
 * Config do Motor LLM — localStorage.
 *
 * A UI (Centro de Inteligência → Configurações → Motor LLM) escreve aqui;
 * o transport lê e envia junto a cada requisição. O backend faz a
 * resolução final (com fallback) para nunca expor chave ao browser.
 */
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LLM_CONFIG, type LlmConfig } from "@/lib/impulsionito/types";

const KEY = "impulsionito-ic-v1:llm-config";
const isBrowser = () => typeof window !== "undefined";

export function readLlmConfig(): LlmConfig {
  if (!isBrowser()) return DEFAULT_LLM_CONFIG;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LLM_CONFIG;
    const parsed = JSON.parse(raw) as Partial<LlmConfig>;
    return { ...DEFAULT_LLM_CONFIG, ...parsed };
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

function writeLlmConfig(cfg: LlmConfig) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* noop */
  }
}

export function useLlmConfig() {
  const [config, setConfig] = useState<LlmConfig>(() => readLlmConfig());
  useEffect(() => {
    setConfig(readLlmConfig());
  }, []);
  const update = useCallback((patch: Partial<LlmConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      writeLlmConfig(next);
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    writeLlmConfig(DEFAULT_LLM_CONFIG);
    setConfig(DEFAULT_LLM_CONFIG);
  }, []);
  return { config, update, reset };
}
