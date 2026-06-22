// Provider de locale por tenant. Componentes consomem via useTenantLocale()
// e formatam moeda/data/telefone sem hardcode de pt-BR/BRL.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  DEFAULT_LOCALE_PROFILE,
  getLocaleProfile,
  type TenantLocaleProfile,
} from "@/lib/tenant-locale";

const TenantLocaleContext = createContext<TenantLocaleProfile>(DEFAULT_LOCALE_PROFILE);

export function TenantLocaleProvider({
  company,
  children,
}: {
  company?: {
    country_code?: string | null;
    locale?: string | null;
    currency_code?: string | null;
    phone_country_code?: string | null;
    timezone?: string | null;
  } | null;
  children: ReactNode;
}) {
  const profile = useMemo(() => getLocaleProfile(company ?? null), [company]);
  return (
    <TenantLocaleContext.Provider value={profile}>
      {children}
    </TenantLocaleContext.Provider>
  );
}

export function useTenantLocale(): TenantLocaleProfile {
  return useContext(TenantLocaleContext);
}
