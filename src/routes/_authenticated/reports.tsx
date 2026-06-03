import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Relatórios" }] }),
  component: Layout,
});

const TABS = [
  { to: "/reports", label: "Visão geral" },
  { to: "/reports/sales", label: "Vendas" },
  { to: "/reports/finance", label: "Financeiro" },
  { to: "/reports/inventory", label: "Estoque" },
  { to: "/reports/agenda", label: "Agenda" },
  { to: "/reports/crm", label: "CRM" },
];

function Layout() {
  const loc = useLocation();
  return (
    <div>
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.to === "/reports" ? loc.pathname === "/reports" : loc.pathname === t.to;
          return (
            <Link key={t.to} to={t.to}
              className={cn("px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap",
                active ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
