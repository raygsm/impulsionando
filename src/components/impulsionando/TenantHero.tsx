import type { ReactNode } from "react";

export type TenantHeroProps = {
  /** Chip/badge acima do título (ex.: "Imobiliária premium") */
  eyebrow?: ReactNode;
  /** H1 do hero. Aceita <span> para destacar palavras com accentColor. */
  title: ReactNode;
  /** Subtítulo/lead. */
  subtitle?: ReactNode;
  /** Área de CTAs (renderize <button>/<Link> conforme o tenant). */
  actions?: ReactNode;
  /** Mini-stats abaixo dos CTAs. */
  stats?: ReactNode;
  /**
   * Imagem/mídia de fundo. Se fornecida, aplica overlay escuro para
   * garantir contraste do texto. Pode ser URL ou node customizado.
   */
  background?: string | ReactNode;
  /** Alinhamento do conteúdo. */
  align?: "center" | "left";
  /** Classe extra opcional no <section>. */
  className?: string;
};

/**
 * Hero neutro para landing de tenant. Não impõe cor — herda tokens do
 * escopo `[data-tenant="..."]`. Componentize aqui todos os padrões
 * repetidos entre WMP, Garrido, FoodService, Marocas, Colors etc.
 */
export function TenantHero({
  eyebrow,
  title,
  subtitle,
  actions,
  stats,
  background,
  align = "center",
  className,
}: TenantHeroProps) {
  const isImage = typeof background === "string";
  const alignCls = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <section
      className={`relative overflow-hidden ${className ?? ""}`}
      style={isImage ? { backgroundImage: `url(${background})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {isImage && <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" aria-hidden />}
      {!isImage && background}
      <div className={`relative mx-auto max-w-7xl px-6 pt-20 pb-24 flex flex-col gap-8 ${alignCls}`}>
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-current/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] opacity-90">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] max-w-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base md:text-lg opacity-85 max-w-2xl">
            {subtitle}
          </p>
        )}
        {actions && <div className="flex flex-wrap gap-3 justify-center">{actions}</div>}
        {stats && <div className="mt-6 w-full">{stats}</div>}
      </div>
    </section>
  );
}
