import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";
import { NAV_GROUPS, TOP_ITEMS, type NavItem, type NavGroup, type NavAudience } from "./nav-config";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useAudience } from "@/hooks/use-audience";
import { countPendingPixCharges } from "@/lib/pix-charges.functions";
import { fetchUserPlanContext } from "@/lib/plan-context.functions";
import { useServerFn } from "@tanstack/react-start";

function classifyPlanTier(code: string | null | undefined, name: string | null | undefined):
  "essencial" | "profissional" | "completo" | null {
  const blob = `${code ?? ""} ${name ?? ""}`.toLowerCase();
  if (blob.includes("complet")) return "completo";
  if (blob.includes("profission") || blob.includes("integrad") || blob.includes("avanc")) return "profissional";
  if (blob.includes("essencial") || blob.includes("basic") || blob.includes("starter")) return "essencial";
  return null;
}

function isItemActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

function usePendingPixBadge(enabled: boolean) {
  return useQuery({
    queryKey: ["nav", "pending-pix-count"],
    queryFn: async () => {
      const res = await countPendingPixCharges();
      return res?.count ?? 0;
    },
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

function NavBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold bg-destructive text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLinkRow({
  item,
  active,
  onNavigate,
  badgeCount,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  badgeCount?: number;
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
      {item.badge === "pendingPix" && <NavBadge count={badgeCount ?? 0} />}
    </Link>
  );
}


function Group({
  group,
  pathname,
  filterItem,
  onNavigate,
  pendingPix,
}: {
  group: NavGroup;
  pathname: string;
  filterItem: (i: NavItem, groupAudiences?: NavAudience[]) => boolean;
  onNavigate?: () => void;
  pendingPix: number;
}) {
  const items = group.items.filter((i) => filterItem(i, group.audiences));
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
              badgeCount={pendingPix}
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
  const { isImpersonating } = useImpersonation();
  const { audience } = useAudience();
  const isSuper = currentUser.isSuperAdmin && !isImpersonating;
  const { companyId } = useActiveCompany();
  const { data: perms, isLoading: permsLoading } = useUserPermissions(companyId);
  const { data: pendingPix = 0 } = usePendingPixBadge(isSuper);

  const planFn = useServerFn(fetchUserPlanContext);
  const { data: planCtx } = useQuery({
    queryKey: ["plan-context"],
    queryFn: () => planFn({ data: {} }),
    staleTime: 60_000,
  });
  const planTier = classifyPlanTier(planCtx?.planCode, planCtx?.planName);

  const matchesAudience = (audiences: NavAudience[] | undefined): boolean => {
    if (!audiences || audiences.length === 0) {
      // Default-deny para consumidor: itens administrativos (sem audience declarada)
      // jamais aparecem para o consumidor final. Para vê-los, é preciso declarar
      // explicitamente `audiences: ["consumidor", ...]`.
      if (audience === "consumidor") return false;
      return true;
    }
    return audiences.includes(audience);
  };

  // Super admin enxerga tudo. Em modo impersonação, comporta-se como o cliente:
  // esconde itens superOnly e libera os demais (o master tem acesso global).
  const filterItem = (i: NavItem, groupAudiences?: NavAudience[]): boolean => {
    // Item herda audiences do grupo quando não declarar a sua própria.
    const effective = i.audiences ?? groupAudiences;
    if (!matchesAudience(effective)) return false;
    if (i.superOnly) return isSuper;
    // Gate por plano: staff/super sempre passa; demais precisam estar no tier.
    if (i.requiresPlanTier && i.requiresPlanTier.length > 0) {
      const bypass = isSuper || planCtx?.isStaff;
      if (!bypass) {
        if (!planTier || !i.requiresPlanTier.includes(planTier)) return false;
      }
    }
    if (isImpersonating) return true;
    if (currentUser.isSuperAdmin) return true;
    if (!i.perm) return true;
    if (permsLoading || !perms) return false;
    return perms.has(i.perm);
  };

  const visibleGroups = NAV_GROUPS.filter((g) => matchesAudience(g.audiences));

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
      <div className="space-y-1">
        {TOP_ITEMS.filter((it) => filterItem(it)).map((it) => (
          <NavLinkRow
            key={it.to}
            item={it}
            active={isItemActive(location.pathname, it.to)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      {visibleGroups.map((g) => (
        <Group
          key={g.label}
          group={g}
          pathname={location.pathname}
          filterItem={filterItem}
          onNavigate={onNavigate}
          pendingPix={pendingPix}
        />
      ))}

    </nav>
  );
}
