import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/crm")({
  head: () => ({ meta: [{ title: "CRM do Cliente — Impulsionando" }] }),
  component: TenantCrmTab,
});

function TenantCrmTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> CRM & Leads
        </h2>
        <p className="text-sm text-muted-foreground">
          Pipelines, oportunidades e leads do tenant <code>{slug}</code>.
        </p>
      </header>
      <Card className="p-6 text-sm space-y-3">
        <p>
          Visão completa em{" "}
          <Link to="/crm" className="text-primary hover:underline">/crm</Link>. Próxima entrega:
          recorte automático por tenant + funil unificado Impulsionando.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/crm">Abrir CRM</Link>
        </Button>
      </Card>
    </div>
  );
}
