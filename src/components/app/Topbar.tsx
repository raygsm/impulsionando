import { useNavigate } from "@tanstack/react-router";
import { Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import type { CurrentUser } from "@/lib/auth";
import { MobileSidebar } from "./MobileSidebar";

export function Topbar({ currentUser }: { currentUser: CurrentUser }) {
  const navigate = useNavigate();
  const name = currentUser.memberships[0]?.display_name ?? currentUser.user.email ?? "Usuário";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel = currentUser.memberships[0]?.profiles?.name ?? "Usuário";

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10 flex items-center px-4 lg:px-6 gap-3 lg:gap-4">
      <MobileSidebar currentUser={currentUser} />
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-9 bg-background" />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium leading-tight">{name}</div>
          <div className="text-xs text-muted-foreground leading-tight">{roleLabel}</div>
        </div>
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={logout} title="Sair">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
