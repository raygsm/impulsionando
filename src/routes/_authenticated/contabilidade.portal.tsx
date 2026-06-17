import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Copy, ExternalLink, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/portal")({
  head: () => ({ meta: [{ title: "Portal do Cliente — Contabilidade" }] }),
  component: ContabPortalAdmin,
});

interface Row {
  id: string; legal_name: string; trade_name: string | null;
  document: string; status: string; portal_token: string;
}

function ContabPortalAdmin() {
  const { companyId } = useActiveCompany();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["contab-portal-list", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contab_clients")
        .select("id, legal_name, trade_name, document, status, portal_token")
        .eq("company_id", companyId!).order("legal_name");
      if (error) throw error;
      return data as Row[];
    },
  });

  function portalUrl(token: string) {
    return `${window.location.origin}/portal/contabilidade/${token}`;
  }

  function copy(token: string) {
    navigator.clipboard.writeText(portalUrl(token));
    toast.success("Link copiado");
  }

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Portal do Cliente"
        description="Cada cliente recebe um link exclusivo (somente leitura) para acompanhar documentos e obrigações."
        action={<CompanyPicker />}
      />

      <Card className="p-4 mb-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
        <div className="flex gap-3">
          <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Como funciona</p>
            <p className="text-blue-800/80 dark:text-blue-100/80 mt-1">
              Compartilhe o link com o cliente final. Ele acessa sem cadastro e visualiza documentos pendentes e obrigações em aberto. Para revogar acesso, basta marcar o cliente como inativo/cancelado.
            </p>
          </div>
        </div>
      </Card>

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}
      {!isLoading && !clients?.length && <EmptyState title="Nenhum cliente" description="Cadastre clientes em Clientes Contábeis." />}

      <div className="space-y-2">
        {clients?.map((c) => (
          <Card key={c.id} className="p-3 flex items-center gap-3 flex-wrap">
            <div className="rounded-md bg-primary/10 p-2"><Building2 className="w-4 h-4 text-primary" /></div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-medium truncate">{c.trade_name || c.legal_name}</div>
              <div className="text-xs text-muted-foreground">{c.document}</div>
            </div>
            <Badge variant={c.status === "active" ? "secondary" : "outline"}>{c.status}</Badge>
            <code className="text-[10px] text-muted-foreground hidden md:inline truncate max-w-[280px]">{portalUrl(c.portal_token)}</code>
            <Button size="sm" variant="outline" onClick={() => copy(c.portal_token)}>
              <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={portalUrl(c.portal_token)} target="_blank" rel="noopener">
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir
              </a>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
