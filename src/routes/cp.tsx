import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Building2,
  Check,
  EyeOff,
  LockKeyhole,
  Scale,
  ShieldCheck,
  TimerReset,
  UserCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { CpMark } from "@/components/cp/CpBrand";
import { getCpCommercialCatalog } from "@/lib/cp-commercial.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/cp")({
  head: () => ({
    meta: [
      { title: "CP — Chat Privado | Impulsionando Tecnologia" },
      {
        name: "description",
        content:
          "CP — Chat Privado da Impulsionando Tecnologia. Conversas privadas para pessoas e empresas, com entrada por convite, grupos controlados, retenção configurável e gestão de acesso.",
      },
      { property: "og:title", content: "CP — Chat Privado | Impulsionando Tecnologia" },
      {
        property: "og:description",
        content: "Converse com quem você escolhe. Com controle, clareza e privacidade profissional.",
      },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/cp" }],
  }),
  component: CpPage,
});

type Audience = "pf" | "pj";

type CommercialTier = {
  code: string;
  name: string;
  monthly_amount: number | null;
  description: string;
};

const benefits = [
  {
    icon: UserCheck,
    title: "Entrada por convite",
    body: "A rede começa com relações deliberadas. Convites, aceite e confirmação organizam quem realmente participa.",
  },
  {
    icon: UsersRound,
    title: "Grupos sob controle",
    body: "Cada grupo tem um responsável e participantes ativos. Entrar em um grupo exige convite e confirmação.",
  },
  {
    icon: EyeOff,
    title: "Exposição reduzida",
    body: "O CP foi desenhado para minimizar informações desnecessárias e manter a comunicação concentrada em quem precisa participar.",
  },
  {
    icon: TimerReset,
    title: "Retenção configurável",
    body: "Conversas podem seguir políticas de retenção e exclusão definidas dentro da área autenticada.",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade profissional",
    body: "Útil para conversas pessoais, familiares, de equipes, projetos, negócios e outras situações legítimas que pedem mais controle.",
  },
  {
    icon: Scale,
    title: "Uso responsável",
    body: "Privacidade e responsabilidade caminham juntas. O CP não é destinado a atividades ilegais, abusivas ou que violem direitos de terceiros.",
  },
] as const;

const howItWorks = [
  "Você cria sua conta e sua área privada.",
  "Convida as pessoas com quem deseja se comunicar.",
  "O convidado aceita e conclui as etapas de ativação aplicáveis.",
  "O responsável confirma a entrada.",
  "A partir daí, a comunicação acontece apenas dentro das relações e grupos autorizados.",
] as const;

function money(value: number | null) {
  return value == null
    ? "Sob consulta"
    : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CpPage() {
  const fetchCatalog = useServerFn(getCpCommercialCatalog);
  const { data } = useQuery({
    queryKey: ["cp-commercial-catalog"],
    queryFn: () => fetchCatalog(),
  });
  const [audience, setAudience] = useState<Audience | null>(null);

  const whiteLabel = (data?.whiteLabel ?? []) as CommercialTier[];
  const pf = (data as { pf?: CommercialTier[] } | undefined)?.pf?.[0];
  const pfPrice = pf?.monthly_amount ?? 810.5;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,.22),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,.13),transparent_28%)]" />
          <div className="relative container-narrow py-20 sm:py-28">
            <div className="flex flex-wrap items-center gap-3">
              <CpMark className="[&_*]:text-white" />
              <Badge className="border-white/15 bg-white/5 text-white">Um serviço Impulsionando Tecnologia</Badge>
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.22em] text-blue-300">CP — Chat Privado</p>
                <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                  Converse com quem você escolhe.
                  <span className="block text-blue-400">Com controle, clareza e privacidade profissional.</span>
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
                  Uma rede privada para pessoas e empresas que desejam organizar conversas, grupos e participantes com mais controle de entrada e menos exposição desnecessária.
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">
                  Privacidade não significa esconder algo inadequado. Significa proteger conversas legítimas — pessoais, familiares, profissionais ou empresariais — contra exposição, ruído e acesso de quem não precisa participar.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-blue-500 text-white hover:bg-blue-400">
                    <a href="#contratar">Quero usar o CP <ArrowRight className="ml-2 h-4 w-4" /></a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                    <Link to="/auth" search={{ next: "/cp/dashboard" } as never}>Entrar na minha conta</Link>
                  </Button>
                </div>
              </div>

              <Card className="border-white/10 bg-white/[.045] p-6 text-white">
                <LockKeyhole className="h-7 w-7 text-blue-300" />
                <h2 className="mt-4 text-xl font-bold">Privacidade útil para a vida real.</h2>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  {[
                    "Conversas entre pessoas de confiança",
                    "Grupos privados por convite",
                    "Comunicação de equipes e projetos",
                    "Assuntos familiares e profissionais",
                    "Relacionamentos empresariais e estratégicos",
                  ].map((item) => (
                    <div key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{item}</div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="container-narrow py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-blue-300">Como funciona</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Uma rede privada construída por relações autorizadas.</h2>
            <p className="mt-4 text-slate-400">No CP, participar do sistema não significa automaticamente participar da rede ou dos grupos de outra pessoa.</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-5">
            {howItWorks.map((item, index) => (
              <Card key={item} className="border-white/10 bg-white/[.035] p-5 text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-sm font-black text-blue-300">{index + 1}</div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">{item}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[.025]">
          <div className="container-narrow py-16 sm:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-slate-400">Vantagens do CP</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Mais controle sobre quem entra, onde participa e como a conversa permanece.</h2>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="border-white/10 bg-slate-950 p-6 text-white">
                  <Icon className="h-6 w-6 text-blue-300" />
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="contratar" className="container-narrow py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-blue-300">Cadastro e contratação</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Você é pessoa física ou pessoa jurídica?</h2>
            <p className="mt-3 text-slate-400">Escolha seu perfil para ver a jornada adequada.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setAudience("pf")}
              className={`rounded-3xl border p-7 text-left transition ${audience === "pf" ? "border-blue-400 bg-blue-500/10" : "border-white/10 bg-white/[.04] hover:border-white/25"}`}
            >
              <UserRound className="h-7 w-7 text-blue-300" />
              <strong className="mt-4 block text-2xl">Pessoa física</strong>
              <span className="mt-2 block text-sm leading-relaxed text-slate-400">Crie sua própria rede privada, convide participantes e organize seus grupos.</span>
            </button>

            <button
              type="button"
              onClick={() => setAudience("pj")}
              className={`rounded-3xl border p-7 text-left transition ${audience === "pj" ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 bg-white/[.04] hover:border-white/25"}`}
            >
              <Building2 className="h-7 w-7 text-emerald-300" />
              <strong className="mt-4 block text-2xl">Pessoa jurídica</strong>
              <span className="mt-2 block text-sm leading-relaxed text-slate-400">Estruture comunicação privada para equipes, empresas e operações que exigem gestão centralizada.</span>
            </button>
          </div>

          {audience === "pf" && (
            <Card className="mt-6 border-blue-400/30 bg-blue-500/[.08] p-7 text-white">
              <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <Badge className="border-blue-300/20 bg-blue-300/10 text-blue-200">Plano individual</Badge>
                  <h3 className="mt-4 text-3xl font-black">CP Pessoa Física</h3>
                  <div className="mt-4 text-4xl font-black">{money(pfPrice)} <span className="text-base font-medium text-slate-400">/ mês</span></div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                    Mensalidade correspondente a 50% do salário mínimo nacional vigente, conforme a referência legal utilizada pelo sistema. Cobrança mensal pré-paga, vencimento no dia 5 e primeira cobrança proporcional quando aplicável.
                  </p>
                </div>
                <div className="min-w-64 space-y-3">
                  <Button asChild size="lg" className="w-full bg-blue-500 hover:bg-blue-400">
                    <Link to="/auth" search={{ next: "/cp/dashboard", cpAudience: "pf", mode: "signup" } as never}>Criar minha conta</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10">
                    <Link to="/auth" search={{ next: "/cp/dashboard", cpAudience: "pf", mode: "login" } as never}>Já sou cliente — entrar</Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {audience === "pj" && (
            <div className="mt-6">
              <div className="mb-5">
                <h3 className="text-2xl font-black">CP para Empresas</h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">Planos empresariais são dimensionados pela operação e podem incluir administração centralizada e modalidade White Label.</p>
              </div>
              {whiteLabel.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {whiteLabel.map((tier) => (
                    <Card key={tier.code} className="border-white/10 bg-white/[.04] p-5 text-white">
                      <div className="text-sm font-semibold">{tier.name}</div>
                      <div className="mt-3 text-2xl font-black">{money(tier.monthly_amount)}</div>
                      <div className="mt-1 text-xs text-slate-500">por mês</div>
                      <p className="mt-3 text-sm text-slate-400">{tier.description}</p>
                      <Button asChild variant="outline" className="mt-5 w-full border-white/20 bg-transparent text-white hover:bg-white/10">
                        <Link to="/orcamento">Solicitar proposta</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-emerald-400/20 bg-emerald-400/[.06] p-7 text-white">
                  <p className="max-w-3xl text-slate-300">Conte quantos usuários e qual tipo de operação sua empresa precisa proteger. A Impulsionando estrutura a proposta adequada.</p>
                  <Button asChild className="mt-5 bg-emerald-400 text-slate-950 hover:bg-emerald-300"><Link to="/orcamento">Solicitar proposta empresarial</Link></Button>
                </Card>
              )}
            </div>
          )}
        </section>

        <section className="border-y border-white/10 bg-white/[.025]">
          <div className="container-narrow py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
              <div>
                <ShieldCheck className="h-9 w-9 text-blue-300" />
                <h2 className="mt-5 text-3xl font-black sm:text-4xl">Depois do login, o Impulsionito acompanha você.</h2>
                <p className="mt-4 leading-relaxed text-slate-400">A página pública apresenta apenas o essencial. Depois do cadastro e da ativação, o dashboard oferece o detalhamento das configurações, grupos, participantes, retenção, convites e demais recursos.</p>
              </div>
              <Card className="border-white/10 bg-slate-950 p-7 text-white">
                <p className="text-sm font-semibold text-blue-300">Dentro da área autenticada</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    "Guia contextual do Impulsionito",
                    "Dashboard da sua rede",
                    "Convites enviados e recebidos",
                    "Criação e gestão de grupos",
                    "Participantes e permissões",
                    "Políticas de retenção",
                    "Exclusão e privacidade",
                    "Situação da assinatura",
                  ].map((item) => <div key={item} className="flex gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{item}</div>)}
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="container-narrow py-16 text-center sm:py-20">
          <ShieldCheck className="mx-auto h-9 w-9 text-blue-300" />
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black sm:text-4xl">Privacidade boa é aquela que protege pessoas, negócios e conversas importantes — com responsabilidade.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">Crie sua área privada ou entre na sua conta para continuar.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-400"><a href="#contratar">Criar minha área privada</a></Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10"><Link to="/auth" search={{ next: "/cp/dashboard" } as never}>Acessar CP</Link></Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
