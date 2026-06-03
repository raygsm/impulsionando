import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/bi")({
  head: () => ({ meta: [{ title: "BI — Dashboards consolidados" }] }),
  component: Layout,
});

function Layout() {
  const loc = useLocation();
  const { data: me } = useCurrentUser();
  const isSuper = me?.isSuperAdmin ?? false;

  const TABS = [
    { to: "/bi", label: "Visão geral" },
    { to: "/bi/company", label: "Cliente" },
    ...(isSuper
      ? [
          { to: "/bi/master", label: "Master" },
          { to: "/bi/niches", label: "Por nicho" },
        ]
      : []),
  ];

  return (
    <div>
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.to === "/bi" ? loc.pathname === "/bi" : loc.pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap",
                active
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
