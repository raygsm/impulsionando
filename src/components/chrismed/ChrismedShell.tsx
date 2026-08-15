import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  CalendarCheck,
  ChevronDown,
  CircleUserRound,
  Globe,
  Menu,
  Phone,
  Stethoscope,
  X,
} from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { isOfficialChrismedHost, toChrismedPublicPathname } from "@/lib/chrismed-clean-paths";
import { cn } from "@/lib/utils";
import { ChrismedOliverProvider } from "./ChrismedOliverProvider";
import { ChrismedPreloader } from "./ChrismedPreloader";
import { openChrismedOliver } from "./oliver-store";

function ChrismedWordmark({ variant = "default" }: { variant?: "default" | "sm" | "header" | "footer" }) {
  const height = variant === "sm" ? "h-8 md:h-9" : variant === "header" ? "h-10 md:h-11 xl:h-12" : variant === "footer" ? "h-12 md:h-14" : "h-10 md:h-12";
  return <img src="/brand/chrismed/logo-horizontal.webp" alt="CHRISMED" className={cn("w-auto max-w-full object-contain select-none", height)} draggable={false} />;
}

export type Lang = "pt" | "en" | "es";

type NavLeaf = { to: string; labels: Record<Lang, string>; desc?: Record<Lang, string>; setLang?: Lang };
type NavGroup = { key: string; labels: Record<Lang, string>; eyebrow?: Record<Lang, string>; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;
const isGroup = (item: NavItem): item is NavGroup => "children" in item;

const NAV: NavItem[] = [
  { to: "/chrismed", labels: { pt: "Dra. Christiane", en: "Dr. Christiane", es: "Dra. Christiane" } },
  {
    key: "atendimento",
    labels: { pt: "Atendimento", en: "Care", es: "Atención" },
    eyebrow: { pt: "Medicina Ambulatorial", en: "Ambulatory Medicine", es: "Medicina Ambulatoria" },
    children: [
      { to: "/chrismed/teleconsulta", labels: { pt: "Teleconsulta", en: "Telehealth", es: "Teleconsulta" }, desc: { pt: "Consulta médica por vídeo, onde você estiver.", en: "Medical consultation by video, wherever you are.", es: "Consulta médica por video, donde usted esté." } },
      { to: "/chrismed/consultorio", labels: { pt: "Presencial · Copacabana", en: "In-office · Copacabana", es: "Presencial · Copacabana" }, desc: { pt: "Atendimento reservado, com hora marcada.", en: "Private, scheduled in-office care.", es: "Atención reservada, con cita previa." } },
      { to: "/chrismed/domiciliar", labels: { pt: "Consulta domiciliar", en: "Home visit", es: "Consulta a domicilio" }, desc: { pt: "Cuidado médico no local previamente combinado.", en: "Medical care at the previously agreed location.", es: "Atención médica en el lugar previamente acordado." } },
      { to: "/chrismed/especialidades", labels: { pt: "Especialidades", en: "Specialties", es: "Especialidades" }, desc: { pt: "Gastroenterologia, Hepatologia e Clínica Médica.", en: "Gastroenterology, Hepatology and Internal Medicine.", es: "Gastroenterología, Hepatología y Clínica Médica." } },
      { to: "/chrismed/exames", labels: { pt: "Exames e preparo", en: "Exams and preparation", es: "Exámenes y preparación" }, desc: { pt: "Orientações organizadas para seus exames.", en: "Organized preparation guidance for your exams.", es: "Orientaciones organizadas para sus exámenes." } },
    ],
  },
  {
    key: "corporativo",
    labels: { pt: "Empresas", en: "Companies", es: "Empresas" },
    eyebrow: { pt: "Saúde Corporativa", en: "Corporate Health", es: "Salud Corporativa" },
    children: [
      { to: "/chrismed/ocupacional", labels: { pt: "Medicina Ocupacional", en: "Occupational Medicine", es: "Medicina Ocupacional" }, desc: { pt: "ASO, gestão de colaboradores, encaminhamentos e exames complementares.", en: "Occupational exams, employee management, referrals and complementary tests.", es: "ASO, gestión de empleados, derivaciones y exámenes complementarios." } },
      { to: "/chrismed/eventos", labels: { pt: "Eventos CHRISMED", en: "CHRISMED Events", es: "Eventos CHRISMED" }, desc: { pt: "Organização, inscrições, credenciais e operação de eventos em saúde.", en: "Health event organization, registration, credentials and operations.", es: "Organización, inscripción, credenciales y operación de eventos de salud." } },
    ],
  },
  {
    key: "gms",
    labels: { pt: "GMS Internacional", en: "GMS International", es: "GMS Internacional" },
    eyebrow: { pt: "Global Medical Support", en: "Global Medical Support", es: "Global Medical Support" },
    children: [
      { to: "/chrismed/internacional", labels: { pt: "Português · Brasil", en: "Portuguese · Brazil", es: "Portugués · Brasil" }, desc: { pt: "Suporte médico internacional em português.", en: "International medical support in Portuguese.", es: "Soporte médico internacional en portugués." }, setLang: "pt" },
      { to: "/chrismed/internacional", labels: { pt: "English", en: "English", es: "English" }, desc: { pt: "Medical support in English.", en: "Medical support in English.", es: "Medical support in English." }, setLang: "en" },
      { to: "/chrismed/internacional", labels: { pt: "Español", en: "Español", es: "Español" }, desc: { pt: "Atención médica en español.", en: "Atención médica en español.", es: "Atención médica en español." }, setLang: "es" },
    ],
  },
  { to: "/chrismed/contato", labels: { pt: "Contato", en: "Contact", es: "Contacto" } },
];

const ChrismedShellContext = createContext(false);

function ChrismedCleanLinkBridge() {
  useEffect(() => {
    if (!isOfficialChrismedHost(window.location.hostname)) return;
    const cleanLinks = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href^="/chrismed"]').forEach((anchor) => {
        const url = new URL(anchor.href, window.location.origin);
        const pathname = toChrismedPublicPathname(window.location.hostname, url.pathname);
        if (pathname !== url.pathname) anchor.setAttribute("href", `${pathname}${url.search}${url.hash}`);
      });
    };
    cleanLinks();
    const observer = new MutationObserver(cleanLinks);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
    return () => observer.disconnect();
  }, []);
  return null;
}

