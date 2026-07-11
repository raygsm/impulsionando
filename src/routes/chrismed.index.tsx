/**
 * /chrismed — Home CHRISMED (Onda V2 · Quiet Luxury)
 *
 * Reposiciona a marca ao redor da Dra. Christiane Alencar como símbolo de
 * atendimento AA, discrição, experiência e continuidade.
 *
 * Guardrails aprovados na Onda V2:
 *  - Só usa primitivos do design system CHRISMED (src/components/chrismed/primitives).
 *  - Nenhum CTA público aponta para WhatsApp. Oliver é o único ponto de conversa.
 *  - Sem preços fixos, sem estatísticas não validadas, sem placeholders visíveis.
 *  - CTA primário sempre → /chrismed/agendar. Secundário → /chrismed/dra-cristiane.
 *  - Retrato da Dra. Christiane só é publicado com src autorizado; caso contrário,
 *    ChrismedPortrait renderiza fallback silencioso.
 *  - Ambulatorial ainda aponta para /chrismed/clinica (rota provisória).
 *
 * Pendências registradas para o Codex / próximas ondas:
 *  - Grafia oficial do nome (Christiane × Christiane) — adotado "Christiane Alencar"
 *    conforme material atual do menu/shell; confirmar no material institucional
 *    antes de publicar em produção.
 *  - Retrato autorizado da Dra. Christiane (asset ainda não existe em src/assets).
 *  - Trajetória, artigos, congressos, cooperações (Seção 5) — só serão exibidos
 *    após validação da fonte oficial. Hoje entregamos versão editorial neutra.
 */
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang, type Lang } from '@/components/chrismed/ChrismedShell';
import {
  ChrismedSection,
  ChrismedHeading,
  ChrismedEyebrow,
  ChrismedButton,
  ChrismedCard,
  ChrismedPortrait,
  ChrismedModalityCard,
  ChrismedOliverLauncher,
  ChrismedTrustBar,
  ChrismedFollowUpCard,
} from '@/components/chrismed/primitives';
import { CHRISMED_DOCTOR } from '@/content/chrismed/identity';
import { DRA_CHRISTIANE_PORTRAIT_SRC } from '@/content/chrismed/portrait';
import { openChrismedOliver } from '@/components/chrismed/oliver-store';

const hasPortrait = Boolean(DRA_CHRISTIANE_PORTRAIT_SRC);


export const Route = createFileRoute('/chrismed/')({
  head: () => ({
    meta: [
      { title: 'CHRISMED — Medicina privada com a Dra. Christiane Alencar' },
      {
        name: 'description',
        content:
          'Atendimento clínico de padrão AA com a Dra. Christiane Alencar: teleconsulta, consulta presencial em Copacabana e visita domiciliar. PT · EN · ES.',
      },
      { property: 'og:title', content: 'CHRISMED — Dra. Christiane Alencar' },
      {
        property: 'og:description',
        content:
          'Medicina privada, contínua e discreta. Teleconsulta, presencial em Copacabana e visita domiciliar.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://chrismed.impulsionando.com.br/chrismed' },
      { property: 'og:site_name', content: 'CHRISMED' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'CHRISMED — Dra. Christiane Alencar' },
      {
        name: 'twitter:description',
        content: 'Medicina privada, contínua e discreta com a Dra. Christiane Alencar.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://chrismed.impulsionando.com.br/chrismed' }],
  }),
  component: ChrismedHomePage,
});

function openOliver() {
  if (typeof window !== 'undefined') {
    openChrismedOliver();
    window.dispatchEvent(new CustomEvent('chrismed:oliver:open'));
  }
}

