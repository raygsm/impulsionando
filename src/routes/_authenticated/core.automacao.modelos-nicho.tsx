import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { NICHO_VARIANTS } from "@/data/automacao-catalog";
import { FlowCard } from "@/components/core/automacao/FlowCard";

export const Route = createFileRoute("/_authenticated/core/automacao/modelos-nicho")({
  head: () => ({ meta: [{ title: "Modelos por Nicho — Automação" }, { name: "robots", content: "noindex" }] }),
  component: ModelosNichoPage,
});

const NICHO_LABEL: Record<string, string> = {
  clinica: "Clínica Médica",
  bar: "Bar / Restaurante",
  imob: "Imobiliária",
  eventos: "Eventos",
  wl: "White Label",
  clube: "Clube PF / Consumidor Final",
};

function ModelosNichoPage() {
  const grupos = NICHO_VARIANTS.reduce<Record<string, typeof NICHO_VARIANTS>>((acc, w) => {
    const n = w.nichos?.[0] ?? "outros";
    (acc[n] ??= []).push(w);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grupos).map(([niche, items]) => (
        <section key={niche} className="space-y-3">
          <Card className="p-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{NICHO_LABEL[niche] ?? niche}</h2>
            <span className="text-xs text-muted-foreground">{items.length} workflow(s)</span>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((wf) => <FlowCard key={wf.slug} wf={wf} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
