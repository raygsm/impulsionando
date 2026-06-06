import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOTHER_MODULES, type MotherModule } from "@/data/motherModules";

interface ModulePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quota máxima de módulos para o plano. Use Infinity para sob medida. */
  quota: number;
  planName: string;
  planSubtitle?: string;
  /** Pré-seleção opcional */
  initialSelected?: string[];
  /** Texto do botão final */
  confirmLabel?: string;
  /** Callback ao confirmar — recebe slugs selecionados */
  onConfirm: (selectedSlugs: string[]) => void;
}

/**
 * Diálogo de seleção de módulos antes do checkout.
 * - Limita o número de módulos ao `quota` do plano
 * - Cada item tem botão "Saiba mais" que abre janela sobreposta com detalhes
 * - O lead pode clicar em Assinar a qualquer momento (com seleção parcial ou vazia)
 */
export function ModulePicker({
  open,
  onOpenChange,
  quota,
  planName,
  planSubtitle,
  initialSelected = [],
  confirmLabel = "Assinar e ir para o pagamento",
  onConfirm,
}: ModulePickerProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [detail, setDetail] = useState<MotherModule | null>(null);

  const quotaLabel = Number.isFinite(quota) ? `${selected.length} / ${quota}` : `${selected.length} (ilimitado)`;
  const reachedLimit = Number.isFinite(quota) && selected.length >= quota;

  const grouped = useMemo(() => {
    const byCat = new Map<string, MotherModule[]>();
    for (const m of MOTHER_MODULES) {
      const arr = byCat.get(m.category) ?? [];
      arr.push(m);
      byCat.set(m.category, arr);
    }
    return Array.from(byCat.entries());
  }, []);

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (Number.isFinite(quota) && prev.length >= quota) {
        // troca o último pelo novo respeitando a quota
        return [...prev.slice(0, quota - 1), slug];
      }
      return [...prev, slug];
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Escolha os módulos do plano {planName}
            </DialogTitle>
            <DialogDescription>
              {planSubtitle ??
                "Selecione os módulos principais que farão parte da sua assinatura."}{" "}
              Você pode clicar em <strong>Saiba mais</strong> para ver os detalhes
              completos de cada módulo.
            </DialogDescription>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant={reachedLimit ? "default" : "secondary"}>
                Selecionados: {quotaLabel}
              </Badge>
              {reachedLimit && (
                <span className="text-xs text-muted-foreground">
                  Limite do plano atingido — desmarque um para escolher outro.
                </span>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh]">
            <div className="px-6 py-4 space-y-6">
              {grouped.map(([category, modules]) => (
                <div key={category}>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {category}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {modules.map((mod) => {
                      const isSelected = selected.includes(mod.slug);
                      const disabled =
                        !isSelected && Number.isFinite(quota) && selected.length >= quota;
                      const Icon = mod.icon;
                      return (
                        <Card
                          key={mod.slug}
                          className={cn(
                            "p-4 flex flex-col gap-2 transition-colors",
                            isSelected && "border-primary ring-1 ring-primary/30 bg-primary/5",
                            disabled && "opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`mod-${mod.slug}`}
                              checked={isSelected}
                              onCheckedChange={() => toggle(mod.slug)}
                              disabled={disabled}
                              aria-label={`Selecionar ${mod.shortName}`}
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`mod-${mod.slug}`}
                                className="flex items-center gap-2 font-medium text-sm cursor-pointer"
                              >
                                <Icon className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate">{mod.shortName}</span>
                              </label>
                              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                {mod.tagline}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <button
                              type="button"
                              onClick={() => setDetail(mod)}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Info className="w-3.5 h-3.5" /> Saiba mais
                            </button>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Selecionado
                              </span>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-muted/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
            <div className="text-xs text-muted-foreground">
              Você pode clicar em <strong>Assinar</strong> a qualquer momento — mesmo
              com seleção parcial. Os módulos escolhidos serão liberados após a
              confirmação do pagamento.
            </div>
            <div className="flex gap-2 justify-end shrink-0">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onConfirm(selected);
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Janela sobreposta — Saiba mais */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <detail.icon className="w-5 h-5 text-primary" />
                  {detail.fullName}
                </DialogTitle>
                <DialogDescription>{detail.tagline}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="leading-relaxed text-foreground/90">{detail.pitch}</p>

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    O que está incluído
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.submodules.map((s) => (
                      <Badge key={s} variant="secondary" className="font-normal">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {detail.exampleNiches.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Nichos onde brilha
                    </div>
                    <p className="text-muted-foreground">
                      {detail.exampleNiches.join(" · ")}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDetail(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    if (!selected.includes(detail.slug)) toggle(detail.slug);
                    setDetail(null);
                  }}
                >
                  {selected.includes(detail.slug) ? "Já selecionado" : "Selecionar este módulo"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