function ChrismedHomePage() {
  const lang = useLang();
  const t = COPY[lang];
  return (
    <ChrismedShell>
      {/* ─────────── Seção 1 — Hero editorial em verde institucional ─────────── */}
      <ChrismedSection tone="forest" className="relative overflow-hidden pt-24 md:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 85% 15%, rgba(228,181,74,0.18), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(228,181,74,0.08), transparent 60%)',
          }}
        />
        <div className="relative grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-24">
          <div>
            <div className="chrismed-rise mb-10 inline-flex items-center gap-3 border border-[var(--chrismed-amber)]/40 bg-black/10 px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--chrismed-amber)]" />
              <span className="chrismed-sans text-[10px] uppercase tracking-[0.32em] text-[var(--chrismed-amber-soft)]">
                {t.hero.eyebrow}
              </span>
            </div>
            <h1 className="chrismed-rise chrismed-rise-delay-1 chrismed-serif font-light tracking-tight text-[clamp(3rem,7vw,5.75rem)] leading-[0.96] text-[var(--chrismed-amber)]">
              {t.hero.title}
              <br />
              <span className="italic text-white">{t.hero.titleItalic}</span>
            </h1>
            <p className="chrismed-rise chrismed-rise-delay-2 chrismed-sans mt-10 max-w-[42ch] text-lg leading-[1.7] text-white/85 md:text-xl">
              {t.hero.lead}
            </p>

            <div className="chrismed-rise chrismed-rise-delay-3 mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link to="/chrismed/agendar" className="inline-flex">
                <button
                  type="button"
                  className="chrismed-cta-glow chrismed-sans inline-flex items-center gap-3 bg-[var(--chrismed-amber)] px-8 py-4 text-[12px] uppercase tracking-[0.25em] text-[var(--chrismed-forest-deep)] shadow-[0_20px_60px_-20px_rgba(228,181,74,0.55)] transition-all hover:bg-[var(--chrismed-amber-deep)] hover:text-white"
                >
                  {t.hero.ctaPrimary}
                  <span aria-hidden>→</span>
                </button>
              </Link>
              <Link to="/chrismed/dra-cristiane" className="inline-flex">
                <button
                  type="button"
                  className="chrismed-sans inline-flex items-center gap-3 border border-[var(--chrismed-amber)]/50 px-8 py-4 text-[12px] uppercase tracking-[0.25em] text-[var(--chrismed-amber)] transition-colors hover:bg-[var(--chrismed-amber)]/10"
                >
                  {t.hero.ctaSecondary}
                </button>
              </Link>
            </div>

            <button
              type="button"
              onClick={openOliver}
              className="chrismed-sans mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[var(--chrismed-amber-soft)]/80 transition-opacity hover:opacity-100"
            >
              <span aria-hidden>—</span> {t.hero.oliverHint}
            </button>

            <ul className="chrismed-sans mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.28em] text-white/60">
              {t.hero.modes.map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <span className="h-px w-4 bg-[var(--chrismed-amber)]/60" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna do retrato — sempre presente para preservar composição editorial;
              renderiza fallback silencioso quando o asset ainda não foi publicado. */}
          <div className="chrismed-rise chrismed-rise-delay-4 relative">
            <div className="absolute -inset-6 -z-10 border border-[var(--chrismed-amber)]/30" aria-hidden />
            <div className="absolute -top-4 -left-4 h-16 w-16 border-l border-t border-[var(--chrismed-amber)]" aria-hidden />
            <div className="absolute -bottom-4 -right-4 h-16 w-16 border-r border-b border-[var(--chrismed-amber)]" aria-hidden />
            {hasPortrait ? (
              <ChrismedPortrait
                src={DRA_CHRISTIANE_PORTRAIT_SRC}
                ratio="4/5"
                alt={t.hero.portraitAlt}
                eyebrow={t.hero.portraitEyebrow}
                className="w-full"
              />
            ) : (
              <div className="aspect-[4/5] w-full bg-gradient-to-br from-[var(--chrismed-forest-soft)] to-[var(--chrismed-forest-deep)] p-8 ring-1 ring-[var(--chrismed-amber)]/25">
                <div className="flex h-full w-full flex-col justify-between">
                  <div className="chrismed-sans text-[10px] uppercase tracking-[0.32em] text-[var(--chrismed-amber)]/70">
                    {t.hero.portraitEyebrow}
                  </div>
                  <div>
                    <div className="chrismed-serif text-3xl italic text-[var(--chrismed-amber)] md:text-4xl">
                      {CHRISMED_DOCTOR.shortName}
                    </div>
                    <div className="chrismed-sans mt-3 text-[10px] uppercase tracking-[0.3em] text-white/60">
                      {t.hero.portraitRole}
                    </div>
                    <div className="mt-6 h-px w-16 bg-[var(--chrismed-amber)]" />
                    <div className="chrismed-sans mt-3 text-[10px] uppercase tracking-[0.28em] text-white/50">
                      CRM/RJ · 52.58575-0
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 2 — Prova social institucional (números editoriais) ─────────── */}
      <section className="chrismed-page-mustard border-y border-[var(--chrismed-mustard-deep)]/20 py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
            {t.stats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="chrismed-serif text-4xl font-light leading-none text-[var(--chrismed-forest-deep)] md:text-6xl">
                  {s.value}
                  {s.suffix && (
                    <span className="ml-1 text-2xl text-[var(--chrismed-mustard-deep)] md:text-3xl">
                      {s.suffix}
                    </span>
                  )}
                </div>
                <div className="chrismed-sans mt-3 text-[10px] uppercase tracking-[0.32em] text-[var(--chrismed-forest-deep)]/70">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Onda 6 — Prova social institucional discreta ─────────── */}
      <ChrismedSection tone="ivory" className="!py-0">
        <ChrismedTrustBar />
      </ChrismedSection>

      {/* ── Vídeo institucional — slot pronto ─ */}
      <section className="chrismed-page-forest py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-6 text-center">
            <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--chrismed-amber-soft)]">Filme institucional</div>
            <h2 className="chrismed-serif mt-3 text-3xl md:text-5xl text-[var(--chrismed-amber)]">Excelência médica com discrição absoluta</h2>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-[var(--chrismed-amber)]/25 bg-[var(--chrismed-forest-deep)] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.6)]">
            <div className="aspect-video w-full bg-[radial-gradient(ellipse_at_center,rgba(228,181,74,0.10),transparent_60%)]">
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--chrismed-amber)]/15 ring-1 ring-[var(--chrismed-amber)]/40">
                  <span className="chrismed-serif text-2xl text-[var(--chrismed-amber)]">▶</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-white/60">Em preparação</div>
                <p className="max-w-md px-6 text-sm text-white/70">
                  Atendimento personalizado, ambiente elegante, ciência, pesquisa e discrição — em breve nesta composição.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Seção 3 — Modalidades sobre verde institucional ─────────── */}
      <ChrismedSection tone="forest">
        <div className="max-w-2xl">
          <div className="chrismed-sans text-[11px] uppercase tracking-[0.32em] text-[var(--chrismed-amber)]">
            {t.modalities.eyebrow}
          </div>
          <h2 className="chrismed-serif mt-5 text-[clamp(2rem,4.5vw,3.5rem)] font-light leading-[1.05] text-[var(--chrismed-amber)]">
            {t.modalities.title}
          </h2>
          <p className="chrismed-sans mt-6 text-lg leading-relaxed text-white/85">
            {t.modalities.lead}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.modalities.items.map((m, i) => (
            <article
              key={m.title}
              className="chrismed-card-lift group relative flex flex-col border border-[var(--chrismed-amber)]/25 bg-black/10 p-8 hover:border-[var(--chrismed-amber)]/70 hover:bg-black/20"
            >
              <div className="chrismed-serif text-6xl font-light leading-none text-[var(--chrismed-amber)]/50 group-hover:text-[var(--chrismed-amber)]">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="mt-8 chrismed-sans text-[10px] uppercase tracking-[0.32em] text-[var(--chrismed-amber-soft)]/80">
                {m.eyebrow}
              </div>
              <h3 className="chrismed-serif mt-3 text-2xl font-light leading-snug text-white md:text-3xl">
                {m.title}
              </h3>
              <p className="chrismed-sans mt-4 text-sm leading-relaxed text-white/70">
                {m.description}
              </p>
              <Link
                to="/chrismed/agendar"
                className="chrismed-sans mt-8 inline-flex items-center gap-2 self-start border-b border-[var(--chrismed-amber)]/40 pb-1 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-amber)] transition-colors hover:border-[var(--chrismed-amber)]"
              >
                {t.modalities.cta}
                <span aria-hidden>→</span>
              </Link>
            </article>
          ))}
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 4 — Padrão AA (branco de apoio) ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.experience.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.experience.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.experience.lead}
            </p>
            <div className="mt-8 h-px w-24 bg-[var(--chrismed-forest)]" />
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {t.experience.items.map((item, i) => (
              <li key={item.title} className="border-t border-[var(--chrismed-forest)]/20 pt-5">
                <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-forest)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="chrismed-serif mt-3 text-xl font-light text-[var(--chrismed-ink)]">
                  {item.title}
                </h3>
                <p className="chrismed-sans mt-2 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 5 — Três vertentes (verde dominante, alternado) ─────────── */}
      <ChrismedSection tone="forest">
        <div className="max-w-2xl">
          <div className="chrismed-sans text-[11px] uppercase tracking-[0.32em] text-[var(--chrismed-amber)]">
            {t.verticals.eyebrow}
          </div>
          <h2 className="chrismed-serif mt-5 text-[clamp(2rem,4.5vw,3.5rem)] font-light leading-[1.05] text-[var(--chrismed-amber)]">
            {t.verticals.title}
          </h2>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {t.verticals.items.map((v) => (
            <article
              key={v.title}
              className="chrismed-card-lift flex flex-col border border-[var(--chrismed-amber)]/25 bg-[var(--chrismed-forest-deep)]/40 p-8 hover:border-[var(--chrismed-amber)]/70"
            >
              <div className="chrismed-sans text-[11px] uppercase tracking-[0.32em] text-[var(--chrismed-amber)]">
                {v.eyebrow}
              </div>
              <h3 className="chrismed-serif mt-4 text-2xl font-light text-white md:text-3xl">
                {v.title}
              </h3>
              <div className="mt-4 h-px w-12 bg-[var(--chrismed-amber)]" />
              <p className="chrismed-sans mt-5 text-sm leading-relaxed text-white/80">
                {v.context}
              </p>
              <dl className="chrismed-sans mt-6 space-y-4 text-xs text-white/70">
                <div>
                  <dt className="uppercase tracking-[0.25em] text-[var(--chrismed-amber-soft)]/70">
                    {t.verticals.audience}
                  </dt>
                  <dd className="mt-1 text-white/85">{v.audience}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.25em] text-[var(--chrismed-amber-soft)]/70">
                    {t.verticals.benefit}
                  </dt>
                  <dd className="mt-1 text-white/85">{v.benefit}</dd>
                </div>
              </dl>
              <div className="mt-auto pt-8">
                <Link
                  to={v.to}
                  className="chrismed-sans inline-flex items-center gap-2 border-b border-[var(--chrismed-amber)]/40 pb-1 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-amber)] transition-colors hover:border-[var(--chrismed-amber)]"
                >
                  {v.cta}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 6 — GMS · Concierge médico internacional ─────────── */}
      <section className="chrismed-page-mustard relative overflow-hidden py-24 md:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(11,42,36,0.10), transparent 55%), radial-gradient(circle at 5% 95%, rgba(184,137,43,0.14), transparent 55%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-4 md:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <div className="inline-flex items-center gap-3 border-l-2 border-[var(--chrismed-forest-deep)] pl-3">
              <span className="chrismed-sans text-[10px] uppercase tracking-[0.36em] text-[var(--chrismed-mustard-deep)]">
                Global Medical Support
              </span>
            </div>
            <h2 className="chrismed-serif mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-light leading-[0.98] text-[var(--chrismed-forest-deep)]">
              {t.gms.title}
            </h2>
            <p className="chrismed-sans mt-8 max-w-[54ch] text-lg leading-[1.7] text-[var(--chrismed-forest-deep)]/85">
              {t.gms.lead}
            </p>

            <div className="mt-10 flex flex-wrap gap-2">
              {t.gms.languages.map((l) => (
                <span
                  key={l}
                  className="chrismed-sans inline-flex items-center gap-2 border border-[var(--chrismed-forest-deep)]/25 bg-white/50 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[var(--chrismed-forest-deep)] backdrop-blur-sm"
                >
                  <span className="h-1 w-1 rounded-full bg-[var(--chrismed-forest-deep)]" />
                  {l}
                </span>
              ))}
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-[var(--chrismed-forest-deep)]/15 pt-8">
              <div>
                <dt className="chrismed-sans text-[9px] uppercase tracking-[0.3em] text-[var(--chrismed-forest-deep)]/60">Contato</dt>
                <dd className="chrismed-serif mt-2 text-2xl italic text-[var(--chrismed-forest-deep)]">24/7</dd>
              </div>
              <div>
                <dt className="chrismed-sans text-[9px] uppercase tracking-[0.3em] text-[var(--chrismed-forest-deep)]/60">Idiomas</dt>
                <dd className="chrismed-serif mt-2 text-2xl italic text-[var(--chrismed-forest-deep)]">3</dd>
              </div>
              <div>
                <dt className="chrismed-sans text-[9px] uppercase tracking-[0.3em] text-[var(--chrismed-forest-deep)]/60">Sigilo</dt>
                <dd className="chrismed-serif mt-2 text-2xl italic text-[var(--chrismed-forest-deep)]">LGPD</dd>
              </div>
            </dl>

            <div className="mt-12">
              <Link to="/chrismed/internacional" className="inline-flex">
                <button
                  type="button"
                  className="chrismed-cta-glow chrismed-sans inline-flex items-center gap-3 bg-[var(--chrismed-forest-deep)] px-8 py-4 text-[12px] uppercase tracking-[0.25em] text-[var(--chrismed-amber)] shadow-[0_20px_60px_-24px_rgba(11,42,36,0.55)] transition-colors hover:bg-[var(--chrismed-forest)]"
                >
                  {t.gms.cta}
                  <span aria-hidden>→</span>
                </button>
              </Link>
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {t.gms.audience.map((a, i) => (
              <li
                key={a}
                className="chrismed-card-lift group relative border border-[var(--chrismed-forest-deep)]/15 bg-white/60 p-7 backdrop-blur-sm hover:border-[var(--chrismed-forest-deep)]/40"
              >
                <div className="flex items-start justify-between">
                  <div className="chrismed-serif text-4xl font-light leading-none text-[var(--chrismed-mustard-deep)]">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="h-px w-10 translate-y-4 bg-[var(--chrismed-forest-deep)]/30" />
                </div>
                <div className="chrismed-sans mt-6 text-sm leading-[1.6] text-[var(--chrismed-forest-deep)]">
                  {a}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>


      {/* ─────────── Seção 7 — Autoridade da Dra. Christiane ─────────── */}
      <ChrismedSection tone="forest">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-20">
          <div>
            <div className="chrismed-sans text-[11px] uppercase tracking-[0.32em] text-[var(--chrismed-amber)]">
              {t.authority.eyebrow}
            </div>
            <h2 className="chrismed-serif mt-5 text-[clamp(2rem,4.5vw,3.5rem)] font-light leading-[1.05] text-[var(--chrismed-amber)]">
              {t.authority.title}
            </h2>
            <p className="chrismed-sans mt-6 max-w-[52ch] text-lg leading-relaxed text-white/85">
              {t.authority.body}
            </p>
            <div className="mt-10">
              <Link to="/chrismed/dra-cristiane" className="inline-flex">
                <button
                  type="button"
                  className="chrismed-sans inline-flex items-center gap-3 border border-[var(--chrismed-amber)]/50 px-8 py-4 text-[12px] uppercase tracking-[0.25em] text-[var(--chrismed-amber)] transition-colors hover:bg-[var(--chrismed-amber)]/10"
                >
                  {t.authority.cta}
                </button>
              </Link>
            </div>
          </div>
          <div className="border-l-2 border-[var(--chrismed-amber)] pl-8">
            <p className="chrismed-serif text-2xl font-light italic leading-relaxed text-white md:text-3xl">
              “{t.authority.quote}”
            </p>
            <p className="chrismed-sans mt-6 text-[11px] uppercase tracking-[0.28em] text-[var(--chrismed-amber-soft)]/80">
              Dra. Christiane Alencar · CRM/RJ 52.58575-0
            </p>
          </div>
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 8 — Como funciona ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="max-w-2xl">
          <ChrismedEyebrow>{t.flow.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.flow.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-5 text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.flow.lead}
          </p>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-5">
          {t.flow.steps.map((step, i) => (
            <li key={step} className="border-t-2 border-[var(--chrismed-forest)] pt-4">
              <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-forest)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="chrismed-serif mt-3 text-lg font-light leading-snug text-[var(--chrismed-ink)]">
                {step}
              </p>
            </li>
          ))}
        </ol>
        <p className="chrismed-sans mt-10 max-w-[60ch] text-xs leading-relaxed text-[var(--chrismed-mist)]">
          {t.flow.note}
        </p>
      </ChrismedSection>

      {/* ─────────── Seção 9 — Oliver ─────────── */}
      <ChrismedSection tone="forest">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <div className="chrismed-sans text-[11px] uppercase tracking-[0.32em] text-[var(--chrismed-amber)]">
              {t.oliver.eyebrow}
            </div>
            <h2 className="chrismed-serif mt-5 text-[clamp(2rem,4.5vw,3.5rem)] font-light leading-[1.05] text-[var(--chrismed-amber)]">
              {t.oliver.title}
            </h2>
            <p className="chrismed-sans mt-6 text-lg leading-relaxed text-white/85">
              {t.oliver.lead}
            </p>
            <ul className="chrismed-sans mt-8 space-y-3 text-sm text-white/80">
              {t.oliver.bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-[var(--chrismed-amber)]" />
                  {b}
                </li>
              ))}
            </ul>
            <p className="chrismed-sans mt-6 text-xs italic text-white/50">
              {t.oliver.disclaimer}
            </p>
          </div>
          <div className="flex justify-start lg:justify-end">
            <ChrismedOliverLauncher
              lang={lang}
              variant="inline"
              onClick={openOliver}
            />
          </div>
        </div>
      </ChrismedSection>

      {/* ─────────── Escada de relacionamento ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="max-w-2xl">
          <ChrismedEyebrow>Continuidade</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            O cuidado não termina na consulta.
          </ChrismedHeading>
          <p className="chrismed-sans mt-5 text-base leading-relaxed text-[var(--chrismed-graphite)]">
            Cada paciente CHRISMED entra em uma escada de acompanhamento discreta —
            do preparo pré-consulta ao retorno periódico — coordenada pela recepção
            humana e sinalizada pelo Oliver.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <ChrismedFollowUpCard
            eyebrow="Antes"
            title="Preparo enviado com antecedência"
            body="Você recebe orientações práticas — documentos, jejum quando aplicável, tempo de deslocamento — no dia anterior à consulta."
            cta="Agendar consulta"
            to="/chrismed/agendar"
          />
          <ChrismedFollowUpCard
            eyebrow="Durante"
            title="Consulta sem cronômetro"
            body="Blocos com margem para escutar e explicar. Ao final, você sai com plano clínico por escrito e próximos passos combinados."
            cta="Conhecer as modalidades"
            to="/chrismed/especialidades"
          />
          <ChrismedFollowUpCard
            eyebrow="Depois"
            title="Retorno e ajustes"
            body="Se combinado, a recepção lembra o retorno na janela adequada. Renovação de receitas e interpretação de exames por teleconsulta rápida."
            cta="Falar com a recepção"
            to="/chrismed/contato"
          />
        </div>
      </ChrismedSection>

      {/* ─────────── Fechamento ─────────── */}
      <ChrismedSection tone="noir">
        <div className="mx-auto max-w-3xl text-center">
          <ChrismedEyebrow className="text-[var(--chrismed-amber)]">
            {t.close.eyebrow}
          </ChrismedEyebrow>
          <h2 className="chrismed-serif mt-6 text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.02] text-[var(--chrismed-ivory)]">
            {t.close.title}{' '}
            <span className="italic text-[var(--chrismed-amber)]">
              {t.close.titleItalic}
            </span>
          </h2>
          <p className="chrismed-sans mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70">
            {t.close.lead}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/chrismed/agendar" className="inline-flex">
              <button
                type="button"
                className="chrismed-sans inline-flex items-center gap-3 bg-[var(--chrismed-amber)] px-8 py-4 text-[12px] uppercase tracking-[0.25em] text-[var(--chrismed-forest-deep)] transition-colors hover:bg-[var(--chrismed-amber-deep)] hover:text-white"
              >
                {t.close.ctaPrimary}
                <span aria-hidden>→</span>
              </button>
            </Link>
            <button
              type="button"
              onClick={openOliver}
              className="chrismed-sans inline-flex items-center gap-2 border border-[var(--chrismed-amber)]/50 px-8 py-4 text-[12px] uppercase tracking-[0.2em] text-[var(--chrismed-amber)] transition-colors hover:bg-[var(--chrismed-amber)]/10"
            >
              {t.close.ctaSecondary}
            </button>
          </div>
        </div>
      </ChrismedSection>
    </ChrismedShell>
  );
}

/* ═════════════════ Conteúdo trilíngue ═════════════════ */
type Copy = {
  hero: {
    eyebrow: string;
    title: string;
    titleItalic: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    oliverHint: string;
    modes: string[];
    portraitAlt: string;
    portraitEyebrow: string;
    portraitRole: string;
  };
  modalities: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    items: { eyebrow: string; title: string; description: string }[];
  };
  experience: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  stats: { value: string; suffix?: string; label: string }[];
  gms: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    languages: string[];
    audience: string[];
  };
  verticals: {
    eyebrow: string;
    title: string;
    audience: string;
    benefit: string;
    items: {
      eyebrow: string;
      title: string;
      context: string;
      audience: string;
      benefit: string;
      cta: string;
      to: '/chrismed/clinica' | '/chrismed/ocupacional' | '/chrismed/internacional';
    }[];
  };
  authority: { eyebrow: string; title: string; body: string; cta: string; quote: string };
  flow: { eyebrow: string; title: string; lead: string; steps: string[]; note: string };
  oliver: {
    eyebrow: string;
    title: string;
    lead: string;
    bullets: string[];
    disclaimer: string;
  };
  close: {
    eyebrow: string;
    title: string;
    titleItalic: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
};

