import { useEffect } from "react";
import { useTenant } from "@/hooks/use-tenant";

/**
 * Aplica branding do tenant detectado pelo hostname:
 *   - --brand-primary / --brand-secondary em CSS vars (tokens do core lêem esses)
 *   - favicon do logo do tenant (quando definido)
 *   - sufixo de título com o nome do tenant, sem sobrescrever o title da rota
 *
 * No CORE (impulsionando.com.br, localhost, preview) é no-op.
 *
 * Etapa 2 — Multi-tenant:
 *   - cleanup agora restaura as mesmas chaves que foram escritas
 *     (bug anterior escrevia --brand-primary e restaurava --primary,
 *      vazando branding do tenant anterior ao trocar de host em SPA).
 *   - título passa a ser sufixo ("Rota — Tenant") preservando o head()
 *     definido pela rota TanStack; se a rota ainda não escreveu título,
 *     usa apenas o nome do tenant.
 */
export function TenantBrandingProvider() {
  const { tenant, isCore } = useTenant();

  useEffect(() => {
    if (isCore || !tenant) return;
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const prevBrandPrimary = root.style.getPropertyValue("--brand-primary");
    const prevBrandSecondary = root.style.getPropertyValue("--brand-secondary");

    if (tenant.primary_color) root.style.setProperty("--brand-primary", tenant.primary_color);
    if (tenant.secondary_color) root.style.setProperty("--brand-secondary", tenant.secondary_color);

    // Título: preserva o que a rota escreveu via head(), apenas anexa
    // o nome do tenant como sufixo — só ajusta uma vez por mudança de tenant.
    const prevTitle = document.title;
    const suffix = ` — ${tenant.name}`;
    if (!prevTitle) {
      document.title = tenant.name;
    } else if (!prevTitle.endsWith(suffix)) {
      document.title = `${prevTitle}${suffix}`;
    }

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
      // Restaura EXATAMENTE as mesmas chaves que escrevemos.
      if (prevBrandPrimary) root.style.setProperty("--brand-primary", prevBrandPrimary);
      else root.style.removeProperty("--brand-primary");
      if (prevBrandSecondary) root.style.setProperty("--brand-secondary", prevBrandSecondary);
      else root.style.removeProperty("--brand-secondary");
      document.title = prevTitle;
      if (linkEl && prevHref) linkEl.href = prevHref;
    };
  }, [tenant, isCore]);

  return null;
}
