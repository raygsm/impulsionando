import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";
import { NAV_GROUPS, TOP_ITEMS, type NavItem, type NavGroup } from "./nav-config";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { useActiveCompany } from "@/hooks/use-active-company";

function isItemActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

function NavLinkRow({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function Group({
  group,
  pathname,
  filterItem,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  filterItem: (i: NavItem) => boolean;
  onNavigate?: () => void;
}) {
  const items = group.items.filter(filterItem);
  if (items.length === 0) return null;

  const hasActive = items.some((i) => isItemActive(pathname, i.to));
  const [open, setOpen] = useState<boolean>(hasActive || !!group.defaultOpen);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
      >
        <span>{group.label}</span>
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform", open ? "rotate-0" : "-rotate-90")}
        />
      </button>
      {open && (
        <div className="space-y-1">
          {items.map((it) => (
            <NavLinkRow
              key={it.to}
              item={it}
              active={isItemActive(pathname, it.to)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav({
  currentUser,
  onNavigate,
}: {
  currentUser: CurrentUser;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const isSuper = currentUser.isSuperAdmin;
  const { companyId } = useActiveCompany();
  const { data: perms, isLoading: permsLoading } = useUserPermissions(companyId);

  // Super admin enxerga tudo. Enquanto as permissões carregam, mostra apenas
  // itens sem `perm` (não-restritos) e os marcados como superOnly se aplicáveis.
  const filterItem = (i: NavItem): boolean => {
    if (i.superOnly) return isSuper;
    if (isSuper) return true;
    if (!i.perm) return true;
    if (permsLoading || !perms) return false;
    return perms.has(i.perm);
  };

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
      <div className="space-y-1">
        {TOP_ITEMS.filter(filterItem).map((it) => (
          <NavLinkRow
            key={it.to}
            item={it}
            active={isItemActive(location.pathname, it.to)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      {NAV_GROUPS.map((g) => (
        <Group
          key={g.label}
          group={g}
          pathname={location.pathname}
          filterItem={filterItem}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
