/**
 * DemoContractFlow — Dialog reutilizável que simula contratação demo:
 *   detalhes → contrato fictício → pagamento simulado → PAGO — DEMO → módulo liberado.
 *
 * Não toca banco. Persistência via `demoContracting` (localStorage).
 * Toda tela exibe a chancela "DEMONSTRAÇÃO — VERSÃO TESTE".
 */
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ShieldCheck, FileText, QrCode, CreditCard, FileText as FileBoleto,
  CheckCircle2, Sparkles, ArrowRight, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { contractDemoModule, type DemoPaymentMethod } from "@/lib/demoContracting";

type Step = "contrato" | "pagamento" | "concluido";

export type DemoContractFlowProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slug: string;
  moduleName: string;
  moduleDescription?: string;
  amountReference?: number; // valor de referência fictício, em R$
  features?: string[];
  /** Rota da demo interativa do módulo (ex: "/demo/afiliados") para CTA final. */
  testRoute?: string;
  onComplete?: () => void;
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function DemoContractFlow({
  open, onOpenChange, slug, moduleName, moduleDescription, amountReference = 0,
  features = [], testRoute, onComplete,
}: DemoContractFlowProps) {
  const [step, setStep] = useState<Step>("contrato");
  const [accepted, setAccepted] = useState({ simulation: false, noCharge: false, fakeData: false });
  const [method, setMethod] = useState<DemoPaymentMethod>("pix");
  const [processing, setProcessing] = useState(false);

  const reset = () => {
    setStep("contrato");
    setAccepted({ simulation: false, noCharge: false, fakeData: false });
    setMethod("pix");
    setProcessing(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const allAccepted = accepted.simulation && accepted.noCharge && accepted.fakeData;

  const simulatePayment = () => {
    setProcessing(true);
    // Pequeno atraso para o lead "sentir" o processamento.
    setTimeout(() => {
      contractDemoModule(slug, { paymentMethod: method, amountReference });
      setProcessing(false);
      setStep("concluido");
      toast.success(`Módulo ${moduleName} liberado na demonstração`, {
        description: "Status: PAGO — DEMO. Nenhuma cobrança real foi realizada.",
      });
      onComplete?.();
    }, 700);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-gradient-primary">
              <Sparkles className="w-3 h-3 mr-1" /> DEMONSTRAÇÃO — VERSÃO TESTE
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            {step === "contrato" && `Contratar ${moduleName} — Demonstração`}
            {step === "pagamento" && `Pagamento simulado — ${moduleName}`}
            {step === "concluido" && `${moduleName} liberado na demonstração`}
          </DialogTitle>
          <DialogDescription>
            {step === "contrato" &&
              "Este contrato é uma simulação para você entender como a contratação real será apresentada. Nenhum compromisso financeiro real será assumido."}
            {step === "pagamento" &&
              "O sistema exibe a tela de pagamento para você conhecer o fluxo. Na demonstração, o pagamento é sempre processado como aprovado."}
            {step === "concluido" &&
              "Pagamento demonstrativo aprovado. Nenhuma cobrança real foi realizada. O módulo está liberado para teste com dados fictícios."}
          </DialogDescription>
        </DialogHeader>

        {step === "contrato" && (
          <div className="space-y-4">
            <Card className="p-4 bg-muted/30">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 text-primary" />
                <div className="flex-1 text-sm">
                  <div className="font-semibold">Contrato Demonstrativo — Versão Teste</div>
                  {moduleDescription && (
                    <p className="text-muted-foreground mt-1">{moduleDescription}</p>
                  )}
                  {features.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {features.slice(0, 5).map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {amountReference > 0 && (
                    <div className="mt-3 text-xs">
                      Valor de referência:{" "}
                      <span className="font-semibold text-foreground">{brl(amountReference)}</span>{" "}
                      <span className="text-muted-foreground">— apenas referência, não cobrado.</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-2 text-sm">
              <CheckboxRow
                checked={accepted.simulation}
                onChange={(v) => setAccepted((s) => ({ ...s, simulation: v }))}
                label="Entendo que esta é uma simulação."
              />
              <CheckboxRow
                checked={accepted.noCharge}
                onChange={(v) => setAccepted((s) => ({ ...s, noCharge: v }))}
                label="Entendo que nenhum pagamento real será feito."
              />
              <CheckboxRow
                checked={accepted.fakeData}
                onChange={(v) => setAccepted((s) => ({ ...s, fakeData: v }))}
                label="Entendo que os dados são fictícios."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button
                disabled={!allAccepted}
                onClick={() => setStep("pagamento")}
                className="bg-gradient-primary"
              >
                Avançar para pagamento demo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "pagamento" && (
          <div className="space-y-4">
            <Card className="p-3 bg-amber-50 border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                Esta é uma <strong>tela de pagamento demonstrativa</strong>. Nenhum gateway real
                será acionado. O resultado será sempre <strong>PAGO — DEMO</strong>.
              </div>
            </Card>

            <RadioGroup value={method} onValueChange={(v) => setMethod(v as DemoPaymentMethod)} className="space-y-2">
              <MethodOption value="pix" icon={QrCode} title="Pix" subtitle="Aprovação imediata simulada" />
              <MethodOption value="cartao" icon={CreditCard} title="Cartão de crédito" subtitle="Até 12x — simulação" />
              <MethodOption value="boleto" icon={FileBoleto} title="Boleto" subtitle="Baixa automática simulada" />
            </RadioGroup>

            <Card className="p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Resumo do pedido (demo)</span>
                <Badge variant="outline" className="text-[10px]">VERSÃO TESTE</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>{moduleName}</span>
                <span className="font-semibold">{amountReference > 0 ? brl(amountReference) : "—"}</span>
              </div>
            </Card>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep("contrato")} disabled={processing}>
                Voltar
              </Button>
              <Button onClick={simulatePayment} disabled={processing} className="bg-gradient-primary">
                {processing ? "Processando…" : `Simular pagamento ${labelFor(method)}`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "concluido" && (
          <div className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div className="font-semibold">Status: PAGO — DEMO</div>
              </div>
              <ul className="mt-3 text-xs text-muted-foreground space-y-1">
                <li>• Módulo marcado como <strong>Ativo na demonstração</strong>.</li>
                <li>• Recursos internos liberados para teste com dados fictícios.</li>
                <li>• Mensagens de teste levam o prefixo <strong>TESTE — DEMONSTRAÇÃO</strong>.</li>
                <li>• Nenhuma cobrança real, contrato real ou envio obrigatório foi executado.</li>
              </ul>
            </Card>

            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => handleClose(false)}>Fechar</Button>
              {testRoute && (
                <Button asChild className="bg-gradient-primary">
                  <a href={testRoute}>
                    <Sparkles className="w-4 h-4 mr-1" /> Testar recursos do módulo
                  </a>
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckboxRow({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      <span>{label}</span>
    </label>
  );
}

function MethodOption({
  value, icon: Icon, title, subtitle,
}: {
  value: DemoPaymentMethod;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <label
      htmlFor={`pay-${value}`}
      className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <RadioGroupItem value={value} id={`pay-${value}`} />
      <Icon className="w-4 h-4 text-primary" />
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </label>
  );
}

function labelFor(m: DemoPaymentMethod) {
  return m === "pix" ? "Pix" : m === "cartao" ? "Cartão" : "Boleto";
}
