import { createFileRoute } from "@tanstack/react-router";
import { Plus, MapPin } from "lucide-react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, StatusBadge } from "@/components/marocas/MarocasUI";
import { MOCK_IMOVEIS, type OperationStatus } from "@/components/marocas/marocasMockData";

export const Route = createFileRoute("/marocas/app/anfitriao/imoveis")({
  head: () => ({ meta: [{ title: "Meus imóveis — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: ImoveisPage,
});

const STATUS_MAP: Record<string, OperationStatus> = {
  ativo: "confirmado",
  pausado: "cancelado",
  manutencao: "urgente",
};

function ImoveisPage() {
  return (
    <MarocasAppShell
      title="Meus imóveis"
      description="Portfolio completo com status operacional, ocupação e próximas movimentações."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Imóveis" }]}
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">
          <Plus className="h-4 w-4" /> Adicionar imóvel
        </button>
      }
    >
      <Section title={`${MOCK_IMOVEIS.length} imóveis cadastrados`}>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MOCK_IMOVEIS.map((i) => (
            <article key={i.id} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition">
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img src={i.cover} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{i.apelido}</h3>
                  <StatusBadge status={STATUS_MAP[i.status] ?? "pendente"} />
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />{i.endereco}
                </p>
                <dl className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                  <div><dt className="text-muted-foreground">Quartos</dt><dd className="font-semibold">{i.quartos}</dd></div>
                  <div><dt className="text-muted-foreground">Capacidade</dt><dd className="font-semibold">{i.capacidade}</dd></div>
                  <div><dt className="text-muted-foreground">Ocupação</dt><dd className="font-semibold">{i.ocupacao30d}%</dd></div>
                </dl>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 rounded-md border text-xs py-1.5 hover:bg-muted">Detalhes</button>
                  <button className="flex-1 rounded-md border text-xs py-1.5 hover:bg-muted">Agenda</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </MarocasAppShell>
  );
}
