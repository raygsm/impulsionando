import { MessageCircle, Clock, Globe2, Zap, ShieldCheck, BellRing } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  /** Texto customizável do bloco passivo. */
  passive?: string;
  /** Texto customizável do bloco ativo. */
  active?: string;
  /** Quando true, usa fundo "soft" em vez do gradiente. */
  soft?: boolean;
}

const DEFAULT_PASSIVE =
  "O cliente chama quando quiser, no horário que quiser e de onde estiver. O sistema responde sem cansar, sem perder contexto, sem depender da disponibilidade imediata de uma pessoa. Ele tira dúvidas, envia links, orienta, conduz para agendamento, pagamento, reserva, pedido, proposta ou atendimento humano. Isso reduz perda de oportunidades, melhora a experiência e aumenta a conversão.";

const DEFAULT_ACTIVE =
  "Além de responder quando o cliente chama, a plataforma também faz follow-ups, lembretes, confirmações, cobranças, pesquisas, reativações, convites, campanhas segmentadas e mensagens de relacionamento — sempre respeitando opt-in, permissões e regras de comunicação.";

const HIGHLIGHTS = [
  { icon: Clock, label: "24 horas por dia" },
  { icon: Globe2, label: "Múltiplos idiomas" },
  { icon: Zap, label: "Resposta em segundos" },
  { icon: BellRing, label: "Follow-up automático" },
  { icon: ShieldCheck, label: "Opt-in e LGPD" },
];

export function WhatsAppBlock({ passive = DEFAULT_PASSIVE, active = DEFAULT_ACTIVE, soft = false }: Props) {
  return (
    <Card
      className={
        "p-6 sm:p-8 border-0 shadow-elegant overflow-hidden relative " +
        (soft
          ? "bg-emerald-500/5 text-foreground"
          : "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white")
      }
    >
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs mb-4">
          <MessageCircle className="w-3.5 h-3.5" /> Atendimento via WhatsApp
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
          Passivo 24h + ativo com inteligência. Menos lead perdido, mais conversão.
        </h3>
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-1">WhatsApp passivo 24h</div>
            <p className="text-sm leading-relaxed">{passive}</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-1">WhatsApp ativo</div>
            <p className="text-sm leading-relaxed">{active}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <span
                key={h.label}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/15 backdrop-blur"
              >
                <Icon className="w-3 h-3" /> {h.label}
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
