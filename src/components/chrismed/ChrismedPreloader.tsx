import { useEffect, useState } from 'react';

const CHRISMED_CREST_URL = '/brand/chrismed/crest.jpeg';

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
      <div className="chrismed-preloader-orbit relative grid size-36 place-items-center rounded-full md:size-44">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_10deg,transparent_0_18%,var(--chrismed-amber)_31%,transparent_45%_68%,rgba(255,255,255,.7)_82%,transparent_96%)] opacity-90 blur-[0.3px]" />
        <div className="absolute inset-[5px] rounded-full bg-[var(--chrismed-forest-deep)] shadow-[0_0_44px_rgba(198,157,80,.28),inset_0_0_18px_rgba(255,255,255,.08)]" />
        <div className="chrismed-preloader-halo absolute inset-[13px] rounded-full border border-[var(--chrismed-amber)]/45" />
        <div className="relative size-24 overflow-hidden rounded-full border border-white/20 bg-white shadow-[0_10px_36px_rgba(0,0,0,.38)] md:size-28">
          <img
            src={CHRISMED_CREST_URL}
            alt=""
            className="h-full w-full select-none object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,.26),transparent_38%,rgba(198,157,80,.12))]" />
        </div>
      </div>
      <p className="mt-6 font-serif text-[0.68rem] tracking-[0.36em] text-[var(--chrismed-champagne)]/90">
        CHRISMED
      </p>
      <style>{`
        @keyframes chrismedPreloaderOrbit {
          to { transform: rotate(360deg); }
        }
        @keyframes chrismedPreloaderHalo {
          0%, 100% { transform: scale(.94); opacity: .42; }
          50% { transform: scale(1.08); opacity: .9; }
        }
        .chrismed-preloader-orbit > :first-child {
          animation: chrismedPreloaderOrbit 1.65s linear infinite;
        }
        .chrismed-preloader-halo {
          animation: chrismedPreloaderHalo 1.7s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .chrismed-preloader-orbit > :first-child,
          .chrismed-preloader-halo { animation: none; }
        }
      `}</style>
    </div>
  );
}
