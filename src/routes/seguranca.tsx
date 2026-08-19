import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Fingerprint, KeyRound, LockKeyhole, MessageSquareLock, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança — Dados Seguros e CP | Impulsionando Tecnologia" },
      { name: "description", content: "Conheça os serviços de segurança e privacidade da Impulsionando: Dados Seguros para credenciais e CP — Chat Privado para conversas e redes controladas." },
      { property: "og:title", content: "Segurança Impulsionando — seus dados e suas conversas sob controle" },
      { property: "og:description", content: "Dados Seguros e CP — Chat Privado: produtos independentes para proteger credenciais, informações sensíveis e comunicações." },
      { property: "og:url", content: "https://impulsionando.com.br/seguranca" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/seguranca" }],
  }),
  component: SecurityPage,
});

const pillars = [
  { icon: LockKeyhole, title: "Privacidade por arquitetura", text: "Produtos desenhados para reduzir exposição e limitar o acesso somente a quem realmente precisa." },
  { icon: Fingerprint, title: "Autenticação forte", text: "Biometria, passkeys e controles de dispositivo para combinar segurança com acesso rápido." },
  { icon: Smartphone, title: "Segurança utilizável", text: "Proteção precisa funcionar na vida real. A experiência é simples por fora e rigorosa por dentro." },
] as const;

function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,hsl(var(--primary)/.15),transparent_34%),radial-gradient(circle_at_82%_18%,hsl(var(--primary)/.08),transparent_30%)]" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Segurança Impulsionando
            </div>
            <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-6xl">
              Seus dados. Suas conversas. <span className="text-primary">Sob o seu controle.</span>
            </h1>
            <p className="mt-6 max-w-4xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              A área Segurança reúne produtos independentes do Ecossistema Impulsionando criados para proteger informações sensíveis e comunicações privadas sem transformar segurança em complicação.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Você pode contratar cada serviço separadamente. Quando usados juntos, eles formam uma camada adicional de proteção para credenciais, acessos, informações privadas e relações autorizadas.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="group overflow-hidden border-primary/30 p-0 shadow-sm transition hover:shadow-lg">
              <div className="p-7 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><KeyRound className="h-6 w-6" /></div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">R$ 9,90/mês</span>
                </div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-primary">Dados Seguros</p>
                <h2 className="mt-2 text-3xl font-semibold">Uma senha para proteger todas as outras.</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Cofre digital para senhas, credenciais, cartões, contas, documentos e notas privadas, concebido com arquitetura de conhecimento zero e criptografia ponta a ponta.
                </p>
                <div className="mt-6 grid gap-3 text-sm">
                  {["Senha mestra com mínimo de 15 caracteres", "Biometria e passkeys para acesso rápido", "Conteúdo cifrado antes da sincronização", "A Impulsionando não deve conhecer a chave do cofre"].map((item) => (
                    <div key={item} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</div>
                  ))}
                </div>
                <Button asChild size="lg" className="mt-7 gap-2"><Link to="/dados-seguros">Conhecer Dados Seguros <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </Card>

            <Card className="group overflow-hidden border-slate-700 bg-slate-950 p-0 text-white shadow-sm transition hover:shadow-lg">
              <div className="p-7 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/15 text-blue-300"><MessageSquareLock className="h-6 w-6" /></div>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-slate-300">Pessoas e empresas</span>
                </div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-blue-300">CP — Chat Privado</p>
                <h2 className="mt-2 text-3xl font-semibold">Converse apenas com quem você escolhe.</h2>
                <p className="mt-4 leading-relaxed text-slate-300">
                  Rede privada para conversas, equipes e grupos com entrada por convite, confirmação de participantes, retenção configurável e exposição reduzida.
                </p>
                <div className="mt-6 grid gap-3 text-sm text-slate-200">
                  {["Convites e confirmação antes da ativação", "Grupos e relações autorizadas", "Políticas configuráveis de retenção e exclusão", "Uso pessoal, profissional e empresarial"].map((item) => (
                    <div key={item} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />{item}</div>
                  ))}
                </div>
                <Button asChild size="lg" className="mt-7 gap-2 bg-blue-500 text-white hover:bg-blue-400"><Link to="/cp">Conhecer o CP <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </Card>
          </div>
        </section>

        <section className="border-y bg-muted/25">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Uma visão única de segurança</p>
              <h2 className="mt-3 text-3xl font-semibold">Proteja o que você guarda e também o que você conversa.</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">Dados Seguros e CP atacam problemas diferentes. O primeiro protege segredos e credenciais. O segundo protege a forma como pessoas autorizadas se comunicam. Nenhum deles exige a contratação dos sistemas de gestão da Impulsionando.</p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {pillars.map(({ icon: Icon, title, text }) => <Card key={title} className="p-6"><Icon className="h-6 w-6 text-primary" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></Card>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <UsersRound className="mx-auto h-9 w-9 text-primary" />
          <h2 className="mt-4 text-3xl font-semibold">Segurança não precisa ser um produto complicado.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">Escolha a proteção que faz sentido hoje. Você pode começar pelo cofre de dados, pelo chat privado ou usar os dois de forma complementar.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/dados-seguros">Dados Seguros</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/cp">CP — Chat Privado</Link></Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
