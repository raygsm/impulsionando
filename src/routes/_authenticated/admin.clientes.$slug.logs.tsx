import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/logs")({
  head: () => ({ meta: [{ title: "Logs & Auditoria do Cliente — Impulsionando" }] }),
  component: TenantLogsTab,
});

function TenantLogsTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Logs & Auditoria
        </h2>
        <p className="text-sm text-muted-foreground">
          Histórico de ações, LGPD e compliance do tenant <code>{slug}</code>.
        </p>
      </header>
      <Card className="p-6 text-sm space-y-3">
        <p>
          Trilha completa em{" "}
          <Link to="/admin/audit-trail" className="text-primary hover:underline">
            /admin/audit-trail
          </Link>. Próxima entrega: filtro fixo por tenant + ações sensíveis com confirmação.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/audit-trail">Abrir audit trail</Link>
        </Button>
      </Card>
    </div>
  );
}
