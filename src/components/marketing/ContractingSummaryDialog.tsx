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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatBRL } from "@/lib/pricing";
import { MOTHER_MODULES } from "@/data/motherModules";

export interface ContractingSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  /** Quota de módulos incluídos no plano. */
  quota: number;
  /** Slugs selecionados (em ordem; os primeiros `quota` são incluídos, os demais adicionais). */
  selectedSlugs: string[];
  /** Mensalidade base do plano em centavos (no modo anual, já é o valor /mês com desconto). */
  baseMonthlyCents: number;
  /** Setup de implantação em centavos. */
  setupCents: number;
  /** Preço por módulo adicional em centavos. */
  extraPriceCents: number;
  /** Ciclo de cobrança escolhido. */
  annual?: boolean;
  /** Texto exibido no botão de confirmação final. */
  confirmLabel?: string;
  onConfirm: () => void;
  onEditModules?: () => void;
}

const ACEITE_KEYS = [
  "Entendo que o contrato mínimo é de 90 dias.",
  "Entendo que são 3 mensalidades obrigatórias no ciclo inicial.",
  "Entendo que a primeira parcela corresponde ao setup de implantação.",
  "Entendo que o ciclo inicial contempla 4 pagamentos obrigatórios.",
  "Entendo quais módulos estão incluídos no meu plano e quais são adicionais.",
  "Aceito os termos da contratação.",
] as const;

