import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Compass, Crown, HeartHandshake, LockKeyhole, MapPin, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/tour")({
  head: () => ({
    meta: [
      { title: "Impulsionando Tour — CP Concierge Privado no Rio de Janeiro" },
      { name: "description", content: "Experiências privadas no Rio de Janeiro, desenhadas por perfil e acessíveis por indicação. CP — Concierge Privado, logística e tranquilidade de A a Z." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: TourPrivateHome,
});

const pillars = [
  ["Turístico", "Os ícones do Rio, escolhidos no melhor horário, ritmo e contexto para você."],
  ["Nativo", "A cidade que o carioca vive: mesa, música, bairros, encontros e pequenos rituais que não cabem num catálogo."],
  ["Extraordinário", "Mar, serra, voo, barco, gastronomia, cultura e experiências especiais organizadas sob medida."],
];

const journey = [
  "Você recebe uma indicação privada e numerada.",
  "Entendemos quem viaja, o que ama, o que evita e o ritmo desejado.",
  "Montamos uma proposta flexível com alternativas A, B e C.",
  "Confirmamos reservas, deslocamentos, horários e contingências.",
  "Seu CP — Concierge Privado acompanha a experiência contratada com discrição e atenção.",
  "Durante a estadia, o plano pode mudar. A operação muda junto.",
];

function TourPrivateHome() {
  return (
    <main className="min-h-screen bg-[#07100d] text-[#f7f3e8] selection:bg-[#c9aa6a]/40">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07100d]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div><p className="text-xs font-semibold uppercase tracking-[.32em] text-[#c9aa6a]">Impulsionando</p><p className="text-lg font-medium tracking-wide">TOUR · PRIVATE</p></div>
          <div className="flex items-center gap-2 rounded-full border border-[#c9aa6a]/35 px-4 py-2 text-xs uppercase tracking-[.2em] text-[#d9c59a]"><LockKeyhole className="h-3.5 w-3.5" /> somente por indicação</div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-40 lg:px-10 lg:pb-36 lg:pt-52">
        <div className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#c9aa6a]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p className="mb-6 flex items-center gap-2 text-sm uppercase tracking-[.28em] text-[#c9aa6a]"><MapPin className="h-4 w-4" /> Rio de Janeiro · Brasil</p>
            <h1 className="max-w-5xl text-5xl font-light leading-[.96] tracking-[-.045em] sm:text-7xl lg:text-[92px]">Você vive o Rio.<br/><span className="font-serif italic text-[#d7bd86]">Nós cuidamos do resto.</span></h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/65">Não vendemos uma lista de passeios. Criamos uma experiência privada entre o Rio que o mundo conhece e o Rio que só quem vive aqui sabe sentir.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[.045] p-7 shadow-2xl backdrop-blur">
            <div className="mb-8 flex items-center justify-between"><Crown className="h-7 w-7 text-[#c9aa6a]"/><span className="rounded-full bg-[#c9aa6a]/10 px-3 py-1 text-xs text-[#d7bd86]">CP · CONCIERGE PRIVADO</span></div>
            <p className="text-2xl font-light leading-9">Zero preocupação.<br/>Tranquilidade de A a Z.</p>
            <p className="mt-5 text-sm leading-6 text-white/55">Aeroporto, rodoviária, hotel, Airbnb, motorista, reservas, gastronomia, experiências, mudanças de planos e contingências — coordenados conforme o plano contratado.</p>
            <a href="#acesso" className="mt-8 flex items-center justify-between rounded-full bg-[#d1b477] px-6 py-4 font-semibold text-[#07100d] transition hover:scale-[1.01]">Validar minha indicação <ArrowRight className="h-5 w-5"/></a>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b1712] px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[.3em] text-[#c9aa6a]">Duas cidades na mesma cidade</p>
          <h2 className="mt-5 max-w-4xl text-4xl font-light tracking-tight sm:text-6xl">O Rio turístico é extraordinário.<br/><span className="font-serif italic text-white/55">O Rio nativo também.</span></h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">{pillars.map(([title,body],i)=><article key={title} className="min-h-64 rounded-[1.75rem] border border-white/10 bg-white/[.035] p-7"><span className="text-xs text-[#c9aa6a]">0{i+1}</span><h3 className="mt-16 text-2xl">{title}</h3><p className="mt-4 leading-7 text-white/55">{body}</p></article>)}</div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-10"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
        <div><p className="text-xs uppercase tracking-[.3em] text-[#c9aa6a]">Private by design</p><h2 className="mt-5 text-4xl font-light sm:text-6xl">Não é aberto ao público.<br/><span className="font-serif italic text-[#d7bd86]">É uma rede de confiança.</span></h2><p className="mt-7 max-w-xl leading-8 text-white/60">Cada novo hóspede entra por uma indicação privada numerada. A indicação não garante contratação: ela abre a porta para uma validação de perfil, disponibilidade e aderência à experiência.</p></div>
        <div className="space-y-3">{journey.map((item,i)=><div key={item} className="flex gap-5 rounded-2xl border border-white/10 bg-white/[.025] p-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c9aa6a]/40 text-xs text-[#c9aa6a]">{i+1}</span><p className="pt-1 text-white/70">{item}</p></div>)}</div>
      </div></section>

      <section className="bg-[#e9e0ce] px-6 py-24 text-[#0a1511] lg:px-10"><div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-3">
          <article><ShieldCheck className="h-8 w-8"/><h3 className="mt-6 text-2xl">Segurança contextual</h3><p className="mt-4 leading-7 opacity-65">Rio é metrópole. Horário, deslocamento, local, perfil e contexto importam. Segurança entra no desenho da experiência, sem transformar a cidade em medo.</p></article>
          <article><HeartHandshake className="h-8 w-8"/><h3 className="mt-6 text-2xl">Respeito ao território</h3><p className="mt-4 leading-7 opacity-65">Comunidades não são cenário. Experiências nesses territórios dependem de contexto, respeito, operadores adequados, regras locais e benefício legítimo para quem vive ali.</p></article>
          <article><Compass className="h-8 w-8"/><h3 className="mt-6 text-2xl">Plano vivo</h3><p className="mt-4 leading-7 opacity-65">Clima, trânsito, energia do grupo e oportunidades mudam. Por isso trabalhamos com alternativas e reconfirmações, não com um roteiro engessado.</p></article>
        </div>
      </div></section>

      <section id="acesso" className="px-6 py-28 lg:px-10"><div className="mx-auto max-w-4xl rounded-[2.5rem] border border-[#c9aa6a]/25 bg-[#0d1b15] p-8 text-center sm:p-14">
        <Sparkles className="mx-auto h-8 w-8 text-[#c9aa6a]"/><p className="mt-6 text-xs uppercase tracking-[.3em] text-[#c9aa6a]">Acesso privado</p><h2 className="mt-5 text-4xl font-light sm:text-6xl">Já foi indicado?</h2><p className="mx-auto mt-5 max-w-xl leading-7 text-white/55">Tenha em mãos o número ou link privado recebido de quem indicou você. Seus dados e preferências são tratados dentro do processo de qualificação da experiência.</p>
        <div className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row"><input aria-label="Código de indicação" placeholder="Número da indicação" className="min-w-0 flex-1 rounded-full border border-white/15 bg-black/20 px-6 py-4 outline-none placeholder:text-white/30 focus:border-[#c9aa6a]"/><button className="rounded-full bg-[#d1b477] px-7 py-4 font-semibold text-[#07100d]">Validar acesso</button></div>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/35"><Check className="h-3.5 w-3.5"/> rede fechada · privacidade · atendimento sob disponibilidade</div>
      </div></section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-xs uppercase tracking-[.2em] text-white/30">Impulsionando Tour · CP — Concierge Privado · Rio de Janeiro</footer>
    </main>
  );
}
