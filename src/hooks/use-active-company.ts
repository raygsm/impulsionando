import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./use-current-user";
import { useImpersonation } from "./use-impersonation";

const KEY = "imp.activeCompanyId";

export function useActiveCompany() {
  const { data: me } = useCurrentUser();
  const { isImpersonating, impersonatedCompanyId, impersonatedCompanyName } = useImpersonation();
  const [companyId, setCompanyId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(KEY) ?? "";
  });

  const { data: allCompanies } = useQuery({
    queryKey: ["companies-all-active"],
    enabled: !!me?.isSuperAdmin,
    queryFn: async () => (await supabase.from("companies").select("id, name, is_master").eq("is_active", true).order("name")).data ?? [],
  });

  // Empresas-demo disponíveis para qualquer usuário autenticado explorar
  const { data: demoCompanies } = useQuery({
    queryKey: ["companies-demo"],
    enabled: !!me?.user?.id && !me?.isSuperAdmin,
    queryFn: async () => (await supabase.from("companies").select("id, name, is_master").eq("is_demo", true).eq("is_active", true).order("name")).data ?? [],
  });

  const userOptions = me?.isSuperAdmin
    ? (allCompanies ?? []).filter((c) => !c.is_master)
    : (me?.memberships.map((m) => m.companies).filter(Boolean) as { id: string; name: string; is_master: boolean }[] | undefined ?? []);

  // Concatena empresas-demo (sufixo "(Demo)") quando o usuário não é super admin
  const demoOptions = !me?.isSuperAdmin
    ? (demoCompanies ?? [])
        .filter((d) => !userOptions.find((u) => u.id === d.id))
        .map((d) => ({ id: d.id, name: `${d.name} (Demo)`, is_master: false }))
    : [];
  const baseOptions = [...userOptions, ...demoOptions];

  // Quando impersonando, força a empresa selecionada para a empresa impersonada
  const effectiveCompanyId = isImpersonating && impersonatedCompanyId ? impersonatedCompanyId : companyId;
  const options = isImpersonating && impersonatedCompanyId
    ? [{ id: impersonatedCompanyId, name: impersonatedCompanyName ?? "Cliente", is_master: false }]
    : baseOptions;

  useEffect(() => {
    if (isImpersonating) return; // impersonation locks the company
    if (!options.length) return;
    if (!companyId || !options.find((c) => c.id === companyId)) {
      const next = options[0].id;
      setCompanyId(next);
      localStorage.setItem(KEY, next);
    }
  }, [options, companyId, isImpersonating]);

  function select(id: string) {
    if (isImpersonating) return; // não alterna empresas em modo impersonação
    setCompanyId(id);
    localStorage.setItem(KEY, id);
  }

  return { companyId: effectiveCompanyId, setCompanyId: select, options };
}
