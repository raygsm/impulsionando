import { useTenant } from "@/hooks/use-tenant";
import { useRouterState } from "@tanstack/react-router";
import { AlertTriangle, Globe, Home, LifeBuoy } from "lucide-react";

/**
 * Fallback amigável quando o hostname não resolve para nenhum tenant
 * válido no core. Some no CORE (impulsionando.com.br, previews, localhost)
 * e enquanto a resolução está carregando.
 *
 * Renderiza uma tela full-screen substituindo o Outlet, mas apenas em
 * rotas públicas — o `_authenticated` já tem seu próprio gate.
 */
export function TenantHostFallback() {
  const { tenant, isLoading, isCore, host } = useTenant();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isCore || isLoading || tenant) return null;
  // Não interceptar rotas administrativas ou de auth do próprio core.
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_authenticated") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/core")
  ) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto"
    >
      <div className="max-w-lg w-full bg-card border border-border rounded-2xl shadow-xl p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500/15 text-amber-600 grid place-items-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">Domínio não reconhecido</div>
            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {host || "hostname indisponível"}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Este endereço chegou até o Ecossistema <strong>Impulsionando</strong>, mas não está
          associado a nenhum tenant ativo. Isso normalmente indica uma das situações abaixo:
        </p>

        <ul className="text-sm space-y-2 text-foreground/90">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              O domínio custom foi conectado no Lovable mas ainda <strong>não foi cadastrado</strong>{" "}
              como tenant no core.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              O registro <code className="font-mono text-xs">A</code> /{" "}
              <code className="font-mono text-xs">CNAME</code> aponta para o Impulsionando, mas o{" "}
              <code className="font-mono text-xs">TXT _lovable</code> ainda está propagando.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>O tenant foi desativado ou o domínio foi movido para outro projeto.</span>
          </li>
        </ul>

        <div className="border-t pt-4 flex flex-col sm:flex-row gap-2">
          <a
            href="https://impulsionando.com.br"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium py-2.5 hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" /> Ir para Impulsionando
          </a>
          <a
            href="mailto:suporte@impulsionando.com.br?subject=Domínio%20não%20reconhecido"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border text-sm font-medium py-2.5 hover:bg-muted transition-colors"
          >
            <LifeBuoy className="h-4 w-4" /> Falar com suporte
          </a>
        </div>

        <div className="text-[11px] text-muted-foreground text-center pt-1">
          Se você é o responsável pelo domínio, verifique DNS/SSL em{" "}
          <span className="font-mono">/core/publicacao</span>.
        </div>
      </div>
    </div>
  );
}
