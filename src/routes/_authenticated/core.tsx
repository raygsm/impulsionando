import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Building2, LayoutDashboard, Boxes, CreditCard, Globe, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core")({
  head: () => ({ meta: [{ title: "Core Manager — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: CoreLayout,
});

function CoreLayout() {
  const { data: me } = useCurrentUser();
  const location = useLocation();
  if (!me?.isImpulsionandoStaff) {
    return (
      <Card className="p-6">
        <h2 className="font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas equipe Impulsionando acessa o Core Manager.</p>
      </Card>
    );
  }
  const tabs = [
    { to: "/core", label: "Visão geral", icon: LayoutDashboard, exact: true },
    { to: "/core/clientes", label: "Clientes", icon: Building2 },
    { to: "/core/modulos", label: "Biblioteca de Módulos", icon: Boxes },
    { to: "/core/implantacoes", label: "Implantações", icon: Rocket },
    { to: "/admin/billing-contracts", label: "Contratos", icon: CreditCard },
    { to: "/admin/billing-policy", label: "Régua", icon: Globe },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap border-b pb-2">
        {tabs.map((t) => {
          const active = t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
