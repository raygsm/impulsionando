/**
 * Breadcrumbs — Trilha visual + `BreadcrumbList` JSON-LD compartilhada.
 *
 * Onda 2.9 — Promovida de src/components/garrido/Breadcrumbs.tsx para o
 * ecossistema. Todo tenant que precisar de trilha deve usar este primitivo.
 *
 * Uso:
 *   <Breadcrumbs items={[
 *     { label: "Início", to: "/garrido" },
 *     { label: "Comprar", to: "/garrido/comprar" },
 *     { label: "Leblon" },
 *   ]} />
 *
 * Para SEO, monte o JSON-LD no `head()` da rota usando `buildBreadcrumbJsonLd`.
 * Tokens visuais aderem ao tenant ativo via var(--tenant-ink) quando presente,
 * caindo em `text-foreground` como fallback.
 */
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export interface BreadcrumbsProps {
  items: Crumb[];
  /** classe extra p/ container (padding, largura) */
  className?: string;
  /** cor do item ativo. Default: text-foreground */
  activeColor?: string;
}

export function Breadcrumbs({
  items,
  className = "max-w-7xl mx-auto px-4 pt-4",
  activeColor,
}: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;
  return (
    <nav
      aria-label="Trilha de navegação"
      className={`${className} text-xs text-muted-foreground`}
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
                  className="font-semibold"
                  style={activeColor ? { color: activeColor } : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Monta o objeto `BreadcrumbList` (schema.org) a partir dos crumbs.
 * Usar em `scripts` do `head()` da rota, com `JSON.stringify`.
 */
export function buildBreadcrumbJsonLd(
  items: Crumb[],
  baseUrl = "https://impulsionando.com.br",
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.label,
      ...(c.to ? { item: `${baseUrl}${c.to}` } : {}),
    })),
  };
}
