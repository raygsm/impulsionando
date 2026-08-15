import { Link } from "@tanstack/react-router";
import { MapPin, Menu, MessageCircle, Music2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MoreContentFab } from "@/components/impulsionando";

type Crumb = { label: string; to?: string };
type Point = { x: number; y: number };

const POSITION_KEY = "wmp:whereabouts:position";
const DISMISSED_KEY = "wmp:whereabouts:dismissed";
const WAGNER_PORTRAIT = "/wmp/wagner-miller.webp";

function clampPosition(point: Point, width = 118, height = 132): Point {
  if (typeof window === "undefined") return point;
  const margin = 12;
  return {
    x: Math.min(Math.max(point.x, margin), Math.max(margin, window.innerWidth - width - margin)),
    y: Math.min(Math.max(point.y, margin), Math.max(margin, window.innerHeight - height - margin)),
  };
}

function WhereaboutsFloatingWidget() {
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef<Point>({ x: 0, y: 0 });
  const moved = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISSED_KEY) === "1");
    const saved = sessionStorage.getItem(POSITION_KEY);
    if (saved) {
      try {
        setPosition(clampPosition(JSON.parse(saved) as Point));
        return;
      } catch {
        // Invalid session state is ignored.
      }
    }
    setPosition(clampPosition({ x: 16, y: window.innerHeight - 164 }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setPosition((current) => (current ? clampPosition(current) : current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!dragging || typeof window === "undefined") return;
    const onMove = (event: PointerEvent) => {
      moved.current = true;
      setPosition(clampPosition({ x: event.clientX - dragOffset.current.x, y: event.clientY - dragOffset.current.y }));
    };
    const onUp = () => {
      setDragging(false);
      setPosition((current) => {
        if (current) sessionStorage.setItem(POSITION_KEY, JSON.stringify(current));
        return current;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  if (dismissed || !position) return null;

  return (
    <div className="fixed z-40 select-none touch-none" style={{ left: position.x, top: position.y }} aria-label="Onde Estou — Wagner Miller">
      <button
        type="button"
        aria-label="Fechar Onde Estou"
        className="absolute -right-1 -top-1 z-10 flex size-7 items-center justify-center rounded-full border shadow-md"
        style={{ background: "var(--wmp-bg)", borderColor: "color-mix(in oklab, var(--wmp-gold) 45%, transparent)", color: "var(--wmp-fg)" }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          sessionStorage.setItem(DISMISSED_KEY, "1");
          setDismissed(true);
        }}
      >
        <X className="size-3.5" aria-hidden />
      </button>

      <div
        role="group"
        className="w-[112px] cursor-grab rounded-2xl border p-2 shadow-2xl backdrop-blur-md active:cursor-grabbing"
        style={{ background: "color-mix(in oklab, var(--wmp-bg) 88%, transparent)", borderColor: "color-mix(in oklab, var(--wmp-gold) 28%, transparent)" }}
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("a,button")) return;
          moved.current = false;
          dragOffset.current = { x: event.clientX - position.x, y: event.clientY - position.y };
          setDragging(true);
        }}
      >
        <div className="mx-auto mb-2 size-16 overflow-hidden rounded-full border-2 shadow-lg" style={{ borderColor: "var(--wmp-gold)", background: "var(--wmp-surface-2)" }}>
          <img src={WAGNER_PORTRAIT} alt="Wagner Miller" className="h-full w-full object-cover" loading="lazy" draggable={false} />
        </div>
        <Link
          to="/wmp/onde-estou"
          className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center text-xs font-semibold"
          style={{ background: "var(--gradient-wmp-cta)", color: "var(--wmp-bg)" }}
          onClick={(event) => {
            if (moved.current) {
              event.preventDefault();
              moved.current = false;
            }
          }}
        >
          <MapPin className="size-3.5" aria-hidden /> Onde estou
        </Link>
        <div className="pt-1.5 text-center text-[10px] opacity-60">Arraste para mover</div>
      </div>
    </div>
  );
}

const NAV = [
  ["Contratar DJ", "/wmp/djs"],
  ["Hotéis & Empresas", "/wmp/empresas"],
  ["Onde Estou", "/wmp/onde-estou"],
  ["Serviços", "/wmp/pacotes"],
  ["Cases", "/wmp/cases"],
  ["Sobre", "/wmp/sobre"],
  ["Seja Parceiro", "/wmp/parceiro"],
] as const;

export function WmpShell({ children, breadcrumbs }: { children: React.ReactNode; breadcrumbs?: Crumb[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="wmp-brand min-h-dvh w-full overflow-x-clip">
      <style>{`
        .wmp-brand [role="dialog"][aria-label*="Milito"] { max-width: calc(100vw - 24px); max-height: calc(100dvh - 24px); overscroll-behavior: contain; }
        .wmp-brand button[aria-label*="Abrir Milito"] { right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom)); min-width: 48px; min-height: 48px; }
        @media (max-width: 640px) {
          .wmp-brand [role="dialog"][aria-label*="Milito"] { inset: 0 !important; width: 100dvw !important; height: 100dvh !important; max-width: 100dvw !important; max-height: 100dvh !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
          .wmp-brand [role="dialog"][aria-label*="Milito"] form { padding-bottom: max(8px, env(safe-area-inset-bottom)); }
          .wmp-brand [role="dialog"][aria-label*="Milito"] input, .wmp-brand [role="dialog"][aria-label*="Milito"] textarea { font-size: 16px !important; }
        }
      `}</style>

      <a href="#wmp-main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2" style={{ background: "var(--wmp-gold)", color: "var(--wmp-bg)" }}>Pular para o conteúdo</a>

      <header className="sticky top-0 z-40 border-b border-[color-mix(in_oklab,var(--wmp-gold)_18%,transparent)] bg-[color-mix(in_oklab,var(--wmp-bg)_75%,transparent)] backdrop-blur-md" role="banner">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/wmp" className="wmp-display flex min-w-0 items-center gap-2 text-xl" aria-label="WMP — Wagner Miller Produções, ir para o início">
            <Music2 className="size-5 shrink-0" style={{ color: "var(--wmp-gold)" }} aria-hidden />
            <span>WMP</span>
            <span className="hidden truncate text-xs font-normal opacity-70 sm:inline" style={{ fontFamily: "Inter" }}>Wagner Miller Produções</span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm xl:flex" aria-label="Menu principal">
            {NAV.map(([label, to]) => <Link key={to} to={to} className="opacity-80 hover:opacity-100">{label}</Link>)}
            <Link to="/wmp/orcamento" className="wmp-cta" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}><Sparkles className="size-4" aria-hidden /> Solicitar proposta</Link>
          </nav>

          <button type="button" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg xl:hidden" style={{ background: "var(--wmp-surface-2)", color: "var(--wmp-fg)" }} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="wmp-mobile-nav" onClick={() => setOpen((value) => !value)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open && (
          <nav id="wmp-mobile-nav" className="border-t border-[color-mix(in_oklab,var(--wmp-gold)_18%,transparent)] xl:hidden" aria-label="Menu mobile">
            <ul className="flex flex-col gap-3 px-4 py-4 text-sm sm:px-6">
              {NAV.map(([label, to]) => <li key={to}><Link to={to} onClick={() => setOpen(false)}>{label}</Link></li>)}
              <li><Link to="/wmp/faq" onClick={() => setOpen(false)}>FAQ</Link></li>
              <li><Link to="/wmp/orcamento" onClick={() => setOpen(false)} className="wmp-cta w-full justify-center" style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", minHeight: "44px" }}><Sparkles className="size-4" aria-hidden /> Solicitar proposta</Link></li>
            </ul>
          </nav>
        )}
      </header>

      {breadcrumbs?.length ? (
        <nav aria-label="Trilha de navegação" className="mx-auto max-w-7xl px-4 pt-4 text-xs opacity-75 sm:px-6">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/wmp" className="hover:underline">WMP</Link></li>
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                {crumb.to && index < breadcrumbs.length - 1 ? <Link to={crumb.to} className="hover:underline">{crumb.label}</Link> : <span aria-current="page" className="opacity-90">{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <main id="wmp-main" className="min-w-0">{children}</main>

      <footer className="mt-16 border-t border-[color-mix(in_oklab,var(--wmp-gold)_18%,transparent)] sm:mt-24" role="contentinfo">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:px-6 sm:py-12 md:grid-cols-4">
          <div><div className="wmp-display mb-2 text-lg">WMP</div><p className="leading-relaxed opacity-70">Produção e operação de eventos, DJs, som, luz, palco, audiovisual e rede de parceiros para clientes, hotéis e empresas.</p></div>
          <div><div className="wmp-display mb-3 text-sm opacity-90">Contratar</div><ul className="space-y-2 opacity-80"><li><Link to="/wmp/orcamento">Solicitar proposta</Link></li><li><Link to="/wmp/djs">Contratar DJ</Link></li><li><Link to="/wmp/empresas">Hotéis & Empresas</Link></li><li><Link to="/wmp/onde-estou">Onde Estou</Link></li></ul></div>
          <div><div className="wmp-display mb-3 text-sm opacity-90">Institucional</div><ul className="space-y-2 opacity-80"><li><Link to="/wmp/sobre">Sobre a WMP</Link></li><li><Link to="/wmp/faq">Perguntas frequentes</Link></li><li><Link to="/wmp/parceiro">Seja parceiro</Link></li></ul></div>
          <div><div className="wmp-display mb-3 text-sm opacity-90">Atendimento</div><div className="flex items-start gap-2 opacity-80"><MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden style={{ color: "var(--wmp-gold)" }} /><span>Use o Milito para iniciar, continuar ou qualificar seu atendimento. Quando necessário, ele encaminha para a equipe WMP.</span></div></div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 pb-8 text-xs opacity-60 sm:px-6 md:flex-row"><span>© {new Date().getFullYear()} Wagner Miller Produções — todos os direitos reservados.</span><span>Operado no ecossistema <a href="/" className="underline">Impulsionando</a>.</span></div>
      </footer>

      <WhereaboutsFloatingWidget />
      <MoreContentFab bg="var(--wmp-gold)" accent="var(--wmp-bg)" />
    </div>
  );
}
