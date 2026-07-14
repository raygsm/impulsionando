import { useEffect, useState } from 'react';
import chrismedLogo from '@/assets/chrismed-logo.png.asset.json';

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
      <img
        src={chrismedHorizontal.url}
        alt=""
        className="h-10 w-auto select-none opacity-90 brightness-0 invert md:h-12"
        draggable={false}
      />
      <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-white/15">
        <div className="chrismed-preloader-bar h-full w-1/3 rounded-full bg-[var(--chrismed-amber)]" />
      </div>
      <style>{`
        @keyframes chrismedPreloaderSlide {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        .chrismed-preloader-bar {
          animation: chrismedPreloaderSlide 1.1s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .chrismed-preloader-bar { animation: none; }
        }
      `}</style>
    </div>
  );
}
