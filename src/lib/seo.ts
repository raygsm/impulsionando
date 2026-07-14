/**
 * SEO helpers para meta tags e JSON-LD.
 * Domínio canônico oficial: impulsionando.com.br
 */

export const SITE_URL = "https://impulsionando.com.br";

export function absUrl(path: string): string {
  if (!path.startsWith("/")) path = "/" + path;
  return `${SITE_URL}${path}`;
}

export interface Crumb {
  name: string;
  path: string;
}

/** Retorna um script JSON-LD BreadcrumbList pronto para `head().scripts`. */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: absUrl(c.path),
      })),
    }),
  };
}

/** JSON-LD para páginas de serviço/módulo (Service). */
export function serviceJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
  areaServed?: string;
}) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      name: opts.name,
      description: opts.description,
      url: opts.url.startsWith("http") ? opts.url : absUrl(opts.url),
      serviceType: opts.serviceType ?? "Software as a Service",
      areaServed: opts.areaServed ?? "BR",
      provider: {
        "@type": "Organization",
        name: "Impulsionando Tecnologia",
        url: SITE_URL,
      },
    }),
  };
}

/** JSON-LD FAQPage. */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((i) => ({
        "@type": "Question",
        name: i.question,
        acceptedAnswer: { "@type": "Answer", text: i.answer },
      })),
    }),
  };
}
