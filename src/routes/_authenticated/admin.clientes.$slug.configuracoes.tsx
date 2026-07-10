import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Settings, ArrowRight, Palette, Globe } from "lucide-react";
import { CoreSection, EmptyState } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações do Cliente — Impulsionando" }] }),
  component: TenantSettingsTab,
});

function TenantSettingsTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title="Configurações do cliente"
        description={`Identidade visual, branding, aliases de e-mail, parâmetros operacionais e integrações do cliente ${slug}. Consolidação incremental nesta aba.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/branding">
                <Palette className="h-3.5 w-3.5" /> Branding
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/clientes/$slug/dominio" params={{ slug }}>
                <Globe className="h-3.5 w-3.5" /> Domínio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        }
      >
        <EmptyState
          icon={<Settings className="h-5 w-5" aria-hidden />}
          title="Central de configurações deste cliente em consolidação"
          description="Identidade visual, aliases de e-mail, preferências operacionais e integrações serão editáveis diretamente por aqui. Enquanto isso, as edições continuam disponíveis nas telas dedicadas de Branding e Domínio, com auditoria completa."
        />
      </CoreSection>
    </div>
  );
}
