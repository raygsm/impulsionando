import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { Globe, Menu, X, CalendarCheck, ChevronDown, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChrismedOliverProvider } from './ChrismedOliverProvider';
import { ChrismedPreloader } from './ChrismedPreloader';
import { openChrismedOliver } from './oliver-store';
import chrismedHorizontal from '@/assets/chrismed-horizontal.png.asset.json';

/**
 * Wordmark CHRISMED V4 — logo oficial CDN (upscale fiel da arte enviada
 * pela cliente). Substitui a versão tipográfica: passamos a usar a marca
 * institucional em header, drawer e footer. A altura escala responsivo
 * para respeitar o shell mobile/desktop.
 */
function ChrismedWordmark({ variant = 'default' }: { variant?: 'default' | 'sm' | 'onDark' }) {
  const height =
    variant === 'sm' ? 'h-8 md:h-9' : 'h-10 md:h-12';
  return (
    <img
      src={chrismedHorizontal.url}
      alt="CHRISMED"
      className={cn(
        'w-auto object-contain select-none',
        height,
        variant === 'onDark' && 'brightness-0 invert',
      )}
      draggable={false}
    />
  );
}

export type Lang = 'pt' | 'en' | 'es';

/** Bandeiras SVG minimalistas — usadas no bloco GMS e menu. Ordem oficial: Brasil, Inglaterra, Espanha. */
function FlagBR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 42" className={className} aria-hidden>
      <path d="M0,0 h60 v42 h-60 z" fill="#009B3A" />
      <path d="M30,4 L56,21 L30,38 L4,21 z" fill="#FEDF00" />
      <circle cx="30" cy="21" r="8" fill="#002776" />
    </svg>
  );
}
function FlagUK({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden>
      <clipPath id="fuk"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" clipPath="url(#fuk)" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2.4" clipPath="url(#fuk)" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="4" />
    </svg>
  );
}
function FlagES({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden>
      <path d="M0,0 h60 v30 h-60 z" fill="#AA151B" />
      <path d="M0,7.5 h60 v15 h-60 z" fill="#F1BF00" />
    </svg>
  );
}
const FLAG_MAP = { br: FlagBR, uk: FlagUK, es: FlagES } as const;
type FlagKey = keyof typeof FLAG_MAP;


type NavLeaf = { to: string; labels: Record<Lang, string>; desc?: Record<Lang, string>; icon?: FlagKey; setLang?: Lang };
type NavGroup = {
  key: string;
  labels: Record<Lang, string>;
  children: NavLeaf[];
};
type NavItem = NavLeaf | NavGroup;

const isGroup = (i: NavItem): i is NavGroup => 'children' in i;

// Arquitetura definitiva do menu (2026-07): 6 pontos de entrada na ordem
// pedida pela cliente — Dra. Christiane (Home) · Medicina Ambulatorial ▾ ·
// Medicina Ocupacional · Contato · GMS ▾ (com bandeiras BR/UK/ES) · Agendar.
const NAV: NavItem[] = [
  {
    to: '/chrismed',
    labels: { pt: 'Dra. Christiane Alencar', en: 'Dr. Christiane Alencar', es: 'Dra. Christiane Alencar' },
  },
  {
    key: 'ambulatorial',
    labels: { pt: 'Medicina Ambulatorial', en: 'Ambulatory Care', es: 'Medicina Ambulatoria' },
    children: [
      {
        to: '/chrismed/teleconsulta',
        labels: { pt: 'Teleconsulta', en: 'Telehealth', es: 'Teleconsulta' },
        desc: {
          pt: 'Consulta por vídeo · PT/EN/ES',
          en: 'Video consultation · PT/EN/ES',
          es: 'Consulta por video · PT/EN/ES',
        },
      },
      {
        to: '/chrismed/consultorio',
        labels: { pt: 'Presencial · Copacabana', en: 'In-office · Copacabana', es: 'En consultorio · Copacabana' },
        desc: {
          pt: 'Consultório reservado, agenda sob horário',
          en: 'Private office, scheduled appointments',
          es: 'Consultorio reservado, agenda por horario',
        },
      },
      {
        to: '/chrismed/domiciliar',
        labels: { pt: 'Consulta domiciliar', en: 'Home visit', es: 'Visita a domicilio' },
        desc: {
          pt: 'Residência, hotel ou escritório',
          en: 'Home, hotel or office',
          es: 'Residencia, hotel u oficina',
        },
      },
    ],
  },
  {
    to: '/chrismed/ocupacional',
    labels: { pt: 'Medicina Ocupacional', en: 'Occupational Medicine', es: 'Medicina Ocupacional' },
  },
  { to: '/chrismed/contato', labels: { pt: 'Contato', en: 'Contact', es: 'Contacto' } },
  {
    key: 'gms',
    labels: { pt: 'GMS · Global Medical Support', en: 'GMS · Global Medical Support', es: 'GMS · Global Medical Support' },
    children: [
      {
        to: '/chrismed',
        labels: { pt: 'Português (Brasil)', en: 'Portuguese (Brazil)', es: 'Portugués (Brasil)' },
        desc: { pt: 'Atendimento nacional', en: 'Nationwide care', es: 'Atención nacional' },
        icon: 'br',
        setLang: 'pt',
      },
      {
        to: '/chrismed/internacional',
        labels: { pt: 'GMS · Services for foreigners', en: 'GMS · Services for foreigners', es: 'GMS · Services for foreigners' },
        desc: { pt: 'English-speaking medical care', en: 'English-speaking medical care', es: 'English-speaking medical care' },
        icon: 'uk',
        setLang: 'en',
      },
      {
        to: '/chrismed/internacional',
        labels: { pt: 'GMS · Servicios para extranjeros', en: 'GMS · Servicios para extranjeros', es: 'GMS · Servicios para extranjeros' },
        desc: { pt: 'Atención médica en español', en: 'Atención médica en español', es: 'Atención médica en español' },
        icon: 'es',
        setLang: 'es',
      },
    ],
  },
];

const CTA = {
  book: { pt: 'Agendar', en: 'Book', es: 'Agendar' },
} as const;

export function useLang(): Lang {
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const raw = (search?.lang as string | undefined) ?? 'pt';
  return (['pt', 'en', 'es'].includes(raw) ? raw : 'pt') as Lang;
}


function LangSwitcher({ lang, tone = 'light' }: { lang: Lang; tone?: 'light' | 'dark' }) {
  const navigate = useNavigate();
  const pick = (l: Lang) =>
    navigate({ to: '.', search: (prev: Record<string, unknown>) => ({ ...prev, lang: l }) as never });
  const container =
    tone === 'dark'
      ? 'border-white/10 bg-white/5 text-white/70'
      : 'border-[var(--chrismed-sand)] bg-white/80 text-[var(--chrismed-graphite)]';
  const active =
    tone === 'dark'
      ? 'bg-[var(--chrismed-amber)] text-[var(--chrismed-forest-deep)]'
      : 'bg-[var(--chrismed-forest)] text-[var(--chrismed-ivory)]';
  return (
    <div className={cn('flex items-center gap-1 rounded-full border px-1.5 py-1 text-[11px] uppercase tracking-wider', container)}>
      <Globe className="mr-0.5 h-3.5 w-3.5 opacity-70" aria-hidden />
      {(['pt', 'en', 'es'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => pick(l)}
          className={cn(
            'rounded-full px-2 py-0.5 transition-colors',
            lang === l ? active : 'hover:text-[var(--chrismed-ink)]',
          )}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function DesktopDropdown({ group, lang, pathname }: { group: NavGroup; lang: Lang; pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = group.children.some((c) => pathname.startsWith(c.to));
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors',
          active
            ? 'text-[var(--chrismed-forest-deep)]'
            : 'text-[var(--chrismed-graphite)] hover:text-[var(--chrismed-forest-deep)]',
        )}
      >
        {group.labels[lang]}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 w-[22rem] -translate-x-1/2 pt-2"
        >
          <div className="overflow-hidden rounded-lg border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] shadow-[var(--chrismed-shadow-lg)]">
            {group.children.map((leaf) => {
              const Flag = leaf.icon ? FLAG_MAP[leaf.icon] : null;
              return (
              <Link
                key={`${leaf.to}-${leaf.labels.pt}`}
                to={leaf.to}
                search={leaf.setLang ? (prev: Record<string, unknown>) => ({ ...prev, lang: leaf.setLang }) as never : undefined}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-b border-[var(--chrismed-sand)]/60 px-5 py-3 last:border-b-0 hover:bg-[var(--chrismed-bone)]"
              >
                {Flag && <Flag className="h-4 w-8 shrink-0 rounded-sm shadow-sm" />}
                <div className="min-w-0">
                  <div className="chrismed-sans text-[13px] font-medium text-[var(--chrismed-forest-deep)]">
                    {leaf.labels[lang]}
                  </div>
                  {leaf.desc && (
                    <div className="mt-0.5 text-[12px] leading-snug text-[var(--chrismed-mist)]">
                      {leaf.desc[lang]}
                    </div>
                  )}
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopLeaf({ leaf, lang, pathname }: { leaf: NavLeaf; lang: Lang; pathname: string }) {
  const active = pathname === leaf.to;
  return (
    <Link
      to={leaf.to}
      className={cn(
        'whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors',
        active
          ? 'text-[var(--chrismed-forest-deep)]'
          : 'text-[var(--chrismed-graphite)] hover:text-[var(--chrismed-forest-deep)]',
      )}
    >
      {leaf.labels[lang]}
    </Link>
  );
}

export function ChrismedHeader({ variant = 'full' }: { variant?: 'full' | 'minimal' }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Fecha o drawer ao trocar de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (variant === 'minimal') {
    return (
      <header className="sticky top-0 z-30 border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link to="/chrismed" aria-label="CHRISMED — voltar ao início" className="min-w-0 truncate">
            <ChrismedWordmark variant="sm" />
          </Link>
          <Link
            to="/chrismed/contato"
            className="chrismed-sans inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--chrismed-graphite)] hover:text-[var(--chrismed-forest-deep)]"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Precisa de ajuda?</span>
            <span className="sm:hidden">Ajuda</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]/92 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 md:px-6 md:py-4 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)]">
        {/* Logo */}
        <Link
          to="/chrismed"
          className="min-w-0 shrink-0 truncate"
          aria-label="CHRISMED — Dra. Cristiane Alencar"
        >
          <ChrismedWordmark />
        </Link>

        {/* Nav desktop — só a partir de lg (≥1024px) */}
        <nav className="hidden justify-center lg:flex" aria-label="Navegação principal">
          <div className="flex items-center gap-1">
            {NAV.map((item) =>
              isGroup(item) ? (
                <DesktopDropdown key={item.key} group={item} lang={lang} pathname={pathname} />
              ) : (
                <DesktopLeaf key={item.to} leaf={item} lang={lang} pathname={pathname} />
              ),
            )}
          </div>
        </nav>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2">
          {/* Bloco GMS de idiomas — visível como bandeiras em telas < lg. No desktop, o GMS aparece no NAV. */}
          <div className="hidden items-center gap-1 rounded-full border border-[var(--chrismed-sand)] bg-white/70 px-2 py-1 sm:flex lg:hidden" role="group" aria-label="GMS · idioma">
            {(['pt', 'en', 'es'] as Lang[]).map((l) => {
              const Flag = FLAG_MAP[l === 'pt' ? 'br' : l === 'en' ? 'uk' : 'es'];
              return (
                <Link
                  key={l}
                  to="."
                  search={(prev: Record<string, unknown>) => ({ ...prev, lang: l }) as never}
                  aria-label={`Idioma ${l.toUpperCase()}`}
                  aria-pressed={lang === l}
                  className={cn(
                    'rounded-sm p-0.5 transition-opacity',
                    lang === l ? 'opacity-100 ring-1 ring-[var(--chrismed-forest-deep)]' : 'opacity-60 hover:opacity-100',
                  )}
                >
                  <Flag className="h-3.5 w-6" />
                </Link>
              );
            })}
          </div>
          <Link
            to="/chrismed/agendar"
            className="chrismed-sans chrismed-cta hidden items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium sm:inline-flex"
          >
            <CalendarCheck className="h-4 w-4 chrismed-cta-lead" aria-hidden />
            <span className="chrismed-cta-lead">{CTA.book[lang]}</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--chrismed-forest-deep)] transition-colors hover:bg-[var(--chrismed-bone)] lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="chrismed-mobile-drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      {open && <MobileDrawer lang={lang} pathname={pathname} onClose={() => setOpen(false)} />}
    </header>
  );
}

function MobileDrawer({
  lang,
  pathname,
  onClose,
}: {
  lang: Lang;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div
      id="chrismed-mobile-drawer"
      className="fixed inset-0 z-[60] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu CHRISMED"
    >
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--chrismed-forest-deep)]/40 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex h-dvh w-[min(100vw,22rem)] flex-col bg-[var(--chrismed-ivory)] shadow-[var(--chrismed-shadow-lg)]">
        <div className="flex items-center justify-between border-b border-[var(--chrismed-sand)] px-5 py-4">
          <ChrismedWordmark variant="sm" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-bone)]"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu">
          {NAV.map((item) =>
            isGroup(item) ? (
              <div key={item.key} className="mb-3">
                <div className="chrismed-sans px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--chrismed-mist)]">
                  {item.labels[lang]}
                </div>
                {item.children.map((leaf) => {
                  const Flag = leaf.icon ? FLAG_MAP[leaf.icon] : null;
                  return (
                  <Link
                    key={`${leaf.to}-${leaf.labels.pt}`}
                    to={leaf.to}
                    search={leaf.setLang ? (prev: Record<string, unknown>) => ({ ...prev, lang: leaf.setLang }) as never : undefined}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px]',
                      pathname === leaf.to
                        ? 'bg-[var(--chrismed-bone)] text-[var(--chrismed-forest-deep)]'
                        : 'text-[var(--chrismed-graphite)] hover:bg-[var(--chrismed-bone)]',
                    )}
                  >
                    {Flag && <Flag className="h-4 w-8 shrink-0 rounded-sm shadow-sm" />}
                    <span className="min-w-0 truncate">{leaf.labels[lang]}</span>
                  </Link>
                  );
                })}
              </div>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'block rounded-md px-3 py-3 text-[15px] font-medium',
                  pathname === item.to
                    ? 'bg-[var(--chrismed-bone)] text-[var(--chrismed-forest-deep)]'
                    : 'text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-bone)]',
                )}
              >
                {item.labels[lang]}
              </Link>
            ),
          )}
        </nav>

        <div className="space-y-3 border-t border-[var(--chrismed-sand)] px-5 py-4">
          <Link
            to="/chrismed/agendar"
            onClick={onClose}
            className="chrismed-sans chrismed-cta flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[14px] font-medium"
          >
            <CalendarCheck className="h-4 w-4 chrismed-cta-lead" aria-hidden />
            <span className="chrismed-cta-lead">{CTA.book[lang]}</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              openChrismedOliver();
            }}
            className="chrismed-sans flex w-full items-center justify-center gap-2 rounded-full border border-[var(--chrismed-forest)] px-4 py-3 text-[14px] font-medium text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-forest-mist)]"
          >
            Falar com Oliver
          </button>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] uppercase tracking-wider text-[var(--chrismed-mist)]">Idioma</span>
            <LangSwitcher lang={lang} />
          </div>
        </div>
      </aside>
    </div>
  );
}

