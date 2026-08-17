import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Copy,
  EyeOff,
  Fingerprint,
  KeyRound,
  Link2,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  TimerReset,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CpMark, CP_SIGNATURE, CP_TAGLINE } from "./CpBrand";

const RETENTION_OPTIONS = ["24 horas", "48 horas", "7 dias", "30 dias", "Manual"] as const;

type Retention = (typeof RETENTION_OPTIONS)[number];

const FEATURES = [
  { icon: UserRoundCheck, title: "Só entra quem você confirma", text: "Convite em duas etapas: o convidado aceita e o convidante faz a confirmação final antes da ativação." },
  { icon: EyeOff, title: "Identidade discreta", text: "Na rede, cada pessoa é identificada pelo celular e por um nome fantasia. O nome civil não precisa ser exibido aos demais." },
  { icon: TimerReset, title: "Retenção sob seu controle", text: "Cada usuário escolhe a política de retenção. Mensagens e períodos podem ser apagados conforme as regras da conversa." },
  { icon: Fingerprint, title: "Proteção local", text: "Estrutura preparada para bloqueio do aplicativo, PIN local e biometria quando suportada pelo dispositivo." },
  { icon: UsersRound, title: "Conversas privadas e grupos", text: "Arquitetura de produto prevista para conversas individuais e grupos por convite, com controles de participantes." },
  { icon: ShieldCheck, title: "Privacidade por desenho", text: "Minimização de dados, ausência de anúncios personalizados e separação entre identidade, acesso e conteúdo da conversa." },
];

export function CpProductPage() {
  const [retention, setRetention] = useState<Retention>("48 horas");
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState("Meu contato privado");

  const inviteUrl = useMemo(() => {
    const slug = nickname.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "convite";
    return `https://impulsionando.com.br/cp?convite=${slug}`;
  }, [nickname]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <CpMark className="[&_*]:text-white" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex">
              <Link to="/">Impulsionando</Link>
            </Button>
            <Button className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" })}>
              Conhecer acesso <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(148,163,184,0.18),transparent_32%),radial-gradient(circle_at_80%_35%,rgba(30,41,59,0.55),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
              <LockKeyhole className="h-4 w-4" /> CP — Chat Privado
            </div>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">Converse com menos exposição. Controle quem entra e por quanto tempo a conversa fica.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">{CP_TAGLINE}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => document.getElementById("convite")?.scrollIntoView({ behavior: "smooth" })}>
                Criar convite de demonstração <Link2 className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => document.getElementById("privacidade")?.scrollIntoView({ behavior: "smooth" })}>
                Ver controles de privacidade
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-500">{CP_SIGNATURE}</p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="rounded-[26px] border border-white/10 bg-slate-900 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-950"><MessageCircle className="h-5 w-5" /></div><div><div className="font-bold">Conversa privada</div><div className="text-xs text-slate-400">2 participantes confirmados</div></div></div>
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="space-y-4 py-6">
                <div className="max-w-[78%] rounded-3xl rounded-bl-md bg-white/10 px-4 py-3 text-sm text-slate-200">Cheguei. Podemos falar por aqui?</div>
                <div className="ml-auto max-w-[78%] rounded-3xl rounded-br-md bg-white px-4 py-3 text-sm font-medium text-slate-950">Sim. Configurei esta conversa para retenção de {retention.toLowerCase()}.</div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-400"><TimerReset className="h-4 w-4" /> Retenção selecionada: <strong className="text-white">{retention}</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section id="privacidade" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Privacidade aplicada ao produto</div><h2 className="mt-3 text-3xl font-black sm:text-5xl">Menos promessa vaga. Mais controle visível.</h2><p className="mt-5 text-slate-300">O CP está sendo estruturado para transformar privacidade em controles compreensíveis: entrada por convite, identificação discreta, retenção escolhida e descarte irreversível com confirmação explícita.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><Icon className="h-6 w-6 text-slate-300" /><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p></article>)}
        </div>
      </section>

      <section id="convite" className="border-y border-white/10 bg-slate-900/55">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-2">
          <div><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Demonstração de jornada</div><h2 className="mt-3 text-3xl font-black sm:text-4xl">Convide. O convidado aceita. Você confirma.</h2><p className="mt-4 max-w-xl text-slate-300">A ativação definitiva exige a segunda confirmação do convidante. Isso reduz inclusão acidental e mantém a rede fechada.</p></div>
          <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
            <label className="text-sm font-bold" htmlFor="cp-nickname">Nome fantasia do contato</label>
            <input id="cp-nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-white/30" maxLength={48} />
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-slate-400 break-all">{inviteUrl}</div>
            <Button onClick={copyInvite} className="mt-4 w-full bg-white text-slate-950 hover:bg-slate-100">{copied ? <><Check className="mr-2 h-4 w-4" /> Copiado</> : <><Copy className="mr-2 h-4 w-4" /> Copiar link de demonstração</>}</Button>
            <p className="mt-3 text-xs text-slate-500">Este bloco demonstra a experiência de convite no front-end. A ativação real depende do serviço autenticado de convites do CP.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Retenção</div><h2 className="mt-3 text-3xl font-black">Você escolhe a janela.</h2><p className="mt-4 text-slate-400">No desenho do CP, exclusões definitivas exigem confirmação explícita e não devem ser recuperáveis pelo produto após o descarte.</p></div>
          <div className="grid gap-3 sm:grid-cols-5">{RETENTION_OPTIONS.map((option) => <button key={option} onClick={() => setRetention(option)} className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${retention === option ? "border-white bg-white text-slate-950" : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"}`}>{option}</button>)}</div>
        </div>
      </section>

      <section id="acesso" className="border-t border-white/10 bg-white text-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Planos planejados</div><h2 className="mt-3 text-3xl font-black sm:text-5xl">7 dias para experimentar.</h2><p className="mt-4 text-slate-600">Os valores abaixo representam a estrutura comercial prevista para o CP. A cobrança deve ser habilitada somente quando autenticação, backend, privacidade e pagamento estiverem validados em produção.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Plan title="CP Individual" price="R$ 9,90" description="Uso privado essencial para uma pessoa." bullets={["Conversas individuais", "Convites controlados", "Política de retenção", "Controles locais de privacidade"]} />
            <Plan title="CP Plus" price="R$ 19,90" description="Mais recursos para quem usa o CP com frequência." bullets={["Tudo do Individual", "Grupos privados", "Controles ampliados", "Prioridade em novos recursos"]} featured />
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600"><Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-slate-900" /><p>Antes do go-live, o CP ainda precisa de validação técnica do backend, autenticação, descarte, criptografia aplicável, recuperação de conta, pagamentos e testes de segurança. Esta página não declara essas camadas como concluídas.</p></div>
        </div>
      </section>
    </main>
  );
}

function Plan({ title, price, description, bullets, featured = false }: { title: string; price: string; description: string; bullets: string[]; featured?: boolean }) {
  return <article className={`rounded-3xl border p-7 ${featured ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black">{title}</h3><p className={`mt-2 text-sm ${featured ? "text-slate-400" : "text-slate-600"}`}>{description}</p></div>{featured && <KeyRound className="h-5 w-5 text-slate-300" />}</div><div className="mt-7 text-4xl font-black">{price}<span className={`text-sm font-medium ${featured ? "text-slate-400" : "text-slate-500"}`}>/mês</span></div><div className="mt-2 text-xs font-bold uppercase tracking-[0.16em] opacity-60">7 dias de teste</div><div className="mt-7 space-y-3">{bullets.map((bullet) => <div key={bullet} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4" /> {bullet}</div>)}</div></article>;
}
