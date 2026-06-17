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
import {
  Inbox,
  MessageCircle,
  Mail,
  Instagram,
  Facebook,
  Phone,
  Sparkles,
  Search,
  Clock,
  CheckCheck,
  Tag,
} from "lucide-react";

export const Route = createFileRoute("/showroom/caixa-unificada")({
  head: () => ({
    meta: [
      { title: "Showroom Caixa Unificada — Inbox omnichannel | Impulsionando" },
      {
        name: "description",
        content:
          "WhatsApp, e-mail, Instagram, Messenger e telefone num só lugar. Filas, etiquetas e SLAs por nicho na Caixa Unificada da Impulsionando.",
      },
      { property: "og:title", content: "Caixa Unificada — Impulsionando" },
      {
        property: "og:description",
        content: "Inbox omnichannel com filas e SLA por nicho.",
      },
    ],
  }),
  component: ShowroomCaixaUnificada,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços (Oficinas, Estética)",
  ecommerce: "E-commerce & Delivery",
};

type Channel = "whatsapp" | "email" | "instagram" | "messenger" | "phone";

const CHANNEL_META: Record<
  Channel,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
  email: { label: "E-mail", icon: Mail, color: "text-sky-600" },
  instagram: { label: "Instagram", icon: Instagram, color: "text-pink-600" },
  messenger: { label: "Messenger", icon: Facebook, color: "text-blue-600" },
  phone: { label: "Telefone", icon: Phone, color: "text-amber-600" },
};

type Conversation = {
  id: string;
  contact: string;
  channel: Channel;
  preview: string;
  time: string;
  unread: number;
  queue: string;
  sla: "ok" | "warn" | "late";
  tags: string[];
};

const QUEUES: Record<NicheSlug, string[]> = {
  clinicas: ["Recepção", "Agendamento", "Pós-consulta", "Financeiro"],
  bares: ["Reservas", "Delivery", "Eventos", "SAC"],
  microcervejarias: ["Clube de assinatura", "B2B / Bares", "Loja física", "Visitação"],
  servicos: ["Orçamentos", "OS em andamento", "Pós-serviço", "Cobrança"],
  ecommerce: ["Pré-venda", "Pedidos", "Trocas & devoluções", "Logística"],
};