export function useLang(): Lang {
  const search = useRouterState({ select: (state) => state.location.search as Record<string, unknown> });
  const raw = (search?.lang as string | undefined) ?? "pt";
  return (["pt", "en", "es"].includes(raw) ? raw : "pt") as Lang;
}

function LangSwitcher({ lang }: { lang: Lang }) {
  const navigate = useNavigate();
  const pick = (nextLang: Lang) => navigate({ to: ".", search: (prev: Record<string, unknown>) => ({ ...prev, lang: nextLang }) as never });
  return (
    <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
      <Globe className="mr-1 h-3.5 w-3.5" aria-hidden />
      {(["pt", "en", "es"] as Lang[]).map((item) => (
        <button key={item} type="button" onClick={() => pick(item)} className={cn("px-1.5 py-1 transition-colors", lang === item ? "font-bold text-[var(--chrismed-amber-soft)]" : "hover:text-white")} aria-pressed={lang === item}>{item}</button>
      ))}
    </div>
  );
}

function DesktopDropdown({ group, lang, pathname }: { group: NavGroup; lang: Lang; pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = group.children.some((child) => pathname === child.to || pathname.startsWith(`${child.to}/`));
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className={cn("group inline-flex h-[5.4rem] items-center gap-1.5 border-b-2 border-transparent px-3 text-[12px] font-medium tracking-[0.02em] text-white/88 transition-all hover:text-white 2xl:px-4 2xl:text-[13px]", active && "border-[var(--chrismed-amber)] text-white")}>
        {group.labels[lang]}
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute left-1/2 top-full z-[100] w-[31rem] -translate-x-1/2 pt-3">
          <div className="overflow-hidden rounded-[1.35rem] border border-[#d9d3c4] bg-[#fbfaf6] shadow-[0_24px_70px_rgba(4,22,18,0.22)]">
            <div className="border-b border-[#e4dfd3] bg-[#f5f1e7] px-6 py-4">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.28em] text-[var(--chrismed-forest)]">{group.eyebrow?.[lang]}</span>
              <span className="chrismed-serif mt-1 block text-[1.35rem] text-[var(--chrismed-forest-deep)]">{group.labels[lang]}</span>
            </div>
            <div className="grid gap-px bg-[#e4dfd3] sm:grid-cols-2">
              {group.children.map((leaf) => (
                <Link key={`${group.key}-${leaf.to}-${leaf.labels.pt}`} to={leaf.to} search={leaf.setLang ? ((prev: Record<string, unknown>) => ({ ...prev, lang: leaf.setLang }) as never) : undefined} role="menuitem" onClick={() => setOpen(false)} className="group bg-white px-6 py-5 transition-colors hover:bg-[#f7f4ec]">
                  <strong className="block text-[13px] font-semibold text-[var(--chrismed-forest-deep)] transition-colors group-hover:text-[var(--chrismed-forest)]">{leaf.labels[lang]}</strong>
                  {leaf.desc && <span className="mt-2 block text-[12px] leading-[1.55] text-[var(--chrismed-graphite)]">{leaf.desc[lang]}</span>}
                  <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--chrismed-forest)] opacity-0 transition-opacity group-hover:opacity-100">Acessar →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopLeaf({ leaf, lang, pathname }: { leaf: NavLeaf; lang: Lang; pathname: string }) {
  const active = pathname === leaf.to || pathname.startsWith(`${leaf.to}/`);
  return <Link to={leaf.to} className={cn("inline-flex h-[5.4rem] items-center border-b-2 border-transparent px-3 text-[12px] font-medium tracking-[0.02em] text-white/88 transition-colors hover:text-white 2xl:px-4 2xl:text-[13px]", active && "border-[var(--chrismed-amber)] text-white")}>{leaf.labels[lang]}</Link>;
}

export function ChrismedHeader({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => setOpen(false), [pathname]);

  if (variant === "minimal") {
    return (
      <header data-chrismed-header className="chrismed-fixed-header fixed inset-x-0 top-0 z-[80] border-b border-white/10 bg-[var(--chrismed-forest-deep)] shadow-[0_12px_34px_rgba(7,28,24,0.18)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link to="/chrismed" aria-label="CHRISMED — voltar ao início"><div className="rounded-lg bg-white px-3 py-2"><ChrismedWordmark variant="sm" /></div></Link>
          <Link to="/chrismed/contato" className="inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white"><Phone className="h-4 w-4" aria-hidden /> Ajuda</Link>
        </div>
      </header>
    );
  }

  return (
    <header data-chrismed-header className="chrismed-fixed-header fixed inset-x-0 top-0 z-[80] border-b border-white/10 bg-[var(--chrismed-forest-deep)] shadow-[0_16px_42px_rgba(5,28,22,0.18)]">
      <div className="mx-auto flex min-h-[5.4rem] max-w-[96rem] items-stretch px-4 md:px-6">
        <Link to="/chrismed" className="flex shrink-0 items-center pr-6 xl:border-r xl:border-white/10" aria-label="CHRISMED — Dra. Christiane Alencar">
          <div className="rounded-lg bg-white px-3 py-2 shadow-[0_4px_18px_rgba(0,0,0,0.10)]"><ChrismedWordmark variant="header" /></div>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-stretch pl-3 xl:flex" aria-label="Navegação principal CHRISMED">
          {NAV.map((item) => isGroup(item) ? <DesktopDropdown key={item.key} group={item} lang={lang} pathname={pathname} /> : <DesktopLeaf key={item.to} leaf={item} lang={lang} pathname={pathname} />)}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-3 border-l border-white/10 pl-5 xl:flex">
          <div className="flex items-center gap-1.5">
            <a href="/auth?persona=patient&next=%2Fchrismed%2Fminha-conta" className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-3.5 text-[11px] font-semibold text-white/88 transition-all hover:border-white/30 hover:bg-white/7 hover:text-white 2xl:px-4 2xl:text-xs"><CircleUserRound className="h-4 w-4 text-[var(--chrismed-amber)]" aria-hidden /> Área do Paciente</a>
            <a href="/auth?persona=professional&next=%2Fchrismed%2Fagenda%2Fprofissional" className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-3.5 text-[11px] font-semibold text-white/88 transition-all hover:border-white/30 hover:bg-white/7 hover:text-white 2xl:px-4 2xl:text-xs"><Stethoscope className="h-4 w-4 text-[var(--chrismed-amber)]" aria-hidden /> Área Profissional</a>
          </div>
          <Link to="/chrismed/agendar" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--chrismed-amber)] px-5 text-[12px] font-extrabold text-[var(--chrismed-forest-deep)] shadow-[0_7px_22px_rgba(214,168,64,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(214,168,64,0.30)]"><CalendarCheck className="h-4 w-4" aria-hidden /> Agendar</Link>
          <LangSwitcher lang={lang} />
        </div>

        <div className="ml-auto flex items-center gap-2 xl:hidden">
          <Link to="/chrismed/agendar" className="hidden min-h-10 items-center gap-2 rounded-full bg-[var(--chrismed-amber)] px-4 text-sm font-bold text-[var(--chrismed-forest-deep)] sm:inline-flex"><CalendarCheck className="h-4 w-4" aria-hidden /> Agendar</Link>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/10" aria-label="Abrir menu" aria-expanded={open} aria-controls="chrismed-mobile-drawer"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
      {open && <MobileDrawer lang={lang} pathname={pathname} onClose={() => setOpen(false)} />}
    </header>
  );
}

