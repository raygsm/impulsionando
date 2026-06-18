import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Beer, QrCode, Receipt, MessageCircle, BellRing, CreditCard,
  TrendingUp, Users, ArrowRight, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20vi%20a%20hist%C3%B3ria%20da%20Beer%20House%20e%20quero%20uma%20demo.";

export const Route = createFileRoute("/demo/beer-house")({
  head: () => ({
    meta: [
      { title: "Beer House — A história contada em uma demo | Impulsionando" },
      { name: "description", content: "Acompanhe a Beer House: do QR Code na mesa ao fechamento de conta, com WhatsApp, push e dashboards consolidados." },
      { property: "og:title", content: "Beer House — Demo em forma de história" },
      { property: "og:description", content: "Como uma cervejaria fictícia usa a Impulsionando do pedido ao financeiro." },
      { property: "og:url", content: "https://impulsionando.com.br/demo/beer-house" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/beer-house" }],
  }),
  component: BeerHouseDemo,
});

type Chapter = {
  number: string;
  time: string;
  icon: React.ElementType;
  title: string;
  story: string;
  what: string[];
  modules: string[];
};

const CHAPTERS: Chapter[] = [
  {
    number: "01",
    time: "19h12 · sexta-feira",
    icon: QrCode,
    title: "A mesa 14 escaneia o QR Code",
    story: "Quatro amigos chegam na Beer House, sentam na mesa 14 e escaneiam o QR Code da mesa. Sem aplicativo, sem cadastro forçado. Em 3 segundos estão no cardápio digital com a foto de cada chopp.",
    what: [
      "Sessão de mesa aberta automaticamente (restaurant_table_sessions)",
      "Cardápio responsivo carrega em < 1s",
      "Garçom é notificado no painel que a mesa 14 está ativa",
    ],
    modules: ["Restaurante", "Cardápio digital", "Mesas"],
  },
  {
    number: "02",
    time: "19h18",
    icon: Beer,
    title: "Pedido entra direto na cozinha",
    story: "Eles pedem 4 IPAs e uma porção de batata rústica. O pedido cai direto no KDS da cozinha e no bar — sem garçom intermediário, sem comanda de papel, sem erro de digitação.",
    what: [
      "Pedido registrado em sales_orders + sales_order_items",
      "KDS sinaliza prioridade por tempo de espera",
      "Estoque baixa automaticamente (inv_movements)",
    ],
    modules: ["Pedidos", "KDS", "Estoque"],
  },
  {
    number: "03",
    time: "19h31",
    icon: BellRing,
    title: "Garçom entrega o prato — comunicação fica para o pós-visita",
    story: "As batatas saem do forno. Quem leva à mesa é o garçom — a Impulsionando não substitui o atendimento humano da operação. O sistema sinaliza ao bar e ao salão que o item está pronto, mas NÃO dispara WhatsApp avisando 'seu prato chegou'. A comunicação com o cliente é guardada para o que importa: voltar, indicar, fidelizar.",
    what: [
      "Sinal interno bar/salão (sem mensagem ao cliente)",
      "Cliente identificado na sessão para o pós-visita",
      "Dados de consumo alimentam CRM e Clube — depois",
    ],
    modules: ["Salão", "Identificação", "CRM (pós)"],
  },

  {
    number: "04",
    time: "21h47",
    icon: Receipt,
    title: "Hora de fechar a conta",
    story: "Eles pedem a conta pelo próprio celular. A divisão é igualitária entre os 4. Cada um paga sua parte por Pix ou cartão direto pelo link — sem maquininha passando de mão em mão.",
    what: [
      "Fechamento via /api/public/payments/close-invoice",
      "Idempotência garantida por chave única",
      "InfinitePay como gateway, com fallback de status",
    ],
    modules: ["Pagamentos", "Pix", "Cartão"],
  },
  {
    number: "05",
    time: "21h49",
    icon: CreditCard,
    title: "Pagamento confirma — ou falha",
    story: "Três pagam na hora. Um cartão é recusado (status: failed). O sistema notifica o cliente, libera apenas o valor pago e mantém a mesa aberta para o quarto cliente tentar de novo. Nada trava.",
    what: [
      "Webhook trata status approved / failed / expired",
      "Replay seguro disponível no painel financeiro",
      "Auditoria completa em webhook_event_log",
    ],
    modules: ["Webhook resiliente", "Replay"],
  },
  {
    number: "06",
    time: "Segunda-feira, 09h00",
    icon: TrendingUp,
    title: "Dono abre o dashboard",
    story: "Na segunda de manhã, o dono da Beer House abre o painel. Em uma tela vê: faturamento do fim de semana, mesas mais lucrativas, item mais vendido, ticket médio, e a Central de Oportunidades aponta 2 clientes inadimplentes e 1 fornecedor com pagamento atrasado.",
    what: [
      "Insights consolidados em /insights/oportunidades",
      "Severidade automática (Crítico / Atenção / Acompanhar)",
      "Drill-down em qualquer card do dashboard",
    ],
    modules: ["BI", "Insights", "Financeiro"],
  },
  {
    number: "07",
    time: "Terça-feira, 11h00",
    icon: MessageCircle,
    title: "Pós-visita: o convite para voltar",
    story: "Agora sim entra a comunicação com o cliente — não na operação, mas no relacionamento. Os 4 amigos recebem um WhatsApp curto agradecendo a visita, com um voucher para a próxima IPA e o convite para entrar no Clube Impulsionando. Quem aceita vira recorrência; quem não aceita, segue no CRM para reativação futura.",
    what: [
      "Régua pós-visita (24h–72h) por nicho",
      "Voucher pessoal + entrada opcional no Clube",
      "Reativação automática de quem não voltou em 30/60/90 dias",
    ],
    modules: ["CRM", "Clube Impulsionando", "Fidelização"],
  },
];



function BeerHouseDemo() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-amber-500/10 via-background to-background">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4">
                <Beer className="h-3 w-3 mr-1" /> Demo em forma de história
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Beer House: uma sexta-feira, do QR Code ao dashboard
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Em vez de mostrar telas soltas, acompanhe a operação real de uma cervejaria fictícia
                usando a Impulsionando. Em 6 capítulos você entende como pedido, pagamento,
                notificação e inteligência conversam — sem clicar em nada.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Quero uma demo guiada
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/demo">Ver outras demos</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="container py-16 md:py-24">
          <div className="max-w-4xl mx-auto space-y-12">
            {CHAPTERS.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <div key={ch.number} className="relative">
                  {i < CHAPTERS.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-[-3rem] w-px bg-border hidden md:block" />
                  )}
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {ch.number}
                      </div>
                    </div>
                    <Card className="flex-1 p-6 md:p-8">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Clock className="h-3 w-3" />
                            {ch.time}
                          </div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Icon className="h-6 w-6 text-primary" />
                            {ch.title}
                          </h2>
                        </div>
                      </div>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {ch.story}
                      </p>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                            O que acontece nos bastidores
                          </div>
                          <ul className="space-y-2">
                            {ch.what.map((w) => (
                              <li key={w} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                            Módulos envolvidos
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ch.modules.map((m) => (
                              <Badge key={m} variant="outline">{m}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Resilience callout */}
        <section className="border-t bg-muted/30">
          <div className="container py-16">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-4">
                <AlertTriangle className="h-3 w-3 mr-1" /> E quando algo dá errado?
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Resiliência não é opcional</h2>
              <p className="text-muted-foreground mb-8">
                Webhook que falhou? Tem replay seguro no painel financeiro com motivo registrado.
                WhatsApp travou? Push e SMS entram como canal extra com dedupe. Pagamento expirou?
                A mesa continua aberta. Tudo auditável em <code className="text-xs bg-background px-1.5 py-0.5 rounded">webhook_event_log</code>.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-left">
                <Card className="p-4">
                  <Users className="h-5 w-5 text-primary mb-2" />
                  <div className="font-semibold mb-1">Idempotência</div>
                  <div className="text-sm text-muted-foreground">
                    Reexecutar mil vezes = mesmo resultado. Sem cobrança em dobro.
                  </div>
                </Card>
                <Card className="p-4">
                  <BellRing className="h-5 w-5 text-primary mb-2" />
                  <div className="font-semibold mb-1">Multi-canal</div>
                  <div className="text-sm text-muted-foreground">
                    WhatsApp + Push/SMS com dedupe. O cliente recebe uma vez.
                  </div>
                </Card>
                <Card className="p-4">
                  <Receipt className="h-5 w-5 text-primary mb-2" />
                  <div className="font-semibold mb-1">Auditoria</div>
                  <div className="text-sm text-muted-foreground">
                    Todo evento logado com motivo, status e quem reexecutou.
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16 md:py-24">
          <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/10 via-background to-amber-500/10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sua operação merece uma história assim
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Restaurante, bar, cervejaria, food hall, dark kitchen — se você atende mesas,
              a Impulsionando se molda à sua operação em até 7 dias.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Falar com especialista
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/demo">
                  Outras demos <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
