import type { CurrentUser } from "@/lib/auth";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";
import { SidebarNav } from "./SidebarNav";
import { useImpersonation } from "@/hooks/use-impersonation";

export function Sidebar({ currentUser }: { currentUser: CurrentUser }) {
  const { isImpersonating, impersonatedCompanyName } = useImpersonation();
  return (
    <aside className="hidden lg:flex flex-col w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      <div className="px-4 py-5 flex items-center justify-center border-b border-sidebar-border bg-white/95">
        <img src={logoAsset.url} alt="Impulsionando Tecnologia" className="h-48 w-auto object-contain" />
      </div>
      <SidebarNav currentUser={currentUser} />
      <div className="p-3 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
        {isImpersonating
          ? `Visão: ${impersonatedCompanyName ?? "Cliente"}`
          : currentUser.isSuperAdmin
            ? "Modo Master"
            : currentUser.memberships[0]?.companies?.name ?? "—"}
      </div>
    </aside>
  );
}
