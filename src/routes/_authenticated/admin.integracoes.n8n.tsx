import { createFileRoute, Link } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/integracoes/n8n")({
  head: () => ({
    meta: [
      { title: "n8n — Gestão centralizada" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LegacyN8nRedirectPage,
});

function LegacyN8nRedirectPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <Workflow className="h-10 w-10 mx-auto" />
          <div>
            <h1 className="text-2xl font-semibold">Gestão n8n centralizada</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
              A configuração antiga por URLs manuais foi desativada para evitar divergência entre o dashboard e o runtime real. A gestão oficial usa o registry do Core e o estado efetivo dos workflows da VPS.
            </p>
          </div>
          <Button asChild>
            <Link to="/core/integracoes/n8n">Abrir painel n8n oficial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
