import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { LGPDBanner } from "@/components/marketing/LGPDBanner";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { DemoAccessGate } from "@/components/demo/DemoAccessGate";
import { TenantBrandingProvider } from "@/components/app/TenantBrandingProvider";
import { TenantHostFallback } from "@/components/app/TenantHostFallback";
import { ImpulsionitoConcierge } from "@/components/marketing/ImpulsionitoConcierge";
import { MedicitoConcierge } from "@/components/riomed/MedicitoConcierge";
import { PoweredByImpulsionando } from "@/components/site/SiteFooter";
import { isMaintenanceOn, MAINTENANCE_KEY } from "@/lib/maintenance";
import { canonicalTenantHostRedirect } from "@/lib/subdomain";
import { EnvHealthBanner } from "@/components/app/EnvHealthBanner";
import { ScrollGuidance } from "@/components/core/ScrollGuidance";
import { RocketRouteLoader } from "@/components/app/RocketRouteLoader";
import { CoreCopyGuard } from "@/components/app/CoreCopyGuard";
import { openImpulsionito } from "@/lib/impulsionito-tracking";
import { SkipLink } from "@/components/impulsionando/SkipLink";

const WMP_CANONICAL_HOST = "wmp.impulsionando.com.br";
const COLORS_CANONICAL_HOST = "colorssaude.impulsionando.com.br";
const CLIENT_AGENT_HOSTS = new Set([
  "anamadu.impulsionando.com.br",
  "chrismed.impulsionando.com.br",
  COLORS_CANONICAL_HOST,
  WMP_CANONICAL_HOST,
  "riomed.impulsionando.com.br",
  "marocas.impulsionando.com.br",
]);

function isWmpBrowser(): boolean {
  return typeof window !== "undefined" && window.location.hostname.toLowerCase() === WMP_CANONICAL_HOST;
}

function TenantSubdomainRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname.toLowerCase();
    if (host === WMP_CANONICAL_HOST || host === COLORS_CANONICAL_HOST) return;
    const canonical = canonicalTenantHostRedirect(window.location);
    if (canonical) window.location.replace(canonical);
  }, []);
  return null;
}

function WmpNavigationLock() {
  useEffect(() => {
    if (!isWmpBrowser()) return;

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    const allowUrl = (value: string | URL | null | undefined): boolean => {
      if (value == null || value === "") return true;
      try {
        const target = new URL(String(value), window.location.href);
        return target.hostname.toLowerCase() === WMP_CANONICAL_HOST;
      } catch {
        return false;
      }
    };

    history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
      if (!allowUrl(url)) {
        console.error("[WMP] pushState blocked by deny-all navigation policy", url);
        return;
      }
      originalPushState(data, unused, url);
    }) as History["pushState"];

    history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      if (!allowUrl(url)) {
        console.error("[WMP] replaceState blocked by deny-all navigation policy", url);
        return;
      }
      originalReplaceState(data, unused, url);
    }) as History["replaceState"];

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a[href]") as HTMLAnchorElement | null : null;
      if (!target) return;
      const rawHref = target.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return;
      if (!allowUrl(rawHref)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.error("[WMP] external/cross-domain navigation blocked", rawHref);
      }
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      const action = form.getAttribute("action");
      if (action && !allowUrl(action)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.error("[WMP] cross-domain form action blocked", action);
      }
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);

    return () => {
      history.pushState = originalPushState as History["pushState"];
      history.replaceState = originalReplaceState as History["replaceState"];
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return null;
}

function MaintenanceGate() {
  const router = useRouter();
  useEffect(() => {
    if (isWmpBrowser()) return;
    const allow = (path: string) => path.startsWith("/manutencao") || path.startsWith("/admin/manutencao") || path.startsWith("/healthz");
    const check = () => { if (isMaintenanceOn() && !allow(window.location.pathname)) router.navigate({ to: "/manutencao" }); };
    check();
    const unsub = router.subscribe("onResolved", check);
    const onStorage = (e: StorageEvent) => { if (e.key === MAINTENANCE_KEY) check(); };
    const onChanged = () => check();
    window.addEventListener("storage", onStorage);
    window.addEventListener("maintenance:changed", onChanged);
    return () => { unsub(); window.removeEventListener("storage", onStorage); window.removeEventListener("maintenance:changed", onChanged); };
  }, [router]);
  return null;
}

