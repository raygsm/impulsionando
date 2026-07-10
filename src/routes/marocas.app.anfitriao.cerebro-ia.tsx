import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section } from "@/components/marocas/MarocasUI";
import { Brain, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/marocas/app/anfitriao/cerebro-ia")({
  head: () => ({ meta: [{ title: "Cérebro IA — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: CerebroPage,
});

const INSIGHTS = [
  { icon: TrendingUp, tone: "emerald", titulo: "Ajustar diária da Copa Ocean 902 em +8%", corpo: "Ocupação de 92% e reservas 60d à frente indicam elasticidade de preço. Aumento sugerido: R$ 720 → R$ 780." },
  { icon: Sparkles, tone: "sky", titulo: "Programar limpeza extra em 12/07 22h", corpo: "Check-out imediato seguido de check-in às 15h. Recomendo turnover noturno para evitar pressa." },
  { icon: AlertTriangle, tone: "amber", titulo: "Manutenção preventiva em Ipanema Garden", corpo: "3 chamados de vazamento em 6 meses. Sugestão: vistoria hidráulica preventiva." },
  { icon: Brain, tone: "purple", titulo: "Hóspede recorrente detectado", corpo: "Marina Ferreira reservou 3x em 2 anos. Enviar upgrade de amenities e mensagem personalizada." },
];

function CerebroPage() {
  return (
    <MarocasAppShell
      title="Cérebro IA"
      description="Sugestões acionáveis geradas a partir da sua operação — preço, agenda, hóspedes e manutenção."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Cérebro IA" }]}
    >
      <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-5 mb-6 flex items-start gap-3">
        <Brain className="h-6 w-6 text-primary shrink-0" />
        <div>
          <h2 className="font-semibold">4 novas sugestões esta semana</h2>
          <p className="text-sm text-muted-foreground">O Cérebro IA analisa ocupação, agenda, avaliações e chamados para propor ações. Aprove para aplicar.</p>
        </div>
      </div>

      <Section title="Sugestões pendentes">
        <div className="grid md:grid-cols-2 gap-3">
          {INSIGHTS.map((s, i) => (
            <article key={i} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{s.titulo}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{s.corpo}</p>
              <div className="flex gap-2 pt-2">
                <button className="text-xs rounded-md bg-primary text-primary-foreground px-3 py-1 font-semibold">Aplicar</button>
                <button className="text-xs rounded-md border px-3 py-1 hover:bg-muted">Descartar</button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <p className="mt-6 text-xs text-muted-foreground max-w-2xl">
        Integração LLM e pipeline de features via Codex — interface pronta para receber sugestões reais.
      </p>
    </MarocasAppShell>
  );
}
