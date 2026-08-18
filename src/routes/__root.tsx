import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { supabase as supabaseAuth } from "@/integrations/supabase/client";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LGPDBanner } from "@/components/marketing/LGPDBanner";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { DemoAccessGate } from "@/components/demo/DemoAccessGate";
import { TenantBrandingProvider } from "@/components/app/TenantBrandingProvider";
import { TenantHostFallback } from "@/components/app/TenantHostFallback";
import { ImpulsionitoConcierge } from "@/components/marketing/ImpulsionitoConcierge";
import { MedicitoConcierge } from "@/components/riomed/MedicitoConcierge";
import { PoweredByImpulsionando } from "@/components/site/SiteFooter";
import { isMaintenanceOn, MAINTENANCE_KEY } from "@/lib/maintenance";
import {
  canonicalTenantHostRedirect,
  deprecatedSubdomainRedirect,
} from "@/lib/subdomain";
import { EnvHealthBanner } from "@/components/app/EnvHealthBanner";
import { ScrollGuidance } from "@/components/core/ScrollGuidance";
import { RocketRouteLoader } from "@/components/app/RocketRouteLoader";
import { CoreCopyGuard } from "@/components/app/CoreCopyGuard";
import { openImpulsionito } from "@/lib/impulsionito-tracking";
import { SkipLink } from "@/components/impulsionando/SkipLink";

const WMP_CANONICAL_HOST = "wmp.impulsionando.com.br";

/**
 * WMP redirect safety policy:
 * - The canonical WMP host is deny-by-default for every client-side redirect.
 * - Cross-domain redirect support must not be added here unless Raygs provides
 *   two separate, explicit approvals for the exact source and destination.
 * - Same-host navigation must use the router/Link components, never location.replace.
 */
function TenantSubdomainRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Absolute hard stop: WMP is never allowed to leave its canonical host from
    // this client-side redirect layer. This guard runs before every redirect helper.
    if (window.location.hostname.toLowerCase() === WMP_CANONICAL_HOST) return;

    const canonical = canonicalTenantHostRedirect(window.location);
    if (canonical) {
      window.location.replace(canonical);
      return;
    }
    const legacy = deprecatedSubdomainRedirect(window.location);
    if (legacy) {
      const from_host = window.location.hostname;
      let to_host = from_host;
      try { to_host = new URL(legacy).hostname; } catch { /* noop */ }
      import("@/lib/painel-audit").then(({ logLegacySubdomainHit }) => {
        logLegacySubdomainHit({
          from_host,
          to_host,
          path: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        });
      }).catch(() => { /* noop */ });
      window.location.replace(legacy);
      return;
    }
  }, []);
  return null;
}

function MaintenanceGate() {
  const router = useRouter();
  useEffect(() => {
    const allow = (path: string) =>
      path.startsWith("/manutencao") ||
      path.startsWith("/admin/manutencao") ||
      path.startsWith("/healthz");
    const check = () => {
      if (!isMaintenanceOn()) return;
      const path = window.location.pathname;
      if (!allow(path)) router.navigate({ to: "/manutencao" });
    };
    check();
    const unsub = router.subscribe("onResolved", check);
    const onStorage = (e: StorageEvent) => {
      if (e.key === MAINTENANCE_KEY) check();
    };
    const onChanged = () => check();
    window.addEventListener("storage", onStorage);
    window.addEventListener("maintenance:changed", onChanged);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("maintenance:changed", onChanged);
    };
  }, [router]);
  return null;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center"><LogoImpulsionando variant="light" size="lg" /></div>
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">A página que você procura não existe ou foi movida.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Ir para o início</Link>
        </div>
      </div>
    </div>
  );
}

type ErrorKind = "chunk_stale" | "offline" | "server" | "not_found" | "unknown";

