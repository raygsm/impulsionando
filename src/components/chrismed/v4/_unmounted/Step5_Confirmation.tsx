/**
 * V4 — Step 5: confirmação persistida.
 * Isolado, não montado. Renderiza um `appointment` real fornecido por prop.
 * Nunca renderizar sem o objeto vindo do backend.
 */
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { V4_DICTIONARY } from '@/content/chrismed/v4/dictionary';
import type { V4ConfirmationProps } from '@/content/chrismed/v4/contracts';

export function Step5_Confirmation({ appointment, warnings, onNew, lang }: V4ConfirmationProps) {
  const d = V4_DICTIONARY[lang].step5;
  return (
    <section className="max-w-xl mx-auto text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-900/10 text-emerald-900 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h2 className="font-serif text-2xl text-emerald-950">{d.title}</h2>
      <p className="text-sm text-emerald-900/70 mt-2">{d.summary}</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
        <dt className="text-emerald-900/60 uppercase tracking-[0.14em] text-[10px]">ID</dt>
        <dd className="text-emerald-950">{appointment.id}</dd>
        <dt className="text-emerald-900/60 uppercase tracking-[0.14em] text-[10px]">Início</dt>
        <dd className="text-emerald-950">{new Date(appointment.starts_at).toLocaleString(lang)}</dd>
        <dt className="text-emerald-900/60 uppercase tracking-[0.14em] text-[10px]">Status</dt>
        <dd className="text-emerald-950">{appointment.status}</dd>
      </dl>

      {warnings && warnings.length > 0 && (
        <p className="mt-4 text-xs text-amber-900/80">{d.warnings}</p>
      )}

      <Button type="button" onClick={onNew} className="mt-6 bg-emerald-900 hover:bg-emerald-950 text-amber-50">
        {d.calendar}
      </Button>
    </section>
  );
}
