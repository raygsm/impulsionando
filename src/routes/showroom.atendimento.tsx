import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Sparkles,
  MessageCircle,
  Instagram,
  Mail,
  MessagesSquare,
  Phone,
  Clock,
  CheckCheck,
  AlertTriangle,
  Send,
  Bot,
  Tag,
  Users,
  Smile,
  Paperclip,
} from "lucide-react";

export const Route = createFileRoute("/showroom/atendimento")({
  head: () => ({
    meta: [
      { title: "Atendimento omnichannel por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Central de atendimento omnichannel: WhatsApp, Instagram, e-mail e chat unificados — com SLA, filas inteligentes e IA por nicho.",
      },
      {
        property: "og:title",
        content: "Atendimento omnichannel — Showroom Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Demonstração navegável: caixa única, filas, tags, IA sugerindo respostas e SLA em tempo real.",
      },
    ],
  }),
  component: ShowroomAtendimento,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";
type Channel = "whatsapp" | "instagram" | "email" | "chat";

type Msg = { from: "cliente" | "agente" | "bot"; text: string; time: string };
type Conv = {
  id: string;
  channel: Channel;
  customer: string;
  preview: string;
  unread: number;
  waitMin: number;
  sla: "ok" | "atencao" | "estouro";
  tag: string;
  assigned: string;
  messages: Msg[];
  suggestion: string;
};

type Cfg = {
  label: string;
  queues: { name: string; size: number; avgWait: string }[];
  conversations: Conv[];
  agents: { name: string; status: "online" | "ocupado" | "pausa"; load: number }[];
};

const CHANNEL_META: Record<
  Channel,
  { label: string; icon: typeof MessageCircle; color: string }
> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
  instagram: { label: "Instagram", icon: Instagram, color: "text-pink-600" },
  email: { label: "E-mail", icon: Mail, color: "text-blue-600" },
  chat: { label: "Chat do site", icon: MessagesSquare, color: "text-purple-600" },
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas & Saúde",
    queues: [
      { name: "Agendamento", size: 12, avgWait: "1m 20s" },
      { name: "Resultados de exames", size: 8, avgWait: "0m 45s" },
      { name: "Convênios & faturamento", size: 5, avgWait: "3m 10s" },
      { name: "Pós-consulta", size: 4, avgWait: "2m 05s" },
    ],
    agents: [
      { name: "Patrícia Souza", status: "online", load: 6 },
      { name: "Marcelo Tavares", status: "online", load: 4 },
      { name: "Júlia Pereira", status: "ocupado", load: 8 },
      { name: "Renata Lemos", status: "pausa", load: 0 },
    ],
    conversations: [
      {
        id: "c1",
        channel: "whatsapp",
        customer: "Mariana Alves",
        preview: "Posso remarcar pra quinta às 16h?",
        unread: 2,
        waitMin: 1,
        sla: "ok",
        tag: "Agendamento",
        assigned: "Patrícia Souza",
        suggestion:
          "Olá Mariana! Confirmado: Dra. Helena, quinta 16h. Posso confirmar a remarcação?",
        messages: [
          { from: "cliente", text: "Oi, preciso remarcar minha consulta de amanhã", time: "09:41" },
          { from: "agente", text: "Claro! Pode ser quinta às 16h com a Dra. Helena?", time: "09:42" },
          { from: "cliente", text: "Posso remarcar pra quinta às 16h?", time: "09:44" },
        ],
      },
      {
        id: "c2",
        channel: "email",
        customer: "Rafael Santos",
        preview: "Quando recebo o resultado do hemograma?",
        unread: 1,
        waitMin: 18,
        sla: "atencao",
        tag: "Resultados",
        assigned: "Júlia Pereira",
        suggestion:
          "Olá Rafael, seu hemograma já está liberado no portal. Enviei o PDF anexo.",
        messages: [
          { from: "cliente", text: "Quando recebo o resultado do hemograma?", time: "08:50" },
        ],
      },
      {
        id: "c3",
        channel: "instagram",
        customer: "@helena.borges",
        preview: "Atendem o convênio Bradesco?",
        unread: 0,
        waitMin: 32,
        sla: "estouro",
        tag: "Convênios",
        assigned: "—",
        suggestion: "Atendemos sim! Posso te enviar a relação de especialidades cobertas?",
        messages: [
          { from: "cliente", text: "Atendem o convênio Bradesco?", time: "08:14" },
        ],
      },
      {
        id: "c4",
        channel: "chat",
        customer: "Visitante 8421",
        preview: "Quanto custa a consulta particular?",
        unread: 1,
        waitMin: 0,
        sla: "ok",
        tag: "Comercial",
        assigned: "Marcelo Tavares",
        suggestion: "Consulta particular: R$ 280. Posso já abrir uma agenda?",
        messages: [
          { from: "cliente", text: "Quanto custa a consulta particular?", time: "09:48" },
        ],
      },
    ],
  },
  bares: {
    label: "Bares & Restaurantes",
    queues: [
      { name: "Reservas", size: 9, avgWait: "0m 55s" },
      { name: "Eventos privados", size: 4, avgWait: "4m 20s" },
      { name: "Delivery", size: 14, avgWait: "1m 40s" },
      { name: "Reclamações", size: 2, avgWait: "2m 10s" },
    ],
    agents: [
      { name: "Carolina Brito", status: "online", load: 7 },
      { name: "Diego Martins", status: "online", load: 5 },
      { name: "Rafael Reis", status: "ocupado", load: 9 },
    ],
    conversations: [
      {
        id: "c1",
        channel: "whatsapp",
        customer: "Lucas Pinheiro",
        preview: "Quero reservar pra sábado, 8 pessoas",
        unread: 3,
        waitMin: 2,
        sla: "ok",
        tag: "Reserva",
        assigned: "Carolina Brito",
        suggestion: "Lucas, temos mesa pra 8 sábado 20h ou 22h. Qual prefere?",
        messages: [
          { from: "cliente", text: "Quero reservar pra sábado, 8 pessoas", time: "18:22" },
          { from: "cliente", text: "Pode ser com camarote?", time: "18:23" },
        ],
      },
      {
        id: "c2",
        channel: "instagram",
        customer: "@camila.r",
        preview: "Vocês têm música ao vivo essa quinta?",
        unread: 1,
        waitMin: 6,
        sla: "atencao",
        tag: "Programação",
        assigned: "Diego Martins",
        suggestion:
          "Sim! Quinta 21h tocam os Maracá Trio. Quer reservar mesa próxima ao palco?",
        messages: [
          { from: "cliente", text: "Vocês têm música ao vivo essa quinta?", time: "17:48" },
        ],
      },
      {
        id: "c3",
        channel: "email",
        customer: "RH Tech Co.",
        preview: "Orçamento confraternização 60 pessoas",
        unread: 1,
        waitMin: 45,
        sla: "estouro",
        tag: "Eventos",
        assigned: "Rafael Reis",
        suggestion:
          "Olá! Para 60 pessoas indicamos open bar 4h por R$ 99/pessoa + couvert. Posso enviar proposta?",
        messages: [
          { from: "cliente", text: "Orçamento confraternização 60 pessoas em dezembro", time: "16:30" },
        ],
      },
      {
        id: "c4",
        channel: "chat",
        customer: "Visitante 3318",
        preview: "Aceitam Pix na conta?",
        unread: 1,
        waitMin: 0,
        sla: "ok",
        tag: "Pagamento",
        assigned: "Diego Martins",
        suggestion: "Aceitamos sim — Pix, cartão e divisão por pessoa no QR code da mesa.",
        messages: [{ from: "cliente", text: "Aceitam Pix na conta?", time: "19:02" }],
      },
    ],
  },
  cervejarias: {
    label: "Microcervejarias",
    queues: [
      { name: "Tours & visitas", size: 6, avgWait: "1m 10s" },
      { name: "Clube de assinatura", size: 11, avgWait: "2m 05s" },
      { name: "B2B (bares)", size: 3, avgWait: "8m 30s" },
      { name: "Suporte e-commerce", size: 7, avgWait: "1m 50s" },
    ],
    agents: [
      { name: "Felipe Ramos", status: "online", load: 5 },
      { name: "Larissa Hoffmann", status: "online", load: 3 },
      { name: "Marina Schmidt", status: "ocupado", load: 7 },
    ],
    conversations: [
      {
        id: "c1",
        channel: "whatsapp",
        customer: "Tiago Ortega",
        preview: "Tem vaga pro tour de sábado às 15h?",
        unread: 1,
        waitMin: 0,
        sla: "ok",
        tag: "Tour",
        assigned: "Felipe Ramos",
        suggestion:
          "Tem sim! 4 vagas restantes. Reservo no seu nome com a degustação dos 5 rótulos?",
        messages: [
          { from: "cliente", text: "Tem vaga pro tour de sábado às 15h?", time: "11:18" },
        ],
      },
      {
        id: "c2",
        channel: "email",
        customer: "André Borges",
        preview: "Minha caixa de assinatura não chegou",
        unread: 1,
        waitMin: 22,
        sla: "atencao",
        tag: "Clube",
        assigned: "Larissa Hoffmann",
        suggestion:
          "Olá André, identifiquei o pedido. Já reenviamos hoje com prioridade — código de rastreio em anexo.",
        messages: [
          { from: "cliente", text: "Minha caixa de assinatura não chegou ainda", time: "10:40" },
        ],
      },
      {
        id: "c3",
        channel: "instagram",
        customer: "@bar.dorei",
        preview: "Preciso de 4 barris pra sexta",
        unread: 2,
        waitMin: 55,
        sla: "estouro",
        tag: "B2B",
        assigned: "—",
        suggestion:
          "Bom dia! Confirmo 4 barris (2 IPA + 2 Pilsen) com entrega quinta à tarde. Envio a NF agora?",
        messages: [{ from: "cliente", text: "Preciso de 4 barris pra sexta", time: "10:05" }],
      },
      {
        id: "c4",
        channel: "chat",
        customer: "Visitante 1184",
        preview: "Vocês entregam em todo Brasil?",
        unread: 1,
        waitMin: 0,
        sla: "ok",
        tag: "E-commerce",
        assigned: "Marina Schmidt",
        suggestion:
          "Entregamos em todo o país! Frete grátis acima de R$ 250 e em até 3 dias úteis no Sul/Sudeste.",
        messages: [
          { from: "cliente", text: "Vocês entregam em todo Brasil?", time: "11:32" },
        ],
      },
    ],
  },
  servicos: {
    label: "Serviços & Reformas",
    queues: [
      { name: "Orçamentos", size: 16, avgWait: "1m 30s" },
      { name: "Agendamento técnico", size: 8, avgWait: "2m 10s" },
      { name: "Pós-serviço & garantia", size: 5, avgWait: "3m 20s" },
      { name: "Emergência 24h", size: 2, avgWait: "0m 18s" },
    ],
    agents: [
      { name: "Ana Beatriz", status: "online", load: 8 },
      { name: "Eduardo Nunes", status: "online", load: 4 },
      { name: "André Cardoso", status: "ocupado", load: 6 },
    ],
    conversations: [
      {
        id: "c1",
        channel: "whatsapp",
        customer: "Família Costa",
        preview: "Preciso de orçamento pra reforma da cozinha",
        unread: 2,
        waitMin: 1,
        sla: "ok",
        tag: "Orçamento",
        assigned: "Ana Beatriz",
        suggestion:
          "Olá! Posso agendar visita técnica gratuita amanhã das 9h às 11h ou 14h às 16h?",
        messages: [
          { from: "cliente", text: "Preciso de orçamento pra reforma da cozinha", time: "08:20" },
          { from: "cliente", text: "Tenho fotos pra mandar", time: "08:21" },
        ],
      },
      {
        id: "c2",
        channel: "email",
        customer: "Edifício Aurora",
        preview: "Contrato anual de manutenção predial",
        unread: 1,
        waitMin: 14,
        sla: "atencao",
        tag: "B2B",
        assigned: "Eduardo Nunes",
        suggestion:
          "Olá! Para prédios de até 60 unidades temos plano de R$ 2.400/mês com plantão 24h. Envio proposta?",
        messages: [
          { from: "cliente", text: "Gostaria de proposta de manutenção predial anual", time: "08:06" },
        ],
      },
      {
        id: "c3",
        channel: "whatsapp",
        customer: "Joana Pacheco",
        preview: "Vazamento sob a pia! Urgente!!",
        unread: 4,
        waitMin: 0,
        sla: "ok",
        tag: "Emergência",
        assigned: "André Cardoso",
        suggestion:
          "Joana, técnico André a caminho — ETA 35 min. Por segurança, feche o registro geral.",
        messages: [
          { from: "cliente", text: "Vazamento sob a pia! Urgente!!", time: "08:45" },
          { from: "cliente", text: "Sai muita água, não consigo conter", time: "08:46" },
        ],
      },
      {
        id: "c4",
        channel: "chat",
        customer: "Visitante 7720",
        preview: "Quanto custa pintar 80m²?",
        unread: 1,
        waitMin: 5,
        sla: "atencao",
        tag: "Orçamento",
        assigned: "Ana Beatriz",
        suggestion:
          "Pintura completa com material: R$ 28/m² — ficaria R$ 2.240. Posso enviar proposta formal?",
        messages: [{ from: "cliente", text: "Quanto custa pintar 80m²?", time: "08:50" }],
      },
    ],
  },
  ecommerce: {
    label: "E-commerce & Varejo",
    queues: [
      { name: "Pré-venda", size: 18, avgWait: "0m 50s" },
      { name: "Status de pedido", size: 22, avgWait: "1m 05s" },
      { name: "Trocas & devoluções", size: 9, avgWait: "2m 40s" },
      { name: "Personal shopper", size: 4, avgWait: "3m 15s" },
    ],
    agents: [
      { name: "Sofia Mendes", status: "online", load: 9 },
      { name: "Pedro Marques", status: "online", load: 6 },
      { name: "Camila Duarte", status: "ocupado", load: 11 },
    ],
    conversations: [
      {
        id: "c1",
        channel: "whatsapp",
        customer: "Bruna Lima",
        preview: "Esse vestido tem no tam P?",
        unread: 1,
        waitMin: 0,
        sla: "ok",
        tag: "Pré-venda",
        assigned: "Sofia Mendes",
        suggestion:
          "Bruna, ainda temos 2 unidades no P. Quer que eu separe e envie link de pagamento?",
        messages: [{ from: "cliente", text: "Esse vestido tem no tam P?", time: "14:30" }],
      },
      {
        id: "c2",
        channel: "instagram",
        customer: "@marina.t",
        preview: "Quero trocar a sandália por outro número",
        unread: 1,
        waitMin: 12,
        sla: "atencao",
        tag: "Troca",
        assigned: "Pedro Marques",
        suggestion:
          "Marina, troca aprovada! Postagem grátis na agência mais próxima. Envio etiqueta agora?",
        messages: [
          { from: "cliente", text: "Quero trocar a sandália por outro número", time: "14:08" },
        ],
      },
      {
        id: "c3",
        channel: "email",
        customer: "Helena Ribeiro",
        preview: "Pedido #38291 não chegou",
        unread: 2,
        waitMin: 36,
        sla: "estouro",
        tag: "Status pedido",
        assigned: "Camila Duarte",
        suggestion:
          "Olá Helena! Identifiquei extravio no transporte. Já liberei reenvio expresso sem custo + cupom de desculpas.",
        messages: [
          { from: "cliente", text: "Meu pedido #38291 era pra ter chegado ontem", time: "13:44" },
          { from: "cliente", text: "Preciso de uma resposta", time: "14:00" },
        ],
      },
      {
        id: "c4",
        channel: "chat",
        customer: "Visitante 9912",
        preview: "Vocês têm cupom de primeira compra?",
        unread: 1,
        waitMin: 0,
        sla: "ok",
        tag: "Cupom",
        assigned: "Sofia Mendes",
        suggestion:
          "Temos! Use BEMVINDA10 e ganhe 10% off + frete grátis acima de R$ 250.",
        messages: [
          { from: "cliente", text: "Vocês têm cupom de primeira compra?", time: "14:40" },
        ],
      },
    ],
  },
};

