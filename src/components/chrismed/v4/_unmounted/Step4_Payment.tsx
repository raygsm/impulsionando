/**
 * V4 — Step 4: pagamento PIX + status.
 * Isolado, não montado. Sem polling, sem timer client-side.
 * `status` e `pix.expires_at` vêm do backend real.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { V4_DICTIONARY } from '@/content/chrismed/v4/dictionary';
import type { V4PaymentProps, V4PaymentStatus } from '@/content/chrismed/v4/contracts';

function PaymentStatusBadge({ status, lang }: { status: V4PaymentStatus; lang: 'pt' | 'en' | 'es' }) {
  const d = V4_DICTIONARY[lang].step4;
  const label: Record<V4PaymentStatus, string> = {
    creating: d.awaiting,
    awaiting_pix: d.awaiting,
    in_process: d.inProcess,
    approved: d.approved,
    rejected: d.rejected,
    cancelled: d.cancelled,
    expired: d.expired,
    refunded: d.refunded,
    charged_back: d.chargedBack,
    error_gateway: d.errorGateway,
    error_network: d.errorNetwork,
  };
  return (
    <span className="inline-block text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded border border-emerald-900/15 bg-white text-emerald-950">
      {label[status]}
    </span>
  );
}

export function Step4_Payment({ pix, status, onCancel, onOpenOliver, lang }: V4PaymentProps) {
  const d = V4_DICTIONARY[lang].step4;
  return (
    <section className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-emerald-950">{d.title}</h2>
        <PaymentStatusBadge status={status} lang={lang} />
      </div>

      {pix && (
        <div className="space-y-4">
          <p className="text-sm text-emerald-900/70">{d.pixHint}</p>
          {pix.qr_code_base64 && (
            <img
              src={`data:image/png;base64,${pix.qr_code_base64}`}
              alt="QR Code PIX"
              width={256}
              height={256}
              className="mx-auto rounded-lg border bg-white p-3"
            />
          )}
          <div className="space-y-1">
            <Label>PIX</Label>
            <Input readOnly value={pix.qr_code} className="font-mono text-xs" />
          </div>
          {/* Expiração vem do backend — apenas renderizada, nunca contada aqui. */}
          <p className="text-xs text-emerald-900/60">
            {new Date(pix.expires_at).toLocaleString(lang)}
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="border-emerald-900/20">
          ✕
        </Button>
        <Button type="button" variant="outline" onClick={onOpenOliver} className="border-emerald-900/20">
          {d.troubleshoot}
        </Button>
      </div>
    </section>
  );
}
