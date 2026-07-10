import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section } from "@/components/marocas/MarocasUI";
import { MOCK_ROTEIROS } from "@/components/marocas/marocasMockData";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/roteiros")({
  head: () => ({ meta: [{ title: "Roteiros no Rio — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: RoteirosPage,
});

function RoteirosPage() {
  return (
    <MarocasAppShell
      title="Roteiros personalizados"
      description="Sugestões pensadas pelo nosso concierge, com destaque para o seu bairro."
      breadcrumbs={[{ label: "Hóspede", to: "/marocas/app/hospede" }, { label: "Roteiros" }]}
    >
      <Section title="Selecionados para você">
        <div className="grid md:grid-cols-3 gap-3">
          {MOCK_ROTEIROS.map((r) => (
            <article key={r.id} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition">
              <div className="aspect-[16/10] bg-muted overflow-hidden">
                <img
                  src={`https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=60&sig=${r.id}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{r.titulo}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.descricao}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {r.tags.map((t) => (
                    <span key={t} className="text-[10px] uppercase tracking-widest bg-muted px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
                <button className="mt-3 text-xs inline-flex items-center gap-1 text-primary font-medium hover:underline">
                  <MapPin className="h-3.5 w-3.5" /> Abrir no mapa
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </MarocasAppShell>
  );
}
