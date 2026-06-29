import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Boxes } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/modulos")({
  head: () => ({ meta: [{ title: "Módulos do Cliente — Impulsionando" }] }),
  component: TenantModulesTab,
});

function TenantModulesTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Boxes className="h-5 w-5" /> Módulos ativos do tenant
        </h2>
        <p className="text-sm text-muted-foreground">
          Catálogo, ativação e configuração dos módulos provisionados para <code>{slug}</code>.
        </p>
      </header>
      <Card className="p-6 text-sm space-y-3">
        <p>
          A operação por tenant está em <Link to="/modules" className="text-primary hover:underline">/modules</Link>.
          Em breve a aba trará: ativação direta, dependências entre módulos, planos vinculados e histórico de mudanças.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/modules">Abrir catálogo de módulos</Link>
        </Button>
      </Card>
    </div>
  );
}
