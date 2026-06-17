import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MessageCircle,
  CheckCheck,
  Sparkles,
  Bell,
  CalendarCheck,
  Star,
  ShoppingCart,
  Wrench,
  Beer,
} from "lucide-react";

export const Route = createFileRoute("/showroom/whatsapp")({
  head: () => ({
    meta: [
      { title: "Showroom WhatsApp — Simulador de conversas por nicho | Impulsionando" },
      {
        name: "description",
        content:
          "Veja como a Impulsionando conversa com seus clientes pelo WhatsApp: lembretes, confirmações, NPS e recuperação automatizados por nicho.",
      },
      { property: "og:title", content: "Simulador WhatsApp — Impulsionando" },
      {
        property: "og:description",
        content: "Conversas reais de lembrete, confirmação e NPS rodando pelo WhatsApp.",
      },
    ],
  }),
  component: ShowroomWhatsapp,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços (Oficinas, Estética)",
  ecommerce: "E-commerce & Delivery",
};

type Sender = "biz" | "client";
type Msg = { from: Sender; text: string; time: string };
type Flow = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  contact: string;
  messages: Msg[];
};

const FLOWS: Record<NicheSlug, Flow[]> = {
  clinicas: [
    {
      id: "lembrete",
      label: "Lembrete de consulta",
      icon: Bell,
      description: "Disparado 24h antes pela automação n8n.",
      contact: "Clínica Vitalis",
      messages: [
        {
          from: "biz",
          text:
            "Olá Marina! 👋 Passando para lembrar da sua consulta com Dra. Helena amanhã (18/06) às 14:30. Posso confirmar?",
          time: "09:02",
        },
        { from: "client", text: "Oi! Pode confirmar sim 🙏", time: "09:04" },
        {
          from: "biz",
          text:
            "Perfeito ✅ Endereço: Av. Paulista, 1200, sala 304. Em caso de imprevisto, basta responder REMARCAR.",
          time: "09:04",
        },
        { from: "client", text: "Combinado, obrigada!", time: "09:05" },
      ],
    },
    {
      id: "noshow",
      label: "Recuperação de no-show",
      icon: CalendarCheck,
      description: "Reagenda quem faltou em até 48h.",
      contact: "Clínica Vitalis",
      messages: [
        {
          from: "biz",
          text:
            "Marina, sentimos sua falta hoje 💛 Posso te ajudar a remarcar com a Dra. Helena? Tenho horários quinta 10h ou sexta 16h.",
          time: "16:10",
        },
        { from: "client", text: "Pode ser sexta 16h", time: "18:42" },
        {
          from: "biz",
          text:
            "Reagendado! 📅 Sexta, 20/06 às 16:00. Enviei o link da Google Agenda. Até lá!",
          time: "18:43",
        },
      ],
    },
    {
      id: "nps",
      label: "NPS pós-consulta",
      icon: Star,
      description: "Coleta nota e comentário 2h depois do atendimento.",
      contact: "Clínica Vitalis",
      messages: [
        {
          from: "biz",
          text:
            "Marina, como foi sua experiência com a Dra. Helena hoje? De 0 a 10, quanto você nos recomendaria?",
          time: "17:30",
        },
        { from: "client", text: "10! Atendimento impecável", time: "17:41" },
        {
          from: "biz",
          text:
            "Que alegria 🙌 Posso compartilhar seu depoimento no nosso Instagram (sem sobrenome)?",
          time: "17:41",
        },
        { from: "client", text: "Pode sim", time: "17:42" },
      ],
    },
  ],
  bares: [
    {
      id: "reserva",
      label: "Confirmação de reserva",
      icon: CalendarCheck,
      description: "Confirma reservas do fim de semana automaticamente.",
      contact: "Tap House",
      messages: [
        {
          from: "biz",
          text:
            "Fala Rafa! 🍻 Sua reserva no Tap House sábado 21h para 4 pessoas está confirmada. Responda SIM para garantir.",
          time: "10:15",
        },
        { from: "client", text: "SIM, vamos sim!", time: "11:02" },
        {
          from: "biz",
          text:
            "Top! Reservada a mesa 12 no rooftop. Em caso de atraso acima de 20min, liberamos a mesa. 🍺",
          time: "11:02",
        },
      ],
    },
    {
      id: "fidelidade",
      label: "Pontos de fidelidade",
      icon: Sparkles,
      description: "Avisa pontuação após cada visita.",
      contact: "Tap House",
      messages: [
        {
          from: "biz",
          text:
            "Valeu pela visita, Rafa! Você ganhou +80 pontos. Saldo atual: 420 pts. Faltam 80 pts para um chope IPA cortesia 🍺",
          time: "23:48",
        },
        { from: "client", text: "Aeee, semana que vem volto", time: "23:55" },
      ],
    },
    {
      id: "reativacao",
      label: "Reativação 30 dias",
      icon: Bell,
      description: "Dispara para quem não vem há um mês.",
      contact: "Tap House",
      messages: [
        {
          from: "biz",
          text:
            "Rafa, sentimos sua falta! 🍻 Volte essa semana e ganhe uma porção de bolinho de costela cortesia. Válido até domingo.",
          time: "18:00",
        },
        { from: "client", text: "Boa! Sexta a noite tem mesa pra 2?", time: "18:12" },
        { from: "biz", text: "Tem sim! 20h, mesa 7. Confirmado? ✅", time: "18:12" },
      ],
    },
  ],
  microcervejarias: [
    {
      id: "clube",
      label: "Renovação do Clube",
      icon: Beer,
      description: "Avisa cobrança recorrente e libera retirada.",
      contact: "Cervejaria Lupulândia",
      messages: [
        {
          from: "biz",
          text:
            "Olá João! 🍺 Sua assinatura Clube Lúpulo foi renovada (R$ 149,90). Já pode retirar seu kit de junho com 4 rótulos exclusivos.",
          time: "08:30",
        },
        { from: "client", text: "Show! Retiro sábado", time: "09:10" },
        {
          from: "biz",
          text:
            "Anotado. Funcionamos sáb das 12h às 22h. Bônus do mês: copo edição limitada 🥂",
          time: "09:11",
        },
      ],
    },
    {
      id: "b2b",
      label: "Lote pronto → B2B",
      icon: CheckCheck,
      description: "Notifica bares parceiros quando lote é envasado.",
      contact: "Cervejaria Lupulândia",
      messages: [
        {
          from: "biz",
          text:
            "Bom dia, Tap House! 🍻 Lote #248 (West Coast IPA) envasado hoje. Reservo 2 barris de 30L para vocês?",
          time: "07:45",
        },
        { from: "client", text: "Reserva 3 barris e 1 caixa de longneck", time: "08:02" },
        {
          from: "biz",
          text:
            "Reservado. Entrega quinta 14h. Boleto a vista com 5% off já no e-mail 📨",
          time: "08:03",
        },
      ],
    },
  ],
  servicos: [
    {
      id: "os",
      label: "Atualização de OS",
      icon: Wrench,
      description: "Cliente acompanha cada etapa do serviço.",
      contact: "Auto Center Speed",
      messages: [
        {
          from: "biz",
          text:
            "Oi Pedro! Sua OS #4421 (revisão 30k) está em andamento. Etapa atual: troca de óleo e filtros. Previsão de entrega: hoje 17h.",
          time: "10:20",
        },
        { from: "client", text: "Beleza, obrigado pelo aviso", time: "10:25" },
        {
          from: "biz",
          text:
            "Pedro, identificamos pastilhas no limite. Foto e orçamento R$ 280. Aprova?",
          time: "13:10",
        },
        { from: "client", text: "Aprovado", time: "13:14" },
      ],
    },
    {
      id: "cobranca",
      label: "Cobrança automática",
      icon: Bell,
      description: "Pix gerado e enviado quando OS é finalizada.",
      contact: "Auto Center Speed",
      messages: [
        {
          from: "biz",
          text:
            "Pedro, sua OS #4421 está pronta ✅ Total: R$ 720,00. Pix copia-e-cola abaixo (válido 30min).",
          time: "16:55",
        },
        { from: "client", text: "Pago! Comprovante enviado", time: "17:01" },
        { from: "biz", text: "Confirmado ✅ Chaves no balcão. Até a próxima!", time: "17:02" },
      ],
    },
  ],
  ecommerce: [
    {
      id: "carrinho",
      label: "Carrinho abandonado",
      icon: ShoppingCart,
      description: "Recupera carrinho 1h após abandono.",
      contact: "Loja Origem",
      messages: [
        {
          from: "biz",
          text:
            "Carla, vimos que você esqueceu seu carrinho 🛒 Tênis Origem Run 39 + meia esportiva = R$ 389. Cupom VOLTA10 dá 10% off por 2h.",
          time: "20:30",
        },
        { from: "client", text: "Frete é grátis?", time: "20:42" },
        {
          from: "biz",
          text:
            "Para SP capital, sim! Posso reservar seu carrinho com o cupom aplicado? 🧡",
          time: "20:43",
        },
        { from: "client", text: "Pode! Finalizo agora", time: "20:44" },
      ],
    },
    {
      id: "rastreio",
      label: "Rastreio do pedido",
      icon: CheckCheck,
      description: "Atualiza status a cada movimentação do Melhor Envio.",
      contact: "Loja Origem",
      messages: [
        {
          from: "biz",
          text: "Pedido #7821 saiu para entrega 🚚 Previsão: hoje até 18h.",
          time: "09:10",
        },
        {
          from: "biz",
          text: "Entregue ✅ Obrigado por comprar com a gente, Carla!",
          time: "14:32",
        },
        { from: "client", text: "Chegou rapidíssimo, amei!", time: "14:50" },
      ],
    },
    {
      id: "recompra",
      label: "Recompra programada",
      icon: Sparkles,
      description: "Sugere reposição com base no consumo anterior.",
      contact: "Loja Origem",
      messages: [
        {
          from: "biz",
          text:
            "Carla, faz 60 dias da sua última compra do gel pós-treino 💪 Quer que eu reserve 2 unidades com 15% off?",
          time: "11:00",
        },
        { from: "client", text: "Reserva sim, manda o pix", time: "11:08" },
      ],
    },
  ],
};

