import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { Globe, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type Lang = 'pt' | 'en' | 'es';

const NAV: Array<{ to: string; labels: Record<Lang, string> }> = [
  { to: '/chrismed', labels: { pt: 'Início', en: 'Home', es: 'Inicio' } },
  { to: '/chrismed/dra-cristiane', labels: { pt: 'Dra. Cristiane Alencar', en: 'Dr. Alencar', es: 'Dra. Alencar' } },
  { to: '/chrismed/internacional', labels: { pt: 'Internacional', en: 'International', es: 'Internacional' } },
  { to: '/chrismed#teleconsulta', labels: { pt: 'Teleconsulta', en: 'Telehealth', es: 'Teleconsulta' } },
  { to: '/chrismed#domiciliar', labels: { pt: 'Consulta domiciliar', en: 'Home visit', es: 'Visita a domicilio' } },
  { to: '/chrismed/clinica', labels: { pt: 'Clínica CrisMed', en: 'CrisMed Clinic', es: 'Clínica CrisMed' } },
  { to: '/chrismed/ocupacional', labels: { pt: 'Medicina ocupacional', en: 'Occupational health', es: 'Salud ocupacional' } },
];

const CTA = {
  book: { pt: 'Agendar consulta', en: 'Book a consultation', es: 'Agendar consulta' },
  oliver: { pt: 'Falar com Oliver', en: 'Talk to Oliver', es: 'Hablar con Oliver' },
} as const;

export function useLang(): Lang {
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const raw = (search?.lang as string | undefined) ?? 'pt';
  return (['pt', 'en', 'es'].includes(raw) ? raw : 'pt') as Lang;
}

function LangSwitcher({ lang }: { lang: Lang }) {
  const navigate = useNavigate();
  const pick = (l: Lang) =>
    navigate({ to: '.', search: (prev: Record<string, unknown>) => ({ ...prev, lang: l }) as never });
  return (
    <div className="flex items-center gap-1 rounded-full border border-amber-200/60 bg-white/70 px-1.5 py-1 text-[11px] uppercase tracking-wider">
      <Globe className="h-3.5 w-3.5 text-amber-700/80 mr-0.5" />
      {(['pt', 'en', 'es'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => pick(l)}
          className={cn(
            'px-2 py-0.5 rounded-full transition-colors',
            lang === l ? 'bg-emerald-900 text-amber-50' : 'text-emerald-900/60 hover:text-emerald-900',
          )}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function ChrismedHeader() {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-[#f7f4ed]/90 backdrop-blur">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link to="/chrismed" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full border border-amber-300/70 bg-gradient-to-br from-emerald-900 to-emerald-800 text-amber-100 flex items-center justify-center font-serif text-lg shadow-sm">
            C
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg text-emerald-950">CrisMed</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-amber-700/90">Medicina privada · Internacional</div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.to.split('#')[0];
            return (
              <Link
                key={item.to}
                to={item.to.split('#')[0]}
                hash={item.to.includes('#') ? item.to.split('#')[1] : undefined}
                className={cn(
                  'px-3 py-1.5 text-[13px] rounded-md transition-colors',
                  active
                    ? 'text-emerald-950 font-medium bg-emerald-900/5'
                    : 'text-emerald-900/70 hover:text-emerald-950 hover:bg-emerald-900/5',
                )}
              >
                {item.labels[lang]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher lang={lang} />
          <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex text-emerald-900 hover:bg-emerald-900/5">
            <a href="#oliver">{CTA.oliver[lang]}</a>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex bg-emerald-900 hover:bg-emerald-950 text-amber-50">
            <Link to="/chrismed">{CTA.book[lang]}</Link>
          </Button>
          <button
            className="xl:hidden p-2 rounded-md text-emerald-900 hover:bg-emerald-900/5"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-emerald-900/10 bg-[#f7f4ed]">
          <div className="container py-3 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to.split('#')[0]}
                hash={item.to.includes('#') ? item.to.split('#')[1] : undefined}
                onClick={() => setOpen(false)}
                className="px-2 py-2 text-sm text-emerald-900/80 hover:text-emerald-950 rounded-md"
              >
                {item.labels[lang]}
              </Link>
            ))}
            <Button asChild className="mt-2 bg-emerald-900 hover:bg-emerald-950 text-amber-50">
              <Link to="/chrismed">{CTA.book[lang]}</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function ChrismedFooter() {
  const lang = useLang();
  const copy = {
    pt: 'Medicina privada, internacional e humana — com sigilo, precisão e conforto.',
    en: 'Private, international and humane medicine — with discretion, precision and comfort.',
    es: 'Medicina privada, internacional y humana — con discreción, precisión y confort.',
  } as const;
  return (
    <footer className="border-t border-emerald-900/10 bg-[#f7f4ed] mt-20 py-10">
      <div className="container grid gap-6 md:grid-cols-3 text-sm text-emerald-900/80">
        <div>
          <div className="font-serif text-emerald-950 text-lg">CrisMed</div>
          <p className="mt-2 text-emerald-900/70">{copy[lang]}</p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-amber-700/90 mb-2">Atendimento</div>
          <ul className="space-y-1">
            <li><Link to="/chrismed/dra-cristiane" className="hover:text-emerald-950">Dra. Cristiane Alencar</Link></li>
            <li><Link to="/chrismed/internacional" className="hover:text-emerald-950">International patients</Link></li>
            <li><Link to="/chrismed/clinica" className="hover:text-emerald-950">Clínica CrisMed</Link></li>
            <li><Link to="/chrismed/ocupacional" className="hover:text-emerald-950">Medicina ocupacional</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-amber-700/90 mb-2">Contato</div>
          <ul className="space-y-1">
            <li>Copacabana · Rio de Janeiro</li>
            <li>Teleconsulta global · PT · EN · ES</li>
            <li className="text-emerald-900/60">Tecnologia Impulsionando</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function ChrismedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="chrismed-brand min-h-screen bg-[#fbf9f4] text-emerald-950">
      <ChrismedHeader />
      <main>{children}</main>
      <ChrismedFooter />
      <OliverFab />
    </div>
  );
}

export function OliverFab() {
  const lang = useLang();
  const labels = {
    pt: { title: 'Falar com Oliver', sub: 'Agente virtual CrisMed' },
    en: { title: 'Talk to Oliver', sub: 'CrisMed virtual concierge' },
    es: { title: 'Hablar con Oliver', sub: 'Concierge virtual CrisMed' },
  }[lang];
  return (
    <a
      id="oliver"
      href="https://wa.me/5521000000000?text=Ol%C3%A1%20Oliver%2C%20gostaria%20de%20atendimento%20CrisMed"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 group flex items-center gap-3 rounded-full bg-emerald-950 text-amber-50 pl-3 pr-5 py-3 shadow-[0_18px_40px_-12px_rgba(6,42,32,0.6)] hover:bg-emerald-900 transition-all"
    >
      <span className="h-9 w-9 rounded-full bg-amber-300 text-emerald-950 font-serif text-lg flex items-center justify-center">O</span>
      <span className="text-left leading-tight">
        <span className="block text-sm font-medium">{labels.title}</span>
        <span className="block text-[10px] uppercase tracking-wider text-amber-200/80">{labels.sub}</span>
      </span>
    </a>
  );
}
