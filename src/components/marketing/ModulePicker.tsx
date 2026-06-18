import { useEffect, useMemo, useRef, useState } from "react";
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
import { CheckCircle2, Info, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOTHER_MODULES, type MotherModule } from "@/data/motherModules";
import { formatBRL } from "@/lib/pricing";

interface ModulePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quota máxima de módulos INCLUÍDOS no plano. Acima disso entram como adicionais. */
  quota: number;
  planName: string;
  planSubtitle?: string;
  /** Pré-seleção opcional */
  initialSelected?: string[];
  /** Preço por módulo adicional, em centavos. */
  extraPriceCents?: number;
  /** Texto do botão final */
  confirmLabel?: string;
  /** Callback ao confirmar — recebe slugs selecionados */
  onConfirm: (selectedSlugs: string[]) => void;
  /** Slugs liberados para contratação. Se undefined, mostra todos. */
  availableSlugs?: string[];
  /** Status comercial por slug (para badges como "sob consulta", "em breve"). */
  moduleStatus?: Record<string, { status: string; allow_standalone: boolean; show_in_checkout: boolean }>;
}

/**
 * Diálogo de seleção de módulos antes do checkout.
 * - Mostra a quota de módulos INCLUÍDOS no plano
 * - Permite adicionar módulos extras acima da quota (cobrados como adicionais)
 * - Cada item tem botão "Saiba mais" que abre janela sobreposta com detalhes
 * - O lead pode clicar em Assinar a qualquer momento
 */
export function ModulePicker({
  open,
  onOpenChange,
  quota,
  planName,
  planSubtitle,
  initialSelected = [],
  extraPriceCents = 0,
  confirmLabel = "Continuar para o resumo da contratação",
  onConfirm,
  availableSlugs,
  moduleStatus,
}: ModulePickerProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [detail, setDetail] = useState<MotherModule | null>(null);

  // Re-sincroniza a seleção sempre que o modal é aberto com um novo plano
  // ou quando a lista recomendada (initialSelected) muda.
  const initialKey = useRef<string>("");
  useEffect(() => {
    if (!open) return;
    const key = `${planName}::${initialSelected.join(",")}`;
    if (key !== initialKey.current) {
      initialKey.current = key;
      setSelected(initialSelected);
    }
  }, [open, planName, initialSelected]);

  const quotaIsFinite = Number.isFinite(quota);
  const includedCount = quotaIsFinite ? Math.min(selected.length, quota) : selected.length;
  const extraCount = quotaIsFinite ? Math.max(0, selected.length - quota) : 0;

  const availableSet = useMemo(
    () => (availableSlugs ? new Set(availableSlugs) : null),
    [availableSlugs],
  );

  function isLocked(slug: string): boolean {
    if (!availableSet) return false;
    return !availableSet.has(slug);
  }

  function lockReason(slug: string): string | null {
    if (!moduleStatus) return isLocked(slug) ? "Indisponível para contratação" : null;
    const s = moduleStatus[slug];
    if (!s) return isLocked(slug) ? "Indisponível para contratação" : null;
    if (s.status === "disponivel_contratacao" && s.show_in_checkout) return null;
    if (s.status === "sob_consulta") return "Sob consulta — fale com um consultor";
    if (s.status === "em_breve") return "Em breve";
    if (s.status === "indisponivel_temporariamente") return "Indisponível temporariamente";
    if (s.status === "exclusivo_interno") return "Exclusivo interno";
    if (s.status === "exclusivo_white_label") return "Exclusivo White Label";
    return "Indisponível para contratação";
  }

  const grouped = useMemo(() => {
    const byCat = new Map<string, MotherModule[]>();
    for (const m of MOTHER_MODULES) {
      const arr = byCat.get(m.category) ?? [];
      arr.push(m);
      byCat.set(m.category, arr);
    }
    return Array.from(byCat.entries());
  }, []);

  function indexOf(slug: string) {
    return selected.indexOf(slug);
  }

  function toggle(slug: string) {
    if (isLocked(slug)) return;
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function statusFor(slug: string): "incluído" | "adicional" | null {
    const i = indexOf(slug);
    if (i < 0) return null;
    if (!quotaIsFinite) return "incluído";
    return i < quota ? "incluído" : "adicional";
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
              Clique em <strong>Saiba mais</strong> para ver detalhes completos
              de cada módulo. Módulos acima do limite do plano entram como{" "}
              <strong>adicionais</strong>.
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="secondary">
                Incluídos: {includedCount}
                {quotaIsFinite ? ` / ${quota}` : ""}
              </Badge>
              {extraCount > 0 && (
                <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-300">
                  {extraCount} adicional(is)
                  {extraPriceCents
                    ? ` · +${formatBRL(extraPriceCents * extraCount)}/mês`
                    : ""}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Você pode adicionar quantos módulos quiser.
              </span>
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
                      const status = statusFor(mod.slug);
                      const isSelected = !!status;
                      const locked = isLocked(mod.slug);
                      const reason = lockReason(mod.slug);
                      const Icon = mod.icon;
                      return (
                        <Card
                          key={mod.slug}
                          className={cn(
                            "p-4 flex flex-col gap-2 transition-colors",
                            status === "incluído" &&
                              "border-primary ring-1 ring-primary/30 bg-primary/5",
                            status === "adicional" &&
                              "border-amber-400 ring-1 ring-amber-300/50 bg-amber-50/40 dark:bg-amber-950/20",
                            locked && "opacity-60",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`mod-${mod.slug}`}
                              checked={isSelected}
                              onCheckedChange={() => toggle(mod.slug)}
                              disabled={locked}
                              aria-label={`Selecionar ${mod.shortName}`}
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`mod-${mod.slug}`}
                                className={cn(
                                  "flex items-center gap-2 font-medium text-sm",
                                  locked ? "cursor-not-allowed" : "cursor-pointer",
                                )}
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
                            {locked ? (
                              <Badge variant="outline" className="text-[10px]">{reason}</Badge>
                            ) : status === "incluído" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Incluído
                              </span>
                            ) : status === "adicional" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                                <Plus className="w-3.5 h-3.5" /> Adicional
                                {extraPriceCents
                                  ? ` · +${formatBRL(extraPriceCents)}/mês`
                                  : ""}
                              </span>
                            ) : null}
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
              Você pode clicar em <strong>Assinar</strong> a qualquer momento. Os
              módulos selecionados acima do limite serão adicionados como
              adicionais.
            </div>
            <div className="flex gap-2 justify-end shrink-0">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => onConfirm(selected)}>{confirmLabel}</Button>
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
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Para que serve
                    </div>
                    <p className="leading-relaxed text-foreground/90">
                      {detail.pitch}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Principais recursos
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
                        Para quem serve
                      </div>
                      <p className="text-muted-foreground">
                        {detail.exampleNiches.join(" · ")}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDetail(null)}>
                  Fechar
                </Button>
                <Button
                  disabled={isLocked(detail.slug)}
                  onClick={() => {
                    if (!selected.includes(detail.slug)) toggle(detail.slug);
                    setDetail(null);
                  }}
                >
                  {isLocked(detail.slug)
                    ? (lockReason(detail.slug) ?? "Indisponível")
                    : selected.includes(detail.slug)
                      ? "Já selecionado"
                      : "Selecionar este módulo"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
