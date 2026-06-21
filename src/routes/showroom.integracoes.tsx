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
  MessageCircle,
  CreditCard,
  Workflow,
  Mail,
  Calendar,
  Truck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plug,
  Receipt,
} from "lucide-react";

export const Route = createFileRoute("/showroom/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações por nicho — Impulsionando" },
      {
        name: "description",
        content:
          "WhatsApp, MercadoPago, n8n, Google Calendar e mais — veja quais integrações já vêm prontas para cada segmento.",
      },
      {
        property: "og:title",
        content: "Integrações por nicho — Impulsionando",
      },
      {
        property: "og:description",
        content: "Catálogo de integrações prontas por segmento.",
      },
    ],
  }),
  component: ShowroomIntegracoesPage,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas e Saúde",
  bares: "Bares e Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços",
  ecommerce: "E-commerce",
};

type IntegrationStatus = "ready" | "optional" | "soon";

type Integration = {
  id: string;
  name: string;
  category: "Comunicação" | "Pagamentos" | "Automação" | "Operacional";
  icon: typeof MessageCircle;
  description: string;
  // status por nicho
  byNiche: Record<NicheSlug, IntegrationStatus>;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "Comunicação",
    icon: MessageCircle,
    description: "Confirmações, lembretes e campanhas via WhatsApp.",
    byNiche: {
      clinicas: "ready",
      bares: "ready",
      microcervejarias: "ready",
      servicos: "ready",
      ecommerce: "ready",
    },
  },
  {
    id: "mercadopago",
    name: "MercadoPago",
    category: "Pagamentos",
    icon: CreditCard,
    description: "Links de pagamento, PIX e cartão.",
    byNiche: {
      clinicas: "ready",
      bares: "ready",
      microcervejarias: "ready",
      servicos: "ready",
      ecommerce: "ready",
    },
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Automação",
    icon: Workflow,
    description: "Automações low-code disparadas por eventos da plataforma.",
    byNiche: {
      clinicas: "ready",
      bares: "ready",
      microcervejarias: "ready",
      servicos: "ready",
      ecommerce: "ready",
    },
  },
  {
    id: "email-marca",
    name: "E-mail com a sua marca",
    category: "Comunicação",
    icon: Mail,
    description: "Envio transacional via domínio próprio (DKIM/SPF).",
    byNiche: {
      clinicas: "ready",
      bares: "ready",
      microcervejarias: "ready",
      servicos: "ready",
      ecommerce: "ready",
    },
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Operacional",
    icon: Calendar,
    description: "Sincroniza agenda dos profissionais.",
    byNiche: {
      clinicas: "ready",
      bares: "optional",
      microcervejarias: "soon",
      servicos: "ready",
      ecommerce: "soon",
    },
  },
  {
    id: "melhor-envio",
    name: "Melhor Envio",
    category: "Operacional",
    icon: Truck,
    description: "Cotação e etiquetas para envios e-commerce.",
    byNiche: {
      clinicas: "soon",
      bares: "soon",
      microcervejarias: "optional",
      servicos: "soon",
      ecommerce: "ready",
    },
  },
  {
    id: "nfe",
    name: "NF-e / NFC-e",
    category: "Pagamentos",
    icon: Receipt,
    description: "Emissão fiscal integrada ao PDV e ao financeiro.",
    byNiche: {
      clinicas: "optional",
      bares: "ready",
      microcervejarias: "ready",
      servicos: "optional",
      ecommerce: "ready",
    },
  },
];

const STATUS_META: Record<
  IntegrationStatus,
  { label: string; tone: string; icon: typeof CheckCircle2 }
> = {
  ready: { label: "Pronta", tone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  optional: { label: "Opcional", tone: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: Plug },
  soon: { label: "Em breve", tone: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
};

function ShowroomIntegracoesPage() {
  const [nicho, setNicho] = useState<NicheSlug>("clinicas");

  const grouped = useMemo(() => {
    const out: Record<string, Integration[]> = {};
    for (const i of INTEGRATIONS) {
      (out[i.category] ??= []).push(i);
    }
    return out;
  }, []);

  const readyCount = INTEGRATIONS.filter((i) => i.byNiche[nicho] === "ready").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="container py-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Link to="/showroom" className="hover:text-foreground">Showroom</Link>
              <span>/</span>
              <span>Integrações</span>
            </div>
            <Badge variant="secondary" className="mb-3 gap-1">
              <Sparkles className="h-3 w-3" /> Conectado ao seu fluxo
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Integrações prontas por nicho
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Cada segmento já vem com integrações essenciais ativas e outras opcionais para você ligar quando quiser.
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
              {readyCount} prontas para {NICHO_LABEL[nicho]}
            </Badge>
          </div>

          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {cat}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((i) => {
                  const status = i.byNiche[nicho];
                  const meta = STATUS_META[status];
                  const Icon = i.icon;
                  const StatusIcon = meta.icon;
                  return (
                    <Card key={i.id} className="p-4 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${meta.tone}`}>
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </div>
                      <h3 className="font-semibold leading-tight">{i.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex-1">{i.description}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild>
              <Link to="/showroom">Voltar ao showroom</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/showroom/relatorios">Relatórios prontos</Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
