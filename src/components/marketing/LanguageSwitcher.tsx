import { useEffect, useState } from "react";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Seletor visual de idioma no cabeçalho.
 * SOMENTE FRONT-END: a tradução real (i18n) é ativada pela camada técnica
 * (Codex). Este componente persiste a preferência em localStorage e mostra
 * um toast informativo quando o usuário escolhe um idioma ainda não ativo.
 */

type LangCode = "pt-BR" | "en" | "es";

const LANGS: { code: LangCode; label: string; native: string; flag: string; active: boolean }[] = [
  { code: "pt-BR", label: "Português (Brasil)", native: "Português", flag: "🇧🇷", active: true },
  { code: "en", label: "English", native: "English", flag: "🇬🇧", active: false },
  { code: "es", label: "Español", native: "Español", flag: "🇪🇸", active: false },
];

const STORAGE_KEY = "impulsionando.lang";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [current, setCurrent] = useState<LangCode>("pt-BR");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (saved && LANGS.some((l) => l.code === saved)) setCurrent(saved);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  function choose(code: LangCode) {
    const lang = LANGS.find((l) => l.code === code)!;
    setCurrent(code);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, code);
    if (!lang.active) {
      setNotice(
        `${lang.native} selecionado. A tradução completa será ativada em breve pela camada técnica.`,
      );
    } else {
      setNotice(null);
    }
  }

  const currentLang = LANGS.find((l) => l.code === current) ?? LANGS[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Selecionar idioma"
            className={cn(
              "gap-1.5 h-9 px-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring transition-colors",
              compact && "px-2",
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              {currentLang.flag}
            </span>
            {!compact && (
              <span className="text-xs font-semibold uppercase tracking-wide">
                {currentLang.code === "pt-BR" ? "PT" : currentLang.code.toUpperCase()}
              </span>
            )}
            <Globe className="w-3.5 h-3.5 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Idioma
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LANGS.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onSelect={() => choose(lang.code)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base leading-none" aria-hidden>
                {lang.flag}
              </span>
              <span className="flex-1 text-sm">{lang.label}</span>
              {!lang.active && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  em breve
                </span>
              )}
              {current === lang.code && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <p className="px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
            A tradução completa (EN/ES) será ativada pela camada técnica.
          </p>
        </DropdownMenuContent>
      </DropdownMenu>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-sm rounded-lg border border-border bg-background/95 backdrop-blur px-4 py-3 text-xs text-foreground shadow-elegant animate-in fade-in slide-in-from-bottom-2"
        >
          {notice}
        </div>
      )}
    </>
  );
}
