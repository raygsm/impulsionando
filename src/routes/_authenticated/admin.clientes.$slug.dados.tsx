import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin, Globe, ArrowRight } from "lucide-react";
import { CoreSection, EmptyState } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/dados")({
  head: () => ({ meta: [{ title: "Dados do cliente — Impulsionando" }] }),
  component: TenantDadosTab,
});

function TenantDadosTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title="Dados do cliente"
        description={`Identidade, contatos, endereço e status comercial de ${slug}. A leitura consolidada segue no Resumo enquanto a edição por aqui é preparada.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/clientes/$slug" params={{ slug }}>
                Resumo do cliente <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/clientes/$slug/configuracoes" params={{ slug }}>
                Configurações <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        }
      >
        <Card className="p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field icon={<Building2 className="h-4 w-4" aria-hidden />} label="Razão social" hint="Nome legal registrado do cliente conectado ao Core." />
            <Field icon={<Building2 className="h-4 w-4" aria-hidden />} label="Nome fantasia" hint="Nome comercial exibido nas telas do cliente." />
            <Field icon={<Mail className="h-4 w-4" aria-hidden />} label="E-mail principal" />
            <Field icon={<Phone className="h-4 w-4" aria-hidden />} label="Telefone / WhatsApp" />
            <Field icon={<MapPin className="h-4 w-4" aria-hidden />} label="Endereço" hint="Cidade / UF / país usados para locale e faturamento." />
            <Field icon={<Globe className="h-4 w-4" aria-hidden />} label="Site institucional" />
          </div>
        </Card>

        <EmptyState
          variant="compact"
          title="Edição consolidada nesta aba em preparação"
          description="Assim que a edição direta for liberada, todos os campos acima ficarão editáveis com histórico auditado. Enquanto isso, a leitura completa segue disponível no Resumo do cliente."
        />
      </CoreSection>
    </div>
  );
}

function Field({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-medium text-muted-foreground/70">—</div>
      {hint ? <div className="text-[11px] text-muted-foreground mt-1">{hint}</div> : null}
    </div>
  );
}
