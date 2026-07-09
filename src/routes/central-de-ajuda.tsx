import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LifeBuoy, MessageCircle, BookOpen, Compass, Search, ArrowRight,
  CreditCard, Settings, Users, Sparkles, Building2,
} from "lucide-react";

type Faq = { q: string; a: string };
type Group = { key: string; label: string; faqs: Faq[] };

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20Impulsionando.";

const GROUPS: Group[] = [
  {
    key: "geral", label: "Começando",
    faqs: [
      { q: "O que é o Impulsionando?", a: "Um sistema operacional completo para o seu negócio: CRM, agenda, vendas, financeiro, fiscal, WhatsApp oficial, marketing automático, pagamentos e marketplace — tudo integrado, com IA embarcada e adaptado ao seu nicho." },
      { q: "Em quanto tempo consigo começar a usar?", a: "Após a contratação via Pix, o ambiente é provisionado em até 5 minutos. O onboarding guiado leva o time pelos 15 passos essenciais (cadastro, equipe, WhatsApp, integrações)." },
      { q: "Preciso ter conhecimento técnico?", a: "Não. O sistema é operado por qualquer pessoa do time. Para configurações avançadas (WhatsApp oficial, emissão fiscal, gateways), nosso suporte conduz junto." },
      { q: "Como funciona o teste?", a: "Você pode rodar o simulador completo na demonstração e usar o trial de 7 dias para experimentar o sistema com seus dados reais antes de assinar." },
    ],
  },
  {
    key: "planos", label: "Planos e contratação",
    faqs: [
      { q: "Quais planos existem?", a: "Essencial, Integrado e Avançado. Há também planos sob medida para operações complexas ou white label." },
      { q: "Tem fidelidade?", a: "Não. Os planos são mensais ou anuais, com economia no anual. Você pode cancelar a qualquer momento." },
      { q: "Posso trocar de plano depois?", a: "Sim, a qualquer momento. Upgrade entra na hora; downgrade na próxima fatura." },
      { q: "O que está incluso no setup?", a: "Provisionamento do ambiente, conexão do WhatsApp oficial, importação inicial de leads/clientes, ajuste fiscal e treinamento do time." },
    ],
  },
  {
    key: "pagamento", label: "Pagamento e cobrança",
    faqs: [
      { q: "Quais formas de pagamento?", a: "Pix (aprovação em segundos), cartão de crédito (até 12x) e boleto bancário. O Pix é o caminho mais rápido — em 1 minuto você está dentro." },
      { q: "Como funciona a primeira mensalidade?", a: "A primeira fatura cobra o setup + 1ª mensalidade. A partir do mês seguinte, apenas a recorrência mensal." },
      { q: "Como cancelo?", a: "Pelo painel ou abrindo um ticket. Sem multa, sem burocracia." },
      { q: "Vocês emitem nota fiscal?", a: "Sim. NFS-e emitida automaticamente a cada cobrança." },
    ],
  },
  {
    key: "tecnico", label: "Funcionamento técnico",
    faqs: [
      { q: "O sistema funciona no celular?", a: "Sim. É 100% responsivo e tem PWA — instala como app no celular do time." },
      { q: "Meus dados ficam seguros?", a: "Sim. Infraestrutura na nuvem com backups diários, LGPD em dia, segregação por tenant, RLS no banco e criptografia em trânsito e em repouso." },
      { q: "Existe API/integração?", a: "Sim. API REST + webhooks, integrações nativas com Mercado Pago, WhatsApp oficial, emissores fiscais, N8N e mais." },
      { q: "Tem aplicativo white label?", a: "Sim. Plano White Label entrega site, painel e app com sua marca, domínio e identidade." },
    ],
  },
];

const SHORTCUTS = [
  { to: "/abrir-ticket", icon: LifeBuoy, title: "Abrir ticket", description: "Resposta em até 1 dia útil." },
  { to: "/onboarding-guiado", icon: Compass, title: "Onboarding guiado", description: "15 passos do zero ao automático." },
  { to: "/contato", icon: MessageCircle, title: "Falar com consultor", description: "Reunião com especialista." },
  { to: "/canal-oficial", icon: Building2, title: "Canal oficial", description: "WhatsApp e identidade." },
];

