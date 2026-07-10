import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section } from "@/components/marocas/MarocasUI";
import { MOCK_HOSPEDE_RESERVA } from "@/components/marocas/marocasMockData";
import { Bed, Bath, Wifi, MapPin, Coffee, Snowflake } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/imovel")({
  head: () => ({ meta: [{ title: "Dados do imóvel — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: ImovelPage,
});

const AMENITIES = [
  { icon: Wifi, label: "Wi-Fi 300 Mbps" },
  { icon: Snowflake, label: "Ar-condicionado" },
  { icon: Coffee, label: "Cafeteira Nespresso" },
  { icon: Bed, label: "Cama Queen + Solteiro" },
  { icon: Bath, label: "Banheira" },
];

function ImovelPage() {
  const r = MOCK_HOSPEDE_RESERVA;
  return (
    <MarocasAppShell
      title={r.imovelApelido}
      description="Detalhes completos do imóvel onde você vai se hospedar."
      breadcrumbs={[{ label: "Hóspede", to: "/marocas/app/hospede" }, { label: "Imóvel" }]}
    >
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {[
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=60",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=60",
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=60",
        ].map((u) => (
          <img key={u} src={u} alt="" className="aspect-[4/3] object-cover rounded-xl" loading="lazy" />
        ))}
      </div>

      <Section title="Localização">
        <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">{r.endereco}</p>
            <p className="text-xs text-muted-foreground mt-1">A 3 minutos da praia · farmácia, mercado e metrô a menos de 500m.</p>
          </div>
        </div>
      </Section>

      <Section title="Comodidades">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMENITIES.map((a) => (
            <div key={a.label} className="rounded-xl border bg-card p-3 flex items-center gap-2 text-sm">
              <a.icon className="h-4 w-4 text-primary" />
              {a.label}
            </div>
          ))}
        </div>
      </Section>
    </MarocasAppShell>
  );
}
