import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCoreSettings } from "@/lib/core-settings.functions";

/**
 * Hook to read a CORE global setting by key.
 * Cached for 5 minutes — settings change rarely.
 *
 * @example
 *   const { value } = useCoreSetting<{ amount: number }>("minimum_wage");
 *   const wage = value?.amount ?? 1518;
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
  return value?.amount ?? 1518;
}
