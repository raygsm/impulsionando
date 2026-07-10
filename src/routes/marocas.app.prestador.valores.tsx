import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section } from "@/components/marocas/MarocasUI";
import { fmtBRL } from "@/components/marocas/marocasMockData";

export const Route = createFileRoute("/marocas/app/prestador/valores")({
  head: () => ({ meta: [{ title: "Valores — Prestador Marocas" }, { name: "robots", content: "noindex" }] }),
  component: ValoresPage,
});

const TABELA = [
  { servico: "Limpeza turnover · studio", valor: 130 },
  { servico: "Limpeza turnover · 1 quarto", valor: 150 },
  { servico: "Limpeza turnover · 2 quartos", valor: 180 },
  { servico: "Limpeza turnover · 3+ quartos", valor: 220 },
  { servico: "Limpeza pesada / faxina", valor: 320 },
  { servico: "Vistoria pré check-in", valor: 120 },
  { servico: "Reposição de amenities", valor: 60 },
  { servico: "Urgência (adicional)", valor: 80 },
];

function ValoresPage() {
  return (
    <MarocasAppShell
      title="Tabela de valores"
      description="Referência praticada pela Marocas. Valores podem variar por urgência, distância e complexidade."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Valores" }]}
    >
      <Section title="Serviços">
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Serviço</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {TABELA.map((t) => (
                <tr key={t.servico}>
                  <td className="px-3 py-2">{t.servico}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtBRL(t.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Repasse via PIX em até 48h após conclusão auditada.</p>
      </Section>
    </MarocasAppShell>
  );
}
