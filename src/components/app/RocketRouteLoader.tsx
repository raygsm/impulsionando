import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";

/**
 * Overlay de carregamento entre rotas — foguete animado.
 * Usa isLoading + isTransitioning do router; aparece só após 120ms para não
 * piscar em navegações instantâneas, e some após um pequeno fade.
 */
export function RocketRouteLoader() {
  const active = useRouterState({
    select: (s) => s.isLoading || s.isTransitioning,
  });
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
      if (!visible && showTimer.current === null) {
        showTimer.current = window.setTimeout(() => {
          setVisible(true);
          showTimer.current = null;
        }, 120);
      }
    } else {
      if (showTimer.current) window.clearTimeout(showTimer.current);
      showTimer.current = null;
      if (visible && hideTimer.current === null) {
        hideTimer.current = window.setTimeout(() => {
          setVisible(false);
          hideTimer.current = null;
        }, 200);
      }
    }
    return () => {
      if (showTimer.current) window.clearTimeout(showTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      showTimer.current = null;
      hideTimer.current = null;
    };
  }, [active, visible]);

  return (
    <>
      <style>{`
        @keyframes impRocketFly {
          0%   { transform: translate(-50%, 20vh) rotate(-15deg); opacity: 0; }
          15%  { opacity: 1; }
          50%  { transform: translate(-50%, -10px) rotate(-15deg); }
          100% { transform: translate(-50%, -20vh) rotate(-15deg); opacity: 0.9; }
        }
        @keyframes impRocketFlame {
          0%,100% { transform: translateX(-50%) scaleY(1); opacity: 0.9; }
          50%     { transform: translateX(-50%) scaleY(1.4); opacity: 1; }
        }
        @keyframes impRocketBar {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(20%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Barra de progresso topo — sempre visível durante loading, sem delay */}
      <div
        aria-hidden={!active}
        className={`fixed top-0 left-0 right-0 z-[9998] h-0.5 overflow-hidden pointer-events-none transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-full w-1/3 bg-gradient-to-r from-primary via-primary/70 to-primary"
          style={{ animation: active ? "impRocketBar 1s ease-in-out infinite" : "none" }}
        />
      </div>

      {/* Foguete central — só aparece se carregamento durar > 120ms */}
      <div
        role="status"
        aria-live="polite"
        aria-label="Carregando próxima página"
        className={`fixed inset-0 z-[9997] pointer-events-none flex items-end justify-center transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute left-1/2 bottom-[10vh]"
          style={{
            animation: visible ? "impRocketFly 1.2s ease-out infinite" : "none",
            transform: "translate(-50%, 20vh) rotate(-15deg)",
          }}
        >
          <div className="relative">
            <div className="rounded-full bg-primary text-primary-foreground p-6 shadow-lg shadow-primary/30">
              <Rocket className="w-12 h-12" />
            </div>
            {/* chama */}
            <div
              aria-hidden
              className="absolute left-1/2 -bottom-4 w-6 h-8 rounded-b-full bg-gradient-to-b from-amber-400 via-orange-500 to-red-500 blur-[1px]"
              style={{
                animation: visible ? "impRocketFlame 0.35s ease-in-out infinite" : "none",
                transformOrigin: "top center",
              }}
            />

          </div>
        </div>
      </div>
    </>
  );
}