function NotFoundComponent() {
  const wmp = isWmpBrowser();
  return <div className="flex min-h-dvh items-center justify-center bg-background px-4"><div className="max-w-md text-center">{!wmp && <div className="mb-8 flex justify-center"><LogoImpulsionando variant="light" size="lg" /></div>}<h1 className="text-7xl font-bold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2><p className="mt-2 text-sm text-muted-foreground">A página que você procura não existe ou foi movida.</p><div className="mt-6"><Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Ir para o início</Link></div></div></div>;
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
  async function copyDetail() { try { await navigator.clipboard.writeText(errorDetail); } catch { /* noop */ } }
  const supportCtx = `Código do erro: ${errorId}\nTipo: ${kind}\nMensagem: ${error?.message ?? ""}`;
  return <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-lg">{!isWmpBrowser() && <div className="mb-6 flex justify-center"><LogoImpulsionando variant="light" size="lg" /></div>}<div className="rounded-xl border border-border bg-card p-6 shadow-sm"><div className="flex items-start gap-3"><div aria-hidden="true" className={"mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full " + (kind === "offline" ? "bg-amber-500" : kind === "chunk_stale" ? "bg-sky-500" : kind === "server" ? "bg-red-500" : "bg-muted-foreground")} /><div className="min-w-0"><h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1><p className="mt-2 text-sm text-muted-foreground leading-relaxed">{guidance}</p></div></div><div className="mt-5 flex flex-wrap gap-2">{kind === "chunk_stale" ? <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Recarregar página</button> : <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Tentar novamente</button>}<button onClick={copyDetail} className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">Copiar detalhes</button>{!isWmpBrowser() && <button onClick={() => openImpulsionito({ message: `Preciso de ajuda com um erro no portal.\n${supportCtx}`, source: "error_boundary" })} className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">Falar com suporte</button>}</div><p className="mt-4 text-xs text-muted-foreground">Código: <span className="font-mono">{errorId}</span></p></div></div></div>;
}

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });
type RouterContext = { queryClient: QueryClient };
export const Route = createRootRouteWithContext<RouterContext>()({ head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { name: "theme-color", content: "#020617" }], links: [{ rel: "stylesheet", href: appCss }] }), component: RootComponent, notFoundComponent: NotFoundComponent, errorComponent: ErrorComponent });

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const state = useRouterState();
  useEffect(() => {
    const { data } = supabaseAuth.auth.onAuthStateChange(() => { queryClient.invalidateQueries(); });
    return () => data.subscription.unsubscribe();
  }, []);

  const pathname = state.location.pathname;
  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const isWmp = host === WMP_CANONICAL_HOST;
  const isRiomed = host === "riomed.impulsionando.com.br" || pathname === "/riomed" || pathname.startsWith("/riomed/");
  const hasDedicatedClientAgent = CLIENT_AGENT_HOSTS.has(host) || pathname === "/anamadu" || pathname.startsWith("/anamadu/") || pathname === "/chrismed" || pathname.startsWith("/chrismed/") || pathname === "/colors" || pathname.startsWith("/colors/") || pathname === "/wmp" || pathname.startsWith("/wmp/") || pathname === "/marocas" || pathname.startsWith("/marocas/");

  return <RootDocument><QueryClientProvider client={queryClient}><TenantBrandingProvider><WmpNavigationLock />{!isWmp && <TenantSubdomainRedirect />}{!isWmp && <MaintenanceGate />}{!isWmp && <TenantHostFallback />}{!isWmp && <EnvHealthBanner />}<RocketRouteLoader />{!isWmp && <CoreCopyGuard />}{!isWmp && <SkipLink />}<ScrollGuidance /><Outlet /><LGPDBanner />{isRiomed ? <MedicitoConcierge /> : hasDedicatedClientAgent ? null : <ImpulsionitoConcierge />}{!isWmp && <PoweredByImpulsionando />}<Toaster richColors position="top-right" /></TenantBrandingProvider></QueryClientProvider></RootDocument>;
}