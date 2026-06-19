import { useEffect } from "react";
import { useTenant } from "@/hooks/use-tenant";

/**
 * Aplica branding do tenant detectado pelo hostname:
 *   - --primary / --secondary em CSS vars
 *   - <title> com o nome do tenant
 *   - favicon do logo do tenant (quando definido)
 *
 * No CORE (impulsionando.com.br, localhost, preview) é no-op.
 */
export function TenantBrandingProvider() {
  const { tenant, isCore } = useTenant();

  useEffect(() => {
    if (isCore || !tenant) return;
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const prevPrimary = root.style.getPropertyValue("--primary");
    const prevSecondary = root.style.getPropertyValue("--secondary");
    const prevTitle = document.title;

    if (tenant.primary_color) root.style.setProperty("--brand-primary", tenant.primary_color);
    if (tenant.secondary_color) root.style.setProperty("--brand-secondary", tenant.secondary_color);

    document.title = tenant.name;

    let prevHref: string | null = null;
    let linkEl: HTMLLinkElement | null = null;
    if (tenant.logo_url) {
      linkEl = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (linkEl) {
        prevHref = linkEl.href;
        linkEl.href = tenant.logo_url;
      }
    }

    return () => {
      if (prevPrimary) root.style.setProperty("--primary", prevPrimary);
      if (prevSecondary) root.style.setProperty("--secondary", prevSecondary);
      document.title = prevTitle;
      if (linkEl && prevHref) linkEl.href = prevHref;
    };
  }, [tenant, isCore]);

  return null;
}
