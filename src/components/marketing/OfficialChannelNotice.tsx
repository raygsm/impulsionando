import { MessageCircle, ShieldAlert } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=" +
  encodeURIComponent("Olá! Vim pelo site oficial da Impulsionando.");

type Variant = "info" | "warning";

/**
 * Aviso padronizado: canal oficial único é o WhatsApp (21) 99307-5000.
 * Reutilizado em formulários, páginas de contato e fluxos de envio de documentos.
 */
export function OfficialChannelNotice({
  variant = "warning",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const styles =
    variant === "warning"
      ? "border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 text-amber-900 dark:text-amber-100"
      : "border-border bg-muted/40 text-foreground";

  return (
    <div
      role="note"
      aria-label="Canal oficial único"
      className={`rounded-md border p-3 text-[12px] leading-snug flex gap-2 items-start ${styles} ${className}`}
    >
      <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <strong className="block">Canal oficial único — WhatsApp (21) 99307-5000</strong>
        <p>
          Documentos, comprovantes de pagamento, solicitações e qualquer
          comunicação devem ser enviados <strong>exclusivamente</strong> pelo
          WhatsApp oficial. <strong>Não envie</strong> arquivos sensíveis,
          dados bancários ou comprovantes por este formulário, e-mails de
          terceiros, DM em redes sociais ou outros números.{" "}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="official-notice-whatsapp"
            className="inline-flex items-center gap-1 underline underline-offset-2 font-semibold"
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Abrir WhatsApp oficial
          </a>
          .
        </p>
      </div>
    </div>
  );
}