const CONVERSATIONS: Record<NicheSlug, Conversation[]> = {
  clinicas: [
    {
      id: "c1",
      contact: "Marina Soares",
      channel: "whatsapp",
      preview: "Pode confirmar sim 🙏",
      time: "09:04",
      unread: 0,
      queue: "Agendamento",
      sla: "ok",
      tags: ["confirmação", "dra. helena"],
    },
    {
      id: "c2",
      contact: "Lucas Pereira",
      channel: "instagram",
      preview: "Vocês atendem convênio Bradesco?",
      time: "10:12",
      unread: 2,
      queue: "Recepção",
      sla: "warn",
      tags: ["convênio"],
    },
    {
      id: "c3",
      contact: "Renata Lima",
      channel: "email",
      preview: "Segue boleto da próxima sessão.",
      time: "ontem",
      unread: 0,
      queue: "Financeiro",
      sla: "ok",
      tags: ["financeiro"],
    },
    {
      id: "c4",
      contact: "José Carlos",
      channel: "phone",
      preview: "Chamada perdida — pedido de retorno.",
      time: "08:45",
      unread: 1,
      queue: "Recepção",
      sla: "late",
      tags: ["urgente"],
    },
  ],
  bares: [
    {
      id: "b1",
      contact: "Rafa Andrade",
      channel: "whatsapp",
      preview: "SIM, vamos sim!",
      time: "11:02",
      unread: 0,
      queue: "Reservas",
      sla: "ok",
      tags: ["sábado", "rooftop"],
    },
    {
      id: "b2",
      contact: "Carla Mendes",
      channel: "instagram",
      preview: "Tem opção vegana no menu?",
      time: "13:25",
      unread: 3,
      queue: "SAC",
      sla: "warn",
      tags: ["cardápio"],
    },
    {
      id: "b3",
      contact: "Time RH Acme",
      channel: "email",
      preview: "Orçamento para confra de 40 pessoas",
      time: "ontem",
      unread: 1,
      queue: "Eventos",
      sla: "ok",
      tags: ["b2b", "confra"],
    },
  ],
  microcervejarias: [
    {
      id: "m1",
      contact: "João Vitor",
      channel: "whatsapp",
      preview: "Show! Retiro sábado",
      time: "09:10",
      unread: 0,
      queue: "Clube de assinatura",
      sla: "ok",
      tags: ["clube"],
    },
    {
      id: "m2",
      contact: "Tap House (compras)",
      channel: "email",
      preview: "Reserva 3 barris e 1 caixa longneck",
      time: "08:02",
      unread: 0,
      queue: "B2B / Bares",
      sla: "ok",
      tags: ["lote-248", "ipa"],
    },
    {
      id: "m3",
      contact: "Visita Aniversário",
      channel: "instagram",
      preview: "Tem tour neste sábado?",
      time: "14:40",
      unread: 4,
      queue: "Visitação",
      sla: "warn",
      tags: ["tour"],
    },
  ],
  servicos: [
    {
      id: "s1",
      contact: "Pedro Garcia",
      channel: "whatsapp",
      preview: "Aprovado",
      time: "13:14",
      unread: 0,
      queue: "OS em andamento",
      sla: "ok",
      tags: ["OS-4421", "pastilhas"],
    },
    {
      id: "s2",
      contact: "Aline Souza",
      channel: "messenger",
      preview: "Quanto fica revisão completa do HB20?",
      time: "10:00",
      unread: 2,
      queue: "Orçamentos",
      sla: "warn",
      tags: ["orçamento"],
    },
    {
      id: "s3",
      contact: "Rodrigo F.",
      channel: "phone",
      preview: "Retorno para fechar pagamento parcelado.",
      time: "ontem",
      unread: 1,
      queue: "Cobrança",
      sla: "late",
      tags: ["parcelar"],
    },
  ],
  ecommerce: [
    {
      id: "e1",
      contact: "Carla Origem",
      channel: "whatsapp",
      preview: "Pode! Finalizo agora",
      time: "20:44",
      unread: 0,
      queue: "Pré-venda",
      sla: "ok",
      tags: ["cupom-volta10"],
    },
    {
      id: "e2",
      contact: "Bruno T.",
      channel: "email",
      preview: "Pedido #7790 chegou com defeito",
      time: "11:20",
      unread: 1,
      queue: "Trocas & devoluções",
      sla: "warn",
      tags: ["troca", "defeito"],
    },
    {
      id: "e3",
      contact: "Mariana DM",
      channel: "instagram",
      preview: "Tem o tênis na 37?",
      time: "16:08",
      unread: 5,
      queue: "Pré-venda",
      sla: "warn",
      tags: ["estoque"],
    },
    {
      id: "e4",
      contact: "Melhor Envio",
      channel: "email",
      preview: "Etiqueta #7821 entregue ✅",
      time: "14:32",
      unread: 0,
      queue: "Logística",
      sla: "ok",
      tags: ["rastreio"],
    },
  ],
};

const SLA_STYLES: Record<Conversation["sla"], { label: string; cls: string }> = {
  ok: { label: "no SLA", cls: "bg-emerald-100 text-emerald-700" },
  warn: { label: "atenção", cls: "bg-amber-100 text-amber-700" },
  late: { label: "atrasado", cls: "bg-rose-100 text-rose-700" },
};

