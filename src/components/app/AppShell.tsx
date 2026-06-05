import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TrialBanner } from "./TrialBanner";
import { PastDueBanner } from "@/components/PastDueBanner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMyTrial } from "@/hooks/use-trial";
import { useSubscription } from "@/hooks/useSubscription";
import { useCompanyModules, requiredModuleFor } from "@/hooks/useCompanyModules";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, error } = useCurrentUser();
  const { isSuspended: trialSuspended } = useMyTrial();
  const { isSuspended: subSuspended } = useSubscription();
  const { hasModule, bypass, isLoading: modulesLoading } = useCompanyModules();

  useEffect(() => {
    if (!isLoading && !data && !error) navigate({ to: "/auth" });
  }, [data, isLoading, error, navigate]);

  // Gate de inadimplência (trial OU assinatura suspensa)
  const isSuspended = trialSuspended || subSuspended;
  useEffect(() => {
    if (!isSuspended) return;
    const path = location.pathname;
    const allowed =
      path.startsWith("/finance") ||
      path.startsWith("/minha-assinatura") ||
      path.startsWith("/auth") ||
      path === "/dashboard" ||
      path === "/";
    if (!allowed) navigate({ to: "/minha-assinatura" });
  }, [isSuspended, location.pathname, navigate]);

  // Gate por módulo: bloqueia rotas cujo módulo não está habilitado
  useEffect(() => {
    if (bypass || modulesLoading || isSuspended) return;
    const required = requiredModuleFor(location.pathname);
    if (!required) return;
    if (!hasModule(required)) {
      navigate({
        to: "/planos",
        search: { locked: required } as never,
      });
    }
  }, [bypass, modulesLoading, isSuspended, location.pathname, hasModule, navigate]);

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
        <TrialBanner />
        <PastDueBanner />
        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

