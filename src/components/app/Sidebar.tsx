import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";
import {
  LayoutDashboard, Building2, Tags, MapPin, Layers, Users, KeyRound,
  SlidersHorizontal, FileSearch, Boxes, Sparkles, KanbanSquare, UserPlus, GitBranch, CalendarClock,
  Calendar, Users2, Wrench, Clock, UsersRound,
  Wallet, ArrowLeftRight, FolderTree, CreditCard, Percent,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superOnly?: boolean;
  group?: string;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Empresas", icon: Building2, superOnly: true },
  { to: "/niches", label: "Nichos", icon: Tags, superOnly: true },
  { to: "/units", label: "Unidades", icon: MapPin },
  { to: "/sectors", label: "Setores", icon: Layers },
  { to: "/users", label: "Usuários", icon: Users },
  { to: "/access-profiles", label: "Perfis", icon: KeyRound },
  { to: "/permissions", label: "Permissões", icon: KeyRound, superOnly: true },
  { to: "/modules", label: "Módulos", icon: Boxes },
  { to: "/settings", label: "Configurações", icon: SlidersHorizontal },
  { to: "/audit", label: "Auditoria", icon: FileSearch },
  { to: "/crm/board", label: "Kanban", icon: KanbanSquare, group: "CRM" },
  { to: "/crm/leads", label: "Leads", icon: UserPlus, group: "CRM" },
  { to: "/crm/pipelines", label: "Funis", icon: GitBranch, group: "CRM" },
  { to: "/crm/activities", label: "Atividades", icon: CalendarClock, group: "CRM" },
  { to: "/agenda", label: "Hoje", icon: Calendar, group: "Agenda" },
  { to: "/agenda/appointments", label: "Agendamentos", icon: CalendarClock, group: "Agenda" },
  { to: "/agenda/professionals", label: "Profissionais", icon: Users2, group: "Agenda" },
  { to: "/agenda/services", label: "Serviços", icon: Wrench, group: "Agenda" },
  { to: "/agenda/schedules", label: "Horários", icon: Clock, group: "Agenda" },
  { to: "/agenda/waitlist", label: "Fila", icon: UsersRound, group: "Agenda" },
];

export function Sidebar({ currentUser }: { currentUser: CurrentUser }) {
  const location = useLocation();
  const items = NAV.filter((i) => !i.superOnly || currentUser.isSuperAdmin);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      <div className="h-16 px-5 flex items-center gap-2 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Impulsionando</div>
          <div className="text-[10px] uppercase text-sidebar-foreground/60 tracking-wider">Sistemas</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {(() => {
          const rendered: React.ReactNode[] = [];
          let lastGroup: string | undefined = undefined;
          items.forEach((it) => {
            if (it.group !== lastGroup) {
              lastGroup = it.group;
              if (it.group) {
                rendered.push(
                  <div key={`g-${it.group}`} className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">
                    {it.group}
                  </div>
                );
              }
            }
            const Icon = it.icon;
            const active = location.pathname === it.to || location.pathname.startsWith(it.to + "/");
            rendered.push(
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{it.label}</span>
              </Link>
            );
          });
          return rendered;
        })()}
      </nav>

      <div className="p-3 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
        {currentUser.isSuperAdmin ? "Modo Master" : currentUser.memberships[0]?.companies?.name ?? "—"}
      </div>
    </aside>
  );
}
