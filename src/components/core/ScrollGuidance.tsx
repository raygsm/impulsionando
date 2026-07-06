import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Orientação global de scroll para páginas públicas do ecossistema Impulsionando.
 *
 * Combina três recursos discretos e elegantes:
 *  1. Barra de progresso de leitura no topo (fina, cor primária).
 *  2. Dica animada "Continue rolando" no rodapé da 1ª dobra, que
 *     desaparece automaticamente assim que o usuário rola a página.
 *  3. Fade sutil no rodapé da 1ª dobra sugerindo continuidade.
 *
 * Só é ativado quando a página realmente tem conteúdo abaixo da dobra
 * (documentHeight > viewport + 120px) e em rotas públicas — telas
 * autenticadas, admin, checkout, auth, manutenção e demo ficam de fora
 * para não poluir dashboards.
 *
 * Uma rota pode desativar explicitamente adicionando
 * `document.body.dataset.noScrollGuidance = "1"`.
 */

const EXCLUDED_PREFIXES = [
  "/_authenticated",
  "/admin",
  "/app",
  "/auth",
  "/checkout",
  "/manutencao",
  "/reset-password",
  "/demo",
  "/healthz",
  "/wmp",
];

function isExcluded(pathname: string) {
  if (pathname === "/") return false;
  return EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function ScrollGuidance() {
  const router = useRouter();
  const [pathname, setPathname] = useState<string>(() =>
    typeof window === "undefined" ? "/" : window.location.pathname,
  );
  const [progress, setProgress] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      setPathname(window.location.pathname);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const excluded =
      isExcluded(pathname) || document.body.dataset.noScrollGuidance === "1";

    const measure = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const viewport = window.innerHeight;
      const full = Math.max(
        doc.scrollHeight,
        document.body.scrollHeight,
        doc.offsetHeight,
      );
      const overflow = full - viewport > 120;
      setHasOverflow(overflow);

      const scrollable = full - viewport;
      const pct = scrollable > 0 ? Math.min(100, (scrollTop / scrollable) * 100) : 0;
      setProgress(pct);

      // Dica só aparece quando ainda está no topo e há conteúdo abaixo.
      setHintVisible(!excluded && overflow && scrollTop < 40);
    };

    measure();

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const onResize = () => measure();
    // Reavalia após imagens/fontes carregarem.
    const t1 = window.setTimeout(measure, 400);
    const t2 = window.setTimeout(measure, 1500);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const excluded = isExcluded(pathname);

  return (
    <>
      {/* 1. Barra de progresso de leitura */}
      {!excluded && hasOverflow && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent"
        >
          <div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(0,0,0,0.15)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 2. Dica "Continue rolando" — sumível */}
      {!excluded && (
        <div
          aria-hidden={!hintVisible}
          className={[
            "pointer-events-none fixed inset-x-0 bottom-4 z-[55] flex justify-center px-4",
            "transition-all duration-500 ease-out",
            hintVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3",
          ].join(" ")}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-4 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur-md">
            <span className="hidden sm:inline text-muted-foreground">Continue rolando</span>
            <span className="sm:hidden text-muted-foreground">Role para ver mais</span>
            <ScrollChevron />
          </div>
        </div>
      )}
    </>
  );
}

function ScrollChevron() {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-primary animate-bounce"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}
