import { Bot, Users, Gift, MessageCircle, Sparkles, Zap } from "lucide-react";

/**
 * Bloco "Ecossistema Impulsionando" — reforça que a Colors Saúde é um
 * tenant do Core Impulsionando e antecipa Área do Cliente, Clube,
 * Fidelidade, CRM, WhatsApp e Impulsionito.
 * Front-end informativo — não requer backend.
 */
export function EcosystemBlock({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";
  const items = [
    { icon: Users, title: "Área do Cliente", desc: "Histórico de pedidos, ficha de saúde e recompra em 1 clique. Em breve." },
    { icon: Bot, title: "Impulsionito · IA", desc: "Agente que recomenda o produto certo para o seu objetivo — emagrecer, dormir, ganhar energia." },
    { icon: Gift, title: "Clube & Fidelidade", desc: "Cashback, brindes e assinatura com preço fechado para clientes recorrentes." },
    { icon: MessageCircle, title: "WhatsApp inteligente", desc: "Suporte humano no 21 96786-2834 + automações de acompanhamento pós-compra." },
    { icon: Zap, title: "CRM & Automações", desc: "Régua de retenção, aviso de recompra, lembrete de uso e reativação inteligente." },
    { icon: Sparkles, title: "Ecossistema Impulsionando", desc: "Colors Saúde é uma marca do Ecossistema Impulsionando — tecnologia que impulsiona resultado." },
  ];
  return (
    <section
      id="ecossistema"
      className={
        "relative overflow-hidden py-20 sm:py-24 " +
        (isDark ? "bg-gradient-to-b from-[#0a0f0d] via-[#0a1512] to-[#0a0f0d] text-white" : "bg-white text-black")
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_50%_0%,rgba(16,185,129,0.18),transparent_60%)]" />
      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className={"text-xs font-bold uppercase tracking-[0.3em] " + (isDark ? "text-emerald-400" : "text-emerald-700")}>
            Ecossistema Impulsionando
          </p>
          <h2 className={"mt-3 text-3xl font-black sm:text-5xl " + (isDark ? "text-white" : "text-black")}>
            Mais do que suplementos — <span className="text-emerald-400">uma plataforma</span> para cuidar de você.
          </h2>
          <p className={"mt-4 text-base sm:text-lg " + (isDark ? "text-white/70" : "text-black/70")}>
            A Colors Saúde faz parte do Ecossistema Impulsionando: infraestrutura de tecnologia,
            IA e relacionamento para transformar cada cliente em uma jornada de saúde acompanhada.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className={
                "rounded-2xl border p-6 transition " +
                (isDark
                  ? "border-white/10 bg-white/[0.03] hover:border-emerald-400/40 hover:bg-emerald-500/[0.06]"
                  : "border-black/10 bg-black/[0.02] hover:border-emerald-600/40")
              }
            >
              <Icon className="h-8 w-8 text-emerald-400" aria-hidden />
              <h3 className={"mt-4 text-lg font-bold " + (isDark ? "text-white" : "text-black")}>{title}</h3>
              <p className={"mt-2 text-sm " + (isDark ? "text-white/70" : "text-black/70")}>{desc}</p>
            </div>
          ))}
        </div>
        <p className={"mt-10 text-center text-xs " + (isDark ? "text-white/50" : "text-black/60")}>
          Suporte permanente pelo WhatsApp <strong>21 96786-2834</strong> · atendimento humano + IA
        </p>
      </div>
    </section>
  );
}

export default EcosystemBlock;
