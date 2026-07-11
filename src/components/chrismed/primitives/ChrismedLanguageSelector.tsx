import { cn } from "@/lib/utils";
import type { Lang } from "../ChrismedShell";

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "pt", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];

/**
 * ChrismedLanguageSelector — três letras (PT · EN · ES), sem bandeiras.
 * Discreto, tipográfico, aderente à direção Quiet Luxury.
 */
export function ChrismedLanguageSelector({
  value,
  onChange,
  className,
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "chrismed-sans inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em]",
        className,
      )}
    >
      {LANGS.map((l, i) => (
        <span key={l.code} className="flex items-center">
          <button
            type="button"
            onClick={() => onChange(l.code)}
            aria-pressed={value === l.code}
            className={cn(
              "px-1.5 py-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne)]",
              value === l.code
                ? "text-[var(--chrismed-ink)] font-medium"
                : "text-[var(--chrismed-mist)] hover:text-[var(--chrismed-graphite)]",
            )}
          >
            {l.label}
          </button>
          {i < LANGS.length - 1 && (
            <span aria-hidden className="text-[var(--chrismed-sand)]">
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
