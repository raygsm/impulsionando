import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import {
  Building2, LayoutDashboard, Boxes, CreditCard, Globe, Rocket,
  KanbanSquare, Wallet, MessageSquare, Users, KeyRound, FileSearch,
  SlidersHorizontal, Plug, HeartPulse, FlaskConical, TrendingUp, Sparkles, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core")({
  head: () => ({ meta: [{ title: "/adm — Impulsionando Core" }, { name: "robots", content: "noindex" }] }),
  component: CoreLayout,
});

function CoreLayout() {
  const { data: me } = useCurrentUser();
  const location = useLocation();
  if (!me?.isImpulsionandoStaff) {
    return (
      <Card className="p-6">
        <h2 className="font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas equipe Impulsionando acessa /adm (Core Manager).</p>
      </Card>
    );
  }
  // Menu Master /adm — usa apenas rotas já existentes; nenhuma tela duplicada.
  const tabs = [
    { to: "/core", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/core/saude", label: "Saúde", icon: HeartPulse },
    { to: "/core/financeiro-master", label: "Financeiro Master", icon: TrendingUp },
    { to: "/core/clientes", label: "Clientes (360)", icon: Building2 },
    { to: "/core/testes", label: "Testes", icon: FlaskConical },
    { to: "/core/parametros", label: "Parâmetros Globais", icon: SlidersHorizontal },
    { to: "/core/eventos", label: "Eventos", icon: MessageSquare },
    { to: "/crm/board", label: "CRM", icon: KanbanSquare },
    { to: "/finance", label: "ERP / Financeiro", icon: Wallet },
    { to: "/admin/billing-contracts", label: "Billing", icon: CreditCard },
    { to: "/core/nova-implantacao", label: "Nova Implantação (IA)", icon: Sparkles },
    { to: "/core/criar-projeto", label: "Criar Projeto (Fábrica)", icon: Rocket },
    { to: "/core/instalar-modulo", label: "Instalar Módulo", icon: Boxes },
    { to: "/core/implantacoes", label: "Implantações", icon: Rocket },
    { to: "/core/modulos", label: "Biblioteca de Módulos", icon: Boxes },
    { to: "/core/modulos", label: "Biblioteca de Módulos", icon: Boxes },
    { to: "/core/finalizacao-comercial", label: "Finalização Comercial", icon: CheckCircle2 },
    { to: "/core/planos", label: "Gestão de Planos", icon: CreditCard },
    { to: "/core/templates", label: "Templates de Site", icon: Globe },
    { to: "/core/prompts", label: "Prompts (IA)", icon: Sparkles },
    { to: "/core/clientes", label: "Páginas por Cliente", icon: FileSearch },
    { to: "/admin/billing-policy", label: "Régua / Domínios", icon: Globe },
    { to: "/users", label: "Usuários", icon: Users },
    { to: "/permissions", label: "Permissões", icon: KeyRound },
    { to: "/audit", label: "Auditoria", icon: FileSearch },
    { to: "/settings", label: "Configurações", icon: SlidersHorizontal },
    { to: "/modules", label: "Integrações", icon: Plug },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 flex-wrap border-b pb-2">
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
