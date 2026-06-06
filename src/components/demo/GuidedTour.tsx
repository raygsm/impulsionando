/**
 * Tour guiado por módulo — overlay leve, não invasivo.
 * - Steps simples (sem highlight DOM, apenas card flutuante)
 * - Persiste "visto" no localStorage por chave de módulo
 * - Reabrível a qualquer momento via botão "Tour guiado"
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";

export type TourStep = {
  title: string;
  body: string;
  hint?: string;
};

type Props = {
  moduleKey: string; // ex: "afiliados", "checkout", "eventos"
  title: string;
  steps: TourStep[];
  autoOpen?: boolean; // abre automaticamente na 1ª visita
};

const SEEN_PREFIX = "imp.demo.tour.seen.";

export function GuidedTour({ moduleKey, title, steps, autoOpen = true }: Props) {
  const seenKey = SEEN_PREFIX + moduleKey;
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!autoOpen) return;
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(seenKey);
    if (!seen) setOpen(true);
  }, [seenKey, autoOpen]);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(seenKey, "1"); } catch { /* ignore */ }
  };

  const reopen = () => {
    setIdx(0);
    setOpen(true);
  };

  const step = steps[idx];
  const isLast = idx >= steps.length - 1;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={reopen}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Tour guiado
      </Button>

      {open && step && (
        <div
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Tour guiado: ${title}`}
        >
          <Card className="w-full max-w-md p-6 shadow-xl border-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-primary">
                  <Sparkles className="w-3 h-3 mr-1" /> Tour
                </Badge>
                <span className="text-sm text-muted-foreground">{title}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={close} aria-label="Fechar tour">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Passo {idx + 1} de {steps.length}
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
              {step.hint && (
                <p className="text-xs text-primary mt-2">💡 {step.hint}</p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIdx(0)} title="Reiniciar tour">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                {isLast ? (
                  <Button size="sm" className="bg-gradient-primary" onClick={close}>
                    Concluir
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}>
                    Próximo <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
