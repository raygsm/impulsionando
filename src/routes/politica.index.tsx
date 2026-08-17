import { createFileRoute, Link } from "@tanstack/react-router";
import { Accessibility, ArrowRight, BookOpenCheck, Bot, CheckCircle2, Headphones, Landmark, MessageCircle, Search, ShieldCheck, Smartphone, UsersRound, Volume2 } from "lucide-react";

export const Route = createFileRoute("/politica/")({
  head: () => ({
    meta: [
      { title: "Impulsionando Política — Informação simples para participar melhor" },
      { name: "description", content: "Um ambiente simples, acessível e multimodal para consultar informações políticas, conhecer candidatos e acompanhar conteúdos com clareza e transparência." },
      { property: "og:title", content: "Impulsionando Política" },
      { property: "og:description", content: "Política explicada de um jeito simples, direto, acessível e transparente." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://politica.impulsionando.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://politica.impulsionando.com.br/" }],
  }),
  component: PoliticaHome,
});

function PoliticaHome() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#172033]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:shadow-xl">
        Ir direto ao conteúdo
      </a>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/politica" className="flex items-center gap-3" aria-label="Impulsionando Política, página inicial">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123b6d] text-white"><Landmark className="h-6 w-6" /></span>
            <span>
              <strong className="block text-lg leading-tight">Impulsionando Política</strong>
              <span className="block text-xs text-slate-600">Informação clara. Participação consciente.</span>
            </span>
          </Link>
          <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-[#123b6d] bg-white px-4 text-sm font-extrabold text-[#123b6d]" aria-label="Ouvir esta página">
            <Volume2 className="h-5 w-5" /> Ouvir página
          </button>
        </div>
      </header>

      <main id="conteudo">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#eaf2ff] px-4 py-2 text-sm font-extrabold text-[#123b6d]"><ShieldCheck className="h-4 w-4" /> Informação com transparência</p>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">Política sem complicação.</h1>
              <p className="mt-5 max-w-2xl text-xl leading-relaxed text-slate-700">Encontre o que precisa, entenda em linguagem simples e escolha como quer continuar. Sem excesso de texto, sem confusão.</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <BigAction icon={Search} title="Quero procurar" text="Encontre candidato, partido ou assunto." />
              <BigAction icon={BookOpenCheck} title="Quero entender" text="Veja explicações curtas e fáceis." />
              <BigAction icon={MessageCircle} title="Quero perguntar" text="Fale no chat ou pelo WhatsApp." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_.85fr]">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-[#123b6d]">Feito para todo mundo</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Poucos passos. Botões grandes. Respostas objetivas.</h2>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Feature icon={Accessibility} title="Acessível" text="Contraste forte, leitura simples, foco visível e navegação por teclado." />
                <Feature icon={Volume2} title="Também em áudio" text="Conteúdo preparado para leitura em voz alta e apoio a quem prefere ouvir." />
                <Feature icon={Smartphone} title="Funciona bem no celular" text="Prioridade para telas pequenas e conexões mais lentas." />
                <Feature icon={Bot} title="Ajuda inteligente" text="O agente explica em linguagem clara e encaminha quando necessário." />
              </div>
            </div>

            <aside className="rounded-3xl border-2 border-[#123b6d] bg-[#123b6d] p-7 text-white sm:p-8">
              <Headphones className="h-9 w-9" aria-hidden="true" />
              <h2 className="mt-4 text-3xl font-black">Prefere conversar?</h2>
              <p className="mt-3 text-lg leading-relaxed text-white/90">Você pode usar o chat próprio da Impulsionando Política ou continuar pelo WhatsApp.</p>
              <div className="mt-6 grid gap-3">
                <button type="button" className="min-h-14 rounded-2xl bg-white px-5 text-left text-lg font-black text-[#123b6d]">Abrir o chat <ArrowRight className="ml-2 inline h-5 w-5" /></button>
                <button type="button" className="min-h-14 rounded-2xl border-2 border-white bg-transparent px-5 text-left text-lg font-black text-white">Falar no WhatsApp <ArrowRight className="ml-2 inline h-5 w-5" /></button>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-wider text-[#123b6d]">Transparência primeiro</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Você precisa saber com quem está falando.</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-700">Páginas de candidatos e partidos devem ser identificadas de forma clara. Conteúdo patrocinado, automação e uso de inteligência artificial também devem ser sinalizados quando aplicável.</p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <Trust text="Identificação clara do responsável pela página" />
              <Trust text="Consentimento e preferência de contato registrados" />
              <Trust text="Saída simples das comunicações quando a pessoa quiser" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-3xl bg-[#eef2f6] p-7 sm:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-extrabold uppercase tracking-wider text-[#123b6d]">Para candidatos e partidos</p>
                <h2 className="mt-2 text-3xl font-black">Tecnologia, relacionamento e operação em um só lugar.</h2>
                <p className="mt-3 text-lg text-slate-700">CRM, chat próprio, WhatsApp integrado, jornadas, conteúdo, captação, relatórios e operação conectados ao Core da Impulsionando.</p>
              </div>
              <button type="button" className="min-h-14 shrink-0 rounded-2xl bg-[#123b6d] px-6 text-lg font-black text-white">Conhecer os planos</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Impulsionando Política · Horário oficial: Brasília</span>
          <span>Clareza · Acessibilidade · Transparência · Privacidade</span>
        </div>
      </footer>
    </div>
  );
}

function BigAction({ icon: Icon, title, text }: { icon: typeof Search; title: string; text: string }) {
  return <button type="button" className="group min-h-40 rounded-3xl border-2 border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-[#123b6d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8bb8ff]"><Icon className="h-8 w-8 text-[#123b6d]" /><span className="mt-5 block text-2xl font-black">{title}</span><span className="mt-2 block text-base leading-relaxed text-slate-600">{text}</span></button>;
}

function Feature({ icon: Icon, title, text }: { icon: typeof UsersRound; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-6 w-6 text-[#123b6d]" /><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-2 leading-relaxed text-slate-600">{text}</p></div>;
}

function Trust({ text }: { text: string }) {
  return <div className="flex min-h-24 items-start gap-3 rounded-2xl border border-slate-200 bg-[#f7f8fa] p-5"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#123b6d]" /><span className="font-bold leading-relaxed">{text}</span></div>;
}