function ShowroomWhatsapp() {
  const [nicho, setNicho] = useState<NicheSlug>("clinicas");
  const flows = useMemo(() => FLOWS[nicho], [nicho]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <MessageCircle className="h-3 w-3" /> Showroom WhatsApp
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Conversas reais, no canal favorito dos seus clientes
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Lembretes, confirmações, NPS e recuperação automatizados por nicho — disparados pelo
              n8n e respondidos pelo seu time direto na caixa unificada da Impulsionando.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Simulador por nicho</h2>
            <p className="mt-1 text-muted-foreground">
              Escolha um segmento e navegue pelos fluxos prontos da Impulsionando.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <Select value={nicho} onValueChange={(v) => setNicho(v as NicheSlug)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NICHO_LABEL) as NicheSlug[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {NICHO_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue={flows[0]?.id} value={undefined} key={nicho}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            {flows.map((f) => {
              const Icon = f.icon;
              return (
                <TabsTrigger
                  key={f.id}
                  value={f.id}
                  className="gap-2 rounded-full border bg-card px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {f.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {flows.map((f) => (
            <TabsContent key={f.id} value={f.id} className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <Card className="flex flex-col overflow-hidden border-emerald-200/40">
                  <div className="flex items-center gap-3 border-b bg-emerald-600 px-4 py-3 text-emerald-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{f.contact}</p>
                      <p className="text-xs text-emerald-100">online · WhatsApp Business API</p>
                    </div>
                  </div>
                  <div
                    className="flex flex-col gap-3 px-4 py-6"
                    style={{
                      background:
                        "repeating-linear-gradient(45deg, hsl(var(--muted)/0.3) 0 2px, transparent 2px 14px)",
                    }}
                  >
                    {f.messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.from === "biz" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            m.from === "biz"
                              ? "rounded-tl-sm bg-card"
                              : "rounded-tr-sm bg-emerald-100 text-emerald-950"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                            <span>{m.time}</span>
                            {m.from === "client" && (
                              <CheckCheck className="h-3 w-3 text-sky-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="flex flex-col gap-4 p-6">
                  <Badge variant="secondary" className="w-fit gap-1">
                    <Sparkles className="h-3 w-3" /> Fluxo pronto
                  </Badge>
                  <h3 className="text-xl font-semibold leading-tight">{f.label}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <p className="font-medium">O que está rodando por trás</p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>• Gatilho automatizado no n8n</li>
                      <li>• Template aprovado pela Meta (HSM)</li>
                      <li>• Resposta cai na Caixa Unificada do time</li>
                      <li>• Métricas em /dashboards & /relatorios</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/showroom/automacoes">Ver automações</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/showroom/integracoes">Ver integrações</Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Quer ver no seu nicho?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Configuramos templates, automações e o número oficial Meta para sua operação em poucos
            dias.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/">Voltar ao hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
