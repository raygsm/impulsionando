/**
 * Breadcrumbs — Trilha visual + `BreadcrumbList` JSON-LD para todas as rotas Garrido.
 *
 * Uso:
 *   <GarridoBreadcrumbs items={[
 *     { label: "Início", to: "/garrido" },
 *     { label: "Comprar", to: "/garrido/comprar" },
 *     { label: "Leblon" }, // último não recebe `to`
 *   ]} />
 *
 * A build do JSON-LD deve acontecer no `head()` da rota (SEO), usando
 * `buildGarridoBreadcrumbJsonLd`. Este componente cuida apenas do visual.
 */
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export function GarridoBreadcrumbs({ items }: { items: Crumb[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav
      aria-label="Trilha de navegação"
      className="max-w-7xl mx-auto px-4 pt-4 text-xs text-slate-500"
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${c.label}-${idx}`} className="flex items-center gap-1">
              {c.to && !isLast ? (
                <Link to={c.to} className="hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span
                  className="text-[color:var(--garrido-ink)] font-semibold"
                  aria-current={isLast ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function buildGarridoBreadcrumbJsonLd(items: Crumb[]) {
  const base = "https://impulsionando.com.br";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.label,
      ...(c.to ? { item: `${base}${c.to}` } : {}),
    })),
  };
}
