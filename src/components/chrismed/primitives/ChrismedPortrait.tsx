import { cn } from "@/lib/utils";

/**
 * ChrismedPortrait — moldura editorial reservada para o retrato oficial
 * da Dra. Cristiane. Enquanto não houver imagem autorizada, renderiza uma
 * superfície bone com marca d'água interna (invisível em produção).
 *
 * REGRA (V1): nunca substituir por foto genérica ou avatar gerado.
 */
export function ChrismedPortrait({
  src,
  alt,
  ratio = "4/5",
  className,
  eyebrow = "Retrato oficial",
}: {
  src?: string;
  alt?: string;
  ratio?: "3/4" | "4/5" | "1/1";
  className?: string;
  eyebrow?: string;
}) {
  const aspect =
    ratio === "3/4" ? "aspect-[3/4]" : ratio === "1/1" ? "aspect-square" : "aspect-[4/5]";

  if (src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--chrismed-bone)]",
          aspect,
          className,
        )}
      >
        <img
          src={src}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  // Fallback editorial neutro — sem placeholder técnico visível ao usuário
  // (regra da Onda V1: nunca expor {{a_configurar}} nem "conteúdo pendente").
  // Renderiza uma superfície tonal calma, sem texto de sistema.
  return (
    <div
      aria-hidden="true"
      data-chrismed-slot="portrait-pending"
      data-eyebrow={eyebrow}
      className={cn(
        "relative overflow-hidden bg-[var(--chrismed-bone)]",
        aspect,
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 30% 20%, rgba(181,164,139,0.18), transparent 60%)",
        }}
      />
    </div>
  );
}