function MobileSection({ group, lang, pathname, onClose }: { group: NavGroup; lang: Lang; pathname: string; onClose: () => void }) {
  const active = group.children.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  const [open, setOpen] = useState(active);
  return (
    <section className="border-b border-white/10 py-1">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between px-1 py-4 text-left text-[14px] font-medium text-white" aria-expanded={open}>
        <span><span className="block text-[9px] uppercase tracking-[0.22em] text-[var(--chrismed-amber-soft)]/75">{group.eyebrow?.[lang]}</span><span className="mt-1 block">{group.labels[lang]}</span></span>
        <ChevronDown className={cn("h-4 w-4 opacity-60 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && <div className="space-y-1 pb-3">{group.children.map((leaf) => <Link key={`${group.key}-${leaf.to}-${leaf.labels.pt}`} to={leaf.to} search={leaf.setLang ? ((prev: Record<string, unknown>) => ({ ...prev, lang: leaf.setLang }) as never) : undefined} onClick={onClose} className="block rounded-lg bg-white/[0.04] px-4 py-3 text-[13px] text-white/82 hover:bg-white/10 hover:text-white"><strong className="block font-medium">{leaf.labels[lang]}</strong>{leaf.desc && <span className="mt-1 block text-[11px] leading-relaxed text-white/55">{leaf.desc[lang]}</span>}</Link>)}</div>}
    </section>
  );
}

function MobileDrawer({ lang, pathname, onClose }: { lang: Lang; pathname: string; onClose: () => void }) {
  return (
    <div id="chrismed-mobile-drawer" className="fixed inset-0 z-[90] xl:hidden" role="dialog" aria-modal="true" aria-label="Menu CHRISMED">
      <button type="button" aria-label="Fechar menu" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <aside className="absolute inset-y-0 right-0 flex h-dvh w-[min(100vw,25rem)] flex-col bg-[var(--chrismed-forest-deep)] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="rounded-lg bg-white px-3 py-2"><ChrismedWordmark variant="sm" /></div><button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 hover:bg-white/10" aria-label="Fechar menu"><X className="h-5 w-5" /></button></div>
        <nav className="flex-1 overflow-y-auto px-5 py-3" aria-label="Menu principal">{NAV.map((item) => isGroup(item) ? <MobileSection key={item.key} group={item} lang={lang} pathname={pathname} onClose={onClose} /> : <Link key={item.to} to={item.to} onClick={onClose} className={cn("block border-b border-white/10 py-4 text-[14px] font-medium text-white/88", pathname === item.to && "text-[var(--chrismed-amber-soft)]")}>{item.labels[lang]}</Link>)}</nav>
        <div className="space-y-2 border-t border-white/10 bg-black/10 p-4">
          <a href="/auth?persona=patient&next=%2Fchrismed%2Fminha-conta" onClick={onClose} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 px-4 text-sm font-semibold text-white"><CircleUserRound className="h-4 w-4 text-[var(--chrismed-amber)]" /> Área do Paciente</a>
          <a href="/auth?persona=professional&next=%2Fchrismed%2Fagenda%2Fprofissional" onClick={onClose} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 px-4 text-sm font-semibold text-white"><Stethoscope className="h-4 w-4 text-[var(--chrismed-amber)]" /> Área do Profissional da Saúde</a>
          <Link to="/chrismed/ocupacional" onClick={onClose} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 px-4 text-sm font-semibold text-white"><Building2 className="h-4 w-4 text-[var(--chrismed-amber)]" /> Área da Empresa</Link>
          <Link to="/chrismed/agendar" onClick={onClose} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--chrismed-amber)] px-4 text-sm font-extrabold text-[var(--chrismed-forest-deep)]"><CalendarCheck className="h-4 w-4" /> Agendar atendimento</Link>
          <div className="flex justify-center pt-2"><LangSwitcher lang={lang} /></div>
        </div>
      </aside>
    </div>
  );
}

