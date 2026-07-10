import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { KpiCard, Section } from "@/components/marocas/MarocasUI";
import { Star, ThumbsUp } from "lucide-react";

export const Route = createFileRoute("/marocas/app/prestador/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações — Prestador Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AvaliacoesPage,
});

const AVAL = [
  { data: "12/07", imovel: "Copa Ocean 902", nota: 5, comentario: "Impecável. Recebi a chegada com tudo brilhando." },
  { data: "08/07", imovel: "Leme Studio 305", nota: 5, comentario: "Rapidez e cuidado. Anfitrião elogiou." },
  { data: "02/07", imovel: "Botafogo Bay 704", nota: 4, comentario: "Tudo certo, só faltou repor o café." },
];

function AvaliacoesPage() {
  return (
    <MarocasAppShell
      title="Avaliações internas"
      description="Como os anfitriões e a gestão Marocas avaliaram os seus serviços."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Avaliações" }]}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Nota média" value="4.9" icon={<Star className="h-4 w-4" />} tone="success" />
        <KpiCard label="Avaliações" value={AVAL.length} />
        <KpiCard label="Recomendações" value="97%" icon={<ThumbsUp className="h-4 w-4" />} tone="success" />
      </div>

      <Section title="Últimas avaliações">
        <ul className="space-y-3">
          {AVAL.map((a, i) => (
            <li key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{a.imovel}</span>
                <span>{a.data}</span>
              </div>
              <div className="mt-1 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= a.nota ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="mt-2 text-sm">{a.comentario}</p>
            </li>
          ))}
        </ul>
      </Section>
    </MarocasAppShell>
  );
}
