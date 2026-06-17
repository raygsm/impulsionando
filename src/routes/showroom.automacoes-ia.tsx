import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Bot,
  Sparkles,
  Zap,
  Brain,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Play,
  Clock,
  Wand2,
  PenLine,
  Mail,
  Phone,
  Calendar,
  Lightbulb,
} from "lucide-react";

export const Route = createFileRoute("/showroom/automacoes-ia")({
  head: () => ({
    meta: [
      { title: "Copilot de IA por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "IA que sugere a próxima ação, escreve respostas, dispara automações e prevê comportamento — adaptada por nicho.",
      },
      {
        property: "og:title",
        content: "Copilot de IA — Showroom Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Demonstração navegável: insights inteligentes, redator de IA, automações no-code e simulador de previsões.",
      },
    ],
  }),
  component: ShowroomAutomacoesIA,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Insight = {
  title: string;
  desc: string;
  impact: string;
  severity: "info" | "warn" | "ok";
};
type Automation = {
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  saved: string;
};
type Template = { label: string; prompt: string; sample: string };
type Forecast = { label: string; current: number; predicted: number; unit: "currency" | "count" };

type Cfg = {
  label: string;
  insights: Insight[];
  automations: Automation[];
  templates: Template[];
  forecasts: Forecast[];
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtInt = (n: number) => n.toLocaleString("pt-BR");

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas & Saúde",
    insights: [
      {
        title: "12 pacientes com retorno em atraso",
        desc: "Cardiologia: pacientes sem retorno há mais de 180 dias. Receita potencial recuperável.",
        impact: "+R$ 3.840 em 7 dias",
        severity: "warn",
      },
      {
        title: "Quinta às 10h é seu pico de no-show",
        desc: "Histórico mostra 22% de faltas neste horário. Sugiro confirmação 4h antes + lista de espera ativa.",
        impact: "-18% faltas projetadas",
        severity: "info",
      },
      {
        title: "Dra. Helena tem 96% de NPS",
        desc: "Promova ela em campanhas de Dermatologia — conversão 2,4x acima da média.",
        impact: "+R$ 6.200/mês",
        severity: "ok",
      },
    ],
    automations: [
      { name: "Confirmação inteligente 24h antes", trigger: "Consulta agendada", action: "WhatsApp + e-mail com 1 clique para confirmar/remarcar", active: true, saved: "9h/sem" },
      { name: "Reativação de pacientes inativos", trigger: "Sem consulta há 180d", action: "Mensagem personalizada por especialidade + cupom de retorno", active: true, saved: "R$ 2.400/mês" },
      { name: "Recuperação de no-show", trigger: "Falta confirmada", action: "Convite imediato para lista de espera + reagendamento sugerido", active: true, saved: "12 vagas/mês" },
      { name: "Pós-atendimento + NPS", trigger: "Consulta finalizada", action: "Pergunta NPS + envio do resumo + agenda de retorno", active: false, saved: "—" },
    ],
    templates: [
      {
        label: "Reativar paciente",
        prompt: "Reativar paciente inativo há 6 meses com tom acolhedor",
        sample:
          "Olá, {{nome}}! Sentimos sua falta na Clínica Vitalis. Sua saúde merece atenção — vamos agendar seu check-up de retorno? Como cliente, você tem 20% off em consultas até o fim do mês. Posso te encaixar essa semana?",
      },
      {
        label: "Confirmar consulta",
        prompt: "Confirmar consulta de amanhã, leve e claro",
        sample:
          "Oi, {{nome}}! Lembrando do seu horário com {{profissional}} amanhã às {{horario}}. Responda 1️⃣ Confirmo, 2️⃣ Remarcar, 3️⃣ Cancelar. Tudo certo? 😊",
      },
      {
        label: "Resultado disponível",
        prompt: "Avisar que resultado de exame está liberado",
        sample:
          "Olá, {{nome}}! Seu resultado de {{exame}} já está disponível no portal. Quer que eu agende uma consulta de avaliação com {{profissional}}? Tenho horários nesta semana.",
      },
    ],
    forecasts: [
      { label: "Receita mês corrente", current: 482000, predicted: 524000, unit: "currency" },
      { label: "Consultas previstas", current: 1842, predicted: 1980, unit: "count" },
      { label: "Taxa de no-show", current: 14, predicted: 9, unit: "count" },
    ],
  },
  bares: {
    label: "Bares & Restaurantes",
    insights: [
      {
        title: "Sábado pode estourar capacidade",
        desc: "Previsão de 320 pessoas com base no fluxo das últimas 6 semanas + clima previsto.",
        impact: "Sugiro abrir camarote extra",
        severity: "warn",
      },
      {
        title: "Mesa 7 gira 30% mais lento",
        desc: "Localização perto da cozinha. Reorganizar layout pode liberar 2 mesas adicionais.",
        impact: "+R$ 1.200/noite",
        severity: "info",
      },
      {
        title: "Drink autoral 'Solstício' viralizou",
        desc: "180 menções no Instagram esta semana. Sugiro destaque no menu + combo com petisco.",
        impact: "+22% ticket médio",
        severity: "ok",
      },
    ],
    automations: [
      { name: "Confirmação de reserva 2h antes", trigger: "Reserva criada", action: "WhatsApp pedindo confirmação + sugestão de couvert", active: true, saved: "11h/sem" },
      { name: "Recuperação de no-show de mesa", trigger: "Reserva não compareceu", action: "Convite para lista de espera + cupom para volta", active: true, saved: "8 mesas/sem" },
      { name: "Birthday club", trigger: "Aniversário do cliente", action: "Envio 7 dias antes com drink grátis + bolo opcional", active: true, saved: "R$ 4.800/mês" },
      { name: "Pós-visita + review", trigger: "Conta paga", action: "Pergunta NPS + convite Google review (se NPS ≥ 9)", active: false, saved: "—" },
    ],
    templates: [
      {
        label: "Convidar para o sábado",
        prompt: "Convidar cliente VIP para o sábado com música ao vivo",
        sample:
          "Salve, {{nome}}! Sábado tem som ao vivo com os Maracá Trio e seu camarote favorito tá liberado. Quer reservar pra você + galera? Garanto chopp de boas-vindas 🍻",
      },
      {
        label: "Pedido de review",
        prompt: "Pedir review pós-visita com tom descontraído",
        sample:
          "E aí, {{nome}}! Foi top te receber ontem 🍻 Curtiu? Se sim, deixa uma estrelinha aqui pra gente: {{link}}. Demora 30s e ajuda demais!",
      },
      {
        label: "Reativar inativo",
        prompt: "Reativar cliente que não vai há 2 meses",
        sample:
          "Faz tempo que não rola um chopp seu por aqui, {{nome}}! Tá com saudade? Te dou um drink autoral por conta da casa quando você voltar. Quando aparece?",
      },
    ],
    forecasts: [
      { label: "Faturamento da semana", current: 84000, predicted: 102000, unit: "currency" },
      { label: "Reservas previstas (sáb)", current: 86, predicted: 124, unit: "count" },
      { label: "No-show projetado", current: 18, predicted: 9, unit: "count" },
    ],
  },
  cervejarias: {
    label: "Microcervejarias",
    insights: [
      {
        title: "IPA Tropical sumirá em 9 dias",
        desc: "Velocidade de venda subiu 40% após menção em revista. Próximo lote em 14 dias.",
        impact: "Antecipar brassagem ou criar fila",
        severity: "warn",
      },
      {
        title: "Clube perde 7% por mês",
        desc: "Maior atrito: atraso na 3ª entrega. Realocar transportadora pode reduzir churn.",
        impact: "+R$ 4.800/mês",
        severity: "info",
      },
      {
        title: "Sour day esgotou em 3h",
        desc: "Demanda 3x maior que oferta. Sugiro lançar versão limitada mensal.",
        impact: "+R$ 8.400/lançamento",
        severity: "ok",
      },
    ],
    automations: [
      { name: "Alerta de estoque crítico", trigger: "Saldo abaixo do mínimo", action: "Notificar produção + criar lote no kanban", active: true, saved: "Zero rupturas" },
      { name: "Renovação do clube", trigger: "5 dias antes da cobrança", action: "Lembrete + opção de pausar/trocar curadoria", active: true, saved: "-22% churn" },
      { name: "Upsell pós-tour", trigger: "Tour concluído", action: "Envio do PDF + cupom de 10% no e-commerce", active: true, saved: "R$ 2.100/mês" },
      { name: "Lançamento de rótulo", trigger: "Novo SKU criado", action: "E-mail + WhatsApp para top 200 fãs com pré-venda 24h", active: false, saved: "—" },
    ],
    templates: [
      {
        label: "Convite para tour",
        prompt: "Convidar cliente para brew tour de sábado",
        sample:
          "Fala, {{nome}}! Esse sábado às 15h rola brew tour com degustação dos 5 rótulos novos. Tenho 2 vagas no seu nome se topar 🍻",
      },
      {
        label: "Alerta de lançamento",
        prompt: "Anunciar lançamento de rótulo limitado para fãs",
        sample:
          "ALERTA HOPS 🚨 Solta a barrel-aged Imperial Stout 'Café-de-Outono' — só 200 garrafas, pré-venda exclusiva pra você por 24h: {{link}}",
      },
      {
        label: "Reativar assinante",
        prompt: "Recuperar assinante que cancelou o clube",
        sample:
          "{{nome}}, sentimos sua falta no Clube Hops! Pra você voltar, libero a próxima caixa com 50% off + frete grátis. Topa?",
      },
    ],
    forecasts: [
      { label: "Receita do mês", current: 162000, predicted: 198000, unit: "currency" },
      { label: "Assinantes do clube", current: 412, predicted: 486, unit: "count" },
      { label: "Tours vendidos", current: 84, predicted: 132, unit: "count" },
    ],
  },
  servicos: {
    label: "Serviços & Reformas",
    insights: [
      {
        title: "32 orçamentos sem follow-up",
        desc: "Enviados há mais de 3 dias. Histórico mostra 28% fecham com 1 lembrete.",
        impact: "+R$ 18.400 potencial",
        severity: "warn",
      },
      {
        title: "Reforma cozinha tem maior margem",
        desc: "Margem 42% vs. 28% da média. Direcionar tráfego pago para essa landing.",
        impact: "+R$ 6.200/mês",
        severity: "info",
      },
      {
        title: "André Cardoso = NPS 9.8",
        desc: "Designar para clientes premium aumenta recompra em 1,8x.",
        impact: "LTV +R$ 2.400/cliente",
        severity: "ok",
      },
    ],
    automations: [
      { name: "Follow-up de orçamento", trigger: "Orçamento enviado há 48h sem resposta", action: "WhatsApp humanizado com FAQ + agenda para visita", active: true, saved: "+18% conversão" },
      { name: "Garantia + revisão preventiva", trigger: "11 meses após OS", action: "Lembrete de revisão da garantia + agenda automática", active: true, saved: "R$ 3.200/mês" },
      { name: "Indicação automática", trigger: "OS concluída com NPS ≥ 9", action: "Solicitação de indicação + cupom R$ 100 ao indicado", active: true, saved: "14 leads/mês" },
      { name: "Roteirização inteligente", trigger: "Nova OS agendada", action: "IA otimiza rota da equipe + reduz tempo de deslocamento", active: false, saved: "—" },
    ],
    templates: [
      {
        label: "Follow-up orçamento",
        prompt: "Retomar orçamento enviado há 3 dias sem resposta",
        sample:
          "Oi, {{nome}}! Sobre o orçamento da {{servico}}: posso te explicar alguma parte? Se quiser, marco uma visita técnica gratuita pra alinhar tudo cara a cara.",
      },
      {
        label: "Garantia vencendo",
        prompt: "Avisar cliente que garantia vence em 30 dias e oferecer revisão",
        sample:
          "Olá, {{nome}}! Sua garantia da {{servico}} vence em 30 dias. Que tal uma revisão preventiva gratuita esta semana? Garanto que tudo continue impecável.",
      },
      {
        label: "Indicação",
        prompt: "Pedir indicação após serviço com NPS 10",
        sample:
          "Top demais ter atendido você, {{nome}}! Se conhecer alguém precisando de {{servico}}, indica a gente? Você ganha R$ 100 e seu amigo também 🙌",
      },
    ],
    forecasts: [
      { label: "Faturamento do mês", current: 348000, predicted: 412000, unit: "currency" },
      { label: "OS previstas", current: 142, predicted: 168, unit: "count" },
      { label: "Conversão de orçamento", current: 28, predicted: 38, unit: "count" },
    ],
  },
  ecommerce: {
    label: "E-commerce & Varejo",
    insights: [
      {
        title: "184 carrinhos abandonados em 24h",
        desc: "Valor médio R$ 320. Sequência de 3 e-mails recupera ~22% historicamente.",
        impact: "+R$ 12.900 esta semana",
        severity: "warn",
      },
      {
        title: "Coleção 'Mar' tem 96% de sell-through",
        desc: "Reabasteça em até 5 dias ou perderá vendas estimadas em R$ 8.400.",
        impact: "Reposição urgente",
        severity: "warn",
      },
      {
        title: "Personal shopper converte 4x mais",
        desc: "Sessões com shopper têm AOV de R$ 580 vs R$ 142 da loja. Promova mais.",
        impact: "+R$ 18.200/mês",
        severity: "ok",
      },
    ],
    automations: [
      { name: "Carrinho abandonado", trigger: "Carrinho parado 1h", action: "Sequência 3 toques: WhatsApp 1h + e-mail 12h + cupom 24h", active: true, saved: "R$ 12.900/sem" },
      { name: "Restock alert", trigger: "Item desejado volta ao estoque", action: "WhatsApp imediato para quem curtiu o produto", active: true, saved: "R$ 6.400/mês" },
      { name: "Drop launch (top 200)", trigger: "Coleção liberada", action: "Acesso 24h antes para top 200 + cupom exclusivo", active: true, saved: "R$ 28.400/drop" },
      { name: "Personal shopper trigger", trigger: "Visitante volta 3x sem comprar", action: "Convite para sessão de personal shopper grátis", active: false, saved: "—" },
    ],
    templates: [
      {
        label: "Carrinho abandonado",
        prompt: "Recuperar carrinho abandonado com tom amigável",
        sample:
          "Oi, {{nome}}! Vi que você ficou de olho na {{produto}} — separei pra você! Posso garantir mais 24h e ainda libero frete grátis. Topa fechar?",
      },
      {
        label: "Drop exclusivo",
        prompt: "Anunciar drop exclusivo para top clientes",
        sample:
          "{{nome}}, drop novo às 19h hoje 🌙 Liberei acesso 24h antes pra você — porque você é VIP. Olha o lookbook: {{link}}",
      },
      {
        label: "Pós-compra",
        prompt: "Pós-compra agradecendo e sugerindo complemento",
        sample:
          "Chegou! Espero que ame a {{produto}} 💖. Olha o que combina perfeito: {{produto2}} com 15% off por ser cliente. Curtiu?",
      },
    ],
    forecasts: [
      { label: "GMV do mês", current: 624000, predicted: 748000, unit: "currency" },
      { label: "Pedidos previstos", current: 2840, predicted: 3420, unit: "count" },
      { label: "Conversão site (%)", current: 2, predicted: 3, unit: "count" },
    ],
  },
};

const SEV_BADGE: Record<Insight["severity"], { cls: string; icon: typeof Lightbulb }> = {
  info: { cls: "bg-blue-100 text-blue-700", icon: Lightbulb },
  warn: { cls: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  ok: { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

const ACTION_ICONS: Record<string, typeof MessageCircle> = {
  WhatsApp: MessageCircle,
  email: Mail,
  ligação: Phone,
  agenda: Calendar,
};

function ShowroomAutomacoesIA() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const cfg = DATA[niche];
  const [tplIdx, setTplIdx] = useState(0);
  const [automations, setAutomations] = useState(cfg.automations);

  // Reset automations when niche changes
  useMemo(() => {
    setAutomations(DATA[niche].automations);
    setTplIdx(0);
  }, [niche]);

  const activeCount = automations.filter((a) => a.active).length;
  const template = cfg.templates[tplIdx];

  const toggle = (i: number) =>
    setAutomations((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, active: !a.active } : a)),
    );

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Header */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Brain className="h-3 w-3" /> Copilot de IA
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                IA que sabe o seu negócio — e age por você
              </h1>
              <p className="mt-3 text-pretty text-muted-foreground">
                Insights diários, automações inteligentes, redator que entende o tom da sua marca e
                previsões em tempo real — treinado nos seus próprios dados.
              </p>
            </div>
            <Select value={niche} onValueChange={(v) => setNiche(v as NicheSlug)}>
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

      {/* Insights */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Insights do dia</h2>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" /> Gerados às 06:00 com base nos seus dados
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cfg.insights.map((ins) => {
            const sev = SEV_BADGE[ins.severity];
            const Icon = sev.icon;
            return (
              <Card key={ins.title} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${sev.cls}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <Badge variant="outline" className="text-[11px]">
                    {ins.impact}
                  </Badge>
                </div>
                <p className="mt-3 font-semibold leading-snug">{ins.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{ins.desc}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="h-7 gap-1">
                    <Play className="h-3.5 w-3.5" /> Aplicar
                  </Button>
                  <Button size="sm" variant="outline" className="h-7">
                    Detalhar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Automations + Redator */}
      <section className="container mx-auto px-4 pb-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Automations */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Automações ativas</h2>
                <p className="text-xs text-muted-foreground">
                  {activeCount} de {automations.length} ligadas — gatilho → ação no-code
                </p>
              </div>
              <Badge className="gap-1">
                <Zap className="h-3 w-3" /> Sem código
              </Badge>
            </div>
            <ul className="space-y-3">
              {automations.map((a, i) => (
                <li key={a.name} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{a.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Quando:</span> {a.trigger}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Então:</span> {a.action}
                      </p>
                    </div>
                    <Switch checked={a.active} onCheckedChange={() => toggle(i)} />
                  </div>
                  {a.active && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Economia estimada: {a.saved}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 w-full gap-1">
              <Sparkles className="h-4 w-4" /> Criar nova automação com IA
            </Button>
          </Card>

          {/* Redator de IA */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Redator de IA</h2>
                <p className="text-xs text-muted-foreground">
                  Gera mensagens no tom da sua marca, com variáveis automáticas
                </p>
              </div>
              <Wand2 className="h-4 w-4 text-primary" />
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {cfg.templates.map((t, i) => (
                <Button
                  key={t.label}
                  size="sm"
                  variant={i === tplIdx ? "default" : "outline"}
                  className="h-7"
                  onClick={() => setTplIdx(i)}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <PenLine className="h-3 w-3" /> Prompt
              </div>
              <p className="mt-1 text-sm">{template.prompt}</p>
            </div>

            <div className="mt-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-primary">
                <Bot className="h-3.5 w-3.5" /> IA gerou em 1,2s
              </div>
              <p className="text-sm leading-relaxed">{template.sample}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="h-7 gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> Enviar WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="h-7 gap-1">
                  <Mail className="h-3.5 w-3.5" /> E-mail
                </Button>
                <Button size="sm" variant="ghost" className="h-7">
                  Regenerar
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Aprende com aprovações: cada vez que você edita, a IA absorve seu tom.
            </div>
          </Card>
        </div>
      </section>

      {/* Forecasts */}
      <section className="container mx-auto px-4 pb-12">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Previsões em tempo real</h2>
            </div>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" /> Atualizado a cada hora
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {cfg.forecasts.map((f) => {
              const delta = ((f.predicted - f.current) / Math.max(f.current, 1)) * 100;
              const value = (n: number) =>
                f.unit === "currency" ? fmtBRL(n) : fmtInt(n) + (f.label.includes("%") ? "%" : "");
              return (
                <div key={f.label} className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {value(f.current)}
                    </span>
                    <span className="text-2xl font-bold">{value(f.predicted)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium ${
                        delta >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs. tendência atual</span>
                  </div>
                  <div className="mt-3 h-12 overflow-hidden rounded bg-muted/50">
                    <div
                      className="h-full bg-gradient-to-r from-primary/70 to-primary"
                      style={{ width: `${Math.min(100, 45 + Math.abs(delta))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Como funciona:</span> a IA combina seu
            histórico (12 meses), sazonalidade, clima, dia da semana e ações ativas para projetar o
            resultado real do período — não é simples extrapolação.
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Pare de operar no escuro. Ligue o copilot.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Insights, automações e redator de IA já vêm prontos no plano — sem prompt engineering,
            sem integrações manuais, sem custo adicional por mensagem.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Ativar IA no meu negócio</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom">
                Voltar ao hub <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default ShowroomAutomacoesIA;
// touch
void ACTION_ICONS;
