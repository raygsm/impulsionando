import { useCallback } from "react";

/**
 * Skip link acessível — permite pular direto ao conteúdo principal via
 * teclado (primeiro Tab a partir do topo da página). Visualmente oculto
 * até receber foco.
 *
 * Estratégia: procura o primeiro elemento `<main>` no DOM ao clicar e
 * move foco/scroll para lá. Funciona independentemente do id que cada
 * shell atribui (`#main-content` no AppShell, `#conteudo` no MarocasShell,
 * `#garrido-main` no GarridoShell, etc).
 */
export function SkipLink({ label = "Pular para o conteúdo principal" }: { label?: string }) {
  const onClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (typeof document === "undefined") return;
    const main = document.querySelector("main") as HTMLElement | null;
    if (!main) return;
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: false });
    main.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <a
      href="#main"
      onClick={onClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:inline-flex focus:items-center focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      {label}
    </a>
  );
}
