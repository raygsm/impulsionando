import type { LucideIcon } from "lucide-react";
import { ShieldCheck } from "lucide-react";

export type TrustBadge = {
  icon?: LucideIcon;
  title: string;
  description?: string;
};

/**
 * Faixa de trust/garantias/certificações. Substitui os blocos ad-hoc
 * de "LGPD / ART / laudo de dB / Compra 100% segura" espalhados nas
 * rotas de tenants.
 */
export function TrustBadges({
  badges,
  columns = 4,
  variant = "cards",
}: {
  badges: TrustBadge[];
  columns?: 2 | 3 | 4;
  variant?: "cards" | "inline";
}) {
  const cols = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns];

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm opacity-85">
        {badges.map((b) => {
          const Icon = b.icon ?? ShieldCheck;
          return (
            <div key={b.title} className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <span>{b.title}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 ${cols} gap-4`}>
      {badges.map((b) => {
        const Icon = b.icon ?? ShieldCheck;
        return (
          <div key={b.title} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5">
            <Icon className="h-6 w-6 mb-3 text-primary" aria-hidden />
            <h3 className="font-serif text-base mb-1">{b.title}</h3>
            {b.description && <p className="text-xs opacity-75 leading-relaxed">{b.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
