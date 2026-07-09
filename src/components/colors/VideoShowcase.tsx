import { PlayCircle } from "lucide-react";

type Props = {
  eyebrow?: string;
  title?: string;
  description?: string;
  poster?: string;
  videoSrc?: string;
  compact?: boolean;
};

/**
 * Área de VSL / vídeo principal — pronta para receber MP4/HLS/YouTube real.
 * Enquanto não houver vídeo, mostra placeholder premium com selo "Em breve".
 * Não usa imagens enganosas; apenas gradiente + play + microcopy.
 */
export default function VideoShowcase({
  eyebrow = "Assista",
  title = "Veja o Super Green Black em ação",
  description = "3 minutos que explicam como a fórmula acelera seu metabolismo e mantém a saciedade ao longo do dia.",
  poster,
  videoSrc,
  compact = false,
}: Props) {
  const hasVideo = Boolean(videoSrc);

  return (
    <section className={"border-y border-white/10 " + (compact ? "py-16" : "py-24")}>
      <div className="container mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base text-white/70 sm:text-lg">{description}</p>
          <ul className="mt-6 space-y-2 text-sm text-white/70">
            <li>· Apresentação oficial da fórmula</li>
            <li>· Depoimentos reais de clientes</li>
            <li>· Como tomar e o que esperar semana a semana</li>
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/30 via-lime-400/10 to-transparent blur-2xl" aria-hidden />
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-emerald-950/40 to-black shadow-2xl">
            {hasVideo ? (
              <video
                className="h-full w-full object-cover"
                controls
                preload="metadata"
                poster={poster}
                playsInline
              >
                <source src={videoSrc} type="video/mp4" />
                Seu navegador não suporta vídeo.
              </video>
            ) : (
              <>
                {poster ? (
                  <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_50%,rgba(16,185,129,0.35),transparent_60%)]" aria-hidden />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <button
                    type="button"
                    aria-label="Reproduzir vídeo de apresentação (em breve)"
                    className="group grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-black shadow-2xl shadow-emerald-500/50 transition hover:scale-105"
                    disabled
                  >
                    <PlayCircle className="h-12 w-12" aria-hidden />
                  </button>
                  <div>
                    <div className="text-lg font-bold">Vídeo de apresentação</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.25em] text-emerald-300">Em breve</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