function classifyError(error: Error): { kind: ErrorKind; title: string; guidance: string } {
  const msg = `${error?.name ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { kind: "offline", title: "Você está sem conexão", guidance: "Verifique sua internet (Wi-Fi ou dados). Assim que a conexão voltar, clique em Tentar novamente." };
  if (/chunkloaderror|loading chunk|failed to fetch dynamically imported module|importing a module script failed/.test(msg)) return { kind: "chunk_stale", title: "Nova versão publicada", guidance: "Foi publicada uma versão mais recente do portal enquanto você navegava. Recarregue a página para aplicar a atualização." };
  if (/(^|\W)(5\d\d|internal server|service unavailable|bad gateway|gateway timeout)(\W|$)/.test(msg)) return { kind: "server", title: "Instabilidade momentânea do servidor", guidance: "Nosso backend respondeu com erro. Costuma resolver em poucos minutos. Você pode tentar de novo ou falar com o suporte." };
  if (/404|not.?found|no matching route/.test(msg)) return { kind: "not_found", title: "Recurso não encontrado", guidance: "O endereço acessado não existe mais ou foi movido. Volte para o início." };
  return { kind: "unknown", title: "Esta página não carregou", guidance: "Algo saiu do esperado durante o build ou o carregamento. Tente novamente, recarregue ou avise o suporte com o código abaixo." };
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { kind, title, guidance } = classifyError(error);
  const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
  const errorDetail = `${errorId}\n${error?.name ?? "Error"}: ${error?.message ?? ""}${error?.stack ? `\n${error.stack.split("\n").slice(0, 4).join("\n")}` : ""}`;

  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component", kind, errorId }); }, [error, kind, errorId]);

  async function copyDetail() { try { await navigator.clipboard.writeText(errorDetail); } catch { /* noop */ } }
  const supportCtx = `Código do erro: ${errorId}\nTipo: ${kind}\nMensagem: ${error?.message ?? ""}`;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center"><LogoImpulsionando variant="light" size="lg" /></div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3"><div aria-hidden="true" className={"mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full " + (kind === "offline" ? "bg-amber-500" : kind === "chunk_stale" ? "bg-sky-500" : kind === "server" ? "bg-red-500" : "bg-muted-foreground")} /><div className="min-w-0"><h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1><p className="mt-2 text-sm text-muted-foreground leading-relaxed">{guidance}</p></div></div>
          <div className="mt-5 flex flex-wrap gap-2">
            {kind === "chunk_stale" ? <button onClick={() => { if (typeof window !== "undefined") window.location.reload(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Recarregar página</button> : <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Tentar novamente</button>}
            <button onClick={copyDetail} className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Copiar detalhes</button>
            <button onClick={() => openImpulsionito({ message: `Preciso de ajuda com um erro no portal.\n${supportCtx}`, source: "error_boundary" })} className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Falar com suporte</button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Código: <span className="font-mono">{errorId}</span></p>
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });

type RouterContext = { queryClient: QueryClient };

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#020617" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const state = useRouterState();
  const queryClientFromContext = useQueryClient();
  useEffect(() => {
    const { data } = supabaseAuth.auth.onAuthStateChange(() => { queryClientFromContext.invalidateQueries(); });
    return () => data.subscription.unsubscribe();
  }, [queryClientFromContext]);

  const pathname = state.location.pathname;
  const isRiomed = pathname === "/riomed" || pathname.startsWith("/riomed/");

  return (
    <QueryClientProvider client={queryClient}>
      <TenantBrandingProvider>
        <TenantSubdomainRedirect />
        <MaintenanceGate />
        <TenantHostFallback />
        <EnvHealthBanner />
        <RocketRouteLoader />
        <CoreCopyGuard />
        <SkipLink />
        <ScrollGuidance />
        <Outlet />
        <LGPDBanner />
        {isRiomed ? <MedicitoConcierge /> : <ImpulsionitoConcierge />}
        <PoweredByImpulsionando />
        <Toaster richColors position="top-right" />
        <HeadContent />
        <Scripts />
      </TenantBrandingProvider>
    </QueryClientProvider>
  );
}
