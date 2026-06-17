import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCoreSettings } from "@/lib/core-settings.functions";

/**
 * Fallback do salário mínimo nacional — vigente a partir de 01/01/2026.
 * Fonte oficial: Decreto nº 12.797, de 23/12/2025 (Planalto).
 * Valor diário: R$ 54,04 · Valor horário: R$ 7,37.
 * Atualize aqui E em core_settings.minimum_wage quando o governo publicar novo decreto.
 */
export const MINIMUM_WAGE_FALLBACK = 1621;

/**
 * Hook to read a CORE global setting by key.
 * Cached for 5 minutes — settings change rarely.
 */
export function useCoreSetting<T = unknown>(key: string) {
  const fetcher = useServerFn(listCoreSettings);
  const q = useQuery({
    queryKey: ["core-settings"],
    queryFn: () => fetcher() as any,
    staleTime: 5 * 60_000,
  });
  const row = (q.data as any[] | undefined)?.find((r) => r.key === key);
  return {
    value: row?.value as T | undefined,
    label: row?.label as string | undefined,
    isLoading: q.isLoading,
    error: q.error,
  };
}

/** Helper for the most used setting */
export function useMinimumWage(): number {
  const { value } = useCoreSetting<{ amount: number }>("minimum_wage");
  return value?.amount ?? MINIMUM_WAGE_FALLBACK;
}

/**
 * Preços dos 3 planos atrelados ao salário mínimo:
 *  - Essencial: ½ SM
 *  - Integrado: 1 SM
 *  - Avançado: 2 SM
 */
export function usePlanPricing() {
  const wage = useMinimumWage();
  return {
    wage,
    essencial: wage / 2,
    integrado: wage,
    avancado: wage * 2,
  };
}
