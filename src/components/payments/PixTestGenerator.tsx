import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPixPayload, type PixPayloadInput } from "@/lib/pix";

export interface PixTestGeneratorProps {
  /** Lead/customer data used to compose the Pix charge. */
  lead: {
    name: string;
    email?: string;
    document?: string; // CPF/CNPJ — falls back to a test key when absent.
    phone?: string;
    city?: string;
  };
  /** Amount in BRL (e.g. 1 for R$1,00 of the TESTE plan). */
  amount: number;
  /** Reference id (e.g. order_nsu) — included as txid. */
  reference?: string;
  /** Description shown inside the bank app. */
  description?: string;
  /**
   * Called when the user clicks "Simular confirmação". This is for visual/
   * functional testing only — real unlock requires InfinitePay's webhook to
   * mark the payment as `paid` in production.
   */
  onSimulateConfirm?: () => void;
}

/**
 * PixTestGenerator
 *
 * Reusable component that generates a Pix "copia e cola" string and a QR
 * Code from lead data, with buttons to copy, download the QR Code and
 * simulate confirmation.
 *
 * ⚠️ Real module unlock is ONLY granted when InfinitePay marks the order as
 * `paid` in the `production` environment (webhook + payment_check). The
 * "simular confirmação" button NEVER unlocks real modules — it only updates
 * local UI state for testing.
 */
export function PixTestGenerator({
  lead,
  amount,
  reference,
  description,
  onSimulateConfirm,
}: PixTestGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pixKey = useMemo(() => {
    const doc = (lead.document ?? "").replace(/\D+/g, "");
    if (doc.length === 11 || doc.length === 14) return doc;
    if (lead.email) return lead.email.trim();
    return "teste@impulsionando.com.br";
  }, [lead.document, lead.email]);

  const payload = useMemo<string>(() => {
    const input: PixPayloadInput = {
      pixKey,
      amount,
      merchantName: lead.name || "IMPULSIONANDO TESTE",
      merchantCity: lead.city || "BRASIL",
      txid: reference,
      description,
    };
    return buildPixPayload(input);
  }, [pixKey, amount, lead.name, lead.city, reference, description]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, { width: 320, margin: 1 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, payload, { width: 320, margin: 1 }).catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [payload]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `pix-teste-${reference || "impulsionando"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSimulate = () => {
    setSimulated(true);
    onSimulateConfirm?.();
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Pix de teste gerado a partir dos dados do lead. A confirmação automática
          depende de gateway/PSP. Esta tela serve para validar o fluxo visual e
          funcional — o desbloqueio real do módulo só acontece quando a InfinitePay
          marcar o pagamento como <strong>paid</strong>.
        </p>
      </div>

      <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="bg-white p-3 rounded-lg border w-fit mx-auto">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code Pix" className="w-[220px] h-[220px]" />
          ) : (
            <canvas ref={canvasRef} className="w-[220px] h-[220px]" />
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Pix copia e cola
            </div>
            <textarea
              readOnly
              value={payload}
              className="w-full h-28 text-xs font-mono p-2 rounded-md border bg-muted/40 resize-none"
              data-testid="pix-payload"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopy} variant="secondary" size="sm">
              <Copy className="w-4 h-4 mr-1" />
              {copied ? "Copiado!" : "Copiar código"}
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm" disabled={!qrDataUrl}>
              <Download className="w-4 h-4 mr-1" />
              Baixar QR Code
            </Button>
            <Button onClick={handleSimulate} size="sm" disabled={simulated}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {simulated ? "Confirmação simulada" : "Simular confirmação"}
            </Button>
          </div>

          {simulated && (
            <p className="text-xs text-amber-600">
              ⚠ Simulação apenas visual. Nenhum módulo real é liberado por aqui — o
              desbloqueio ocorre apenas via webhook InfinitePay com status{" "}
              <code>paid</code> em <code>production</code>.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default PixTestGenerator;
