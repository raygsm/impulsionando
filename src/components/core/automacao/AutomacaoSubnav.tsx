import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Workflow, LayersIcon, ShieldCheck, Users,
  PlayCircle, Rocket, Webhook, ScrollText, AlertTriangle,
  FileText, Radio, ClipboardCheck, History, Activity, LifeBuoy,
} from "lucide-react";

export const AUTOMACAO_NAV: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: "/core/automacao",                 label: "Visão geral",       icon: LayoutDashboard },
  { to: "/core/automacao/fluxos",          label: "Fluxos",            icon: Workflow },
  { to: "/core/automacao/modelos-nicho",   label: "Modelos por Nicho", icon: LayersIcon },
  { to: "/core/automacao/modelos-plano",   label: "Modelos por Plano", icon: ShieldCheck },
  { to: "/core/automacao/modelos-tenant",  label: "Modelos por Tenant",icon: Users },
  { to: "/core/automacao/demonstracoes",   label: "Demonstrações",     icon: PlayCircle },
  { to: "/core/automacao/producao",        label: "Produção",          icon: Rocket },
  { to: "/core/automacao/webhooks",        label: "Webhooks",          icon: Webhook },
  { to: "/core/automacao/logs",            label: "Logs",              icon: ScrollText },
  { to: "/core/automacao/erros",           label: "Erros",             icon: AlertTriangle },
  { to: "/core/automacao/templates",       label: "Templates",         icon: FileText },
  { to: "/core/automacao/canais",          label: "Canais",            icon: Radio },
  { to: "/core/automacao/aprovacoes",      label: "Aprovações",        icon: ClipboardCheck },
  { to: "/core/automacao/historico",       label: "Histórico",         icon: History },
  { to: "/core/automacao/monitoramento",   label: "Monitoramento",     icon: Activity },
  { to: "/core/automacao/fallback-humano", label: "Fallback Humano",   icon: LifeBuoy },
];

export function AutomacaoSubnav() {
  const { pathname } = useLocation();
  return (
    <nav className="flex flex-wrap gap-1 border-b pb-3 mb-6" aria-label="Automação">
      {AUTOMACAO_NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
