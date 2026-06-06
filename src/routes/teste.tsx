import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  FlaskConical,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";
import { PixTestGenerator } from "@/components/payments/PixTestGenerator";

export const Route = createFileRoute("/teste")({
  head: () => ({
    meta: [
      { title: "Plano TESTE — Experimente a Impulsionando por R$1,00" },
      {
        name: "description",
        content:
          "Conheça a Impulsionando com o Plano TESTE de R$1,00. Gere um Pix de teste, simule a confirmação e explore demonstrações por nicho — sem alterar sua conta.",
      },
      { property: "og:title", content: "Plano TESTE — Impulsionando" },
      {
        property: "og:description",
        content:
          "R$1,00 para experimentar a plataforma com Pix de teste e nichos prontos.",
      },
      { property: "og:url", content: "https://impulsionando.com.br/teste" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/teste" }],
  }),
  component: TestePage,
});

const TEST_NICHES: Array<{ slug: string; emoji: string }> = [
  { slug: "bares-restaurantes", emoji: "🍺" },
  { slug: "servicos", emoji: "⚖️" }, // Advocacia/serviços
  { slug: "clinicas", emoji: "🩺" },
  { slug: "fitness", emoji: "🎧" }, // DJ/Eventos rolando dentro do bloco fitness/eventos
];

function TestePage() {
  const [lead, setLead] = useState({
    name: "",
    email: "",
    document: "",
    phone: "",
    city: "",
  });
  const [started, setStarted] = useState(false);

  const canGenerate = lead.name.trim().length >= 2 && (lead.email || lead.document);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs mb-4">
            <FlaskConical className="w-3.5 h-3.5" />
            Área de testes pública
            <Badge className="ml-1 bg-amber-400 text-amber-950 hover:bg-amber-400">
              TESTE
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Experimente a Impulsionando por <span className="text-accent">R$1,00</span>
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl leading-relaxed">
            O Plano TESTE existe para você sentir a plataforma na prática: gere um
            Pix com seus dados, simule a confirmação e visite as demonstrações por
            nicho. Sem alterar sua autenticação atual e sem cobrança real.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() =>
                document
                  .getElementById("pix-teste")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Gerar Pix de teste <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Link to="/planos">Ver planos completos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* BADGE PERMANENTE — aviso ambiente teste */}
      <div className="w-full bg-amber-100 border-y border-amber-300 text-amber-900 text-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            <strong>Ambiente de teste:</strong> esta área usa o Plano TESTE
            (R$1,00). Nenhum módulo real é desbloqueado por redirect ou simulação —
            apenas pagamentos InfinitePay marcados como <code>paid</code> em{" "}
            <code>production</code> liberam acesso.
          </span>
        </div>
      </div>

      {/* OBJETIVO */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-12 grid gap-6 md:grid-cols-3">
        <Card className="p-5">
          <Sparkles className="w-5 h-5 text-primary mb-2" />
          <h3 className="font-semibold">Objetivo</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Mostrar de forma honesta como a plataforma funciona — formulários,
            geração de Pix e demos por nicho — antes de qualquer compromisso.
          </p>
        </Card>
        <Card className="p-5">
          <BadgeCheck className="w-5 h-5 text-primary mb-2" />
          <h3 className="font-semibold">Plano TESTE</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Reutiliza o checkout InfinitePay com valor simbólico de R$1,00. A
            confirmação real do pagamento é feita exclusivamente pelo webhook.
          </p>
        </Card>
        <Card className="p-5">
          <FlaskConical className="w-5 h-5 text-primary mb-2" />
          <h3 className="font-semibold">Sem alterar autenticação</h3>
          <p className="text-sm text-muted-foreground mt-1">
            A rota <code>/teste</code> é pública. Você não precisa criar conta
            para testar; nenhuma sessão é alterada.
          </p>
        </Card>
      </section>

      {/* FORMULÁRIO + PIX */}
      <section id="pix-teste" className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 pb-12">
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1">Seus dados de teste</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Usaremos esses dados apenas para compor o Pix copia e cola e o QR Code
            de teste. Nada é enviado ao servidor.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="t-name">Nome</Label>
              <Input
                id="t-name"
                value={lead.name}
                onChange={(e) => setLead({ ...lead, name: e.target.value })}
                placeholder="Ex.: Maria Silva"
              />
            </div>
            <div>
              <Label htmlFor="t-email">E-mail</Label>
              <Input
                id="t-email"
                type="email"
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
                placeholder="voce@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="t-doc">CPF/CNPJ (opcional)</Label>
              <Input
                id="t-doc"
                value={lead.document}
                onChange={(e) => setLead({ ...lead, document: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label htmlFor="t-phone">Telefone</Label>
              <Input
                id="t-phone"
                value={lead.phone}
                onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                placeholder="(21) 99999-9999"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => setStarted(true)}
              disabled={!canGenerate}
            >
              Gerar Pix de teste (R$1,00)
            </Button>
          </div>
        </Card>

        {started && canGenerate && (
          <PixTestGenerator
            lead={lead}
            amount={1}
            reference={`TESTE-${Date.now().toString(36).toUpperCase()}`}
            description="Plano TESTE Impulsionando"
          />
        )}
      </section>

      {/* CTAs / NICHOS */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-semibold mb-1">Explore demos por nicho</h2>
        <p className="text-sm text-muted-foreground mb-6">
          A mesma plataforma adaptada para diferentes negócios.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEST_NICHES.map((n) => {
            const detail = NICHO_DETAILS.find((d) => d.slug === n.slug);
            if (!detail) return null;
            return (
              <Card key={n.slug} className="p-5 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{n.emoji}</div>
                <h3 className="font-semibold leading-tight">{detail.shortLabel}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {detail.cardDesc}
                </p>
                <Button asChild variant="link" size="sm" className="px-0 mt-2">
                  <Link to="/nichos/$slug" params={{ slug: n.slug }}>
                    Ver demo <ArrowRight className="ml-1 w-3 h-3" />
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
