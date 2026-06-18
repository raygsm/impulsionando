import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, HelpCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Shell mínimo usado durante a jornada de checkout/assinatura.
 *
 * Regra estrutural: o usuário no fluxo de contratação NÃO pode ver menus
 * administrativos (Core, WL, Cockpits, Central Impulsionando, Cockpit Contábil,
 * Começar/Melhorar, etc.). Esse shell substitui o AppShell normal e expõe
 * apenas: Meu Plano · Benefícios · Checkout · Ajuda · Sair.
 */
export function CheckoutShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Impulsionando</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link
              to="/minha-assinatura"
              className="px-3 py-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              Meu Plano
            </Link>
            <Link
              to="/clube"
              className="px-3 py-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              Benefícios
            </Link>
            <Link
              to="/contratar"
              className="px-3 py-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              Checkout
            </Link>
            <a
              href="https://impulsionando.com.br/ajuda"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Ajuda
            </a>
          </nav>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © Impulsionando · Pagamento seguro · Suas informações são protegidas pela LGPD
      </footer>
    </div>
  );
}

/** Rotas que devem renderizar com o CheckoutShell em vez do AppShell. */
export function isCheckoutPath(pathname: string): boolean {
  return (
    pathname.startsWith("/checkout/") ||
    pathname === "/checkout" ||
    pathname === "/clube/bem-vindo"
  );
}
