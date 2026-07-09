import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/publicacao")({
  head: () => ({ meta: [{ title: "Publicação do cliente — Impulsionando" }] }),
  component: TenantPublicacaoTab,
});

// Onda 3.2 — Cliente 360. Aba visual "Publicação". Consolida o status do
// site publicado do cliente (build, DNS, SSL, preview vs. produção).
// A automação real (deploy sob demanda, rollback, gates) entra na Fase 3.5.
function TenantPublicacaoTab() {
  const { slug } = Route.useParams();
  const previsto = `${slug}.impulsionando.com.br`;
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Rocket className="h-5 w-5" /> Publicação
          </h2>
          <p className="text-sm text-muted-foreground">
            Status do site publicado do cliente <code>{slug}</code>.
          </p>
        </div>
        <Badge variant="outline">Prévia visual · Fase 3.5</Badge>
      </header>

      <Card className="p-6 space-y-3 text-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Status ok label="Preview interno" value={`${slug} · preview`} />
          <Status ok label="Domínio Impulsionando" value={previsto} />
          <Status label="Domínio próprio" value="—" />
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            A automação de publicação, rollback e verificação ao vivo é entregue na Fase 3.5.
            Nesta aba apenas exibimos o retrato atual.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={`https://${previsto}`} target="_blank" rel="noreferrer">
                Abrir site <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/clientes/$slug/dominio" params={{ slug }}>Ir para Domínios</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Status({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-sm font-medium">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}
