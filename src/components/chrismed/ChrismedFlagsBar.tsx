import { useNavigate } from '@tanstack/react-router';
import { useLang } from './ChrismedShell';
import { cn } from '@/lib/utils';

/**
 * Barra de bandeiras para tradução imediata (EN/ES).
 * Exibir em toda página que menciona GMS / pacientes estrangeiros.
 * Clique traduz integralmente o conteúdo via ?lang=.
 */
export function ChrismedFlagsBar({
  tone = 'light',
  className,
  align = 'right',
}: {
  tone?: 'light' | 'dark';
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const lang = useLang();
  const navigate = useNavigate();
  const pick = (l: 'pt' | 'en' | 'es') =>
    navigate({ to: '.', search: (prev: Record<string, unknown>) => ({ ...prev, lang: l }) as never });

  const box =
    tone === 'dark'
      ? 'border-white/15 bg-white/5 text-white/80'
      : 'border-[var(--chrismed-sand)] bg-white/85 text-[var(--chrismed-graphite)]';
  const activeCls =
    tone === 'dark'
      ? 'bg-[var(--chrismed-amber)] text-[var(--chrismed-forest-deep)]'
      : 'bg-[var(--chrismed-forest)] text-[var(--chrismed-ivory)]';

  const alignCls =
    align === 'center' ? 'justify-center' : align === 'left' ? 'justify-start' : 'justify-end';

  const flags: { code: 'en' | 'es'; emoji: string; label: string }[] = [
    { code: 'en', emoji: '🇬🇧', label: 'EN' },
    { code: 'es', emoji: '🇪🇸', label: 'ES' },
  ];

  return (
    <div className={cn('flex items-center gap-2', alignCls, className)}>
      <div className={cn('flex items-center gap-1 rounded-full border px-1.5 py-1 text-[11px] uppercase tracking-wider', box)}>
        <span className="pl-1 pr-0.5 opacity-70">Translate:</span>
        {flags.map((f) => (
          <button
            key={f.code}
            type="button"
            onClick={() => pick(f.code)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors',
              lang === f.code ? activeCls : 'hover:text-[var(--chrismed-ink)]',
            )}
            aria-pressed={lang === f.code}
            aria-label={`Translate page to ${f.label}`}
          >
            <span aria-hidden>{f.emoji}</span>
            <span>{f.label}</span>
          </button>
        ))}
        {lang !== 'pt' && (
          <button
            type="button"
            onClick={() => pick('pt')}
            className="ml-1 rounded-full px-2 py-0.5 opacity-60 hover:opacity-100"
            aria-label="Voltar para português"
          >
            PT
          </button>
        )}
      </div>
    </div>
  );
}