const FOOTER_LINKS = [
  { label: "Dra. Christiane Alencar", to: "/chrismed/dra-cristiane" },
  { label: "Teleconsulta", to: "/chrismed/teleconsulta" },
  { label: "Presencial · Copacabana", to: "/chrismed/consultorio" },
  { label: "Consulta domiciliar", to: "/chrismed/domiciliar" },
  { label: "GMS Internacional", to: "/chrismed/internacional" },
];
const FOOTER_LINKS_2 = [
  { label: "Especialidades", to: "/chrismed/especialidades" },
  { label: "Exames e preparo", to: "/chrismed/exames" },
  { label: "Eventos", to: "/chrismed/eventos" },
  { label: "Medicina Ocupacional", to: "/chrismed/ocupacional" },
  { label: "Área do Paciente", to: "/auth?persona=patient&next=%2Fchrismed%2Fminha-conta" },
  { label: "Área dos Profissionais da Saúde", to: "/auth?persona=professional&next=%2Fchrismed%2Fagenda%2Fprofissional" },
  { label: "Perguntas frequentes", to: "/chrismed/faq" },
  { label: "Termos de uso", to: "/chrismed/termos" },
];

export function ChrismedFooter() {
  const lang = useLang();
  const copy = { pt: "Medicina privada, internacional e humana — com sigilo, precisão e conforto.", en: "Private, international and humane medicine — with discretion, precision and comfort.", es: "Medicina privada, internacional y humana — con discreción, precisión y confort." } as const;
  return (
    <footer className="chrismed-band-forest mt-24 bg-[var(--chrismed-forest-deep)]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div><div className="inline-flex rounded-xl bg-white p-3 shadow-sm"><ChrismedWordmark variant="footer" /></div><p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/75">{copy[lang]}</p><div className="mt-6 space-y-1 text-[11px] uppercase tracking-[0.22em] text-white/60"><div className="text-[var(--chrismed-amber-soft)]">Diretora Técnica</div><div className="normal-case tracking-normal text-white/90">Dra. Christiane Soares Alencar</div><div>CRM/RJ 52.58575-0 · Registro ativo</div><div>LGPD · Dados protegidos</div></div></div>
          <FooterCol title="Atendimento" links={FOOTER_LINKS} />
          <FooterCol title="Ecossistema" links={FOOTER_LINKS_2} />
          <div><div className="mb-3 text-[11px] uppercase tracking-[0.28em] text-white/50">Contato</div><ul className="space-y-2 text-[14px] text-white/80"><li>Copacabana · Rio de Janeiro</li><li>PT · EN · ES</li><li><Link to="/chrismed/contato" className="hover:text-[var(--chrismed-amber)]">Fale conosco</Link></li><li><Link to="/chrismed/privacidade" className="hover:text-[var(--chrismed-amber)]">Privacidade · LGPD</Link></li><li><Link to="/chrismed/termos" className="hover:text-[var(--chrismed-amber)]">Termos · Contratação</Link></li></ul></div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-6 text-center text-[11px] uppercase tracking-[0.18em] text-white/45"><span>© {new Date().getFullYear()} CHRISMED · Todos os direitos reservados</span><span>Produzido e gerenciado por <a href="https://impulsionando.com.br" target="_blank" rel="noreferrer" className="text-[var(--chrismed-amber)] transition-colors hover:text-white">Impulsionando Tecnologia</a></span></div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  return <div><div className="mb-3 text-[11px] uppercase tracking-[0.28em] text-white/50">{title}</div><ul className="space-y-2 text-[14px] text-white/80">{links.map((link) => <li key={`${link.to}-${link.label}`}><a href={link.to} className="hover:text-[var(--chrismed-amber)]">{link.label}</a></li>)}</ul></div>;
}

export function ChrismedShell({ children, variant = "full" }: { children: React.ReactNode; variant?: "full" | "minimal" }) {
  const insideChrismedShell = useContext(ChrismedShellContext);
  if (insideChrismedShell) return <>{children}</>;
  return (
    <ChrismedShellContext.Provider value><ChrismedCleanLinkBridge /><div data-tenant="chrismed" className="chrismed-brand min-h-dvh bg-[var(--chrismed-forest-deep)] text-[var(--chrismed-ivory)]"><a href="#chrismed-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded focus:bg-[var(--chrismed-forest)] focus:px-4 focus:py-2 focus:text-white">Pular para o conteúdo principal</a><ChrismedOliverProvider><ChrismedPreloader /><ChrismedHeader variant={variant} /><main id="chrismed-main" className="mx-auto w-full max-w-7xl pb-28 pt-[5.4rem] md:pb-24">{children}</main>{variant === "full" && <ChrismedFooter />}<OliverFab /></ChrismedOliverProvider></div></ChrismedShellContext.Provider>
  );
}

export function OliverFab() {
  const lang = useLang();
  const labels = { pt: { title: "Falar com Oliver", sub: "Concierge CHRISMED" }, en: { title: "Talk to Oliver", sub: "CHRISMED concierge" }, es: { title: "Hablar con Oliver", sub: "Concierge CHRISMED" } }[lang];
  return <button type="button" id="oliver" data-oliver-launcher data-chrismed-oliver-fixed-launcher aria-label={labels.title} aria-haspopup="dialog" onClick={() => { openChrismedOliver(); try { window.dispatchEvent(new CustomEvent("chrismed:oliver:open", { detail: { lang } })); } catch {} }} style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)", right: "calc(env(safe-area-inset-right, 0px) + 1rem)" }} className="fixed z-40 flex items-center gap-3 rounded-full bg-[var(--chrismed-forest-deep)] py-3 pl-3 pr-3 text-white shadow-[var(--chrismed-shadow-lg)] transition-all hover:bg-[var(--chrismed-forest)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-amber)] min-[380px]:pr-5"><span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--chrismed-amber)] chrismed-serif text-lg text-[var(--chrismed-forest-deep)]">O</span><span className="hidden text-left leading-tight min-[380px]:block"><span className="block text-sm font-medium">{labels.title}</span><span className="block text-[10px] uppercase tracking-wider text-[var(--chrismed-amber-soft)]">{labels.sub}</span></span></button>;
}
