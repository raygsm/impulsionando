import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Home as HomeIcon, Users, Wrench, Calendar, BarChart3, MessageCircle } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { MAROCAS_BRAND, MAROCAS_IMAGENS, MAROCAS_SERVICOS, MAROCAS_JORNADA_ANFITRIAO } from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas";
export const Route = createFileRoute("/marocas")({
  head: () => ({
    meta: [
      { title: "Marocas — Gestão de imóveis de locação por temporada" },
      { name: "description", content: "Plataforma para organizar limpeza, reposição, manutenção, comunicação e rotinas de imóveis de locação por temporada." },
      { property: "og:title", content: "Marocas — gestão de locação por temporada" },
      { property: "og:description", content: "Operação, registros e acompanhamento de imóveis de temporada em uma única plataforma." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { property: "og:site_name", content: "Marocas" },
      { property: "og:image", content: MAROCAS_IMAGENS.heroApto },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: MarocasHome,
});

const MODULES = [
  { icon: <HomeIcon className="h-5 w-5" />, t: "Imóveis", d: "Cadastro e histórico operacional por unidade." },
  { icon: <Users className="h-5 w-5" />, t: "Perfis e responsáveis", d: "Proprietários e prestadores vinculados à operação." },
  { icon: <Wrench className="h-5 w-5" />, t: "Serviços e manutenção", d: "Solicitações, orçamentos, checklists e acompanhamento." },
  { icon: <Calendar className="h-5 w-5" />, t: "Agenda operacional", d: "Organização de tarefas e serviços por data." },
  { icon: <MessageCircle className="h-5 w-5" />, t: "Comunicação", d: "Jornadas configuráveis quando os canais estiverem homologados." },
  { icon: <BarChart3 className="h-5 w-5" />, t: "Demonstrativos", d: "Custos, serviços e repasses a partir de dados registrados." },
  { icon: <ShieldCheck className="h-5 w-5" />, t: "Segurança", d: "Acesso autenticado, segregação por empresa e trilha operacional." },
];

function MarocasHome() {
  return <MarocasShell transparentHeader>
    <section className="relative min-h-[88dvh] flex items-center overflow-hidden">
      <div className="absolute inset-0 -z-10"><img src={MAROCAS_IMAGENS.heroApto} alt="Ambiente residencial de referência editorial" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/60 to-slate-900/25" /></div>
      <div className="container mx-auto px-4 md:px-6 py-24 text-white"><div className="max-w-3xl">
        <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">{MAROCAS_BRAND.vertical}</p>
        <h1 className="mt-4 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">Organize a operação do seu imóvel de temporada em um só lugar.</h1>
        <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl">{MAROCAS_BRAND.descricaoCurta}</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/marocas/cadastrar-imovel" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold shadow-xl hover:opacity-90 transition">Cadastrar meu imóvel <ArrowRight className="h-4 w-4" /></Link><Link to="/marocas/login" className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 font-semibold backdrop-blur hover:bg-white/10 transition">Acessar painel</Link><Link to="/marocas/hospedes" className="inline-flex items-center px-4 py-3 font-medium text-white/90 hover:text-white">Sou hóspede →</Link></div>
      </div></div>
    </section>

    <section className="container mx-auto px-4 md:px-6 py-20 max-w-4xl text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Gestão operacional</p><h2 className="text-3xl md:text-4xl font-bold mt-3">A plataforma registra o que acontece em cada unidade.</h2><p className="mt-4 text-lg text-muted-foreground">{MAROCAS_BRAND.promessa}</p></section>

    <section className="bg-muted/30 py-20"><div className="container mx-auto px-4 md:px-6"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Capacidades atuais</p><h2 className="text-3xl md:text-4xl font-bold mt-2">Rotinas operacionais estruturadas</h2><p className="mt-3 text-muted-foreground">Os recursos abaixo dependem dos dados e serviços efetivamente cadastrados para cada imóvel; nenhum prestador, SLA ou disponibilidade é presumido.</p></div><div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{MAROCAS_SERVICOS.map(s => <div key={s.id} className="rounded-2xl bg-card border p-5 hover:shadow-md transition"><div className="text-3xl">{s.emoji}</div><h3 className="font-semibold mt-3">{s.titulo}</h3><p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.resumo}</p></div>)}</div></div></section>

    <section className="container mx-auto px-4 md:px-6 py-20"><div className="grid lg:grid-cols-2 gap-12 items-center"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Jornada do anfitrião</p><h2 className="text-3xl md:text-4xl font-bold mt-2">Do cadastro ao acompanhamento operacional.</h2><p className="mt-4 text-muted-foreground">A configuração é feita conforme os dados, responsáveis e serviços efetivamente definidos para cada unidade — sem prazo ou cobertura presumidos.</p><ol className="mt-8 space-y-6">{MAROCAS_JORNADA_ANFITRIAO.map(p => <li key={p.passo} className="flex gap-4"><div className="grid place-items-center h-12 w-12 rounded-full bg-primary/10 text-primary font-bold shrink-0">{p.passo}</div><div><div className="font-semibold text-lg">{p.titulo}</div><div className="text-sm text-muted-foreground mt-1">{p.texto}</div></div></li>)}</ol><Link to="/marocas/cadastrar-imovel" className="inline-flex items-center gap-2 mt-8 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition">Iniciar cadastro <ArrowRight className="h-4 w-4" /></Link></div><div className="relative"><img src={MAROCAS_IMAGENS.sala} alt="Ambiente residencial de referência editorial" className="rounded-3xl shadow-2xl w-full aspect-[4/5] object-cover" /><div className="hidden md:block absolute -bottom-6 -left-6 bg-card border rounded-2xl p-4 shadow-xl max-w-xs"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-600"><ShieldCheck className="h-4 w-4" />Registro e rastreabilidade</div><div className="text-sm font-medium mt-1">Checklists, imagens e histórico ficam disponíveis quando cadastrados na operação.</div></div></div></div></section>

    <section className="bg-[oklch(0.15_0.02_240)] text-white py-20"><div className="container mx-auto px-4 md:px-6"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Ecossistema Impulsionando</p><h2 className="text-3xl md:text-4xl font-bold mt-2">Uma base para evoluir a gestão sem criar ilhas de dados.</h2><p className="mt-3 text-white/75">Módulos são habilitados de acordo com configuração, permissões e integrações homologadas. Recursos ainda não conectados não são apresentados como ativos.</p></div><div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">{MODULES.map(m => <div key={m.t} className="rounded-2xl bg-white/5 border border-white/10 p-5"><div className="text-amber-300">{m.icon}</div><div className="font-semibold mt-3">{m.t}</div><div className="text-white/70 text-xs mt-1">{m.d}</div></div>)}</div><div className="mt-10 flex flex-wrap gap-3"><Link to="/marocas/cadastrar-imovel" className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-slate-900 px-6 py-3 font-semibold hover:opacity-90 transition">Cadastrar imóvel <ArrowRight className="h-4 w-4" /></Link><Link to="/marocas/contato" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-semibold hover:bg-white/10 transition">Canais e suporte</Link></div></div></section>
  </MarocasShell>;
}