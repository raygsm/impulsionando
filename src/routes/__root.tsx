import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { supabase as supabaseAuth } from "@/integrations/supabase/client";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
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
import { ImpulsionitoPanel } from "@/components/marketing/ImpulsionitoPanel";
import { PoweredByImpulsionando } from "@/components/site/SiteFooter";
import { isMaintenanceOn, MAINTENANCE_KEY } from "@/lib/maintenance";
import { getTenantSubdomain, tenantSubdomainTarget } from "@/lib/subdomain";
import { EnvHealthBanner } from "@/components/app/EnvHealthBanner";
import { ScrollGuidance } from "@/components/core/ScrollGuidance";
import { RocketRouteLoader } from "@/components/app/RocketRouteLoader";


function TenantSubdomainRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const match = getTenantSubdomain(window.location.hostname);
    if (!match) return;
    const target = tenantSubdomainTarget(match.slug);
    // Só redireciona se ainda não estamos na rota de destino ou em subrota do tenant.
    const p = window.location.pathname;
    if (p === "/" || p === "") {
      window.location.replace(target + window.location.search + window.location.hash);
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
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

type ErrorKind = "chunk_stale" | "offline" | "server" | "not_found" | "unknown";

function classifyError(error: Error): { kind: ErrorKind; title: string; guidance: string } {
  const msg = `${error?.name ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      kind: "offline",
      title: "Você está sem conexão",
      guidance:
        "Verifique sua internet (Wi-Fi ou dados). Assim que a conexão voltar, clique em Tentar novamente.",
    };
  }
  if (/chunkloaderror|loading chunk|failed to fetch dynamically imported module|importing a module script failed/.test(msg)) {
    return {
      kind: "chunk_stale",
      title: "Nova versão publicada",
      guidance:
        "Foi publicada uma versão mais recente do portal enquanto você navegava. Recarregue a página para aplicar a atualização.",
    };
  }
  if (/(^|\W)(5\d\d|internal server|service unavailable|bad gateway|gateway timeout)(\W|$)/.test(msg)) {
    return {
      kind: "server",
      title: "Instabilidade momentânea do servidor",
      guidance:
        "Nosso backend respondeu com erro. Costuma resolver em poucos minutos. Você pode tentar de novo ou falar com o suporte.",
    };
  }
  if (/404|not.?found|no matching route/.test(msg)) {
    return {
      kind: "not_found",
      title: "Recurso não encontrado",
      guidance: "O endereço acessado não existe mais ou foi movido. Volte para o início.",
    };
  }
  return {
    kind: "unknown",
    title: "Esta página não carregou",
    guidance:
      "Algo saiu do esperado durante o build ou o carregamento. Tente novamente, recarregue ou avise o suporte com o código abaixo.",
  };
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { kind, title, guidance } = classifyError(error);
  const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
  const errorDetail = `${errorId}\n${error?.name ?? "Error"}: ${error?.message ?? ""}${error?.stack ? `\n${error.stack.split("\n").slice(0, 4).join("\n")}` : ""}`;

  useEffect(() => {
    reportLovableError(error, {
      boundary: "tanstack_root_error_component",
      kind,
      errorId,
    });
  }, [error, kind, errorId]);

  async function copyDetail() {
    try {
      await navigator.clipboard.writeText(errorDetail);
    } catch {
      /* noop */
    }
  }

  const whatsappHelp = `https://wa.me/5521993075000?text=${encodeURIComponent(
    `Olá, preciso de suporte no portal Impulsionando.\nCódigo do erro: ${errorId}\nTipo: ${kind}\nMensagem: ${error?.message ?? ""}`,
  )}`;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <LogoImpulsionando variant="light" size="lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div
              aria-hidden="true"
              className={
                "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full " +
                (kind === "offline"
                  ? "bg-amber-500"
                  : kind === "chunk_stale"
                    ? "bg-sky-500"
                    : kind === "server"
                      ? "bg-red-500"
                      : "bg-muted-foreground")
              }
            />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{guidance}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {kind === "chunk_stale" ? (
              <button
                onClick={() => {
                  if (typeof window !== "undefined") window.location.reload();
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Recarregar página
              </button>
            ) : (
              <button
                onClick={() => {
                  router.invalidate();
                  reset();
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Tentar novamente
              </button>
            )}
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Ir para o início
            </a>
            <a
              href="/api/public/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Ver status do sistema
            </a>
            <a
              href={whatsappHelp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Falar com suporte
            </a>
          </div>

          <div className="mt-5 rounded-md border border-dashed border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Código do erro
                </div>
                <div className="mt-0.5 font-mono text-xs text-foreground truncate">{errorId}</div>
              </div>
              <button
                type="button"
                onClick={copyDetail}
                className="shrink-0 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                Copiar detalhes
              </button>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Ver detalhes técnicos
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-background p-2 text-[11px] leading-relaxed text-muted-foreground">
                {errorDetail}
              </pre>
            </details>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            Informe o código <span className="font-mono">{errorId}</span> ao suporte para acelerar
            a resposta. Registramos o erro automaticamente para o time técnico.
          </p>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0F172A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Impulsionando" },
      { name: "mobile-web-app-capable", content: "yes" },
      // Cache-busting: garante que a navegação/menu novo apareça imediatamente após publicar.
      { httpEquiv: "Cache-Control", content: "no-cache, no-store, must-revalidate" },
      { httpEquiv: "Pragma", content: "no-cache" },
      { httpEquiv: "Expires", content: "0" },
      { title: "Impulsionando Tecnologia — Plataforma SaaS Multiempresa" },
      { name: "description", content: "Plataforma SaaS multiempresa modular: CRM, agenda online, WhatsApp, pagamentos, emissão fiscal, estoque, BI e automação para empresas que precisam crescer com controle." },
      { name: "author", content: "Impulsionando Tecnologia" },
      { property: "og:site_name", content: "Impulsionando Tecnologia" },
      { property: "og:title", content: "Impulsionando Tecnologia — Plataforma SaaS Multiempresa" },
      { property: "og:description", content: "SaaS multiempresa modular: CRM, agenda, WhatsApp, pagamentos, emissão fiscal, estoque, BI e automação." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://impulsionando.com.br/" },
      { property: "og:image", content: "https://impulsionando.com.br/__l5e/assets-v1/bfbd00d4-b55e-4e72-b25c-e93c63adf738/logo-impulsionando.png" },
      { property: "og:image:alt", content: "Impulsionando Tecnologia" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Impulsionando Tecnologia — Plataforma SaaS Multiempresa" },
      { name: "twitter:description", content: "SaaS multiempresa modular para gestão, atendimento e automação." },
      { name: "twitter:image", content: "https://impulsionando.com.br/__l5e/assets-v1/bfbd00d4-b55e-4e72-b25c-e93c63adf738/logo-impulsionando.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/pwa-icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/pwa-icon-512.png" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/pwa-icon-192.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Impulsionando Tecnologia",
          url: "https://impulsionando.com.br",
          logo: "https://impulsionando.com.br/__l5e/assets-v1/bfbd00d4-b55e-4e72-b25c-e93c63adf738/logo-impulsionando.png",
          description:
            "Plataforma SaaS multiempresa modular para gestão, atendimento e automação.",
          sameAs: ["https://impulsionandobrasil.com.br"],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Impulsionando Tecnologia",
          url: "https://impulsionando.com.br",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
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
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <AnalyticsTracker />
      <MaintenanceGate />
      <TenantSubdomainRedirect />
      <TenantBrandingProvider />
      <TenantHostFallback />
      <Toaster richColors position="top-right" />
      <EnvHealthBanner />
      <ScrollGuidance />
      <RocketRouteLoader />
      <Outlet />
      <PoweredByImpulsionando />
      <LGPDBanner />
      {/* Painel visual do agente Impulsionito (somente UI — integração posterior). */}
      <ImpulsionitoPanel />
      <DemoAccessGate />
    </QueryClientProvider>
  );
}


function AnalyticsTracker() {
  const router = useRouter();
  useEffect(() => {
    // Importa lazy para não rodar em SSR e isolar o módulo
    import("@/lib/analytics").then(({ initAnalytics, trackPageView }) => {
      initAnalytics();
      // Primeiro page_view
      trackPageView(window.location.pathname + window.location.search);
      // Próximas navegações
      const unsub = router.subscribe("onResolved", () => {
        trackPageView(window.location.pathname + window.location.search);
      });
      (window as unknown as { __unsubAnalytics?: () => void }).__unsubAnalytics = unsub;
    });
    // Rastreio global de cliques + retorno (envio presumido) no WhatsApp oficial
    import("@/lib/whatsapp-cta").then(
      ({ installGlobalWhatsAppClickTracking, installWhatsAppReturnTracking }) => {
        installGlobalWhatsAppClickTracking();
        installWhatsAppReturnTracking();
      },
    );
    return () => {
      const w = window as unknown as { __unsubAnalytics?: () => void };
      w.__unsubAnalytics?.();
      w.__unsubAnalytics = undefined;
    };
  }, [router]);
  return null;
}




function AuthSync() {
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabaseAuth.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        return;
      }
      queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);
  return null;
}
