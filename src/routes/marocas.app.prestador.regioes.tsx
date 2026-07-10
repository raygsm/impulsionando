import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section } from "@/components/marocas/MarocasUI";
import { MapPin, Check } from "lucide-react";

export const Route = createFileRoute("/marocas/app/prestador/regioes")({
  head: () => ({ meta: [{ title: "Regiões atendidas — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: RegioesPage,
});

const REGIOES = [
  "Copacabana", "Leme", "Ipanema", "Leblon", "Arpoador",
  "Botafogo", "Flamengo", "Laranjeiras", "Urca", "Humaitá",
  "Barra da Tijuca", "Recreio", "Jardim Oceânico",
];

function RegioesPage() {
  const [sel, setSel] = useState<string[]>(["Copacabana", "Leme"]);
  const toggle = (r: string) => setSel((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));
  return (
    <MarocasAppShell
      title="Regiões atendidas"
      description="Selecione onde você aceita realizar serviços. Só receberá oportunidades das regiões marcadas."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Regiões" }]}
    >
      <Section title={`${sel.length} regiões selecionadas`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {REGIOES.map((r) => {
            const on = sel.includes(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggle(r)}
                className={`rounded-xl border p-3 text-sm flex items-center gap-2 transition ${
                  on ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary"
                }`}
              >
                {on ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                {r}
              </button>
            );
          })}
        </div>
      </Section>
    </MarocasAppShell>
  );
}
