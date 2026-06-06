import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/affiliates", label: "Dashboard", exact: true },
  { to: "/affiliates/products", label: "Produtos" },
  { to: "/affiliates/offers", label: "Ofertas" },
  { to: "/affiliates/affiliates", label: "Afiliados" },
  { to: "/affiliates/coproducers", label: "Coprodutores" },
  { to: "/affiliates/managers", label: "Gerentes" },
  { to: "/affiliates/links", label: "Links" },
  { to: "/affiliates/sales", label: "Vendas" },
  { to: "/affiliates/commissions", label: "Comissões" },
  { to: "/affiliates/payouts", label: "Saques" },
  { to: "/affiliates/reports", label: "Relatórios" },
];

export function AffiliatesSubnav() {
  const { pathname } = useLocation();
  return (
    <div className="border-b mb-4 overflow-x-auto">
      <nav className="flex gap-1 min-w-max">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "px-3 py-2 text-sm rounded-t-md whitespace-nowrap transition-colors",
                active
                  ? "bg-background border border-b-background -mb-px font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
