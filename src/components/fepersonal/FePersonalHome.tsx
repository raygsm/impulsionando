import { Activity, ArrowRight, CalendarDays, HeartPulse, LockKeyhole, Play, ShieldCheck, Sparkles, TrendingUp, Video } from 'lucide-react';

const pillars = [
  { icon: Activity, title: 'Método individual', text: 'Objetivos, rotina, experiência, disponibilidade e evolução orientam uma jornada realmente pessoal.' },
  { icon: HeartPulse, title: 'Ciência do movimento', text: 'Treino com atenção à qualidade do movimento, progressão, percepção de esforço, consistência e contexto do aluno.' },
  { icon: ShieldCheck, title: 'Privacidade real', text: 'Experiência concebida para clientes que valorizam discrição, segurança e relacionamento individual.' },
];

const privateFeatures = [
  ['Seu treino', 'Programa individual e orientação organizada para a sua rotina.'],
  ['Fernanda Live', 'Teleatendimento privado diretamente pela sua área exclusiva.'],
  ['Fernanda Video', 'Conteúdo on-demand protegido, organizado e disponível onde você estiver.'],
  ['Sua evolução', 'Histórico, aderência, avaliações e progresso em um único ambiente.'],
];

export function FePersonalHome() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#15231f] selection:bg-[#b9d4c7]">
      <header className="sticky top-0 z-40 border-b border-[#173b31]/10 bg-[#f4f1ea]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <a href="/fepersonal" className="leading-none" aria-label="Fernanda Personal">
            <span className="block text-xl font-semibold tracking-[0.16em]">FERNANDA</span>
            <span className="mt-1 block text-[10px] font-medium tracking-[0.42em] text-[#57746a]">PERSONAL · PRIVATE PERFORMANCE</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#metodo" className="hover:opacity-60">Método</a>
            <a href="#experiencia" className="hover:opacity-60">Experiência</a>
            <a href="#private" className="hover:opacity-60">Área exclusiva</a>
          </nav>
          <a href="/auth" className="rounded-full border border-[#173b31] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#173b31] hover:text-white">Área do aluno</a>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-28">
        <div className="pointer-events-none absolute -right-32 top-10 h-[520px] w-[520px] rounded-full border border-[#3f6d5d]/15" />
        <div className="pointer-events-none absolute -right-12 top-32 h-[360px] w-[360px] rounded-full border border-[#3f6d5d]/20" />
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#173b31]/15 bg-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#49685e]">
              <Sparkles size={14} /> Personal · Saúde · Performance
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-0.045em] sm:text-6xl lg:text-8xl">
              Seu corpo não segue uma fórmula.
              <span className="mt-3 block font-light italic text-[#54786b]">Seu treino também não deveria.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#40544d] lg:text-xl">
              Treinamento personalizado com método, conhecimento e presença. Uma experiência privada construída ao redor do seu corpo, da sua rotina e dos seus objetivos — presencialmente ou onde você estiver.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="#aplicar" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#173b31] px-7 py-4 font-semibold text-white transition hover:translate-y-[-1px]">Quero treinar com a Fernanda <ArrowRight size={18} /></a>
              <a href="#private" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#173b31]/25 px-7 py-4 font-semibold"><Play size={17} /> Conheça a experiência</a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/60 bg-gradient-to-br from-[#234b3f] via-[#54796b] to-[#b8c9bf] p-8 shadow-[0_30px_90px_rgba(22,52,43,.18)]">
              <div className="flex h-full flex-col justify-between rounded-[2rem] border border-white/25 bg-white/10 p-7 text-white backdrop-blur-sm">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.22em]">Private Performance</span><LockKeyhole size={18} /></div>
                <div>
                  <p className="text-sm uppercase tracking-[.22em] text-white/70">Conhecimento em movimento</p>
                  <p className="mt-4 text-4xl font-medium leading-tight">Treinar é entender o corpo antes de exigir dele.</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-2xl bg-white/10 p-4"><TrendingUp className="mx-auto mb-2" size={19}/><span>Evolução</span></div>
                  <div className="rounded-2xl bg-white/10 p-4"><Video className="mx-auto mb-2" size={19}/><span>Live</span></div>
                  <div className="rounded-2xl bg-white/10 p-4"><Play className="mx-auto mb-2" size={19}/><span>On-demand</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="metodo" className="bg-[#173b31] px-6 py-24 text-white lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[.28em] text-[#a9c7bb]">Método Fernanda Personal</p>
          <div className="mt-5 grid gap-12 lg:grid-cols-2">
            <h2 className="text-4xl font-semibold tracking-[-.035em] sm:text-5xl">Excelência não nasce do excesso. Nasce da precisão.</h2>
            <p className="max-w-xl text-lg leading-8 text-white/70">A jornada conecta avaliação, objetivos, rotina, programa, execução, percepção de esforço, aderência, evolução e reavaliação. Tecnologia organiza. Fernanda interpreta, acompanha e conduz.</p>
          </div>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[2rem] border border-white/10 bg-white/[.055] p-7"><Icon size={27} className="text-[#b9d5ca]"/><h3 className="mt-8 text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-white/65">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="private" className="px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.28em] text-[#527468]">Fernanda Private</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.035em] sm:text-6xl">Tudo o que importa. Em um único lugar.</h2><p className="mt-6 text-lg leading-8 text-[#53655f]">Clientes ativos terão um ambiente exclusivo para acompanhar sua jornada sem depender de links espalhados, mensagens perdidas ou aplicativos desconectados.</p></div>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {privateFeatures.map(([title,text], i) => <article key={title} className="group rounded-[2rem] border border-[#173b31]/10 bg-white/55 p-8 transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[.2em] text-[#66877b]">0{i+1}</span>{i===1?<Video size={22}/>:i===2?<Play size={22}/>:i===3?<TrendingUp size={22}/>:<CalendarDays size={22}/>}</div><h3 className="mt-12 text-2xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-[#5a6964]">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="experiencia" className="px-6 pb-24 lg:px-10 lg:pb-32"><div className="mx-auto max-w-7xl rounded-[2.5rem] bg-[#dfe7e1] p-8 sm:p-12 lg:p-16"><div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[.28em] text-[#557368]">Presencial + remoto</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.035em] sm:text-5xl">Sua rotina muda. O acompanhamento continua.</h2></div><div className="space-y-5 text-lg leading-8 text-[#455a53]"><p>Em casa, na academia, em viagem ou entre compromissos: a experiência foi concebida para manter proximidade e continuidade.</p><p className="font-semibold text-[#173b31]">Brasil e exterior · agenda inteligente · teleatendimento privado · conteúdo on-demand.</p></div></div></div></section>

      <section id="aplicar" className="bg-[#101d19] px-6 py-24 text-white lg:px-10"><div className="mx-auto max-w-4xl text-center"><p className="text-xs font-semibold uppercase tracking-[.28em] text-[#9fbcb1]">Comece pela conversa certa</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.035em] sm:text-6xl">Treinar com a Fernanda começa por entender você.</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">Conte seus objetivos, sua rotina e o que espera do acompanhamento. A partir daí, avaliamos a melhor experiência para você.</p><a href="mailto:contato@fepersonal.impulsionando.com.br" className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-semibold text-[#173b31]">Solicitar atendimento <ArrowRight size={18}/></a></div></section>

      <footer className="bg-[#0b1512] px-6 py-10 text-white/55 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm sm:flex-row sm:items-center sm:justify-between"><div><span className="font-semibold tracking-[.14em] text-white">FERNANDA PERSONAL</span><span className="ml-3">Private Performance</span></div><p>Treinamento personalizado · Saúde · Bem-estar · Performance</p></div></footer>
    </main>
  );
}
