import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, EyeOff, Fingerprint, KeyRound, LockKeyhole, MessageCircle, ShieldCheck, Smartphone, TimerReset, UserRoundCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CpMark } from "./CpBrand";

const FEATURES = [
  { icon: UserRoundCheck, title: "Só entra quem você confirma", text: "Convite em duas etapas: o convidado aceita e o convidante faz a confirmação final antes da ativação." },
  { icon: EyeOff, title: "Identidade discreta", text: "A experiência reduz exposição desnecessária de identidade e separa acesso, relacionamento e conteúdo." },
  { icon: TimerReset, title: "Retenção sob seu controle", text: "A conversa pode obedecer a políticas de permanência e descarte definidas para o contexto em que ela acontece." },
  { icon: Fingerprint, title: "Acesso reforçado", text: "Segundo fator obrigatório na área segura CP e arquitetura preparada para controles adicionais por dispositivo." },
  { icon: UsersRound, title: "Pessoas e grupos autorizados", text: "Relações privadas são formadas por convite e confirmação, reduzindo inclusão acidental de participantes." },
  { icon: ShieldCheck, title: "Privacidade por desenho", text: "Minimização de dados e controles técnicos verificáveis. O CP não transforma suposições em promessas de segurança." },
] as const;

const USE_CASES = ["Advogados e clientes", "Executivos e conselhos", "Negociações empresariais", "RH e assuntos internos", "Famílias e patrimônio", "Investidores e estratégias", "Profissionais liberais", "Conversas pessoais sensíveis"];

export function CpProductPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <CpMark className="[&_*]:text-white" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex"><Link to="/seguranca">Segurança e Privacidade</Link></Button>
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-100"><Link to="/auth">Criar meu CP <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_80%_35%,rgba(30,41,59,0.65),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-300"><LockKeyhole className="h-4 w-4" /> CP — Chat Privado</div>
            <h1 className="text-5xl font-black leading-[.98] tracking-tight sm:text-7xl">Só vocês precisam saber.</h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold leading-relaxed text-white sm:text-2xl">Tem conversas que não deveriam deixar rastros desnecessários.</p>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">Converse. Resolva. Encerre. O CP é um ambiente privado para assuntos pessoais, profissionais e estratégicos, com entrada controlada, autenticação reforçada e regras de retenção pensadas desde a arquitetura.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-100"><Link to="/auth">Criar meu Chat Privado <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => document.getElementById("privacidade")?.scrollIntoView({ behavior: "smooth" })}>Entender a segurança</Button>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-slate-500">Privacidade não é uma frase de marketing. O CP descreve como garantido apenas aquilo que sua implementação técnica consegue efetivamente assegurar.</p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="rounded-[26px] border border-white/10 bg-slate-900 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-950"><MessageCircle className="h-5 w-5" /></div><div><div className="font-bold">Conversa privada</div><div className="text-xs text-slate-400">Participantes confirmados</div></div></div><ShieldCheck className="h-5 w-5 text-emerald-300" /></div>
              <div className="space-y-4 py-6"><div className="max-w-[78%] rounded-3xl rounded-bl-md bg-white/10 px-4 py-3 text-sm text-slate-200">Podemos tratar este assunto por aqui?</div><div className="ml-auto max-w-[78%] rounded-3xl rounded-br-md bg-white px-4 py-3 text-sm font-medium text-slate-950">Sim. Esta conversa usa acesso reforçado e retenção controlada.</div></div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-400"><LockKeyhole className="h-4 w-4" /> CP • ambiente privado</div>
            </div>
          </div>
        </div>
      </section>

      <section id="privacidade" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Privacidade aplicada ao produto</div><h2 className="mt-3 text-3xl font-black sm:text-5xl">Privacidade não é apagar depois. É reduzir o acesso desde o início.</h2><p className="mt-5 text-slate-300">O CP transforma privacidade em controles compreensíveis: quem entra, como a sessão é validada, quais relações são autorizadas e por quanto tempo o conteúdo deve permanecer.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{FEATURES.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><Icon className="h-6 w-6 text-blue-300" /><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p></article>)}</div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/55"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Quando usar o CP</div><h2 className="mt-3 text-3xl font-black sm:text-5xl">Quando o assunto exige discrição, o canal também precisa exigir.</h2></div><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{USE_CASES.map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-slate-200"><Check className="h-4 w-4 shrink-0 text-emerald-300" />{item}</div>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="grid gap-8 lg:grid-cols-2"><div><div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Acesso seguro</div><h2 className="mt-3 text-3xl font-black sm:text-5xl">Convide. A pessoa aceita. Você confirma.</h2><p className="mt-5 text-slate-300">A área segura CP já exige autenticação AAL2 para liberar a rede privada e utiliza confirmação em duas etapas para novos vínculos.</p></div><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"><KeyRound className="h-7 w-7 text-blue-300"/><h3 className="mt-5 text-xl font-black">Segurança antes da conversa</h3><div className="mt-5 space-y-3 text-sm text-slate-300">{["Segundo fator obrigatório na área segura", "Convite individual controlado", "Aceite do convidado", "Confirmação final de quem convidou", "Revogação de convite e vínculo"].map((x)=><div key={x} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"/>{x}</div>)}</div></div></div></section>

      <section id="acesso" className="border-t border-white/10 bg-white text-slate-950"><div className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8"><Smartphone className="mx-auto h-8 w-8"/><h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black sm:text-6xl">Sua conversa não precisa virar exposição.</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">Entre no Ecossistema Impulsionando e acesse a jornada segura do CP. O Impulsionito pode orientar cadastro, acesso, convites, retenção e os controles disponíveis.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild size="lg" className="bg-slate-950 text-white hover:bg-slate-800"><Link to="/auth">Criar meu CP <ArrowRight className="ml-2 h-4 w-4"/></Link></Button><Button asChild size="lg" variant="outline"><Link to="/seguranca">Ver Segurança e Privacidade</Link></Button></div></div></section>
    </main>
  );
}
