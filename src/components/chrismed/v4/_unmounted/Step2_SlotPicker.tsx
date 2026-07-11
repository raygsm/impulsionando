/**
 * V4 — Step 2: seleção de profissional, data e horário + banner de hold.
 * Isolado, não montado. Sem fetch, sem timer client-side.
 * Countdown do hold é renderizado a partir de `hold.expires_at` (backend).
 */
import { V4_DICTIONARY } from '@/content/chrismed/v4/dictionary';
import type { V4SlotPickerProps } from '@/content/chrismed/v4/contracts';

export function Step2_SlotPicker({
  professionals,
  slots,
  hold,
  state,
  onPickProfessional,
  onPickSlot,
  onReleaseHold,
  lang,
}: V4SlotPickerProps) {
  const d = V4_DICTIONARY[lang].step2;

  return (
    <section className="grid md:grid-cols-[240px_1fr] gap-8">
      <aside>
        <label className="text-[11px] uppercase tracking-[0.18em] text-amber-700/90">
          {d.professionalLabel}
        </label>
        <ul className="mt-3 space-y-2">
          {professionals.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPickProfessional(p.id)}
                className="w-full text-left px-3 py-2 rounded-lg border border-emerald-900/10 hover:border-emerald-900/30 bg-white text-emerald-950"
              >
                <div className="font-medium">{p.display_name}</div>
                <div className="text-xs text-emerald-900/60">{p.specialties.join(' · ')}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div>
        <h2 className="font-serif text-2xl text-emerald-950">{d.title}</h2>

        {/* Calendário: placeholder visual — implementação real virá com contrato de availability. */}
        <div className="mt-4 rounded-xl border border-emerald-900/10 bg-white p-4 min-h-[220px]">
          <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-900/60">
            {d.calendarLabel}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-900/60 mb-3">
            {d.timeLabel}
          </div>
          {state === 'no_availability' ? (
            <p className="text-sm text-emerald-900/70">{d.noAvailability}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={`${s.professional_id}_${s.starts_at}`}
                  type="button"
                  onClick={() => onPickSlot(s)}
                  className="px-3 py-1.5 rounded-full border border-emerald-900/15 hover:border-emerald-900/40 bg-white text-emerald-950 text-sm"
                >
                  {new Date(s.starts_at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hold banner — expires_at é do backend, apenas renderizado. */}
        {hold && (
          <div className="mt-6 rounded-lg border border-amber-300/60 bg-amber-100/50 px-4 py-3 text-sm text-emerald-950 flex items-center justify-between">
            <span>
              {d.holdActive} · {new Date(hold.expires_at).toLocaleTimeString(lang)}
            </span>
            <button type="button" onClick={onReleaseHold} className="text-emerald-900 hover:underline">
              ✕
            </button>
          </div>
        )}
        {state === 'hold_expired' && (
          <p className="mt-4 text-sm text-red-800/80">{d.holdExpired}</p>
        )}
        {state === 'hold_conflict' && (
          <p className="mt-4 text-sm text-red-800/80">{d.holdConflict}</p>
        )}
      </div>
    </section>
  );
}
