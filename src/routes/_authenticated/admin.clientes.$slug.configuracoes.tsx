import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações do Cliente — Impulsionando" }] }),
  component: TenantSettingsTab,
});

function TenantSettingsTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" /> Configurações
        </h2>
        <p className="text-sm text-muted-foreground">
          Identidade, branding, e-mails e parâmetros do tenant <code>{slug}</code>.
        </p>
      </header>
      <Card className="p-6 text-sm space-y-3">
        <p>
          Branding e identidade visual em{" "}
          <Link to="/admin/branding" className="text-primary hover:underline">/admin/branding</Link>.
          Aliases de e-mail e domínio também ficam acessíveis pelo painel global. Próxima entrega:
          consolidação completa nesta aba.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/branding">Branding</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/clientes/$slug/dominio" params={{ slug }}>Domínio</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
