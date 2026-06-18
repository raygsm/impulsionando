/**
 * DemoCheckout — checkout 100% simulado para a demo Bar & Restaurante.
 *
 * SEGURANÇA:
 *  - Nenhum input aceita dado real. Campos de cartão e CPF são readOnly com
 *    valores fictícios pré-preenchidos; Pix mostra um "QR" decorativo.
 *  - Nenhuma chamada externa de pagamento é feita. Tudo dispara apenas
 *    recordDemoEvent com o método escolhido.
 *  - Banner permanente reforça "ambiente de demonstração".
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, QrCode, CreditCard, Bike, CheckCircle2, Copy } from "lucide-react";
import { formatBRL, type DemoCartItem } from "@/hooks/useDemoCart";

export type DemoPaymentMethod = "pix" | "card" | "on_delivery";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DemoCartItem[];
  totalCents: number;
  onSimulate: (method: DemoPaymentMethod) => void;
  onAfterSuccess: () => void;
};

const FAKE_PIX_PAYLOAD =
  "00020126360014BR.GOV.BCB.PIX0114DEMO-IMPULSION5204000053039865405" +
  "0.005802BR5921BOTECO AURORA DEMO6009SAO PAULO62070503***6304ABCD";

export function DemoCheckout({ open, onOpenChange, items, totalCents, onSimulate, onAfterSuccess }: Props) {
  const [method, setMethod] = useState<DemoPaymentMethod>("pix");
  const [success, setSuccess] = useState<DemoPaymentMethod | null>(null);

  const reset = () => {
    setSuccess(null);
    setMethod("pix");
  };

  const handleSimulate = () => {
    onSimulate(method);
    setSuccess(method);
  };

  const handleClose = (next: boolean) => {
    if (!next && success) {
      onAfterSuccess();
      reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {success ? (
          <SuccessView method={success} totalCents={totalCents} onClose={() => handleClose(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Finalizar pedido</DialogTitle>
            </DialogHeader>

            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-xs text-amber-900 dark:text-amber-100">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Demonstração — todos os campos abaixo estão bloqueados e nenhum dado real é
                aceito ou transmitido. Os valores servem apenas para mostrar o fluxo.
              </p>
            </div>

            <Card className="p-3 space-y-1 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="truncate pr-2">
                    {i.qty}× {i.name}
                  </span>
                  <span className="text-muted-foreground">{formatBRL(i.priceCents * i.qty)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatBRL(totalCents)}</span>
              </div>
            </Card>

            <Tabs value={method} onValueChange={(v) => setMethod(v as DemoPaymentMethod)} className="mt-2">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="pix" className="gap-1"><QrCode className="w-4 h-4" /> Pix</TabsTrigger>
                <TabsTrigger value="card" className="gap-1"><CreditCard className="w-4 h-4" /> Cartão</TabsTrigger>
                <TabsTrigger value="on_delivery" className="gap-1"><Bike className="w-4 h-4" /> Entrega</TabsTrigger>
              </TabsList>

              <TabsContent value="pix" className="space-y-3 pt-3">
                <div className="flex flex-col items-center gap-2">
                  <FakePixQr />
                  <Badge variant="secondary" className="text-[10px]">QR Pix fictício</Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pix Copia e Cola (demo)</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={FAKE_PIX_PAYLOAD} className="text-xs font-mono" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard?.writeText(FAKE_PIX_PAYLOAD).catch(() => {})}
                      aria-label="Copiar payload Pix simulado"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Em produção este payload viria do gateway real configurado pelo restaurante.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="card" className="space-y-3 pt-3">
                <FieldRO label="Número do cartão" value="4242 4242 4242 4242" />
                <div className="grid grid-cols-2 gap-2">
                  <FieldRO label="Validade" value="12/30" />
                  <FieldRO label="CVV" value="•••" />
                </div>
                <FieldRO label="Nome no cartão" value="DEMO IMPULSIONANDO" />
                <FieldRO label="CPF" value="000.000.000-00" />
                <p className="text-[11px] text-muted-foreground">
                  Campos bloqueados. Em produção, o restaurante decide se usa link de pagamento,
                  tap-to-pay ou maquininha integrada.
                </p>
              </TabsContent>

              <TabsContent value="on_delivery" className="space-y-3 pt-3">
                <Card className="p-3 text-sm space-y-2">
                  <p className="font-medium">Pagar na entrega</p>
                  <p className="text-xs text-muted-foreground">
                    O entregador leva maquininha. Cliente escolhe Pix, débito, crédito ou dinheiro
                    no momento.
                  </p>
                </Card>
                <FieldRO label="Troco para" value="R$ 0,00 (não precisa)" />
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={handleSimulate} size="lg" className="w-full">
                Simular pagamento ({methodLabel(method)})
              </Button>
              <Button variant="ghost" onClick={() => handleClose(false)} className="w-full">
                Voltar ao carrinho
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldRO({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input readOnly value={value} className="bg-muted/50 cursor-not-allowed" />
    </div>
  );
}

function methodLabel(m: DemoPaymentMethod) {
  return m === "pix" ? "Pix" : m === "card" ? "Cartão" : "Na entrega";
}

function FakePixQr() {
  // QR decorativo determinístico — 17x17 quadrados gerados a partir de um hash trivial.
  // Não é um QR válido; apenas ilustração visual.
  const seed = "BOTECO-AURORA-DEMO";
  const size = 17;
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    const code = (seed.charCodeAt(i % seed.length) * (i + 7)) % 7;
    cells.push(code < 3);
  }
  // Forçar marcadores de canto (estético).
  const isCorner = (x: number, y: number) =>
    (x < 3 && y < 3) || (x > size - 4 && y < 3) || (x < 3 && y > size - 4);
  return (
    <div
      className="grid bg-white p-2 rounded border"
      style={{ gridTemplateColumns: `repeat(${size}, 8px)` }}
      aria-hidden
    >
      {cells.map((on, i) => {
        const x = i % size;
        const y = Math.floor(i / size);
        const corner = isCorner(x, y);
        const filled = corner ? (x === 0 || x === 2 || y === 0 || y === 2 || (x === 1 && y === 1)) : on;
        return (
          <div
            key={i}
            style={{ width: 8, height: 8, background: filled ? "#0a0a0a" : "#ffffff" }}
          />
        );
      })}
    </div>
  );
}

function SuccessView({
  method,
  totalCents,
  onClose,
}: {
  method: DemoPaymentMethod;
  totalCents: number;
  onClose: () => void;
}) {
  return (
    <div className="text-center space-y-3 py-2">
      <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <DialogTitle className="text-center">Pagamento simulado com sucesso</DialogTitle>
      <p className="text-sm text-muted-foreground">
        Método: <strong>{methodLabel(method)}</strong> · Total: <strong>{formatBRL(totalCents)}</strong>
      </p>
      <Card className="text-left p-3 text-xs space-y-2">
        <p className="font-medium">O que aconteceria em produção:</p>
        <ul className="list-disc pl-4 text-muted-foreground space-y-1">
          <li>CRM do restaurante cria contato, registra ticket e horário do pedido.</li>
          <li>WhatsApp dispara comprovante e pesquisa de satisfação.</li>
          <li>Voucher de retorno é emitido automaticamente conforme regra do Clube.</li>
          <li>Dashboard do dono atualiza receita, mix de produtos e ticket médio.</li>
        </ul>
      </Card>
      <Button onClick={onClose} className="w-full">Continuar demonstração</Button>
    </div>
  );
}
