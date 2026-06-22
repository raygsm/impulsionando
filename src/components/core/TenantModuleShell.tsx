// TenantModuleShell — wrapper genérico para QUALQUER rota operacional de tenant
// (`/admin/clientes/{slug}/...`). Resolve `companyId` via subdomain e aplica
// o gate unificado (`useClientFeatureGate`) — uma única primitiva pra todos os
// 24+ módulos RioMed e futuros tenants.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientOperationShell } from "@/components/core/ClientOperationShell";
import { Loader2 } from "lucide-react";

interface TenantModuleShellProps {
  tenantSlug: string;
  moduleSlug: string | null;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function TenantModuleShell({
  tenantSlug,
  moduleSlug,
  title,
  description,
  children,
}: TenantModuleShellProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-by-slug", tenantSlug],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id")
        .eq("subdomain", tenantSlug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando tenant {tenantSlug}…
      </div>
    );
  }

  return (
    <div className="p-6">
      <ClientOperationShell
        companyId={data?.id}
        companySlug={tenantSlug}
        moduleSlug={moduleSlug}
        title={title}
        description={description}
      >
        {children}
      </ClientOperationShell>
    </div>
  );
}
