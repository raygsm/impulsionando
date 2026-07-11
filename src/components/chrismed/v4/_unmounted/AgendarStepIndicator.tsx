/**
 * V4 — Step indicator (isolado, não montado).
 * Puramente visual; recebe `current` e `lang` por props.
 */
import { V4_DICTIONARY } from '@/content/chrismed/v4/dictionary';
import type { V4StepIndicatorProps } from '@/content/chrismed/v4/contracts';
import { cn } from '@/lib/utils';

export function AgendarStepIndicator({ current, lang }: V4StepIndicatorProps) {
  const d = V4_DICTIONARY[lang].stepper;
  const steps = [d.s1, d.s2, d.s3, d.s4, d.s5];
  return (
    <ol className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4 | 5;
        const active = n === current;
        const done = n < current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium border',
                active && 'bg-emerald-900 text-amber-50 border-emerald-900',
                done && 'bg-amber-100 text-emerald-950 border-amber-300',
                !active && !done && 'bg-white text-emerald-900/60 border-emerald-900/15',
              )}
            >
              {n}
            </span>
            <span className={cn(active ? 'text-emerald-950' : 'text-emerald-900/60')}>{label}</span>
            {n < steps.length && <span aria-hidden className="text-emerald-900/20">·</span>}
          </li>
        );
      })}
    </ol>
  );
}
