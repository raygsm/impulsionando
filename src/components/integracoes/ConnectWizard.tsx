import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicFieldsForm } from "./DynamicFieldsForm";
import type { IntegrationItem } from "@/data/integracoes-catalog";

const STEPS = [
  { key: "contexto", label: "O que será conectado" },
  { key: "requisitos", label: "Pré-requisitos" },
  { key: "campos", label: "Campos necessários" },
  { key: "teste", label: "Teste" },
  { key: "confirmacao", label: "Confirmação" },
] as const;

export function ConnectWizard({
  item,
  open,
  onOpenChange,
}: {
  item: IntegrationItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  function reset() {
    setStep(0);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : reset())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Conectar {item.name}</DialogTitle>
          <DialogDescription>
            Vamos guiar você em 5 passos simples. Nada é ativado antes da confirmação.
          </DialogDescription>
        </DialogHeader>

        {/* Passos */}
        <ol className="flex flex-wrap items-center gap-2 text-xs">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                i === step
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : i < step
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                    : "border-border text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                  i === step ? "border-primary" : i < step ? "border-emerald-500" : "border-border",
                )}
              >
                {i < step ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
            </li>
          ))}
        </ol>

        <div className="min-h-[220px] py-3">
          {step === 0 && (
            <div className="space-y-3 text-sm">
              <p className="text-foreground">
                Vamos conectar sua conta <strong>{item.name}</strong> ao Impulsionando.
              </p>
              <p className="text-muted-foreground">{item.description}</p>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                Impulsinito: “Fique tranquilo, eu explico cada campo. Tudo pode ser desfeito depois.”
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 text-sm">
              <p className="font-medium">Antes de continuar, confirme:</p>
              <ul className="space-y-2">
                {item.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Preencha os campos que o {item.name} pede. Nada é enviado ainda.
              </p>
              <DynamicFieldsForm fields={item.fields} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <p className="font-medium">Vamos testar a conexão</p>
              <p className="text-muted-foreground">
                Clique em <strong>Rodar teste</strong>. É uma simulação visual — a verificação real acontece
                quando o Codex conclui o backend.
              </p>
              <Button variant="secondary" size="sm">
                Rodar teste
              </Button>
              <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                Resultado simulado: <span className="font-medium text-emerald-700">Tudo funcionando ✓</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{item.name} pronto para uso</span>
              </div>
              <p className="text-muted-foreground">
                Tudo certo. Você pode acompanhar o status pela tela de diagnóstico.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={reset}>
            Cancelar
          </Button>
          <div className="flex-1" />
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
          )}
          {!isLast && (
            <Button onClick={() => setStep((s) => s + 1)}>
              Avançar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {isLast && <Button onClick={reset}>Concluir</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
