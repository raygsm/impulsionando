import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";
import type { CurrentUser } from "@/lib/auth";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";

export function MobileSidebar({ currentUser }: { currentUser: CurrentUser }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-72 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col"
      >
        <div className="h-24 px-4 flex items-center justify-center border-b border-sidebar-border">
          <img src={logoAsset.url} alt="Impulsionando Tecnologia" className="h-16 w-auto" />
        </div>
        <SidebarNav currentUser={currentUser} onNavigate={() => setOpen(false)} />
        <div className="p-3 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
          {currentUser.isSuperAdmin
            ? "Modo Master"
            : currentUser.memberships[0]?.companies?.name ?? "—"}
        </div>
      </SheetContent>
    </Sheet>
  );
}
