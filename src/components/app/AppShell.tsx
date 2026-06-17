import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TrialBanner } from "./TrialBanner";
import { PastDueBanner } from "@/components/PastDueBanner";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { CommandPalette } from "./CommandPalette";
import { Breadcrumbs } from "./Breadcrumbs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMyTrial } from "@/hooks/use-trial";
import { useSubscription } from "@/hooks/useSubscription";
import { useCompanyModules, requiredModuleFor } from "@/hooks/useCompanyModules";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { pushRecent } from "@/hooks/use-recent-pages";
import { useAppearance } from "@/hooks/use-appearance";
import { TOP_ITEMS, NAV_GROUPS } from "./nav-config";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, error } = useCurrentUser();
  const { isSuspended: trialSuspended } = useMyTrial();
  const { isSuspended: subSuspended, isActive: subActive } = useSubscription();
  const { hasModule, bypass, isLoading: modulesLoading } = useCompanyModules();
  useAppearance();

  useEffect(() => {
    if (!isLoading && !data && !error) navigate({ to: "/auth" });
  }, [data, isLoading, error, navigate]);

  // Histórico recente (B19)
  useEffect(() => {
    const path = location.pathname;
    if (path === "/" || path === "/auth" || path.startsWith("/auth/")) return;
    const idx: Record<string, string> = {};
    for (const it of TOP_ITEMS) idx[it.to] = it.label;
    for (const g of NAV_GROUPS) for (const it of g.items) idx[it.to] = it.label;
    const label = idx[path] ?? document.title.replace(" — Impulsionando", "") ?? path;
    pushRecent(path, label);
  }, [location.pathname]);

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

  // Gate por módulo: aplicado APENAS para assinantes pagantes ativos.
  // Durante trial ativo (sem assinatura), todos os módulos ficam acessíveis.
  // Sem trial nem assinatura, o usuário cai no fluxo de /planos.
  useEffect(() => {
    if (bypass || modulesLoading || isSuspended) return;
    if (!subActive) return; // não bloqueia trial ou sem-assinatura aqui
    const required = requiredModuleFor(location.pathname);
    if (!required) return;
    if (!hasModule(required)) {
      navigate({ to: "/planos", search: { locked: required } as never });
    }
  }, [bypass, modulesLoading, isSuspended, subActive, location.pathname, hasModule, navigate]);


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
        <ImpersonationBanner />
        <TrialBanner />
        <PastDueBanner />
        <Breadcrumbs />
        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}

