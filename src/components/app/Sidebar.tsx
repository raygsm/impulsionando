import type { CurrentUser } from "@/lib/auth";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";

import { SidebarNav } from "./SidebarNav";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useAudience } from "@/hooks/use-audience";
import { Badge } from "@/components/ui/badge";

export function Sidebar({ currentUser }: { currentUser: CurrentUser }) {
  const { isImpersonating, impersonatedCompanyName } = useImpersonation();
  const { label: audienceLabel, isViewingAs } = useAudience();

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      <div className="px-4 py-4 flex items-center justify-center border-b border-sidebar-border" data-bg-tone="dark">
        <div className="aspect-square w-40 rounded-xl bg-white shadow-sm flex items-center justify-center p-3">
          <img
            src={logoAsset.url}
            alt="Impulsionando Tecnologia"
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        </div>
      </div>

      <SidebarNav currentUser={currentUser} />
      <div className="p-3 border-t border-sidebar-border space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wide text-sidebar-foreground/50">Audiência</span>
          <Badge variant={isViewingAs ? "outline" : "secondary"} className="text-[10px]">
            {audienceLabel}
          </Badge>
        </div>
        <div className="text-xs text-sidebar-foreground/60">
          {isImpersonating
            ? `Visão: ${impersonatedCompanyName ?? "Cliente"}`
            : currentUser.isSuperAdmin
              ? "Modo Master"
              : currentUser.memberships[0]?.companies?.name ?? "—"}
        </div>
      </div>
    </aside>
  );
}
