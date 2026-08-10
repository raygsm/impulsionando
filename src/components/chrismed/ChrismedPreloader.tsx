import { useEffect, useState } from 'react';

/**
 * ChrismedPreloader — splash inicial no padrão Impulsionando:
 * fundo forest deep + wordmark + barra de progresso indeterminada em
 * amber. Fica visível por ~700ms no primeiro paint e some com fade,
 * garantindo que o lead nunca veja o layout "quebrando" enquanto
 * fontes/CSS terminam de aplicar. Só roda no cliente (evita hydration
 * mismatch) e respeita `prefers-reduced-motion`.
 */
export function ChrismedPreloader() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Se o usuário pediu menos animação, some quase imediato.
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hold = reduce ? 120 : 650;
    const t1 = setTimeout(() => setFading(true), hold);
    const t2 = setTimeout(() => setVisible(false), hold + 380);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--chrismed-forest-deep)] transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-[0_0_0_10px_rgba(228,181,74,0.08),0_24px_70px_rgba(0,0,0,0.45)] md:h-36 md:w-36">
        <div className="chrismed-preloader-ring absolute inset-[-9px] rounded-full border-[3px] border-white/15 border-t-[var(--chrismed-amber)] border-r-[var(--chrismed-amber)]" />
        <div className="h-[86%] w-[86%] overflow-hidden rounded-full bg-white">
          <img
            src="/brand/chrismed/brasao.jpg"
            alt=""
            className="h-[125%] w-full select-none object-cover object-top"
            draggable={false}
          />
        </div>
      </div>
      <style>{`
        @keyframes chrismedPreloaderSpin {
          to { transform: rotate(360deg); }
        }
        .chrismed-preloader-ring {
          animation: chrismedPreloaderSpin 1.05s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .chrismed-preloader-ring { animation: none; }
        }
      `}</style>
    </div>
  );
}
