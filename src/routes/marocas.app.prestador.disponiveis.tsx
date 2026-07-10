import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, EventPill, EmptyState, SuccessBanner } from "@/components/marocas/MarocasUI";
import { MOCK_FILA_SERVICOS, fmtBRL, fmtDateBR } from "@/components/marocas/marocasMockData";
import { AlertTriangle, MapPin, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/marocas/app/prestador/disponiveis")({
  head: () => ({ meta: [{ title: "Serviços disponíveis — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: DisponiveisPage,
});

const URG_TONE: Record<string, string> = {
  critica: "text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-200",
  alta: "text-amber-800 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200",
  normal: "text-sky-800 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200",
};

function DisponiveisPage() {
  const [aceitos, setAceitos] = useState<string[]>([]);
  const rows = MOCK_FILA_SERVICOS.filter((r) => !aceitos.includes(r.id));
  return (
    <MarocasAppShell
      title="Serviços disponíveis"
      description="Fila aberta na sua região. Assuma o serviço que fizer sentido para sua agenda."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Disponíveis" }]}
    >
      {aceitos.length > 0 && (
        <div className="mb-4">
          <SuccessBanner
            title={`${aceitos.length} serviço(s) aceito(s)`}
            description="Você recebe as instruções detalhadas por WhatsApp e por push."
          />
        </div>
      )}
      <Section title={`${rows.length} disponíveis`}>
        {rows.length === 0 ? (
          <EmptyState title="Nada na fila agora" description="Assim que uma nova oportunidade abrir na sua região, avisamos." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {rows.map((r) => (
              <article key={r.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <EventPill type={r.tipo} />
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${URG_TONE[r.urgencia]}`}>
                    {r.urgencia === "critica" && <AlertTriangle className="h-3 w-3" />}
                    Urgência {r.urgencia}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{r.imovelApelido}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {r.bairro}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{r.descricao}</p>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Data</div>
                    <div className="tabular-nums">{fmtDateBR(r.data)} · {r.hora}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Valor sugerido</div>
                    <div className="font-semibold tabular-nums">{fmtBRL(r.valorSugerido)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 inline-flex items-center gap-1 justify-center"
                    onClick={() => setAceitos((a) => [...a, r.id])}
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Assumir serviço
                  </button>
                  <button className="rounded-md border px-3 py-2 text-xs hover:bg-muted">Detalhes</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </MarocasAppShell>
  );
}