function ShowroomCaixaUnificada() {
  const [nicho, setNicho] = useState<NicheSlug>("clinicas");
  const [activeQueue, setActiveQueue] = useState<string>("all");

  const queues = QUEUES[nicho];
  const list = CONVERSATIONS[nicho];

  const filtered = useMemo(
    () => (activeQueue === "all" ? list : list.filter((c) => c.queue === activeQueue)),
    [list, activeQueue],
  );

  const stats = useMemo(() => {
    const total = list.length;
    const unread = list.reduce((a, c) => a + c.unread, 0);
    const late = list.filter((c) => c.sla === "late").length;
    return { total, unread, late };
  }, [list]);

  const selected = filtered[0];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Inbox className="h-3 w-3" /> Caixa Unificada
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Todos os canais do seu cliente num só lugar
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              WhatsApp, e-mail, Instagram, Messenger e telefone com filas, etiquetas e SLA por
              nicho. Seu time atende mais rápido sem trocar de aba.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Inbox por nicho</h2>
            <p className="mt-1 text-muted-foreground">
              Escolha um segmento para ver as filas e conversas típicas.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <Select
              value={nicho}
              onValueChange={(v) => {
                setNicho(v as NicheSlug);
                setActiveQueue("all");
              }}
            >
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

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Conversas abertas</p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Não lidas</p>
            <p className="mt-1 text-2xl font-bold text-primary">{stats.unread}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Fora do SLA</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{stats.late}</p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-[220px_1fr_360px]">
            {/* Filas */}
            <div className="border-b bg-muted/30 p-3 lg:border-b-0 lg:border-r">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filas
              </p>
              <div className="flex flex-row flex-wrap gap-1 lg:flex-col">
                <button
                  onClick={() => setActiveQueue("all")}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                    activeQueue === "all"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span>Todas</span>
                  <Badge variant="secondary" className="ml-2 h-5">
                    {list.length}
                  </Badge>
                </button>
                {queues.map((q) => {
                  const count = list.filter((c) => c.queue === q).length;
                  return (
                    <button
                      key={q}
                      onClick={() => setActiveQueue(q)}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                        activeQueue === q
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="truncate">{q}</span>
                      <Badge variant="secondary" className="ml-2 h-5">
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista */}
            <div className="border-b lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Buscar conversas, etiquetas, contato…"
                />
              </div>
              <ul className="divide-y">
                {filtered.map((c) => {
                  const Ch = CHANNEL_META[c.channel];
                  const Icon = Ch.icon;
                  const sla = SLA_STYLES[c.sla];
                  return (
                    <li key={c.id} className="flex gap-3 px-4 py-3 hover:bg-muted/40">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <span className="text-sm font-semibold">
                          {c.contact
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-card ${Ch.color}`}
                        >
                          <Icon className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{c.contact}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {c.time}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{c.preview}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${sla.cls}`}>
                            <Clock className="mr-0.5 inline h-3 w-3" /> {sla.label}
                          </span>
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                            >
                              <Tag className="mr-0.5 inline h-3 w-3" />
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      {c.unread > 0 && (
                        <Badge className="ml-1 self-start">{c.unread}</Badge>
                      )}
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma conversa nesta fila.
                  </li>
                )}
              </ul>
            </div>

            {/* Detalhe */}
            <div className="hidden flex-col lg:flex">
              {selected ? (
                <>
                  <div className="flex items-center gap-3 border-b px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {selected.contact
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{selected.contact}</p>
                      <p className="text-xs text-muted-foreground">
                        {CHANNEL_META[selected.channel].label} · {selected.queue}
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCheck className="h-3 w-3" /> atribuído
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-3 bg-muted/20 p-4 text-sm">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card p-3 shadow-sm">
                      Olá! Como posso ajudar?
                      <div className="mt-1 text-right text-[10px] text-muted-foreground">
                        08:50
                      </div>
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-emerald-100 p-3 text-emerald-950 shadow-sm">
                      {selected.preview}
                      <div className="mt-1 text-right text-[10px] text-emerald-800">
                        {selected.time}
                      </div>
                    </div>
                  </div>
                  <div className="border-t p-3 text-xs text-muted-foreground">
                    <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                    Sugestão IA: enviar template de confirmação e marcar como resolvido.
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
                  Selecione uma conversa.
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Unifique seus canais</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Conectamos WhatsApp Business API, e-mail com sua marca, Instagram, Messenger e
            telefone numa caixa só — com filas, SLA e relatórios prontos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/whatsapp">Ver WhatsApp</Link>
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
