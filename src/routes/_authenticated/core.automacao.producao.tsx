import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/automacao/producao")({
  head: () => ({ meta: [{ title: "Produção — Automação" }, { name: "robots", content: "noindex" }] }),
  component: ProducaoPage,
});

function ProducaoPage() {
  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <Rocket className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <h2 className="text-base font-semibold">Nenhum workflow em produção ainda</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
          A ativação real depende do checklist em <code>docs/n8n/checklist-ativacao.md</code>,
          templates aprovados na Meta, canais conectados e aprovação manual do responsável do tenant.
        </p>
      </Card>
    </div>
  );
}
