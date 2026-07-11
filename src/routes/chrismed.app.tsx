/**
 * /chrismed/app — página institucional do aplicativo CHRISMED.
 * Enquanto não existirem URLs oficiais de App Store / Google Play, os
 * botões aparecem como "Em breve" e o CTA principal é cadastrar interesse
 * via marketing_leads (pipeline já ativo). Nenhuma URL de loja é inventada.
 */
import { createFileRoute } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Smartphone, Bell, Calendar, ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/chrismed/app')({
  head: () => ({
    meta: [
      { title: 'Baixar o App CHRISMED — Em breve' },
      { name: 'description', content: 'O aplicativo da CHRISMED chega em breve com agenda, prontuário e canal direto com a Dra. Christiane Alencar. Cadastre seu interesse.' },
      { property: 'og:title', content: 'App CHRISMED · Em breve' },
      { property: 'og:description', content: 'Cadastre seu interesse no aplicativo da CHRISMED.' },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !contato) { toast.error('Informe nome e contato.'); return; }
    setSending(true);
    try {
      const { error } = await supabase.from('marketing_leads').insert({
        source: 'chrismed_app_waitlist',
        name: nome,
        phone: contato.includes('@') ? null : contato,
        email: contato.includes('@') ? contato : null,
        message: 'Interesse no lançamento do App CHRISMED',
        answers: { origem: 'chrismed_app' },
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });
      if (error) throw error;
      toast.success('Perfeito. Avisaremos assim que o app for publicado.');
      setNome(''); setContato('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível registrar agora.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ChrismedShell>
      <div className="chrismed-page-forest">
        <section className="mx-auto max-w-4xl px-4 py-20 md:px-6 md:py-28 text-center">
          <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--chrismed-amber)]/15 text-[var(--chrismed-amber)]">
            <Smartphone className="h-7 w-7" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.32em] text-[var(--chrismed-amber-soft)]">Aplicativo CHRISMED</span>
          <h1 className="chrismed-serif mt-4 text-4xl md:text-6xl leading-[1.05]">Baixar o App · Em breve</h1>
          <p className="chrismed-lede mx-auto mt-6 max-w-2xl text-lg">
            Um canal privado com a Dra. Christiane Alencar: agenda inteligente, lembretes,
            histórico, prescrições e o Concierge Oliver — tudo no seu bolso.
          </p>

          {/* Selos de loja em estado "Em breve" — visualmente refinados,
              não-interativos, sem URL inventada. Substituir por links reais
              quando App Store / Google Play publicarem o app. */}
          <div className="mx-auto mt-10 grid max-w-md gap-3 sm:grid-cols-2">
            {[
              { store: 'App Store', hint: 'iPhone · iPad' },
              { store: 'Google Play', hint: 'Android' },
            ].map(({ store, hint }) => (
              <div
                key={store}
                aria-disabled="true"
                className="group relative overflow-hidden rounded-2xl border border-[var(--chrismed-amber)]/30 bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-5 py-4 text-left"
              >
                <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--chrismed-amber-soft)]/80">Em breve</div>
                <div className="chrismed-serif mt-1 text-lg text-white">{store}</div>
                <div className="text-[11px] text-white/50">{hint}</div>
                <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[var(--chrismed-amber)]/10 blur-xl" />
              </div>
            ))}
          </div>

          {/* Bloco pré-lançamento — sem QR fake. Composição editorial
              com selo lacrado que substitui o QR até o app ir ao ar. */}
          <div className="mx-auto mt-10 flex max-w-md items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-5 text-left">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--chrismed-forest)] ring-1 ring-[var(--chrismed-amber)]/40">
              <span className="chrismed-serif text-2xl text-[var(--chrismed-amber)]">C</span>
              <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--chrismed-amber)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest text-[var(--chrismed-forest-deep)]">Beta</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--chrismed-amber-soft)]/80">Programa fechado</div>
              <div className="chrismed-serif text-base text-white">Pré-lançamento CHRISMED</div>
              <p className="mt-1 text-[12px] leading-relaxed text-white/70">Assim que o app entrar em loja, quem estiver na lista recebe o acesso antes.</p>
            </div>
          </div>

        </section>

        <section className="mx-auto max-w-4xl px-4 pb-20 md:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Calendar, title: 'Agenda em tempo real', desc: 'Reserve, remarque e receba lembretes sem esperar retorno humano.' },
              { icon: Bell, title: 'Lembretes discretos', desc: 'Notificações silenciosas e privadas — nada exposto na tela de bloqueio.' },
              { icon: ShieldCheck, title: 'LGPD desde o desenho', desc: 'Prontuário criptografado, acesso por biometria e trilha de auditoria.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-white/5 p-6 text-left">
                <Icon className="h-5 w-5 text-[var(--chrismed-amber)]" />
                <h3 className="chrismed-serif mt-3 text-lg text-[var(--chrismed-amber)]">{title}</h3>
                <p className="mt-2 text-sm text-white/75">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Waitlist */}
        <section className="mx-auto max-w-2xl px-4 pb-24 md:px-6">
          <form onSubmit={submit} className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur md:p-8">
            <h2 className="chrismed-serif text-2xl">Quero ser avisado no lançamento</h2>
            <p className="mt-2 text-sm text-white/70">Cadastre-se abaixo. Não usamos seus dados para nada além disso.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-[var(--chrismed-amber)] focus:outline-none"
              />
              <input
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="E-mail ou WhatsApp"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-[var(--chrismed-amber)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="chrismed-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60"
            >
              <span className="chrismed-cta-lead">{sending ? 'Registrando…' : 'Avisem-me no lançamento'}</span>
            </button>
            <p className="mt-3 text-center text-[11px] text-white/50">
              Conformidade LGPD · seus dados só serão usados para comunicar o lançamento do app.
            </p>
          </form>
        </section>
      </div>
    </ChrismedShell>
  );
}
