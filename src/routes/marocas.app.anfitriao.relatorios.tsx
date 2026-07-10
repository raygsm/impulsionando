import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, KpiCard } from "@/components/marocas/MarocasUI";
import { BarChart3, TrendingUp, Sparkles, Wrench } from "lucide-react";

export const Route = createFileRoute("/marocas/app/anfitriao/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  return (
    <MarocasAppShell
      title="Relatórios"
      description="Ocupação, faturamento, custo operacional e satisfação — período customizável."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Relatórios" }]}
      actions={<button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">Exportar PDF</button>}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Ocupação 90d" value="76%" tone="success" icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label="Diária média" value="R$ 720" icon={<BarChart3 className="h-4 w-4" />} />
        <KpiCard label="Custo médio limpeza" value="R$ 175" icon={<Sparkles className="h-4 w-4" />} />
        <KpiCard label="Custo médio manut." value="R$ 240" icon={<Wrench className="h-4 w-4" />} />
      </div>

      <Section title="Ocupação por mês (últimos 6)">
        <div className="rounded-xl border bg-card p-6">
          <div className="grid grid-cols-6 gap-3 items-end h-40">
            {[
              { m: "Fev", v: 68 }, { m: "Mar", v: 72 }, { m: "Abr", v: 65 },
              { m: "Mai", v: 78 }, { m: "Jun", v: 82 }, { m: "Jul", v: 87 },
            ].map((b) => (
              <div key={b.m} className="flex flex-col items-center gap-2">
                <div className="w-full bg-primary/80 rounded-t-md" style={{ height: `${b.v}%` }} />
                <div className="text-xs text-muted-foreground">{b.m}</div>
                <div className="text-[10px] tabular-nums">{b.v}%</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Relatórios prontos">
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { t: "Repasse ao proprietário", d: "Detalhamento mensal com receitas, despesas e comissões." },
            { t: "Ocupação por imóvel", d: "% de noites ocupadas por canal (Airbnb, Booking, direto)." },
            { t: "Satisfação NPS", d: "Nota, comentários e destaques dos hóspedes." },
            { t: "Prestadores — desempenho", d: "SLA, número de chamados e avaliações internas." },
            { t: "Estoque de amenities", d: "Consumo, reposição e projeção do próximo mês." },
            { t: "Fiscal", d: "Recibos, boletos e NFe emitidas pela Marocas." },
          ].map((r) => (
            <div key={r.t} className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold text-sm">{r.t}</h3>
              <p className="text-xs text-muted-foreground mt-1">{r.d}</p>
              <button className="mt-3 text-xs text-primary font-medium hover:underline">Baixar</button>
            </div>
          ))}
        </div>
      </Section>
    </MarocasAppShell>
  );
}
