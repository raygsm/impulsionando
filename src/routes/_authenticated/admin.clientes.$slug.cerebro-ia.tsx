import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, Clock, Globe2, BookOpen, Radio, PlayCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/cerebro-ia")({
  head: () => ({ meta: [{ title: "Cérebro IA por Cliente — Impulsionando" }] }),
  component: TenantCerebroIATab,
});

// Onda 3.2 — Cliente 360. Aba visual "Cérebro IA por Cliente".
// Toda a operação real (schema, agentes, chamadas ao provedor, custos)
// será tratada na Fase 3.4, quando o backend for destravado de forma
// controlada. Aqui apenas expomos a estrutura visual do cockpit.
function TenantCerebroIATab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" /> Cérebro IA por Cliente
          </h2>
          <p className="text-sm text-muted-foreground">
            Configurações do agente virtual dedicado ao cliente <code>{slug}</code>.
          </p>
        </div>
        <Badge variant="outline">Prévia visual · Fase 3.4</Badge>
      </header>

      <Card className="p-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <BrainField icon={<Sparkles className="h-4 w-4" />} label="Nome do agente" placeholder="Ex.: Impulsinho, Riobot, Garrido IA…" />
          <BrainField icon={<MessageSquare className="h-4 w-4" />} label="Tom de voz" placeholder="Formal · Consultivo · Próximo · Bem-humorado" />
          <BrainField icon={<MessageSquare className="h-4 w-4" />} label="Abordagem" placeholder="Objetivo comercial, atendimento, pós-venda, cobrança…" />
          <BrainField icon={<Clock className="h-4 w-4" />} label="Horários de atendimento" placeholder="Dias / faixas horárias / fuso" />
          <BrainField icon={<Globe2 className="h-4 w-4" />} label="Idiomas suportados" placeholder="pt-BR · es-BO · en-US…" />
          <BrainField icon={<Radio className="h-4 w-4" />} label="Canais ativos" placeholder="WhatsApp · Web · E-mail · Instagram…" />
        </div>

        <div className="border-t pt-4 grid gap-3 md:grid-cols-2">
          <BrainBlock icon={<BookOpen className="h-4 w-4" />} title="Base de conhecimento">
            Documentos, FAQs, catálogos, políticas e scripts que alimentam o cérebro do agente.
            Upload, versionamento e revisão humana entram na Fase 3.4.
          </BrainBlock>
          <BrainBlock icon={<PlayCircle className="h-4 w-4" />} title="Testes e homologação">
            Sandbox de conversa, prompts de teste, checagem de guardrails e aprovação antes de
            liberar o agente para os canais reais do cliente.
          </BrainBlock>
        </div>

        <div className="border-t pt-3 flex flex-wrap gap-2 items-center">
          <Badge variant="outline">Status: rascunho</Badge>
          <span className="text-xs text-muted-foreground">
            Nenhuma configuração é persistida enquanto o backend do Cérebro IA não é destravado.
          </span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" disabled>Testar agente</Button>
          <Button size="sm" disabled>Salvar rascunho</Button>
        </div>
      </Card>
    </div>
  );
}

function BrainField({
  icon,
  label,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="border rounded-md p-3 space-y-1">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-sm text-muted-foreground/80 italic">{placeholder}</div>
    </div>
  );
}

function BrainBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-md p-4 space-y-2">
      <div className="flex items-center gap-2 font-medium text-sm">
        {icon} {title}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
