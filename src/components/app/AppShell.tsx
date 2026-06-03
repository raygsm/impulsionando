import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !data && !error) navigate({ to: "/auth" });
  }, [data, isLoading, error, navigate]);

  useEffect(() => {
    if (error) console.error("[AppShell] failed to load current user", error);
  }, [error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-4">
          <h2 className="text-lg font-semibold">Não foi possível carregar seu perfil</h2>
          <p className="text-sm text-muted-foreground">
            Sua sessão pode ter expirado. Faça login novamente para continuar.
          </p>
          <Button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar currentUser={data} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar currentUser={data} />
        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

