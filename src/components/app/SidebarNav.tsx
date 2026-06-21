import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
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

function isBranchActive(pathname: string, item: NavItem): boolean {
  if (item.to && isItemActive(pathname, item.to)) return true;
  if (item.children) return item.children.some((c) => isBranchActive(pathname, c));
  return false;
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
  depth = 0,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  badgeCount?: number;
  depth?: number;
}) {
  const Icon = item.icon;
  if (!item.to) return null;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        depth > 0 && "ml-4 pl-3 border-l border-sidebar-border/40",
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

function SubMenu({
  item,
  pathname,
  filterItem,
  onNavigate,
  pendingPix,
  groupAudiences,
}: {
  item: NavItem;
  pathname: string;
  filterItem: (i: NavItem, groupAudiences?: NavAudience[]) => boolean;
  onNavigate?: () => void;
  pendingPix: number;
  groupAudiences?: NavAudience[];
}) {
  const visibleChildren = (item.children ?? []).filter((c) => filterItem(c, groupAudiences));
  const active = isBranchActive(pathname, item);
  const [open, setOpen] = useState<boolean>(active);
  const Icon = item.icon;

  if (visibleChildren.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
          active
            ? "text-sidebar-foreground bg-sidebar-accent/60"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        )}
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {visibleChildren.map((c) => (
            <NavLinkRow
              key={c.to ?? c.label}
              item={c}
              active={!!c.to && isItemActive(pathname, c.to)}
              onNavigate={onNavigate}
              badgeCount={pendingPix}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const GROUP_TONES = [
  "bg-blue-600 text-white hover:bg-blue-500 border-blue-700",
  "bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-700",
  "bg-amber-500 text-slate-900 hover:bg-amber-400 border-amber-600",
  "bg-rose-600 text-white hover:bg-rose-500 border-rose-700",
  "bg-violet-600 text-white hover:bg-violet-500 border-violet-700",
  "bg-sky-600 text-white hover:bg-sky-500 border-sky-700",
  "bg-orange-600 text-white hover:bg-orange-500 border-orange-700",
  "bg-teal-600 text-white hover:bg-teal-500 border-teal-700",
  "bg-fuchsia-600 text-white hover:bg-fuchsia-500 border-fuchsia-700",
  "bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-700",
  "bg-lime-500 text-slate-900 hover:bg-lime-400 border-lime-600",
];


function Group({
  group,
  index,
  pathname,
  filterItem,
  onNavigate,
  pendingPix,
}: {
  group: NavGroup;
  index: number;
  pathname: string;
  filterItem: (i: NavItem, groupAudiences?: NavAudience[]) => boolean;
  onNavigate?: () => void;
  pendingPix: number;
}) {
  const items = group.items.filter((i) => {
    if (i.children) {
      const anyChild = i.children.some((c) => filterItem(c, group.audiences));
      if (!anyChild) return false;
      if (i.superOnly || i.audiences || i.perm || i.requiresPlanTier) {
        return filterItem(i, group.audiences);
      }
      return true;
    }
    return filterItem(i, group.audiences);
  });
  if (items.length === 0) return null;

  const hasActive = items.some((i) => isBranchActive(pathname, i));
  const [open, setOpen] = useState<boolean>(hasActive || !!group.defaultOpen);
  const tone = GROUP_TONES[index % GROUP_TONES.length];

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm font-bold uppercase tracking-wide transition-colors shadow-sm",
          tone,
        )}
      >
        <span className="truncate">{group.label}</span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", open ? "rotate-0" : "-rotate-90")}
        />
      </button>
      {open && (
        <div className="space-y-1 mt-1.5">
          {items.map((it) =>
            it.children ? (
              <SubMenu
                key={it.label}
                item={it}
                pathname={pathname}
                filterItem={filterItem}
                onNavigate={onNavigate}
                pendingPix={pendingPix}
                groupAudiences={group.audiences}
              />
            ) : (
              <NavLinkRow
                key={it.to ?? it.label}
                item={it}
                active={!!it.to && isItemActive(pathname, it.to)}
                onNavigate={onNavigate}
                badgeCount={pendingPix}
              />
            )
          )}
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
      // jamais aparecem para o consumidor final.
      if (audience === "consumidor") return false;
      return true;
    }
    return audiences.includes(audience);
  };

  const filterItem = (i: NavItem, groupAudiences?: NavAudience[]): boolean => {
    const effective = i.audiences ?? groupAudiences;
    if (!matchesAudience(effective)) return false;
    if (i.superOnly) return isSuper;
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
            key={it.to ?? it.label}
            item={it}
            active={!!it.to && isItemActive(location.pathname, it.to)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      {visibleGroups.map((g, i) => (
        <Group
          key={g.label}
          group={g}
          index={i}
          pathname={location.pathname}
          filterItem={filterItem}
          onNavigate={onNavigate}
          pendingPix={pendingPix}
        />
      ))}

    </nav>
  );
}
