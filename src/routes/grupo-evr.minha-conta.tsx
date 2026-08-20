import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CalendarClock, ChevronRight, FileText, HeartPulse, PackageCheck, Pill, ShieldCheck, Smartphone, WalletCards } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/minha-conta")({ component: MinhaContaEvr });

const actions = [
  { icon: CalendarClock, title: "Agenda", text: "Confirmar, remarcar, cancelar ou pedir antecipação de consulta.", to: "/grupo-evr/agendar" },
  { icon: FileText, title: "Documentos", text: "Acessar somente documentos clínicos liberados para você." },
  { icon: Pill, title: "Prescrições e pedidos", text: "Consultar prescrições válidas e decidir se deseja solicitar orçamento à Ative-se Pharma." },
  { icon: PackageCheck, title: "Meus pedidos", text: "Acompanhar orçamento, pagamento, produção, retirada ou entrega." },
  { icon: WalletCards, title: "Financeiro", text: "Visualizar cobranças, pagamentos, recibos e notas fiscais disponíveis." },
  { icon: Bell, title: "Notificações", text: "Controlar lembretes, mensagens e avisos transacionais." },
  { icon: ShieldCheck, title: "Privacidade", text: "Gerenciar consentimentos, canais de contato e autorizações de compartilhamento." },
  { icon: HeartPulse, title: "Meu acompanhamento", text: "Acompanhar etapas e orientações liberadas pela equipe assistencial." },
];

function MinhaContaEvr(){
  return <main className="min-h-screen bg-[#f4f5f1] text-[#17221d]">
    <section className="bg-[#12231d] px-5 py-10 text-white"><div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-6"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#b9cabf]">Grupo EVR · Área do paciente</p><h1 className="mt-2 text-4xl font-semibold">Seu cuidado em um só lugar.</h1><p className="mt-3 max-w-2xl leading-7 text-white/70">Uma experiência mobile-first para agenda, documentos, pedidos, pagamentos, notificações e consentimentos — sem misturar o que é clínico com o que é comercial.</p></div><div className="rounded-3xl border border-white/15 bg-white/5 p-5"><Smartphone className="h-7 w-7 text-[#d5bc75]"/><p className="mt-4 text-sm font-semibold">Preparado como PWA</p><p className="mt-1 text-xs text-white/60">Instalável no celular quando habilitado.</p></div></div>
    </div></section>
    <section className="mx-auto max-w-5xl px-5 py-10">
      <div className="rounded-3xl border border-[#dbe2dc] bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#718078]">Próximo compromisso</p><div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-semibold">Nenhum compromisso carregado</h2><p className="mt-1 text-sm text-[#6c7a72]">Os dados reais aparecerão somente após autenticação e integração do perfil do paciente.</p></div><Link to="/grupo-evr/agendar" className="inline-flex items-center gap-2 rounded-xl bg-[#173e31] px-4 py-3 text-sm font-semibold text-white">Agendar <ChevronRight className="h-4 w-4"/></Link></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{actions.map(({icon:Icon,title,text,to})=>{
        const body=<><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf2ee] text-[#173e31]"><Icon className="h-5 w-5"/></div><div className="flex-1"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-[#68766e]">{text}</p></div><ChevronRight className="h-4 w-4 text-[#9aa69f]"/></>;
        return to?<Link key={title} to={to} className="flex items-start gap-4 rounded-3xl border border-[#dbe2dc] bg-white p-5 transition hover:border-[#96aa9e] hover:shadow-sm">{body}</Link>:<article key={title} className="flex items-start gap-4 rounded-3xl border border-[#dbe2dc] bg-white p-5">{body}</article>
      })}</div>
    </section>
  </main>
}
