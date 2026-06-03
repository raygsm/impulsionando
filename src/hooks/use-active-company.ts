import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./use-current-user";

const KEY = "imp.activeCompanyId";

export function useActiveCompany() {
  const { data: me } = useCurrentUser();
  const [companyId, setCompanyId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(KEY) ?? "";
  });

  const { data: allCompanies } = useQuery({
    queryKey: ["companies-all-active"],
    enabled: !!me?.isSuperAdmin,
    queryFn: async () => (await supabase.from("companies").select("id, name, is_master").eq("is_active", true).order("name")).data ?? [],
  });

  const options = me?.isSuperAdmin
    ? (allCompanies ?? []).filter((c) => !c.is_master)
    : (me?.memberships.map((m) => m.companies).filter(Boolean) as { id: string; name: string; is_master: boolean }[] | undefined ?? []);

  useEffect(() => {
    if (!options.length) return;
    if (!companyId || !options.find((c) => c.id === companyId)) {
      const next = options[0].id;
      setCompanyId(next);
      localStorage.setItem(KEY, next);
    }
  }, [options, companyId]);

  function select(id: string) {
    setCompanyId(id);
    localStorage.setItem(KEY, id);
  }

  return { companyId, setCompanyId: select, options };
}
