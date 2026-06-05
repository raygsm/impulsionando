import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

export const Route = createFileRoute("/demo/trial")({
  head: () => ({
    meta: [
      { title: "Demonstração do Trial — Impulsionando Tecnologia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrialDemo,
});

const STEPS = [
  { key: "criado", label: "Trial criado", desc: "Lead aceita os termos e cria o Trial." },
  { key: "ativo", label: "Trial ativo", desc: "Todos os recursos liberados por 7 dias." },
  { key: "dia3", label: "Dia 3", desc: "Comunicação de progresso por WhatsApp e e-mail." },
  { key: "vence_3d", label: "Faltam 3 dias", desc: "Aviso de proximidade do encerramento." },
  { key: "vence_1d", label: "Faltam 1 dia", desc: "Aviso final antes da cobrança." },
  { key: "cobranca", label: "Cobrança gerada", desc: "Trial encerra, cobrança do plano escolhido." },
  { key: "pago", label: "Pagamento aprovado", desc: "Trial convertido para plano pago." },
  { key: "negado", label: "Pagamento não identificado", desc: "Aviso de inadimplência." },
  { key: "suspenso", label: "Acesso suspenso", desc: "Cliente acessa apenas o financeiro." },
  { key: "regularizado", label: "Regularizado", desc: "Acesso restabelecido após pagamento." },
];

function TrialDemo() {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-12 w-full">
        <Badge variant="outline" className="mb-3">Demonstração — dados fictícios, sem impacto em dados reais</Badge>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Ciclo completo do Trial</h1>
        <p className="text-muted-foreground mb-8">Avance os passos para simular o ciclo do Trial de 7 dias da Impulsionando Tecnologia.</p>

        <div className="grid lg:grid-cols-[1fr,2fr] gap-6">
          <Card className="p-4 space-y-1 h-fit">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setStep(i)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  i === step ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <div className="font-medium">{i + 1}. {s.label}</div>
              </button>
            ))}
          </Card>

          <Card className="p-6">
            <Badge>{STEPS[step].label}</Badge>
            <h2 className="text-xl font-semibold mt-3">{STEPS[step].desc}</h2>
            <div className="mt-6 rounded-md bg-muted/40 border p-4 text-sm leading-relaxed">
              {step === 5 && (
                <span>Você está em ambiente de testes. Este pagamento será processado como concretizado ficticiamente para que você visualize a dinâmica pós-pagamento confirmado. Nenhuma cobrança real será realizada.</span>
              )}
              {step === 7 && (
                <span>Você está inadimplente. Seu acesso foi suspenso temporariamente. Para regularizar sua conta, acesse a área financeira e realize o pagamento pendente.</span>
              )}
              {step !== 5 && step !== 7 && (
                <span>Comunicação enfileirada por WhatsApp e e-mail. Status do Trial atualizado para <strong>{STEPS[step].label}</strong>.</span>
              )}
            </div>
            <div className="mt-6 flex gap-2 justify-between">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Anterior</Button>
              <Button disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Avançar</Button>
            </div>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
