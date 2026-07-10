import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section } from "@/components/marocas/MarocasUI";
import { MOCK_HOSPEDE_RESERVA } from "@/components/marocas/marocasMockData";
import { Check, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/regras")({
  head: () => ({ meta: [{ title: "Regras do imóvel — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: RegrasPage,
});

function RegrasPage() {
  const r = MOCK_HOSPEDE_RESERVA;
  return (
    <MarocasAppShell
      title="Regras da casa"
      description="Regras claras para uma estadia tranquila para você e para os moradores do prédio."
      breadcrumbs={[{ label: "Hóspede", to: "/marocas/app/hospede" }, { label: "Regras" }]}
    >
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border bg-card p-4">
          <Clock className="h-5 w-5 text-primary" />
          <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Check-in / Check-out</p>
          <p className="font-semibold">15h / 11h</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Users className="h-5 w-5 text-primary" />
          <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Limite de hóspedes</p>
          <p className="font-semibold">Até {r.adultos + r.criancas} pessoas</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Clock className="h-5 w-5 text-primary" />
          <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Silêncio</p>
          <p className="font-semibold">22h — 08h</p>
        </div>
      </div>

      <Section title="Combinados da casa">
        <ul className="rounded-xl border bg-card divide-y">
          {r.regras.map((rg) => (
            <li key={rg} className="p-3 flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              {rg}
            </li>
          ))}
        </ul>
      </Section>
    </MarocasAppShell>
  );
}
