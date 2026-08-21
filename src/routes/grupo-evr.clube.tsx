import { createFileRoute } from "@tanstack/react-router";
import { BellRing, BookOpenCheck, Repeat2, UsersRound } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/clube")({ component: ClubeEvr });

const items = [
  [BookOpenCheck,"Conteúdo e educação","Programas e conteúdos organizados por jornada, com progresso e liberação controlada."],
  [UsersRound,"Comunidade e relacionamento","Relacionamento contínuo com segmentação, consentimento e histórico."],
  [Repeat2,"Recorrência","Assinaturas, renovação, retenção, reativação e visão de LTV."],
  [BellRing,"Engajamento","Notificações e jornadas personalizadas sem transformar acompanhamento em spam."],
] as const;

function ClubeEvr(){return <main className="min-h-screen bg-[#f6f7f4] px-5 py-16 text-[#17221d]"><section className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#708078]">Grupo EVR · Clube</p><h1 className="mt-2 text-5xl font-semibold tracking-tight">Relacionamento que continua depois da consulta.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[#617067]">A camada de conteúdo e recorrência prolonga a experiência de cuidado, fortalece retenção e cria relacionamento contínuo sem confundir educação com orientação clínica individual.</p><div className="mt-10 grid gap-4 md:grid-cols-2">{items.map(([Icon,title,text])=><article key={title} className="rounded-3xl border border-[#dbe2dc] bg-white p-6"><Icon className="h-6 w-6 text-[#173e31]"/><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-[#65736b]">{text}</p></article>)}</div></section></main>}
