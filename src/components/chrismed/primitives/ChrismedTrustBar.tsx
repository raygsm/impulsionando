import { cn } from "@/lib/utils";
import { ShieldCheck, Languages, ScrollText, HeartPulse } from "lucide-react";

/**
 * ChrismedTrustBar — Onda 6.
 *
 * Faixa de prova social discreta e institucional. Não usa depoimentos
 * fabricados nem números não validados (guardrail V1/V2). Apenas ancora
 * a marca em selos verificáveis: CRM da médica responsável, aderência
 * LGPD, sigilo médico e idiomas de atendimento.
 *
 * Uso: entre hero e primeira seção de conteúdo, ou antes do CTA final.
 */
type TrustItem = { icon: typeof ShieldCheck; label: string; hint?: string };

const DEFAULT_ITEMS: TrustItem[] = [
  { icon: ScrollText, label: "CRM ativo", hint: "Médica responsável registrada" },
  { icon: ShieldCheck, label: "LGPD", hint: "Dados sob sigilo médico" },
  { icon: HeartPulse, label: "Sigilo clínico", hint: "Prontuário criptografado" },
  { icon: Languages, label: "PT · EN · ES", hint: "Atendimento trilíngue" },
];

export function ChrismedTrustBar({
  items = DEFAULT_ITEMS,
  className,
  tone = "ivory",
}: {
  items?: TrustItem[];
  className?: string;
  tone?: "ivory" | "bone";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--chrismed-sand)] py-6 md:grid-cols-4 md:py-8",
        tone === "bone" && "bg-[var(--chrismed-bone)]/50 px-6",
        className,
      )}
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="flex items-start gap-3">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chrismed-champagne-deep)]"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="chrismed-sans text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--chrismed-ink)]">
                {it.label}
              </p>
              {it.hint && (
                <p className="chrismed-sans mt-1 text-[11px] leading-snug text-[var(--chrismed-mist)]">
                  {it.hint}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
