import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Copy,
  MessageCircle,
  Upload,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildPixPayload,
  pixQrUrl,
  PIX_KEY,
  PIX_RECEBEDOR,
} from "@/lib/pix";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  amountCents: number;
  txid: string;
  /** Texto opcional acima do QR (ex.: "Plano Integrado — mensal"). */
  label?: string;
  /** Número do WhatsApp para envio de comprovante (somente dígitos). */
  whatsappPhone?: string;
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PixFallbackDialog({
  open,
  onOpenChange,
  amountCents,
  txid,
  label,
  whatsappPhone = "5521972554500",
}: Props) {
  const payload = useMemo(
    () => buildPixPayload(amountCents, txid),
    [amountCents, txid],
  );
  const qr = pixQrUrl(payload);
  const [comprovante, setComprovante] = useState<{ name: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${what} copiado!`);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pagar via Pix (chave CNPJ)</DialogTitle>
          <DialogDescription>
            Houve instabilidade no método de pagamento principal. Você pode
            pagar agora via Pix usando o CNPJ da Impulsionando como chave.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            {label ? <><strong>{label}</strong> — </> : null}
            Valor: <strong>{formatBRL(amountCents)}</strong>. Após pagar,
            anexe o comprovante e confirme. Nossa equipe valida e libera o
            acesso em até 1 dia útil.
          </p>
        </div>

        <div className="grid md:grid-cols-[240px_1fr] gap-4 items-start mt-2">
          <div className="flex flex-col items-center">
            <img
              src={qr}
              alt="QR Code Pix"
              width={240}
              height={240}
              className="rounded-md border border-border bg-white"
              loading="lazy"
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-center">
              Aponte a câmera do app bancário
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">
                Chave Pix (CNPJ)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-2 py-1.5 rounded-md bg-muted text-sm font-mono select-all break-all">
                  {PIX_KEY}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copy(PIX_KEY, "CNPJ")}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                Pix copia e cola (com valor)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-2 py-1.5 rounded-md bg-muted text-[11px] font-mono select-all break-all max-h-20 overflow-auto">
                  {payload}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copy(payload, "Código Pix")}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Recebedor</Label>
              <p className="font-medium">{PIX_RECEBEDOR}</p>
            </div>

            {confirmed ? (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/60 p-3 flex items-start gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <p className="font-medium">Pagamento confirmado pelo cliente</p>
                  <p className="opacity-80">
                    Comprovante: <strong>{comprovante?.name ?? "enviado"}</strong>. Equipe notificada para liberação.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-md border border-border bg-card p-3">
                <Label className="text-xs text-muted-foreground">
                  Anexar comprovante do Pix
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    id="pix-comprovante-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 8 * 1024 * 1024) {
                        toast.error("Arquivo muito grande (máx. 8MB).");
                        return;
                      }
                      setComprovante({ name: f.name });
                      toast.success("Comprovante anexado.");
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("pix-comprovante-input")?.click()
                    }
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {comprovante ? "Trocar arquivo" : "Selecionar arquivo"}
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {comprovante ? comprovante.name : "PNG, JPG ou PDF até 8MB"}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!comprovante}
                  onClick={() => {
                    setConfirmed(true);
                    toast.success(
                      "Pagamento confirmado! Equipe notificada para liberação.",
                    );
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar pagamento
                </Button>
              </div>
            )}

            <Button asChild variant="outline" size="sm" className="w-full">
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                  `Olá! Paguei via Pix (${label ?? txid} — ${formatBRL(amountCents)}). Segue o comprovante.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Enviar comprovante por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
