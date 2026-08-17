import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Building2, Check, EyeOff, LockKeyhole, Scale, Server, ShieldCheck, TimerReset, UserCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { CpMark, CP_TAGLINE, CP_SIGNATURE } from "@/components/cp/CpBrand";
import { getCpCommercialCatalog } from "@/lib/cp-commercial.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/cp")({
  head: () => ({ meta: [
    { title: "CP — Chat Privado | Impulsionando Tecnologia" },
    { name: "description", content: "CP — Chat Privado da Impulsionando Tecnologia: comunicação por convite, dupla confirmação, privacidade configurável e planos para pessoas e empresas." },
    { property: "og:title", content: "CP — Chat Privado" },
    { property: "og:description", content: "A segurança das suas conversas começa aqui — e termina com você." },
  ], links: [{ rel: "canonical", href: "https://impulsionando.com.br/cp" }] }),
  component: CpPage,
});

const principles = [
  { icon: LockKeyhole, title: "Conteúdo ponta a ponta", body: "Arquitetura alvo com chaves privadas mantidas nos dispositivos, nunca no servidor da Impulsionando." },
  { icon: UserCheck, title: "Só entra por convite", body: "Primeiro acesso com validação em dois fatores, aceite do convidado e confirmação final de quem convidou." },
  { icon: EyeOff, title: "Identidade discreta", body: "Na rede, cada pessoa é reconhecida por celular e apelido escolhido. Nome civil não é exibido aos demais participantes." },
  { icon: TimerReset, title: "Retenção definida por você", body: "Conversas podem seguir exclusão manual ou automática por janelas configuradas. A exclusão definitiva exige confirmação explícita." },
  { icon: Server, title: "Infraestrutura segregada", body: "O CP possui controles próprios de segurança e privacidade, separados das jornadas comerciais comuns." },
  { icon: Scale, title: "Privacidade dentro da lei", body: "Conteúdo e registros legais mínimos são tratados em camadas distintas. Privacidade forte sem promessas juridicamente impossíveis." },
];

