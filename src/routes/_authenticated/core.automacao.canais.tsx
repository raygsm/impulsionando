import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { CHANNELS_MOCK } from "@/data/automacao-catalog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/core/automacao/canais")({
  head: () => ({ meta: [{ title: "Canais — Automação" }, { name: "robots", content: "noindex" }] }),
  component: CanaisPage,
});

const STATUS_STYLE = {
  ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  aguardando_credencial: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  desabilitado: "bg-muted text-foreground/70",
} as const;

function CanaisPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {CHANNELS_MOCK.map((c) => (
        <Card key={c.id} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{c.nome}</div>
              <div className="text-xs text-muted-foreground">{c.provedor}</div>
            </div>
            <Badge variant="outline" className={"border-transparent " + STATUS_STYLE[c.status]}>
              {c.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Configuração por tenant via <code>/core/integracoes/n8n</code>. Credenciais reais ficam no
            provedor N8N ou secrets do backend — nunca em código.
          </p>
        </Card>
      ))}
    </div>
  );
}
