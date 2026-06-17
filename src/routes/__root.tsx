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

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <img src={logoAsset.url} alt="Impulsionando Tecnologia" className="mx-auto mb-8 h-20 md:h-24 w-auto object-contain" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível concluir o carregamento agora. Tente novamente ou volte para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Impulsionando Tecnologia — Plataforma SaaS Multiempresa" },
      { name: "description", content: "Plataforma SaaS multiempresa modular: CRM, agenda online, WhatsApp, pagamentos, emissão fiscal, estoque, BI e automação para empresas que precisam crescer com controle." },
      { name: "author", content: "Impulsionando Tecnologia" },
      { property: "og:site_name", content: "Impulsionando Tecnologia" },
      { property: "og:title", content: "Impulsionando Tecnologia — Plataforma SaaS Multiempresa" },
      { property: "og:description", content: "SaaS multiempresa modular: CRM, agenda, WhatsApp, pagamentos, emissão fiscal, estoque, BI e automação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Impulsionando Tecnologia — Plataforma SaaS Multiempresa" },
      { name: "twitter:description", content: "SaaS multiempresa modular para gestão, atendimento e automação." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Impulsionando Tecnologia",
          url: "https://impulsionando.com.br",
          logo: "https://impulsionando.com.br/favicon.ico",
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
      <Toaster richColors position="top-right" />
      <Outlet />
      <LGPDBanner />
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
