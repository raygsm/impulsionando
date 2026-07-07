import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/automacao/erros")({
  head: () => ({ meta: [{ title: "Erros — Automação" }, { name: "robots", content: "noindex" }] }),
  component: ErrosPage,
});

function ErrosPage() {
  return (
    <Card className="p-6 text-center">
      <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <h2 className="text-base font-semibold">Sem erros registrados no modo demo</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
        Falhas de produção com <code>status: failed</code> aparecem aqui, agrupadas por workflow com contagem,
        último erro e link para a trilha. Requer view <code>v_n8n_metrics</code> (pendente).
      </p>
    </Card>
  );
}
