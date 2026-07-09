import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChefHat, Bike, Home, MapPin, Clock, Phone } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";

export const Route = createFileRoute("/marocas/pedidos/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Pedido ${params.id} — Marocas` },
      { name: "description", content: "Rastreie seu pedido Marocas em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RastreioPage,
});

const STEPS = [
  { id: "recebido", label: "Recebido", icon: CheckCircle2 },
  { id: "preparando", label: "Preparando", icon: ChefHat },
  { id: "saiu", label: "Saiu para entrega", icon: Bike },
  { id: "entregue", label: "Entregue", icon: Home },
];

function RastreioPage() {
  const { id } = Route.useParams();
  // Mock de progresso — em produção: leitura via createServerFn com polling.
  const currentIdx = 1;

  return (
    <MarocasShell breadcrumbs={[
      { label: "Marocas", to: "/marocas" },
      { label: "Pedidos", to: "/marocas/pedidos" },
      { label: id },
    ]}>
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
        <div className="rounded-2xl border p-6 bg-card">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pedido</div>
          <h1 className="text-3xl font-bold mt-1 font-mono">{id}</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Previsão de entrega: 35–45 min
          </p>

          {/* Timeline */}
          <ol className="mt-8 space-y-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <li key={s.id} className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 shrink-0 ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${active ? "ring-4 ring-primary/20 animate-pulse" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className={`font-medium ${done ? "" : "text-muted-foreground"}`}>{s.label}</div>
                    {active && <div className="text-xs text-primary mt-0.5">Agora</div>}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 pt-6 border-t space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Entrega em: <span className="font-medium">Rua Exemplo, 123 · Zona Sul</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Entregador Marocas · Contato via app.</span>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Link to="/marocas/cardapio" className="flex-1 text-center rounded-md border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
              Pedir mais
            </Link>
            <Link to="/marocas/faq" className="flex-1 text-center rounded-md border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
              Preciso de ajuda
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          Status atualizado a cada 30s. Divergiu do combinado? Use o SAC no botão de ajuda.
        </p>
      </div>
    </MarocasShell>
  );
}
