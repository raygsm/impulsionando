import { Link, useLocation, useSearch } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Workflow, LayersIcon, FileText, ClipboardCheck, Server,
} from "lucide-react";

/**
 * Navegação operacional: só expõe áreas que não simulam estado de produção.
 * Painéis antigos baseados em mocks/tabelas removidas ficam fora da navegação
 * até serem reconectados a fontes reais do Core.
 */
export const AUTOMACAO_NAV: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: "/core/automacao",                label: "Visão geral",       icon: LayoutDashboard },
  { to: "/core/automacao/fluxos",         label: "Catálogo de fluxos",icon: Workflow },
  { to: "/core/automacao/modelos-nicho",  label: "Modelos por nicho", icon: LayersIcon },
  { to: "/core/automacao/templates",      label: "Templates",         icon: FileText },
  { to: "/core/automacao/aprovacoes",     label: "Aprovações",        icon: ClipboardCheck },
  { to: "/admin/integracoes/n8n",         label: "Runtime n8n",       icon: Server },
];

export function AutomacaoSubnav() {
  const { pathname } = useLocation();
  const search = useSearch({ strict: false }) as { tenant?: string; mode?: "demo" | "producao" };
  const scoped =
    search?.tenant || search?.mode
      ? { ...(search?.tenant ? { tenant: search.tenant } : {}), ...(search?.mode ? { mode: search.mode } : {}) }
      : undefined;
  return (
    <nav className="flex flex-wrap gap-1 border-b pb-3 mb-6" aria-label="Automação">
      {AUTOMACAO_NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            search={to.startsWith("/core/automacao") ? scoped : undefined}
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
