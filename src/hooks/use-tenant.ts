import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  resolveTenantByHost,
  type TenantContext,
} from "@/lib/tenant-resolver.functions";
import { getTenantSubdomain, isImpulsionandoPlatformHost, TENANT_LANDING_BY_SUBDOMAIN } from "@/lib/subdomain";

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

  const core = useMemo(() => isImpulsionandoPlatformHost(host), [host]);
  const knownSubdomainTenant = useMemo(() => {
    const match = getTenantSubdomain(host);
    if (!match || !TENANT_LANDING_BY_SUBDOMAIN[match.slug]) return null;
    return {
      id: `subdomain:${match.slug}`,
      name: match.slug,
      subdomain: match.slug,
      domain: match.host,
      primary_color: null,
      secondary_color: null,
      logo_url: null,
      is_active: true,
    } satisfies TenantContext;
  }, [host]);
  const fetchTenant = useServerFn(resolveTenantByHost);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-by-host", host],
    enabled: host.length > 0 && !core && !knownSubdomainTenant,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchTenant({ data: { host } }),
  });

  return {
    tenant: core ? null : knownSubdomainTenant ?? data ?? null,
    isLoading: !core && !knownSubdomainTenant && isLoading,
    isCore: core,
    host,
  };
}
