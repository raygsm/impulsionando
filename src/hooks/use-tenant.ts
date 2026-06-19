import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  resolveTenantByHost,
  type TenantContext,
} from "@/lib/tenant-resolver.functions";

/**
 * Hostnames que NÃO devem disparar lookup de tenant — são o CORE/marketing.
 * Qualquer outro hostname (subdomínio próprio ou domínio cliente) vira tenant.
 */
const CORE_HOSTS = new Set<string>([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "impulsionando.com.br",
  "www.impulsionando.com.br",
  "impulsionando.lovable.app",
]);

function isCoreHost(host: string): boolean {
  if (!host) return true;
  if (CORE_HOSTS.has(host)) return true;
  // Subdomínios de preview e edição do Lovable são CORE
  if (host.endsWith(".lovable.app") && host.includes("-preview--")) return true;
  if (host.endsWith(".lovable.dev")) return true;
  return false;
}

export function useTenant(): {
  tenant: TenantContext | null;
  isLoading: boolean;
  isCore: boolean;
  host: string;
} {
  const [host, setHost] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") setHost(window.location.hostname);
  }, []);

  const core = useMemo(() => isCoreHost(host), [host]);
  const fetchTenant = useServerFn(resolveTenantByHost);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-by-host", host],
    enabled: host.length > 0 && !core,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchTenant({ data: { host } }),
  });

  return {
    tenant: core ? null : data ?? null,
    isLoading: !core && isLoading,
    isCore: core,
    host,
  };
}
