import { createFileRoute, redirect } from "@tanstack/react-router";
import { tenantSubdomainTarget } from "@/lib/subdomain";

/**
 * Universal fallback de preview para tenants enquanto DNS/SSL/subdomínio oficial
 * ainda estiverem em reconciliação. Reaproveita exatamente o front já existente
 * no Core; não cria uma cópia paralela do cliente.
 *
 * Exemplos:
 *   /preview/csi          -> /csi
 *   /preview/colorssaude  -> /colors
 *   /preview/wmp          -> /wmp
 *   /preview/riomed       -> /riomed
 *   /preview/<slug>       -> rota dedicada conhecida ou /vitrine/<slug>
 */
export const Route = createFileRoute("/preview/$slug")({
  beforeLoad: ({ params }) => {
    const slug = String(params.slug || "").trim().toLowerCase();
    if (!slug) throw redirect({ to: "/vitrine" });
    const target = tenantSubdomainTarget(slug);
    throw redirect({ href: target, replace: true });
  },
  component: () => null,
});
