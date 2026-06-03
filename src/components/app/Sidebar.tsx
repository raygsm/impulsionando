import type { CurrentUser } from "@/lib/auth";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";
import { SidebarNav } from "./SidebarNav";

export function Sidebar({ currentUser }: { currentUser: CurrentUser }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      <div className="h-24 px-4 flex items-center justify-center border-b border-sidebar-border">
        <img src={logoAsset.url} alt="Impulsionando Tecnologia" className="h-16 w-auto" />
      </div>
      <SidebarNav currentUser={currentUser} />
      <div className="p-3 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
        {currentUser.isSuperAdmin
          ? "Modo Master"
          : currentUser.memberships[0]?.companies?.name ?? "—"}
      </div>
    </aside>
  );
}
