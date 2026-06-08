import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMatches } from "@/lib/realestate.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export const Route = createFileRoute("/_authenticated/imobiliaria/matches")({
  head: () => ({ meta: [{ title: "Matches — Imobiliária" }] }),
  component: Page,
});

type Match = {
  id: string; property_id: string; intent_id: string; notified_at: string;
  realestate_properties: { title: string; reference_code: string | null; neighborhood: string | null; city: string | null } | null;
  realestate_search_intents: { contact_name: string | null; contact_email: string | null } | null;
};

function Page() {
  const { companyId } = useActiveCompany();
  const fetchList = useServerFn(listMatches);
  const { data, isLoading } = useQuery({
    queryKey: ["realestate-matches", companyId],
    enabled: !!companyId,
    queryFn: () => fetchList({ data: { companyId } }),
  });

  const matches = (data?.matches ?? []) as Match[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Matches notificados"
        description="Histórico de pareamentos imóvel × intenção que dispararam WhatsApp/e-mail."
      />
      {!companyId ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Selecione uma empresa.</p></Card>
      ) : isLoading ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Carregando…</p></Card>
      ) : matches.length === 0 ? (
        <EmptyState title="Nenhum match ainda" description="Cadastre imóveis e intenções para iniciar o matching automático." />
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <Card key={m.id} className="p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{m.realestate_properties?.title ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {m.realestate_properties?.neighborhood ?? "-"}, {m.realestate_properties?.city ?? "-"}
                </div>
              </div>
              <div className="text-sm">
                <Badge variant="outline">Lead: {m.realestate_search_intents?.contact_name ?? "—"}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(m.notified_at).toLocaleString("pt-BR")}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
