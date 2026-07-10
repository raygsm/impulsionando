import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, EventPill, StatusBadge, Section, SuccessBanner } from "@/components/marocas/MarocasUI";
import { MOCK_PRESTADOR_AGENDA, fmtBRL, fmtDateBR } from "@/components/marocas/marocasMockData";
import { X } from "lucide-react";

export const Route = createFileRoute("/marocas/app/prestador/aceitos")({
  head: () => ({ meta: [{ title: "Serviços aceitos — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AceitosPage,
});

function AceitosPage() {
  const [cancelou, setCancelou] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const rows = MOCK_PRESTADOR_AGENDA.filter((r) => r.status === "confirmado");

  return (
    <MarocasAppShell
      title="Serviços aceitos"
      description="Compromissos confirmados. Precisa cancelar? Peça substituição — o serviço volta para a fila e outro prestador assume."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Aceitos" }]}
    >
      {enviado && (
        <div className="mb-4">
          <SuccessBanner
            title="Substituição solicitada"
            description="O serviço volta para a fila. A gestão da Marocas será notificada e outro prestador pode assumir."
          />
        </div>
      )}

      <Section title={`${rows.length} confirmados`}>
        <DataTable
          rows={rows}
          columns={[
            { header: "Data", render: (r) => <span className="tabular-nums whitespace-nowrap">{fmtDateBR(r.data)} · {r.hora}</span> },
            { header: "Tipo", render: (r) => <EventPill type={r.tipo} /> },
            { header: "Imóvel", render: (r) => r.imovelApelido },
            { header: "Bairro", render: (r) => <span className="text-xs">{r.bairro}</span> },
            { header: "Valor", render: (r) => <span className="tabular-nums font-medium">{fmtBRL(r.valor)}</span> },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              header: "Ações",
              render: (r) => (
                <button
                  type="button"
                  onClick={() => setCancelou(r.id)}
                  className="text-xs inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-muted"
                >
                  <X className="h-3 w-3" /> Solicitar substituição
                </button>
              ),
            },
          ]}
        />
      </Section>

      {cancelou && !enviado && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-5 space-y-3">
            <h3 className="font-semibold">Solicitar substituição</h3>
            <p className="text-sm text-muted-foreground">
              Explique o motivo. O serviço volta para a fila e outro prestador poderá assumir. A gestão da Marocas
              revisa o histórico e pode ajustar o valor conforme a situação.
            </p>
            <textarea
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Ex.: passei mal e preciso descansar hoje…"
            />
            <div className="flex justify-end gap-2">
              <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" onClick={() => setCancelou(null)}>
                Voltar
              </button>
              <button
                className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                disabled={motivo.trim().length < 5}
                onClick={() => { setEnviado(true); setCancelou(null); setMotivo(""); }}
              >
                Confirmar substituição
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground max-w-2xl">
        <p className="font-semibold text-foreground mb-1">Fluxo de substituição</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Você solicita cancelamento com justificativa.</li>
          <li>O serviço volta automaticamente para a fila pública.</li>
          <li>Outro prestador pode assumir imediatamente.</li>
          <li>O valor pode ser ajustado conforme urgência ou complexidade.</li>
          <li>A gestão Marocas aprova ou registra a alteração para auditoria.</li>
          <li>O histórico permanece visível para todos os envolvidos.</li>
        </ol>
      </div>
    </MarocasAppShell>
  );
}