const COPY: Record<Lang, Copy> = {
  pt: {
    hero: {
      eyebrow: 'CHRISMED · Medicina privada',
      title: 'Cuidado clínico',
      titleItalic: 'que pertence a você.',
      lead: 'Consultas com a Dra. Christiane Alencar em Copacabana, na sua casa ou por vídeo. Tempo dedicado, escuta atenta e continuidade — sem pressa, sem intermediários.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Conhecer a Dra. Christiane',
      oliverHint: 'Falar antes com Oliver',
      modes: ['Teleconsulta', 'Presencial · Copacabana', 'Consulta domiciliar'],
      portraitAlt: 'Retrato editorial da Dra. Christiane Alencar',
      portraitEyebrow: 'Autoridade médica',
      portraitRole: 'Medicina privada · Rio de Janeiro',
    },
    stats: [
      { value: '80.000', suffix: '+', label: 'Pacientes atendidos' },
      { value: '3', suffix: 'décadas', label: 'De prática clínica' },
      { value: '3', suffix: 'idiomas', label: 'PT · EN · ES' },
      { value: '100', suffix: '%', label: 'Discrição · LGPD' },
    ],
    gms: {
      eyebrow: 'GMS · Global Medical Support',
      title: 'Atendimento internacional no Rio de Janeiro.',
      lead: 'Um único ponto de contato clínico para estrangeiros, consulados, diplomatas e famílias internacionais. Coordenação hospitalar, suporte multilíngue e continuidade quando você retorna ao seu país.',
      cta: 'Conhecer o GMS',
      languages: ['Português', 'English', 'Español'],
      audience: [
        'Estrangeiros e expatriados residentes no Rio de Janeiro.',
        'Consulados, embaixadas e famílias diplomáticas.',
        'Executivos internacionais em passagem pelo Brasil.',
        'Continuidade clínica em coordenação com médicos no exterior.',
      ],
    },
    modalities: {
      eyebrow: 'Como deseja ser atendido',
      title: 'Três modalidades pensadas para a sua rotina.',
      lead: 'Cada modalidade preserva o mesmo padrão de escuta, tempo e cuidado. A escolha é sobre onde e como — nunca sobre quanto de atenção você recebe.',
      cta: 'Agendar nesta modalidade',
      items: [
        {
          eyebrow: 'Vídeo',
          title: 'Teleconsulta',
          description:
            'Consulta por vídeo com prescrição digital e prontuário eletrônico. Ideal para acompanhamento contínuo e para pacientes em viagem.',
        },
        {
          eyebrow: 'Copacabana',
          title: 'Presencial em Copacabana',
          description:
            'Consultório reservado, agenda sob horário e recepção discreta. Tempo dedicado antes, durante e depois da consulta.',
        },
        {
          eyebrow: 'Casa · Hotel',
          title: 'Consulta domiciliar',
          description:
            'Atendimento em sua residência, hotel ou escritório, com o mesmo rigor clínico e a privacidade que a sua rotina exige.',
        },
      ],
    },
    experience: {
      eyebrow: 'Padrão AA',
      title: 'O que muda quando o tempo da consulta é seu.',
      lead: 'Padrão AA, na CHRISMED, é uma prática — não um adjetivo. Traduzimos em decisões concretas sobre escuta, continuidade e discrição.',
      items: [
        { title: 'Escuta sem pressa', body: 'Consultas com tempo real para conversar, examinar e explicar. Nada de agenda apertada nem consulta encaixada.' },
        { title: 'Atenção contínua', body: 'A mesma médica acompanha a sua história ao longo do tempo, com prontuário próprio e leitura integrada dos exames.' },
        { title: 'Acompanhamento entre consultas', body: 'Orientação estruturada após o atendimento e canal direto para dúvidas objetivas — sempre pela CHRISMED.' },
        { title: 'Discrição', body: 'Recepção reservada, dados criptografados e conformidade total com a LGPD. Sua privacidade é parte do protocolo.' },
        { title: 'Clareza', body: 'Diagnósticos, condutas e alternativas explicados sem jargão. Você entende cada decisão antes de tomá-la.' },
        { title: 'Continuidade', body: 'Encaminhamentos, exames e interconsultas coordenados pela CHRISMED, com laboratórios e redes hospitalares parceiras.' },
      ],
    },
    verticals: {
      eyebrow: 'Vertentes CHRISMED',
      title: 'Três frentes de atuação, uma única medicina.',
      audience: 'Para quem',
      benefit: 'Benefício',
      items: [
        {
          eyebrow: '01 · Clínica',
          title: 'Medicina Ambulatorial',
          context: 'Consultas privadas, acompanhamento longitudinal e coordenação de exames e interconsultas.',
          audience: 'Pacientes que buscam médica de referência em Copacabana, no Rio de Janeiro ou à distância.',
          benefit: 'Continuidade clínica com uma única médica ao longo do tempo.',
          cta: 'Conhecer a Clínica',
          to: '/chrismed/clinica',
        },
        {
          eyebrow: '02 · Empresas',
          title: 'Medicina Ocupacional',
          context: 'Programas ocupacionais estruturados: PCMSO, ASO, acompanhamento e triagem — com o mesmo padrão clínico das consultas privadas.',
          audience: 'Empresas e famílias que contratam saúde ocupacional discreta e sem terceirização massiva.',
          benefit: 'Conformidade regulatória com atendimento humano, longe da lógica de esteira.',
          cta: 'Ver Medicina Ocupacional',
          to: '/chrismed/ocupacional',
        },
        {
          eyebrow: '03 · Internacional',
          title: 'GMS — Global Medical Support',
          context: 'Atendimento exclusivo a estrangeiros no Rio de Janeiro: assistência multilíngue, coordenação hospitalar e continuidade internacional.',
          audience: 'Estrangeiros, expatriados, consulados e famílias internacionais.',
          benefit: 'Um único ponto de contato clínico em português, inglês e espanhol.',
          cta: 'Ver GMS',
          to: '/chrismed/internacional',
        },
      ],
    },
    authority: {
      eyebrow: 'Sobre a Dra. Christiane',
      title: 'Uma prática construída paciente a paciente.',
      body: 'A Dra. Christiane Alencar dedica sua prática à medicina privada com foco em continuidade, escuta e precisão. A trajetória completa — formação, atuação, cooperações e produção científica — é apresentada em página dedicada, publicada somente com material verificado.',
      cta: 'Ler a página completa',
      quote: 'A medicina que pratico começa antes da consulta e continua depois dela.',
    },
    flow: {
      eyebrow: 'Como funciona',
      title: 'Cinco passos, sem intermediários.',
      lead: 'O fluxo será concluído dentro da própria CHRISMED. Você escolhe a modalidade, seleciona o horário, confirma os dados, realiza o pagamento quando aplicável e recebe a confirmação com instruções.',
      steps: [
        'Escolha a modalidade',
        'Selecione o horário',
        'Confirme os dados',
        'Pague, quando aplicável',
        'Receba confirmação',
      ],
      note: 'O agendamento reúne escolha da modalidade, horário, confirmação e orientações em uma única jornada dentro da CHRISMED.',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'Se preferir, converse antes de agendar.',
      lead: 'Oliver é o concierge digital da CHRISMED. Ele orienta a escolha da modalidade, ajuda no agendamento e responde dúvidas objetivas — em português, inglês ou espanhol.',
      bullets: [
        'Ajuda a escolher entre teleconsulta, presencial e domiciliar.',
        'Orienta o agendamento dentro do fluxo oficial da CHRISMED.',
        'Responde dúvidas administrativas e de acesso.',
        'Quando necessário, oferece WhatsApp dentro da própria janela — sem sair do concierge.',
      ],
      disclaimer: 'Oliver não substitui avaliação médica nem emite conduta clínica.',
    },
    close: {
      eyebrow: 'Próximo passo',
      title: 'Reservar um tempo',
      titleItalic: 'com a Dra. Christiane.',
      lead: 'Consulta privada em Copacabana, na sua casa ou por vídeo. Escolha a modalidade que preserva o seu tempo — o cuidado é o mesmo.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Falar com Oliver',
    },
  },
  en: {
    hero: {
      eyebrow: 'CHRISMED · Private medicine',
      title: 'Clinical care',
      titleItalic: 'that belongs to you.',
      lead: 'Consultations with Dr. Christiane Alencar in Copacabana, at your home, or by video. Dedicated time, attentive listening, and continuity — without haste or intermediaries.',
      ctaPrimary: 'Book a consultation',
      ctaSecondary: 'Meet Dr. Alencar',
      oliverHint: 'Talk to Oliver first',
      modes: ['Telehealth', 'In-person · Copacabana', 'Home visit'],
      portraitAlt: 'Editorial portrait of Dr. Christiane Alencar',
      portraitEyebrow: 'Medical authority',
      portraitRole: 'Private medicine · Rio de Janeiro',
    },
    stats: [
      { value: '80,000', suffix: '+', label: 'Patients seen' },
      { value: '3', suffix: 'decades', label: 'Of clinical practice' },
      { value: '3', suffix: 'languages', label: 'PT · EN · ES' },
      { value: '100', suffix: '%', label: 'Discretion · LGPD' },
    ],
    gms: {
      eyebrow: 'GMS · Global Medical Support',
      title: 'International medical care in Rio de Janeiro.',
      lead: 'A single clinical point of contact for foreigners, consulates, diplomats and international families. Hospital coordination, multilingual support and continuity when you return home.',
      cta: 'Discover GMS',
      languages: ['Português', 'English', 'Español'],
      audience: [
        'Foreigners and expatriates living in Rio de Janeiro.',
        'Consulates, embassies and diplomatic families.',
        'International executives passing through Brazil.',
        'Clinical continuity coordinated with physicians abroad.',
      ],
    },
    modalities: {
      eyebrow: 'How would you like to be seen',
      title: 'Three modalities designed around your routine.',
      lead: 'Each modality holds the same standard of listening, time, and care. The choice is about where and how — never about how much attention you receive.',
      cta: 'Book this modality',
      items: [
        {
          eyebrow: 'Video',
          title: 'Telehealth',
          description:
            'Video consultation with digital prescription and electronic records. Ideal for continuous follow-up and traveling patients.',
        },
        {
          eyebrow: 'Copacabana',
          title: 'In-person, Copacabana',
          description:
            'Private office, scheduled time slots and a discreet reception. Dedicated time before, during and after your visit.',
        },
        {
          eyebrow: 'Home · Hotel',
          title: 'Home visit',
          description:
            'Care at your home, hotel, or office, with the same clinical rigor and the privacy your routine demands.',
        },
      ],
    },
    experience: {
      eyebrow: 'AA standard',
      title: 'What changes when the time is yours.',
      lead: 'At CHRISMED, AA standard is a practice — not an adjective. It translates into concrete decisions around listening, continuity, and discretion.',
      items: [
        { title: 'Unhurried listening', body: 'Real time to talk, examine, and explain. No tight agendas, no squeezed-in visits.' },
        { title: 'Continuous attention', body: 'The same physician follows your history over time, with a proprietary record and integrated reading of your exams.' },
        { title: 'Follow-up between visits', body: 'Structured guidance after each visit and a direct channel for objective questions — always through CHRISMED.' },
        { title: 'Discretion', body: 'Private reception, encrypted data and full LGPD compliance. Your privacy is part of the protocol.' },
        { title: 'Clarity', body: 'Diagnoses, plans and alternatives explained without jargon. You understand every decision before making it.' },
        { title: 'Continuity', body: 'Referrals, exams and interconsultations coordinated by CHRISMED with partner laboratories and hospital networks.' },
      ],
    },
    verticals: {
      eyebrow: 'CHRISMED verticals',
      title: 'Three practices, one medicine.',
      audience: 'For whom',
      benefit: 'Benefit',
      items: [
        {
          eyebrow: '01 · Clinic',
          title: 'Ambulatory Medicine',
          context: 'Private consultations, longitudinal follow-up and coordination of exams and interconsultations.',
          audience: 'Patients seeking a reference physician in Copacabana, Rio de Janeiro or remotely.',
          benefit: 'Clinical continuity with a single physician over time.',
          cta: 'Discover the clinic',
          to: '/chrismed/clinica',
        },
        {
          eyebrow: '02 · Business',
          title: 'Occupational Medicine',
          context: 'Structured occupational programs — PCMSO, ASO, screening and follow-up — held to the same standard as our private consultations.',
          audience: 'Companies and families seeking discreet occupational health without mass outsourcing.',
          benefit: 'Regulatory compliance paired with humane care, far from assembly-line logic.',
          cta: 'See Occupational Medicine',
          to: '/chrismed/ocupacional',
        },
        {
          eyebrow: '03 · International',
          title: 'GMS — Global Medical Support',
          context: 'Exclusive service for foreigners in Rio de Janeiro: multilingual assistance, hospital coordination and international continuity.',
          audience: 'Foreigners, expats, consulates and international families.',
          benefit: 'A single clinical point of contact in Portuguese, English and Spanish.',
          cta: 'See GMS',
          to: '/chrismed/internacional',
        },
      ],
    },
    authority: {
      eyebrow: 'About Dr. Alencar',
      title: 'A practice built patient by patient.',
      body: 'Dr. Christiane Alencar dedicates her practice to private medicine with a focus on continuity, listening and precision. Her full trajectory — training, practice, collaborations and scientific work — is presented on a dedicated page, published only with verified material.',
      cta: 'Read the full page',
      quote: 'The medicine I practice begins before the consultation and continues after it.',
    },
    flow: {
      eyebrow: 'How it works',
      title: 'Five steps, no intermediaries.',
      lead: 'The flow will be completed entirely within CHRISMED. You choose the modality, select a time, confirm your data, pay when applicable and receive the confirmation with instructions.',
      steps: [
        'Choose the modality',
        'Select a time',
        'Confirm your data',
        'Pay, when applicable',
        'Receive confirmation',
      ],
      note: 'Booking brings modality choice, scheduling, confirmation and instructions into a single journey inside CHRISMED.',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'If you prefer, talk before booking.',
      lead: 'Oliver is CHRISMED’s digital concierge. He guides your choice of modality, helps with booking and answers objective questions — in Portuguese, English or Spanish.',
      bullets: [
        'Helps you choose between telehealth, in-person and home visit.',
        'Guides booking inside CHRISMED’s official flow.',
        'Answers administrative and access questions.',
        'When needed, offers WhatsApp inside the same window — never leaving the concierge.',
      ],
      disclaimer: 'Oliver does not replace medical assessment or issue clinical guidance.',
    },
    close: {
      eyebrow: 'Next step',
      title: 'Reserve time',
      titleItalic: 'with Dr. Alencar.',
      lead: 'Private consultation in Copacabana, at your home, or by video. Choose the modality that fits your time — the care is the same.',
      ctaPrimary: 'Book a consultation',
      ctaSecondary: 'Talk to Oliver',
    },
  },
  es: {
    hero: {
      eyebrow: 'CHRISMED · Medicina privada',
      title: 'Un cuidado clínico',
      titleItalic: 'que le pertenece.',
      lead: 'Consultas con la Dra. Christiane Alencar en Copacabana, en su casa o por video. Tiempo dedicado, escucha atenta y continuidad — sin prisa ni intermediarios.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Conocer a la Dra. Alencar',
      oliverHint: 'Hablar antes con Oliver',
      modes: ['Teleconsulta', 'Presencial · Copacabana', 'Visita a domicilio'],
      portraitAlt: 'Retrato editorial de la Dra. Christiane Alencar',
      portraitEyebrow: 'Autoridad médica',
      portraitRole: 'Medicina privada · Río de Janeiro',
    },
    stats: [
      { value: '80.000', suffix: '+', label: 'Pacientes atendidos' },
      { value: '3', suffix: 'décadas', label: 'De práctica clínica' },
      { value: '3', suffix: 'idiomas', label: 'PT · EN · ES' },
      { value: '100', suffix: '%', label: 'Discreción · LGPD' },
    ],
    gms: {
      eyebrow: 'GMS · Global Medical Support',
      title: 'Atención internacional en Río de Janeiro.',
      lead: 'Un único punto de contacto clínico para extranjeros, consulados, diplomáticos y familias internacionales. Coordinación hospitalaria, soporte multilingüe y continuidad cuando regresa a su país.',
      cta: 'Conocer GMS',
      languages: ['Português', 'English', 'Español'],
      audience: [
        'Extranjeros y expatriados residentes en Río de Janeiro.',
        'Consulados, embajadas y familias diplomáticas.',
        'Ejecutivos internacionales en tránsito por Brasil.',
        'Continuidad clínica coordinada con médicos en el exterior.',
      ],
    },
    modalities: {
      eyebrow: 'Cómo desea ser atendido',
      title: 'Tres modalidades pensadas para su rutina.',
      lead: 'Cada modalidad conserva el mismo estándar de escucha, tiempo y cuidado. La elección es sobre dónde y cómo — nunca sobre cuánta atención recibe.',
      cta: 'Agendar en esta modalidad',
      items: [
        {
          eyebrow: 'Video',
          title: 'Teleconsulta',
          description:
            'Consulta por video con receta digital e historia clínica electrónica. Ideal para seguimiento continuo y pacientes en viaje.',
        },
        {
          eyebrow: 'Copacabana',
          title: 'Presencial en Copacabana',
          description:
            'Consultorio reservado, agenda con horario y recepción discreta. Tiempo dedicado antes, durante y después de la consulta.',
        },
        {
          eyebrow: 'Casa · Hotel',
          title: 'Visita a domicilio',
          description:
            'Atención en su residencia, hotel u oficina, con el mismo rigor clínico y la privacidad que su rutina exige.',
        },
      ],
    },
    experience: {
      eyebrow: 'Estándar AA',
      title: 'Lo que cambia cuando el tiempo de la consulta es suyo.',
      lead: 'En CHRISMED, estándar AA es una práctica — no un adjetivo. Se traduce en decisiones concretas sobre escucha, continuidad y discreción.',
      items: [
        { title: 'Escucha sin prisa', body: 'Tiempo real para conversar, examinar y explicar. Sin agenda apretada ni consulta encajada.' },
        { title: 'Atención continua', body: 'La misma médica acompaña su historia a lo largo del tiempo, con historia clínica propia y lectura integrada de los exámenes.' },
        { title: 'Seguimiento entre consultas', body: 'Orientación estructurada después de la consulta y canal directo para dudas objetivas — siempre por CHRISMED.' },
        { title: 'Discreción', body: 'Recepción reservada, datos cifrados y cumplimiento total de la LGPD. Su privacidad es parte del protocolo.' },
        { title: 'Claridad', body: 'Diagnósticos, conductas y alternativas explicados sin jerga. Usted entiende cada decisión antes de tomarla.' },
        { title: 'Continuidad', body: 'Derivaciones, exámenes e interconsultas coordinadas por CHRISMED con laboratorios y redes hospitalarias asociadas.' },
      ],
    },
    verticals: {
      eyebrow: 'Vertientes CHRISMED',
      title: 'Tres frentes, una sola medicina.',
      audience: 'Para quién',
      benefit: 'Beneficio',
      items: [
        {
          eyebrow: '01 · Clínica',
          title: 'Medicina Ambulatoria',
          context: 'Consultas privadas, seguimiento longitudinal y coordinación de exámenes e interconsultas.',
          audience: 'Pacientes que buscan una médica de referencia en Copacabana, en Río de Janeiro o a distancia.',
          benefit: 'Continuidad clínica con una única médica a lo largo del tiempo.',
          cta: 'Conocer la clínica',
          to: '/chrismed/clinica',
        },
        {
          eyebrow: '02 · Empresas',
          title: 'Medicina Ocupacional',
          context: 'Programas ocupacionales estructurados: PCMSO, ASO, seguimiento y triaje — con el mismo estándar clínico de nuestras consultas privadas.',
          audience: 'Empresas y familias que contratan salud ocupacional discreta y sin tercerización masiva.',
          benefit: 'Cumplimiento regulatorio con atención humana, lejos de la lógica de línea de montaje.',
          cta: 'Ver Medicina Ocupacional',
          to: '/chrismed/ocupacional',
        },
        {
          eyebrow: '03 · Internacional',
          title: 'GMS — Global Medical Support',
          context: 'Atención exclusiva a extranjeros en Río de Janeiro: asistencia multilingüe, coordinación hospitalaria y continuidad internacional.',
          audience: 'Extranjeros, expatriados, consulados y familias internacionales.',
          benefit: 'Un único punto de contacto clínico en portugués, inglés y español.',
          cta: 'Ver GMS',
          to: '/chrismed/internacional',
        },
      ],
    },
    authority: {
      eyebrow: 'Sobre la Dra. Alencar',
      title: 'Una práctica construida paciente a paciente.',
      body: 'La Dra. Christiane Alencar dedica su práctica a la medicina privada con foco en continuidad, escucha y precisión. Su trayectoria completa — formación, actuación, cooperaciones y producción científica — se presenta en una página dedicada, publicada solo con material verificado.',
      cta: 'Leer la página completa',
      quote: 'La medicina que practico comienza antes de la consulta y continúa después de ella.',
    },
    flow: {
      eyebrow: 'Cómo funciona',
      title: 'Cinco pasos, sin intermediarios.',
      lead: 'El flujo se concluirá dentro de la propia CHRISMED. Usted elige la modalidad, selecciona el horario, confirma sus datos, paga cuando corresponda y recibe la confirmación con instrucciones.',
      steps: [
        'Elija la modalidad',
        'Seleccione el horario',
        'Confirme los datos',
        'Pague, cuando corresponda',
        'Reciba confirmación',
      ],
      note: 'El agendamiento reúne la elección de modalidad, horario, confirmación e instrucciones en un único recorrido dentro de CHRISMED.',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'Si prefiere, converse antes de agendar.',
      lead: 'Oliver es el concierge digital de CHRISMED. Orienta la elección de la modalidad, ayuda con la agenda y responde dudas objetivas — en portugués, inglés o español.',
      bullets: [
        'Ayuda a elegir entre teleconsulta, presencial y domiciliaria.',
        'Orienta el agendamiento dentro del flujo oficial de CHRISMED.',
        'Responde dudas administrativas y de acceso.',
        'Cuando es necesario, ofrece WhatsApp dentro de la misma ventana — sin salir del concierge.',
      ],
      disclaimer: 'Oliver no sustituye la evaluación médica ni emite conducta clínica.',
    },
    close: {
      eyebrow: 'Próximo paso',
      title: 'Reservar un tiempo',
      titleItalic: 'con la Dra. Alencar.',
      lead: 'Consulta privada en Copacabana, en su casa o por video. Elija la modalidad que preserva su tiempo — el cuidado es el mismo.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Hablar con Oliver',
    },
  },
};
