import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/core/automacao/historico")({
  head: () => ({ meta: [{ title: "Histórico — Automação" }, { name: "robots", content: "noindex" }] }),
  component: HistoricoPage,
});

const EVENTS = [
  { data: "2026-07-07", ator: "Sistema", acao: "Gerados 86 workflows N8N (Onda 2)", detalhe: "docs/n8n/generate-workflows.mjs" },
  { data: "2026-07-07", ator: "Sistema", acao: "Publicado ARQUITETURA/CATALOGO/matrizes (Onda 1)", detalhe: "docs/n8n/**" },
  { data: "2026-07-07", ator: "Sistema", acao: "UI /core/automacao publicada (Onda 3)", detalhe: "15 subáreas" },
];

function HistoricoPage() {
  return (
    <Card className="p-4">
      <ol className="relative border-l pl-4 space-y-4">
        {EVENTS.map((e, i) => (
          <li key={i} className="text-sm">
            <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary" />
            <div className="text-xs text-muted-foreground">{e.data} · {e.ator}</div>
            <div className="font-medium">{e.acao}</div>
            <div className="text-xs text-muted-foreground font-mono">{e.detalhe}</div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Histórico real (mudanças de status, aprovações, ativações) exige tabela dedicada — pendente em
        docs/n8n/PENDENCIAS.md.
      </p>
    </Card>
  );
}
