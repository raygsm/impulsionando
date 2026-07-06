import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NICHOS_MACROS, type NichoMacro, type NichoMicro } from "@/data/nichos-taxonomy";

/**
 * Menu Nichos — estilo marketplace, 3 colunas progressivas.
 * Coluna 1: Macros (com ícones). Coluna 2: Micros do macro selecionado.
 * Coluna 3: Sub-nichos (aparece somente quando o micro possui `subs`).
 *
 * Escopo puramente visual/UX. Não altera rotas, dados, RLS ou regras.
 */
export function NichosMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [activeMacro, setActiveMacro] = useState<NichoMacro>(NICHOS_MACROS[0]);
  const [activeMicro, setActiveMicro] = useState<NichoMicro | null>(null);

  const handleMacroEnter = (m: NichoMacro) => {
    setActiveMacro(m);
    setActiveMicro(null);
  };

  const handleMicroEnter = (mi: NichoMicro) => {
    if (mi.subs && mi.subs.length > 0) setActiveMicro(mi);
    else setActiveMicro(null);
  };

  const closeAndNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  const macros = useMemo(() => NICHOS_MACROS, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm font-bold uppercase tracking-wide transition-colors shadow-sm",
            "bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-700",
          )}
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Nichos
          </span>
          <ChevronRight className="w-4 h-4 opacity-80" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="p-0 w-[min(96vw,900px)] max-h-[80vh] overflow-hidden border-border shadow-xl"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ecossistema Impulsionando · Nichos
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(180px,220px)_minmax(200px,1fr)_minmax(0,1fr)] max-h-[70vh]">
          {/* Coluna 1 — Macros */}
          <div className="border-r overflow-y-auto py-2">
            {macros.map((m) => {
              const Icon = m.icon;
              const isActive = m.slug === activeMacro.slug;
              return (
                <button
                  key={m.slug}
                  type="button"
                  onMouseEnter={() => handleMacroEnter(m)}
                  onFocus={() => handleMacroEnter(m)}
                  onClick={() => handleMacroEnter(m)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                      : "text-foreground/80 hover:bg-muted border-l-2 border-transparent",
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{m.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>
              );
            })}
          </div>

          {/* Coluna 2 — Micros */}
          <div className="border-r overflow-y-auto py-2 bg-background">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {activeMacro.label}
            </div>
            {activeMacro.micros.map((mi) => {
              const isActive = activeMicro?.label === mi.label;
              const hasSubs = !!mi.subs?.length;
              const content = (
                <>
                  <span className="truncate flex-1">{mi.label}</span>
                  {hasSubs && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  {!mi.to && !hasSubs && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                      em breve
                    </span>
                  )}
                </>
              );
              const baseCls = cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded-none transition-colors",
                isActive
                  ? "bg-muted text-foreground font-medium"
                  : mi.to
                  ? "text-foreground/85 hover:bg-muted"
                  : "text-muted-foreground/70 cursor-default",
              );
              if (mi.to && !hasSubs) {
                return (
                  <Link
                    key={mi.label}
                    to={mi.to}
                    onClick={closeAndNavigate}
                    onMouseEnter={() => handleMicroEnter(mi)}
                    className={baseCls}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <button
                  key={mi.label}
                  type="button"
                  onMouseEnter={() => handleMicroEnter(mi)}
                  onFocus={() => handleMicroEnter(mi)}
                  onClick={() => handleMicroEnter(mi)}
                  className={baseCls}
                  disabled={!mi.to && !hasSubs}
                >
                  {content}
                </button>
              );
            })}
          </div>

          {/* Coluna 3 — Sub-nichos */}
          <div className="overflow-y-auto py-2 bg-muted/30">
            {activeMicro?.subs?.length ? (
              <>
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {activeMicro.label}
                </div>
                {activeMicro.subs.map((s) => {
                  if (s.to) {
                    return (
                      <Link
                        key={s.label}
                        to={s.to}
                        onClick={closeAndNavigate}
                        className="block px-3 py-1.5 text-sm text-foreground/85 hover:bg-background/80 hover:text-foreground transition-colors"
                      >
                        {s.label}
                      </Link>
                    );
                  }
                  return (
                    <div
                      key={s.label}
                      className="px-3 py-1.5 text-sm text-muted-foreground/70 flex items-center justify-between"
                    >
                      <span>{s.label}</span>
                      <span className="text-[10px] uppercase tracking-wide">em breve</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="px-4 py-6 text-xs text-muted-foreground/70">
                Passe o mouse sobre um item com{" "}
                <ChevronRight className="inline w-3 h-3 -mt-0.5" /> para ver subnichos.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