function money(v: number | null) { return v == null ? "Sob consulta" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function CpPage() {
  const fetchCatalog = useServerFn(getCpCommercialCatalog);
  const { data } = useQuery({ queryKey: ["cp-commercial-catalog"], queryFn: () => fetchCatalog() });
  const [audience, setAudience] = useState<"pf" | "pj" | null>(null);
  const wl = data?.whiteLabel ?? [];
  const pf = (data as { pf?: Array<{ code:string; name:string; monthly_amount:number|null; description:string }> } | undefined)?.pf?.[0];
  const pfPrice = pf?.monthly_amount ?? 810.5;

  return <div className="min-h-screen bg-slate-950 text-white"><PublicHeader /><main>
    <section className="relative overflow-hidden border-b border-white/10"><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_30%)]"/><div className="relative container-narrow py-20 sm:py-28"><CpMark className="mb-8 [&_*]:text-white"/><Badge className="mb-5 border-white/15 bg-white/5 text-white">Um serviço Impulsionando Tecnologia</Badge><h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{CP_TAGLINE}</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{CP_SIGNATURE}</p><p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-400">Uma rede privada para pessoas e empresas que precisam controlar quem entra, como cada participante é identificado e por quanto tempo as conversas permanecem disponíveis.</p><Button asChild size="lg" className="mt-8 bg-white text-slate-950 hover:bg-slate-100"><a href="#contratar">Quero usar o CP <ArrowRight className="ml-2 h-4 w-4"/></a></Button></div></section>

    <section id="contratar" className="container-narrow py-16 sm:py-20"><div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">Contratação</div><h2 className="mt-3 text-3xl font-black sm:text-4xl">Primeiro, diga quem vai usar o CP.</h2><p className="mt-3 text-slate-400">Você é pessoa física ou está contratando para uma empresa?</p></div><div className="mt-8 grid gap-4 md:grid-cols-2"><button onClick={() => setAudience("pf")} className={`rounded-3xl border p-7 text-left transition ${audience === "pf" ? "border-blue-400 bg-blue-500/10" : "border-white/10 bg-white/[.04] hover:border-white/25"}`}><UserRound className="h-7 w-7 text-blue-300"/><strong className="mt-4 block text-2xl">Pessoa física</strong><span className="mt-2 block text-sm leading-relaxed text-slate-400">Uma área exclusiva para criar sua rede privada e conversar apenas com pessoas convidadas e confirmadas.</span></button><button onClick={() => setAudience("pj")} className={`rounded-3xl border p-7 text-left transition ${audience === "pj" ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 bg-white/[.04] hover:border-white/25"}`}><Building2 className="h-7 w-7 text-emerald-300"/><strong className="mt-4 block text-2xl">Pessoa jurídica</strong><span className="mt-2 block text-sm leading-relaxed text-slate-400">Comunicação privada para empresas, equipes e operações que exigem administração e segurança centralizadas.</span></button></div>
    {audience === "pf" && <Card className="mt-6 border-blue-400/30 bg-blue-500/[.08] p-7 text-white"><div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center"><div><Badge className="border-blue-300/20 bg-blue-300/10 text-blue-200">Plano único PF</Badge><h3 className="mt-4 text-3xl font-black">CP Pessoa Física</h3><div className="mt-4 text-4xl font-black">{money(pfPrice)} <span className="text-base font-medium text-slate-400">/ mês</span></div><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Meio salário mínimo de 2026. Cobrança mensal pré-paga, vencimento sempre no dia 5 e primeira mensalidade proporcional (pró-rata).</p></div><Button asChild size="lg"><Link to="/auth" search={{ next: "/cp/dashboard", cpAudience: "pf" } as never}>Criar minha área privada</Link></Button></div></Card>}
    {audience === "pj" && <div className="mt-6"><div className="mb-5"><h3 className="text-2xl font-black">CP Empresarial / White Label</h3><p className="mt-2 text-sm text-slate-400">Escolha a faixa da sua operação. Acima de 1.000 usuários, fazemos dimensionamento dedicado.</p></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{wl.map(t => <Card key={t.code} className="border-white/10 bg-white/[.04] p-5 text-white"><div className="text-sm font-semibold">{t.name}</div><div className="mt-3 text-2xl font-black">{money(t.monthly_amount)}</div><div className="mt-1 text-xs text-slate-500">por mês</div><p className="mt-3 text-sm text-slate-400">{t.description}</p><Button asChild variant="outline" className="mt-5 w-full border-white/20 bg-transparent text-white hover:bg-white/10"><Link to="/orcamento">Contratar / solicitar proposta</Link></Button></Card>)}</div></div>}
    </section>

    <section className="border-y border-white/10 bg-white/[.03]"><div className="container-narrow py-16 sm:py-20"><div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[.2em] text-slate-400">Arquitetura de confiança</div><h2 className="mt-3 text-3xl font-black">Segurança não pode depender de promessa.</h2><p className="mt-4 text-slate-300">O CP foi desenhado em torno de controle de entrada, dupla confirmação, minimização de exposição e políticas de retenção. A ativação completa de criptografia e demais controles críticos deve permanecer sujeita a testes e auditoria técnica.</p></div><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{principles.map(p => { const Icon=p.icon; return <Card key={p.title} className="border-white/10 bg-slate-950 p-6 text-white"><Icon className="h-6 w-6 text-slate-200"/><h3 className="mt-4 font-bold">{p.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{p.body}</p></Card> })}</div><div className="mt-8 grid gap-3 sm:grid-cols-2">{["Convite + 2FA + duplo aceite","Retenção manual, 24h, 48h, 1, 2, 5 ou 30 dias","Revogação de dispositivo","Sem nome civil visível aos demais usuários","Exclusão definitiva exige confirmação","Mensagens em trânsito durante troca de número não são recuperadas"].map(x => <div key={x} className="flex gap-2 text-sm text-slate-300"><Check className="mt-.5 h-4 w-4 shrink-0"/>{x}</div>)}</div></div></section>

    <section className="container-narrow py-16 text-center sm:py-20"><ShieldCheck className="mx-auto h-9 w-9"/><h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black">Você convida. A pessoa aceita. Você confirma.</h2><p className="mx-auto mt-4 max-w-2xl text-slate-400">Somente depois da segunda confirmação o novo participante é ativado e passa a fazer parte da sua rede privada.</p><Button asChild size="lg" className="mt-7 bg-white text-slate-950 hover:bg-slate-100"><a href="#contratar">Escolher meu plano</a></Button></section>
  </main><PublicFooter /></div>;
}
