/**
 * V4 — Step 3: dados do pagador + consentimentos LGPD/Termos.
 * Isolado, não montado. Nenhuma submissão real; apenas UI.
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { V4_DICTIONARY } from '@/content/chrismed/v4/dictionary';
import type { V4PayerFormProps } from '@/content/chrismed/v4/contracts';

export function Step3_PayerForm({
  value,
  onChange,
  consents,
  onConsentsChange,
  state,
  onSubmit,
  lang,
}: V4PayerFormProps) {
  const d = V4_DICTIONARY[lang].step3;
  const disabled = state !== 'valid';

  return (
    <section className="max-w-xl">
      <h2 className="font-serif text-2xl text-emerald-950 mb-6">{d.title}</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="v4-fn">{d.first_name}</Label>
            <Input id="v4-fn" value={value.first_name ?? ''} onChange={(e) => onChange({ first_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="v4-ln">{d.last_name}</Label>
            <Input id="v4-ln" value={value.last_name ?? ''} onChange={(e) => onChange({ last_name: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="v4-em">{d.email}</Label>
          <Input id="v4-em" type="email" value={value.email ?? ''} onChange={(e) => onChange({ email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="v4-ph">{d.phone}</Label>
          <Input id="v4-ph" value={value.phone_e164 ?? ''} onChange={(e) => onChange({ phone_e164: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="v4-doc">{d.doc}</Label>
          <Input id="v4-doc" value={value.doc_number ?? ''} onChange={(e) => onChange({ doc_number: e.target.value })} />
        </div>

        <label className="flex items-start gap-2 text-sm text-emerald-900/80">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(consents.lgpd_version)}
            onChange={(e) => onConsentsChange({ lgpd_version: e.target.checked ? 'pending' : undefined })}
          />
          <span>{d.consentLgpd}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-emerald-900/80">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(consents.terms_version)}
            onChange={(e) => onConsentsChange({ terms_version: e.target.checked ? 'pending' : undefined })}
          />
          <span>{d.terms}</span>
        </label>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="w-full bg-emerald-900 hover:bg-emerald-950 text-amber-50"
        >
          {V4_DICTIONARY[lang].stepper.s4}
        </Button>
      </div>
    </section>
  );
}