const FOOTER_LINKS: Array<{ label: string; to: string }> = [
  { label: 'Dra. Cristiane Alencar', to: '/chrismed/dra-cristiane' },
  { label: 'Teleconsulta', to: '/chrismed/teleconsulta' },
  { label: 'Presencial · Copacabana', to: '/chrismed/consultorio' },
  { label: 'Consulta domiciliar', to: '/chrismed/domiciliar' },
  { label: 'Atendimento internacional', to: '/chrismed/internacional' },
];

const FOOTER_LINKS_2: Array<{ label: string; to: string }> = [
  { label: 'Especialidades', to: '/chrismed/especialidades' },
  { label: 'Exames e preparo', to: '/chrismed/exames' },
  { label: 'Empresa · Medicina ocupacional', to: '/chrismed/ocupacional' },
  { label: 'Área dos Médicos', to: '/chrismed/medicos' },
  { label: 'Perguntas frequentes', to: '/chrismed/faq' },
];

export function ChrismedFooter() {
  const lang = useLang();
  const copy = {
    pt: 'Medicina privada, internacional e humana — com sigilo, precisão e conforto.',
    en: 'Private, international and humane medicine — with discretion, precision and comfort.',
    es: 'Medicina privada, internacional y humana — con discreción, precisión y confort.',
  } as const;

  return (
    <footer className="chrismed-band-forest mt-24">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 md:px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <ChrismedWordmark variant="onDark" />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70">{copy[lang]}</p>
            <div className="mt-6 text-[11px] uppercase tracking-[0.28em] text-white/50">CRM/RJ · Registro ativo</div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/50">LGPD · Dados protegidos</div>
          </div>

          <FooterCol title="Atendimento" links={FOOTER_LINKS} />
          <FooterCol title="Clínica" links={FOOTER_LINKS_2} />

          <div>
            <div className="mb-3 text-[11px] uppercase tracking-[0.28em] text-white/50">Contato</div>
            <ul className="space-y-2 text-[14px] text-white/80">
              <li>Copacabana · Rio de Janeiro</li>
              <li>PT · EN · ES</li>
              <li>
                <Link to="/chrismed/contato" className="hover:text-[var(--chrismed-amber)]">Fale conosco</Link>
              </li>
              <li>
                <Link to="/chrismed/privacidade" className="hover:text-[var(--chrismed-amber)]">Privacidade · LGPD</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.24em] text-white/45 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} CHRISMED · Todos os direitos reservados</span>
          <span>Tecnologia Impulsionando</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  return (
    <div>
      <div className="mb-3 text-[11px] uppercase tracking-[0.28em] text-white/50">{title}</div>
      <ul className="space-y-2 text-[14px] text-white/80">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="hover:text-[var(--chrismed-amber)]">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * ChrismedShell — casca visual das rotas /chrismed/*.
 * Aceita variant "minimal" para o funil transacional (/agendar, /checkout)
 * que reduz o header a logo + ajuda e omite o footer.
 */
export function ChrismedShell({
  children,
  variant = 'full',
}: {
  children: React.ReactNode;
  variant?: 'full' | 'minimal';
}) {
  return (
    <div
      data-tenant="chrismed"
      className="chrismed-brand min-h-dvh bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)]"
    >
      <a
        href="#chrismed-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded focus:bg-[var(--chrismed-forest)] focus:px-4 focus:py-2 focus:text-[var(--chrismed-ivory)]"
      >
        Pular para o conteúdo principal
      </a>
      <ChrismedOliverProvider>
        <ChrismedPreloader />
        <ChrismedHeader variant={variant} />
        <main id="chrismed-main" className="mx-auto w-full max-w-7xl pb-28 md:pb-24">
          {children}
        </main>
        {variant === 'full' && <ChrismedFooter />}
        <OliverFab />
      </ChrismedOliverProvider>
    </div>
  );
}

/**
 * OliverFab — launcher do concierge Oliver.
 * V3: mantém regra CHRISMED (WhatsApp só dentro do painel Oliver).
 */
export function OliverFab() {
  const lang = useLang();
  const labels = {
    pt: { title: 'Falar com Oliver', sub: 'Concierge CrisMed' },
    en: { title: 'Talk to Oliver', sub: 'CrisMed concierge' },
    es: { title: 'Hablar con Oliver', sub: 'Concierge CrisMed' },
  }[lang];
  return (
    <button
      type="button"
      id="oliver"
      data-oliver-launcher
      data-chrismed-oliver-fixed-launcher
      aria-label={labels.title}
      aria-haspopup="dialog"
      onClick={() => {
        openChrismedOliver();
        try {
          window.dispatchEvent(new CustomEvent('chrismed:oliver:open', { detail: { lang } }));
        } catch {
          /* noop */
        }
      }}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
        right: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
      }}
      className="fixed z-40 flex items-center gap-3 rounded-full bg-[var(--chrismed-forest-deep)] py-3 pl-3 pr-3 text-[var(--chrismed-ivory)] shadow-[var(--chrismed-shadow-lg)] transition-all hover:bg-[var(--chrismed-forest)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-amber)] min-[380px]:pr-5"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--chrismed-amber)] chrismed-serif text-lg text-[var(--chrismed-forest-deep)]"
      >
        O
      </span>
      <span className="hidden text-left leading-tight min-[380px]:block">
        <span className="block text-sm font-medium">{labels.title}</span>
        <span className="block text-[10px] uppercase tracking-wider text-[var(--chrismed-amber-soft)]">
          {labels.sub}
        </span>
      </span>
    </button>
  );
}
