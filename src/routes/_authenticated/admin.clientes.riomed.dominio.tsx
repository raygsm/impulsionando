import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ShieldCheck, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/dominio")({
  head: () => ({ meta: [{ title: "Rio Med · Domínio & Deploy" }] }),
  component: () => (
    <TenantModuleShell tenantSlug="riomed" moduleSlug="deploy" title="Domínio & Deploy">
      <Page />
    </TenantModuleShell>
  ),
});

function Page() {
  const { data: identity } = useQuery({
    queryKey: ["riomed-identity-domain"],
    queryFn: async () => {
      const { data } = await supabase
        .from("core_tenant_identity")
        .select("subdomain, custom_domain, brand_name, company_id")
        .eq("subdomain", "riomed")
        .maybeSingle();
      return data;
    },
  });

  const previewUrl = identity?.subdomain ? `https://${identity.subdomain}.impulsionando.com.br` : null;
  const customUrl = identity?.custom_domain ? `https://${identity.custom_domain}` : null;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Domínio & Deploy — Rio Med</h1>
        <p className="text-sm text-muted-foreground">
          URLs públicas, status de domínio personalizado e checklist de publicação.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" /> Subdomínio Impulsionando
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                {previewUrl}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Subdomínio não configurado.</p>
            )}
            <Badge variant="default">Ativo</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Domínio personalizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customUrl ? (
              <>
                <a href={customUrl} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                  {customUrl}
                </a>
                <Badge variant="default">Conectado</Badge>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Nenhum domínio personalizado vinculado.</p>
                <Badge variant="secondary">Pendente</Badge>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5" /> Checklist de publicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Identidade visual aprovada e tokens publicados</li>
            <li>• DNS apontado (CNAME → impulsionando.lovable.app)</li>
            <li>• Certificado SSL emitido</li>
            <li>• Páginas públicas (cotizar, hospitales, serviço técnico) validadas</li>
            <li>• Webhooks de pagamento e N8N ativos</li>
            <li>• Implantação 100% no painel correspondente</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
