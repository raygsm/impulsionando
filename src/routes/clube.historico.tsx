import { createFileRoute } from "@tanstack/react-router";
import { History, ShoppingBag, Calendar, Stethoscope, Ticket, Home } from "lucide-react";
import { SectionHeader } from "@/components/impulsionando";
import { CLUBE_HISTORICO } from "@/data/clube-mocks";

export const Route = createFileRoute("/clube/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — Clube Impulsionando" },
      { name: "description", content: "Todas as suas compras, reservas, consultas, eventos e uso de vouchers no Clube Impulsionando." },
      { property: "og:title", content: "Histórico — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/historico" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/historico" }],
  }),
  component: ClubeHistorico,
});

const ICONS = {
  compra: ShoppingBag,
  reserva: Home,
  consulta: Stethoscope,
  evento: Calendar,
  voucher: Ticket,
} as const;

function ClubeHistorico() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <SectionHeader
        eyebrow="Histórico"
        title="Toda sua atividade no Clube"
        description="Fonte única para o CRM e para o Impulsionito personalizarem sua próxima recomendação."
        align="left"
      />

      <ul className="mt-6 relative border-l border-border pl-6 space-y-6">
        {CLUBE_HISTORICO.map((h) => {
          const Icon = ICONS[h.tipo];
          return (
            <li key={h.id} className="relative">
              <span className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center border-2 border-background">
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{h.descricao}</div>
                  <div className="text-xs opacity-70">{h.empresa} · {h.data} · <span className="capitalize">{h.tipo}</span></div>
                </div>
                {typeof h.valor === "number" && (
                  <div className="text-sm font-serif whitespace-nowrap">R$ {h.valor.toFixed(2).replace(".", ",")}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs opacity-60 mt-8 flex items-center gap-1">
        <History className="w-3.5 h-3.5" /> Este histórico será consolidado pelo CRM assim que o backend do Clube estiver ativo.
      </p>
    </section>
  );
}