const NICHE_FAQ: Record<string, Faq[]> = {
  clinicas: [
    { q: "Atende prontuário eletrônico?", a: "Sim — prontuário, evolução, prescrição, agenda multiprofissional, telemedicina e teleconsulta." },
    { q: "Tem fila e confirmação de consulta?", a: "Sim, com lembrete automático via WhatsApp, lista de espera e reaproveitamento de horários cancelados." },
  ],
  "bares-restaurantes": [
    { q: "Tem PDV e KDS (cozinha)?", a: "Sim — PDV, comandas por mesa, KDS por estação, fechamento por pessoa e split de conta." },
    { q: "QR Code de mesa funciona?", a: "Sim. Cardápio digital, pedido pelo QR, pagamento na mesa e integração com cozinha." },
  ],
  imobiliaria: [
    { q: "Distribui leads por corretor?", a: "Sim. Roleta inteligente, regras por região/produto, SLA por corretor e blast para parceiros." },
    { q: "Gera contrato e ficha de visita?", a: "Sim. Contratos digitais com assinatura eletrônica, propostas e gestão de visitas." },
  ],
  ecommerce: [
    { q: "Tem checkout próprio?", a: "Sim. Checkout otimizado, Pix instantâneo, recuperação de carrinho automática e antifraude." },
    { q: "Integra com transportadoras?", a: "Sim. Cálculo de frete em tempo real, etiquetas, rastreamento e múltiplos CDs." },
  ],
  servicos: [
    { q: "Funciona para prestador autônomo?", a: "Sim. Agenda, orçamento, contrato, recebimento e nota fiscal — tudo em um lugar." },
    { q: "Tem ordem de serviço?", a: "Sim. OS com check-in/check-out, fotos, peças, mão de obra e fechamento financeiro." },
  ],
};

function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function AjudaPage() {
  const [query, setQuery] = useState("");

  const allFaqs = GROUPS.flatMap((g) => g.faqs.map((f) => ({ ...f, group: g.label })));
  const filtered = query.trim().length > 1
    ? allFaqs.filter((f) =>
        f.q.toLowerCase().includes(query.toLowerCase()) ||
        f.a.toLowerCase().includes(query.toLowerCase()))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-5xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-2">Central de Ajuda</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Como podemos ajudar?</h1>
          <p className="text-muted-foreground">Busque sua dúvida, abra um ticket ou fale com o time.</p>
        </div>

        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar (ex: Pix, WhatsApp, fiscal, cancelar)..."
            className="pl-10 h-12"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.to} to={s.to as any} className="group">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardContent className="pt-6 text-center">
                    <Icon className="w-7 h-7 mx-auto mb-2 text-primary" />
                    <div className="font-semibold text-sm">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.description}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {filtered ? (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="text-base">{filtered.length} resultado(s) para "{query}"</CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Nada encontrado.{" "}
                  <Link to="/abrir-ticket" className="text-primary underline">Abrir um ticket</Link>?
                </div>
              ) : (
                <Accordion type="multiple">
                  {filtered.map((f, i) => (
                    <AccordionItem key={i} value={`r-${i}`}>
                      <AccordionTrigger className="text-left">
                        <span><Badge variant="outline" className="mr-2">{f.group}</Badge>{f.q}</span>
                      </AccordionTrigger>
                      <AccordionContent>{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="geral" className="mb-10">
            <TabsList className="flex flex-wrap h-auto">
              {GROUPS.map((g) => (
                <TabsTrigger key={g.key} value={g.key}>{g.label}</TabsTrigger>
              ))}
            </TabsList>
            {GROUPS.map((g) => (
              <TabsContent key={g.key} value={g.key}>
                <Card>
                  <CardContent className="pt-6">
                    <Accordion type="multiple">
                      {g.faqs.map((f, i) => (
                        <AccordionItem key={i} value={`${g.key}-${i}`}>
                          <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                          <AccordionContent>{f.a}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> FAQ por nicho
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(NICHE_FAQ).map(([slug, faqs]) => (
              <Card key={slug}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{slug.replace(/-/g, " ")}</CardTitle>
                  <CardDescription>
                    <Link to="/nichos/$slug" params={{ slug }} className="text-primary text-xs hover:underline">
                      ver página completa <ArrowRight className="w-3 h-3 inline" />
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple">
                    {faqs.map((f, i) => (
                      <AccordionItem key={i} value={`${slug}-${i}`}>
                        <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
                        <AccordionContent className="text-sm">{f.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="bg-primary/5 border-primary">
          <CardHeader>
            <CardTitle>Não achou o que procurava?</CardTitle>
            <CardDescription>Nosso time responde em até 1 dia útil. Prefere conversar agora? O Impulsionito ajuda em segundos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild className="btn-alive focus-ring"><Link to="/abrir-ticket">Abrir ticket</Link></Button>
            <Button
              variant="outline"
              className="focus-ring"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("impulsionito:open"));
                }
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Falar com Impulsionito
            </Button>
            <Button asChild variant="outline" className="focus-ring"><Link to="/contato">Falar com consultor</Link></Button>
            <Button asChild variant="ghost" className="focus-ring"><Link to="/onboarding-guiado">Ver onboarding guiado</Link></Button>
          </CardContent>
        </Card>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(allFaqs)) }}
      />
    </div>
  );
}

export const Route = createFileRoute("/central-de-ajuda")({
  head: () => ({
    meta: [
      { title: "Central de Ajuda | Impulsionando" },
      { name: "description", content: "FAQ por nicho, abertura de ticket, WhatsApp oficial e onboarding guiado em um só lugar." },
    ],
  }),
  component: AjudaPage,
});