export function ContractingSummaryDialog(props: ContractingSummaryProps) {
  const {
    open,
    onOpenChange,
    planName,
    quota,
    selectedSlugs,
    baseMonthlyCents,
    setupCents,
    extraPriceCents,
    annual = false,
    confirmLabel = "Confirmar contratação e ir para o pagamento",
    onConfirm,
    onEditModules,
  } = props;

  const [aceites, setAceites] = useState<boolean[]>(() => ACEITE_KEYS.map(() => false));
  const allAccepted = aceites.every(Boolean);

  const {
    included,
    extras,
    extrasMonthlyCents,
    totalMonthlyCents,
    annualTotalCents,
    cycleTotalCents,
  } = useMemo(() => {
    const quotaIsFinite = Number.isFinite(quota);
    const included = selectedSlugs.slice(0, quotaIsFinite ? quota : selectedSlugs.length);
    const extras = quotaIsFinite ? selectedSlugs.slice(quota) : [];
    const extrasMonthlyCents = extras.length * extraPriceCents;
    const totalMonthlyCents = baseMonthlyCents + extrasMonthlyCents;
    // Anual = 12 meses pagos à vista no preço /mês já com desconto (equivale a 10 mensalidades cheias, 2 grátis).
    const annualTotalCents = totalMonthlyCents * 12;
    const cycleTotalCents = annual
      ? setupCents + annualTotalCents
      : setupCents + totalMonthlyCents * 3;
    return { included, extras, extrasMonthlyCents, totalMonthlyCents, annualTotalCents, cycleTotalCents };
  }, [selectedSlugs, quota, baseMonthlyCents, extraPriceCents, setupCents, annual]);

  function moduleName(slug: string) {
    return MOTHER_MODULES.find((m) => m.slug === slug)?.shortName ?? slug;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Resumo da contratação — Plano {planName}
          </DialogTitle>
          <DialogDescription>
            Confira o que está incluído, o que entra como adicional e os valores
            antes de avançar para o pagamento.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-5 text-sm">
            {/* Módulos incluídos */}
            <section>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Incluídos no plano ({included.length}
                {Number.isFinite(quota) ? ` / ${quota}` : ""})
              </div>
              {included.length === 0 ? (
                <p className="text-muted-foreground italic">
                  Nenhum módulo selecionado dentro do limite ainda.
                </p>
              ) : (
                <ul className="space-y-1">
                  {included.map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{moduleName(s)}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        Incluído
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {extras.length > 0 && (
              <section>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Módulos adicionais ({extras.length})
                </div>
                <ul className="space-y-1">
                  {extras.map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>{moduleName(s)}</span>
                      <Badge className="ml-auto text-[10px] bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-300">
                        + {formatBRL(extraPriceCents)}/mês
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Separator />

            {/* Valores */}
            <section className="space-y-1">
              <div className="flex justify-between">
                <span>Mensalidade base do plano{annual ? " (preço /mês no anual)" : ""}</span>
                <span>{formatBRL(baseMonthlyCents)}</span>
              </div>
              {extras.length > 0 && (
                <div className="flex justify-between">
                  <span>
                    Adicionais ({extras.length} × {formatBRL(extraPriceCents)})
                  </span>
                  <span>+ {formatBRL(extrasMonthlyCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total {annual ? "mensal equivalente" : "mensal"}</span>
                <span>{formatBRL(totalMonthlyCents)}</span>
              </div>
              {annual && (
                <div className="flex justify-between">
                  <span>Cobrança anual à vista (12 meses)</span>
                  <span>{formatBRL(annualTotalCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Setup de implantação (1ª parcela)</span>
                <span>{formatBRL(setupCents)}</span>
              </div>
            </section>

            <Separator />

            {/* Contrato 90 dias */}
            <section className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-3 space-y-2">
              <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
                <ShieldCheck className="w-4 h-4" />
                Contrato mínimo de 90 dias
              </div>
              {annual ? (
                <>
                  <p className="text-xs text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
                    No <strong>plano anual</strong>, o ciclo inicial obrigatório é coberto pelo
                    pagamento anual à vista. São <strong>2 pagamentos no ciclo inicial</strong>:
                    setup + 12 meses pagos antecipadamente (com 2 meses de desconto já aplicados
                    no preço /mês).
                  </p>
                  <ul className="text-xs text-amber-900/90 dark:text-amber-100/90 space-y-0.5">
                    <li>• Pagamento 1: Setup de implantação — {formatBRL(setupCents)}</li>
                    <li>• Pagamento 2: Anuidade (12 meses) — {formatBRL(annualTotalCents)}</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-xs text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
                    A contratação possui <strong>permanência mínima de 90 dias</strong>,
                    equivalente a <strong>3 mensalidades obrigatórias</strong>. A primeira
                    parcela corresponde ao <strong>setup de implantação</strong>. Portanto,
                    o ciclo inicial obrigatório contempla{" "}
                    <strong>4 pagamentos: 1 setup + 3 mensalidades</strong>.
                  </p>
                  <ul className="text-xs text-amber-900/90 dark:text-amber-100/90 space-y-0.5">
                    <li>• Pagamento 1: Setup de implantação — {formatBRL(setupCents)}</li>
                    <li>• Pagamento 2: 1ª mensalidade — {formatBRL(totalMonthlyCents)}</li>
                    <li>• Pagamento 3: 2ª mensalidade — {formatBRL(totalMonthlyCents)}</li>
                    <li>• Pagamento 4: 3ª mensalidade — {formatBRL(totalMonthlyCents)}</li>
                  </ul>
                </>
              )}
              <div className="flex justify-between text-sm font-semibold pt-1 border-t border-amber-300/60">
                <span>Total mínimo inicial</span>
                <span>{formatBRL(cycleTotalCents)}</span>
              </div>
            </section>

            {/* Aceites */}
            <section className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Aceites obrigatórios
              </div>
              {ACEITE_KEYS.map((label, i) => (
                <label
                  key={label}
                  className="flex items-start gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={aceites[i]}
                    onCheckedChange={(c) =>
                      setAceites((prev) => {
                        const next = [...prev];
                        next[i] = !!c;
                        return next;
                      })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </section>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
          <div className="text-[11px] text-muted-foreground">
            {allAccepted
              ? "Tudo pronto. Você pode avançar para o pagamento."
              : "Marque todos os aceites para liberar o pagamento."}
          </div>
          <div className="flex gap-2 justify-end shrink-0">
            {onEditModules && (
              <Button variant="ghost" onClick={onEditModules}>
                Revisar módulos
              </Button>
            )}
            <Button onClick={onConfirm} disabled={!allAccepted}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
