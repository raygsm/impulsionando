import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, KeyRound, Fingerprint, Smartphone, LockKeyhole, Mic, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingLeadDialog } from "@/components/marketing/ImpulsionandoBrasilFAB";

export const Route = createFileRoute("/dados-seguros")({
  head: () => ({
    meta: [
      { title: "Dados Seguros — Cofre digital Impulsionando" },
      { name: "description", content: "Cofre digital de conhecimento zero para senhas, credenciais, cartões e dados sensíveis. R$ 9,90/mês." },
      { property: "og:title", content: "Dados Seguros — uma senha para proteger todas as outras" },
      { property: "og:description", content: "Criptografia ponta a ponta, biometria/passkeys e arquitetura de conhecimento zero." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/dados-seguros" }],
  }),
  component: DadosSegurosPage,
});

const FEATURES = [
  [KeyRound, "Uma única senha central", "Você memoriza apenas uma senha mestra forte. O cofre organiza as demais credenciais."],
  [EyeOff, "Conhecimento zero", "A Impulsionando não deve possuir a senha mestra nem uma chave capaz de descriptografar o conteúdo do seu cofre."],
  [Fingerprint, "Biometria e passkeys", "Desbloqueio rápido no dispositivo usando Face ID, biometria ou chave de acesso protegida pelo sistema operacional."],
  [Mic, "Entrada por voz protegida", "No produto, a fala deve ser transcrita localmente e criptografada antes de qualquer sincronização. Nunca por chat ou log em texto aberto."],
  [Smartphone, "Confirmação forte de dispositivo", "Novo dispositivo exige aprovação por passkey/chave de segurança. SMS pode existir apenas como contingência de baixo privilégio, nunca como fator principal para abrir o cofre."],
  [LockKeyhole, "Criptografia ponta a ponta", "Os dados sensíveis são cifrados no dispositivo antes de sair dele e só podem ser abertos por uma chave derivada do segredo do usuário."],
] as const;

function DadosSegurosPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Impulsionando Dados Seguros
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            Uma senha para proteger <span className="text-primary">todas as outras.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Um cofre digital simples para senhas, acessos, credenciais, cartões, contas, documentos e notas privadas — projetado para que nem a própria Impulsionando consiga ler o conteúdo armazenado.
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-5">
            <div><div className="text-4xl font-semibold">R$ 9,90</div><div className="text-sm text-muted-foreground">por mês · 1 usuário</div></div>
            <MarketingLeadDialog defaultInterest="Dados Seguros R$ 9,90" trigger={<Button size="lg">Quero o Dados Seguros</Button>} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold">Segurança que começa no desenho do produto</h2>
        <p className="mt-3 max-w-4xl text-muted-foreground">O objetivo não é confiar que alguém “não vai olhar”. É construir o sistema para que ninguém fora do seu dispositivo tenha como olhar.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, title, text]) => <Card key={title} className="p-6"><Icon className="h-7 w-7 text-primary" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></Card>)}
        </div>
      </section>

      <section className="border-y bg-muted/25"><div className="mx-auto max-w-5xl px-6 py-16"><h2 className="text-3xl font-semibold">Regra Impulsionando para a senha central</h2><div className="mt-6 grid gap-5 md:grid-cols-2"><Card className="p-6"><h3 className="font-semibold">Senha mestra</h3><ul className="mt-4 space-y-3 text-sm">{["mínimo obrigatório de 15 caracteres", "frase-senha longa recomendada", "bloqueio de senhas comuns ou já vazadas", "derivação de chave resistente a força bruta", "nunca armazenada ou transmitida em texto claro"].map(x => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{x}</li>)}</ul></Card><Card className="p-6"><h3 className="font-semibold">Acesso rápido</h3><ul className="mt-4 space-y-3 text-sm">{["Face ID / biometria apenas como desbloqueio local", "passkey ou chave de segurança para novo dispositivo", "autobloqueio por inatividade", "reautenticação para revelar/copiar dados altamente sensíveis", "alertas de novo dispositivo e tentativa suspeita"].map(x => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{x}</li>)}</ul></Card></div></div></section>

      <section className="mx-auto max-w-5xl px-6 py-16"><div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><h2 className="font-semibold">Uma regra importante</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">O chat da Impulsionando ou do ChatGPT não deve ser usado como campo de armazenamento de senha em texto aberto. O fluxo correto é abrir o Dados Seguros, autenticar-se e inserir ou ditar a credencial dentro do ambiente criptografado. O assistente pode ajudar a localizar o item, mas a revelação do segredo exige autenticação local do usuário.</p></div></div></div></section>

      <section className="border-t bg-primary/5"><div className="mx-auto max-w-4xl px-6 py-16 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-4 text-3xl font-semibold">Se você só precisa decorar uma senha, ela precisa proteger tudo de verdade.</h2><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Dados Seguros nasce para reduzir a fricção sem reduzir a segurança: uma experiência simples por fora e uma arquitetura criptográfica rigorosa por dentro.</p><MarketingLeadDialog defaultInterest="Dados Seguros" trigger={<Button size="lg" className="mt-7">Conhecer o plano de R$ 9,90</Button>} /></div></section>
    </main>
  );
}
