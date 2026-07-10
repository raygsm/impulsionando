import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2, AlertTriangle, ExternalLink, ArrowRight } from "lucide-react";
import { CoreSection } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/publicacao")({
  head: () => ({ meta: [{ title: "Publicação do cliente — Impulsionando" }] }),
  component: TenantPublicacaoTab,
});

function TenantPublicacaoTab() {
  const { slug } = Route.useParams();
  const previsto = `${slug}.impulsionando.com.br`;
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title="Publicação"
        description={`Retrato atual do site publicado do cliente ${slug}: preview interno, domínio Impulsionando e domínio próprio. As ações de deploy dependem do pipeline central.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <a href={`https://${previsto}`} target="_blank" rel="noreferrer" aria-label="Abrir site publicado em nova aba">
                Abrir site <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/clientes/$slug/dominio" params={{ slug }}>
                Domínio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        }
      >
        <Card className="p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Status ok label="Preview interno" value={`${slug} · preview`} />
            <Status ok label="Domínio Impulsionando" value={previsto} />
            <Status label="Domínio próprio" value="Não configurado" />
          </div>

          <div className="border-t pt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Rocket className="h-3.5 w-3.5" aria-hidden />
            O status exibido reflete o estado atual da publicação. Ajustes de DNS, SSL e deploy passam pelo pipeline central da Impulsionando.
          </div>
        </Card>
      </CoreSection>
    </div>
  );
}

function Status({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-sm font-medium">
        <Icon
          className={ok ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-amber-600"}
          aria-hidden
        />
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}