const SLA_BADGE: Record<Conv["sla"], { label: string; cls: string }> = {
  ok: { label: "Dentro do SLA", cls: "bg-emerald-100 text-emerald-700" },
  atencao: { label: "Atenção", cls: "bg-amber-100 text-amber-700" },
  estouro: { label: "SLA estourado", cls: "bg-red-100 text-red-700" },
};

function ShowroomAtendimento() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [filter, setFilter] = useState<Channel | "todos">("todos");
  const cfg = DATA[niche];
  const [activeId, setActiveId] = useState<string>(cfg.conversations[0].id);

  const filtered = useMemo(
    () => cfg.conversations.filter((c) => filter === "todos" || c.channel === filter),
    [cfg, filter],
  );

  const active =
    cfg.conversations.find((c) => c.id === activeId) ?? cfg.conversations[0];

  const kpis = useMemo(() => {
    const all = cfg.conversations;
    return {
      open: all.length,
      sla: Math.round(
        (all.filter((c) => c.sla === "ok").length / Math.max(all.length, 1)) * 100,
      ),
      waitAvg: Math.round(all.reduce((a, c) => a + c.waitMin, 0) / Math.max(all.length, 1)),
      agents: cfg.agents.filter((a) => a.status === "online").length,
    };
  }, [cfg]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Header */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 gap-1">
                <MessagesSquare className="h-3 w-3" /> Atendimento omnichannel
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                WhatsApp, Instagram, e-mail e chat — em uma única caixa
              </h1>
              <p className="mt-3 text-pretty text-muted-foreground">
                Filas inteligentes por assunto, SLA monitorado em tempo real e IA sugerindo a
                próxima resposta. Cada conversa cai com o agente certo, sem retrabalho.
              </p>
            </div>
            <Select
              value={niche}
              onValueChange={(v) => {
                const next = v as NicheSlug;
                setNiche(next);
                setActiveId(DATA[next].conversations[0].id);
                setFilter("todos");
              }}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DATA) as NicheSlug[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {DATA[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={MessagesSquare}
            label="Conversas abertas"
            value={String(kpis.open)}
            sub="Em todos os canais"
          />
          <KpiCard
            icon={CheckCheck}
            label="SLA atingido"
            value={`${kpis.sla}%`}
            sub="Meta: 90% • últimas 24h"
          />
          <KpiCard
            icon={Clock}
            label="Tempo médio de espera"
            value={`${kpis.waitAvg} min`}
            sub="Pico nos últimos 30 min"
          />
          <KpiCard
            icon={Users}
            label="Agentes online"
            value={`${kpis.agents}/${cfg.agents.length}`}
            sub="Distribuição automática ativa"
          />
        </div>
      </section>

      {/* Inbox */}
      <section className="container mx-auto px-4 pb-10">
        <Card className="overflow-hidden">
          <div className="grid h-[640px] grid-cols-1 md:grid-cols-[280px_1fr_280px]">
            {/* Lista de conversas */}
            <div className="flex flex-col border-r">
              <div className="border-b p-3">
                <div className="mb-2 flex items-center gap-1 overflow-x-auto">
                  <FilterChip active={filter === "todos"} onClick={() => setFilter("todos")}>
                    Todos
                  </FilterChip>
                  {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
                    const meta = CHANNEL_META[c];
                    const Icon = meta.icon;
                    return (
                      <FilterChip
                        key={c}
                        active={filter === c}
                        onClick={() => setFilter(c)}
                      >
                        <Icon className={`h-3 w-3 ${meta.color}`} />
                      </FilterChip>
                    );
                  })}
                </div>
                <Input placeholder="Buscar conversa..." className="h-8 text-xs" />
              </div>
              <ul className="flex-1 divide-y overflow-y-auto">
                {filtered.map((c) => {
                  const meta = CHANNEL_META[c.channel];
                  const Icon = meta.icon;
                  const isActive = c.id === active.id;
                  return (
                    <li
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`cursor-pointer p-3 text-sm hover:bg-muted/40 ${
                        isActive ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]">
                            {c.customer
                              .replace(/[@]/g, "")
                              .split(/[ .]/)
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <Icon className={`h-3 w-3 ${meta.color}`} />
                            <p className="truncate text-xs font-semibold">{c.customer}</p>
                            {c.unread > 0 && (
                              <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                {c.unread}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                            {c.preview}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className="h-4 px-1.5 text-[10px] font-normal"
                            >
                              {c.tag}
                            </Badge>
                            <span
                              className={`rounded px-1.5 text-[10px] ${SLA_BADGE[c.sla].cls}`}
                            >
                              {c.waitMin}m
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Conversa ativa */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = CHANNEL_META[active.channel].icon;
                    return (
                      <Icon className={`h-4 w-4 ${CHANNEL_META[active.channel].color}`} />
                    );
                  })()}
                  <div>
                    <p className="text-sm font-semibold">{active.customer}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CHANNEL_META[active.channel].label} • atribuída a {active.assigned}
                    </p>
                  </div>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[11px] ${SLA_BADGE[active.sla].cls}`}>
                  {SLA_BADGE[active.sla].label}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
                {active.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.from === "cliente" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        m.from === "cliente"
                          ? "rounded-tl-sm bg-background"
                          : m.from === "bot"
                            ? "rounded-tr-sm bg-purple-100 text-purple-900"
                            : "rounded-tr-sm bg-primary text-primary-foreground"
                      }`}
                    >
                      <p>{m.text}</p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          m.from === "agente" ? "opacity-80" : "text-muted-foreground"
                        }`}
                      >
                        {m.time}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Sugestão de IA */}
                <div className="mx-auto max-w-[85%] rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                  <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Bot className="h-3 w-3" /> Resposta sugerida pela IA
                  </div>
                  <p className="text-sm">{active.suggestion}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" className="h-7">
                      Usar resposta
                    </Button>
                    <Button size="sm" variant="outline" className="h-7">
                      Editar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t p-3">
                <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                  <Smile className="h-4 w-4 text-muted-foreground" />
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite uma mensagem..."
                    className="h-7 border-0 px-0 focus-visible:ring-0"
                  />
                  <Button size="sm" className="h-7 gap-1">
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </Button>
                </div>
              </div>
            </div>

            {/* Painel lateral */}
            <div className="hidden border-l md:flex md:flex-col">
              <div className="border-b p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Filas ativas
                </p>
                <ul className="mt-2 space-y-2 text-sm">
                  {cfg.queues.map((q) => (
                    <li key={q.name} className="flex items-center justify-between">
                      <span className="truncate">{q.name}</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {q.avgWait}
                        <Badge variant="secondary" className="h-5">
                          {q.size}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-b p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Agentes
                </p>
                <ul className="mt-2 space-y-2 text-sm">
                  {cfg.agents.map((a) => (
                    <li key={a.name} className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          a.status === "online"
                            ? "bg-emerald-500"
                            : a.status === "ocupado"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`}
                      />
                      <span className="flex-1 truncate">{a.name}</span>
                      <span className="text-xs text-muted-foreground">{a.load}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Tags rápidas
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["VIP", "Reclamação", "Lead quente", "Pós-venda", "B2B", "Indicação"].map(
                    (t) => (
                      <Badge key={t} variant="outline" className="gap-1 text-[11px]">
                        <Tag className="h-3 w-3" /> {t}
                      </Badge>
                    ),
                  )}
                </div>

                <div className="mt-4 rounded-md border bg-amber-50 p-3 text-xs text-amber-800">
                  <div className="flex items-center gap-1 font-semibold">
                    <AlertTriangle className="h-3 w-3" /> Alerta de SLA
                  </div>
                  <p className="mt-1">
                    1 conversa próxima ao estouro. Realocação automática em 2 min se não atendida.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Atendimento sem deixar ninguém esperando
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Caixa unificada, IA com base no seu negócio, SLA por canal e relatórios prontos —
            tudo integrado ao CRM e ao financeiro da Impulsionando.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">
                <Phone className="mr-1 h-4 w-4" /> Falar com especialista
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom">
                Ver outros showrooms <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-colors ${
        active ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof MessagesSquare;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

export default ShowroomAtendimento;

