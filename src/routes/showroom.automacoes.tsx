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
  Bell,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  Sparkles,
  Workflow,
  ShoppingCart,
  Wrench,
  Repeat,
  Star,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/showroom/automacoes")({
  head: () => ({
    meta: [
      { title: "Automações n8n pré-configuradas por nicho — Impulsionando" },
      {
        name: "description",
        content:
          "Fluxos n8n prontos para cada segmento: lembretes, cobrança, reativação, NPS e mais — basta ligar.",
      },
      {
        property: "og:title",
        content: "Automações n8n pré-configuradas por nicho — Impulsionando",
      },
      {
        property: "og:description",
        content: "Fluxos prontos por nicho com gatilhos e ações reais.",
      },
    ],
  }),
  component: ShowroomAutomacoesPage,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas e Saúde",
  bares: "Bares e Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços",
  ecommerce: "E-commerce",
};

type Automation = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  icon: typeof MessageCircle;
};

const FLOWS: Record<NicheSlug, Automation[]> = {
  clinicas: [
    {
      id: "clin-lembrete",
      name: "Lembrete de consulta (24h)",
      description: "Envia lembrete por WhatsApp 24h antes da consulta.",
      trigger: "Agendamento confirmado",
      actions: ["Aguardar até 24h antes", "Enviar WhatsApp", "Registrar envio em CRM"],
      icon: CalendarCheck,
    },
    {
      id: "clin-noshow",
      name: "Recuperação de no-show",
      description: "Mensagem automática quando o paciente não comparece.",
      trigger: "Status = no_show",
      actions: ["Enviar WhatsApp", "Criar tarefa para recepção", "Sugerir novo horário"],
      icon: Repeat,
    },
    {
      id: "clin-nps",
      name: "NPS pós-consulta",
      description: "Pergunta a satisfação 2h após a consulta finalizada.",
      trigger: "Consulta concluída",
      actions: ["Aguardar 2h", "Enviar pesquisa", "Registrar resposta"],
      icon: Star,
    },
  ],
  bares: [
    {
      id: "bar-reserva",
      name: "Confirmação de reserva",
      description: "Confirma reserva e libera no salão.",
      trigger: "Nova reserva",
      actions: ["WhatsApp de confirmação", "Bloquear mesa", "Notificar maître"],
      icon: CalendarCheck,
    },
    {
      id: "bar-fidelidade",
      name: "Pontos de fidelidade",
      description: "Credita pontos após cada comanda fechada.",
      trigger: "Comanda fechada",
      actions: ["Calcular pontos", "Atualizar carteira", "WhatsApp de saldo"],
      icon: Star,
    },
    {
      id: "bar-reativacao",
      name: "Reativação de cliente (30 dias)",
      description: "Cupom para quem não volta há 30 dias.",
      trigger: "Cliente inativo 30d",
      actions: ["Gerar cupom", "Enviar WhatsApp", "Registrar campanha"],
      icon: Repeat,
    },
  ],
  microcervejarias: [
    {
      id: "brew-clube",
      name: "Renovação do Clube",
      description: "Cobra a mensalidade do clube no dia certo.",
      trigger: "Vencimento da assinatura",
      actions: ["Gerar cobrança MercadoPago", "Enviar boleto/PIX", "Notificar entrega"],
      icon: CreditCard,
    },
    {
      id: "brew-lote",
      name: "Lote pronto → B2B",
      description: "Avisa bares parceiros quando um lote sai da maturação.",
      trigger: "Lote = pronto",
      actions: ["Calcular disponibilidade", "WhatsApp B2B", "Abrir pedido sugerido"],
      icon: Bell,
    },
    {
      id: "brew-evento",
      name: "Lançamento exclusivo",
      description: "Campanha para o clube em lançamentos.",
      trigger: "Novo lote especial",
      actions: ["Segmentar clube", "Enviar push + e-mail", "Reservar cotas"],
      icon: Sparkles,
    },
  ],
  servicos: [
    {
      id: "serv-os",
      name: "Atualização de OS",
      description: "Cliente recebe cada mudança de status.",
      trigger: "Mudança de status da OS",
      actions: ["WhatsApp ao cliente", "Atualizar portal", "Registrar SLA"],
      icon: Wrench,
    },
    {
      id: "serv-cobranca",
      name: "Cobrança automática",
      description: "Gera link de pagamento ao finalizar a OS.",
      trigger: "OS finalizada",
      actions: ["Gerar link MercadoPago", "Enviar WhatsApp", "Conciliar no financeiro"],
      icon: CreditCard,
    },
    {
      id: "serv-pesquisa",
      name: "Pesquisa de satisfação",
      description: "NPS 24h após conclusão.",
      trigger: "OS concluída + 24h",
      actions: ["Enviar pesquisa", "Registrar nota", "Alerta se nota ≤ 6"],
      icon: Star,
    },
  ],
  ecommerce: [
    {
      id: "ec-carrinho",
      name: "Recuperação de carrinho",
      description: "Reengaja em 1h e em 24h.",
      trigger: "Carrinho abandonado",
      actions: ["Aguardar 1h", "WhatsApp + e-mail", "Cupom se 24h sem compra"],
      icon: ShoppingCart,
    },
    {
      id: "ec-rastreio",
      name: "Rastreio do pedido",
      description: "Mantém o cliente informado em cada etapa.",
      trigger: "Status do pedido mudou",
      actions: ["Consultar transportadora", "Enviar WhatsApp", "Atualizar painel"],
      icon: Bell,
    },
    {
      id: "ec-recompra",
      name: "Recompra programada",
      description: "Sugere recompra com base na recorrência.",
      trigger: "Tempo médio de recompra",
      actions: ["Gerar oferta", "Enviar WhatsApp", "Criar pedido sugerido"],
      icon: Repeat,
    },
  ],
};

function ShowroomAutomacoesPage() {
  const [nicho, setNicho] = useState<NicheSlug>("clinicas");
  const flows = useMemo(() => FLOWS[nicho], [nicho]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="container py-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Link to="/showroom" className="hover:text-foreground">Showroom</Link>
              <span>/</span>
              <span>Automações</span>
            </div>
            <Badge variant="secondary" className="mb-3 gap-1">
              <Workflow className="h-3 w-3" /> n8n pré-configurado
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Automações prontas por nicho
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Fluxos n8n já desenhados para cada segmento — gatilhos reais, ações com WhatsApp,
              cobrança e CRM. Basta ligar.
            </p>
          </div>
        </section>

        <section className="container py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <span className="text-sm font-medium">Nicho:</span>
            <Select value={nicho} onValueChange={(v) => setNicho(v as NicheSlug)}>
              <SelectTrigger className="w-full md:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NICHO_LABEL) as NicheSlug[]).map((s) => (
                  <SelectItem key={s} value={s}>{NICHO_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="ml-auto">
              {flows.length} automações prontas
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flows.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.id} className="p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Pronta
                    </Badge>
                  </div>
                  <h3 className="font-semibold leading-tight">{f.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{f.description}</p>

                  <div className="space-y-3 mt-auto">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Gatilho
                      </div>
                      <div className="text-sm">{f.trigger}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Fluxo
                      </div>
                      <ol className="space-y-1">
                        {f.actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span>{a}</span>
                            {i < f.actions.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground mt-1.5" />
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild>
              <Link to="/showroom">Voltar ao showroom</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/showroom/integracoes">Ver integrações</Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
