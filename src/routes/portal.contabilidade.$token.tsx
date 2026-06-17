import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, FileText, ClipboardList, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/portal/contabilidade/$token")({
  head: () => ({ meta: [{ title: "Portal do Cliente — Contabilidade" }] }),
  component: PortalCliente,
});

interface PortalData {
  error?: string;
  client?: { legal_name: string; trade_name: string | null; document: string; document_type: string };
  documents?: Array<{ id: string; title: string; doc_type: string; competence: string | null; status: string; created_at: string }>;
  obligations?: Array<{ id: string; title: string; obligation_type: string; due_date: string; amount: number | null; status: string }>;
}

const today = new Date().toISOString().slice(0, 10);

function PortalCliente() {
  const { token } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["contab-portal", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contab_portal_data", { _token: token });
      if (error) throw error;
      return data as PortalData;
    },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;

  if (!data || data.error || !data.client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <h1 className="font-semibold text-lg mb-2">Acesso não encontrado</h1>
          <p className="text-sm text-muted-foreground">Este link é inválido ou foi revogado. Entre em contato com seu escritório de contabilidade.</p>
        </Card>
      </div>
    );
  }

  const { client, documents = [], obligations = [] } = data;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3"><Calculator className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="font-bold text-xl">{client.trade_name || client.legal_name}</h1>
            <p className="text-sm text-muted-foreground">{client.document_type}: {client.document}</p>
          </div>
        </header>

        <Card className="p-4 mb-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Portal do Cliente</strong> — área somente leitura. Para enviar documentos ou tirar dúvidas, fale com seu contador.
          </p>
        </Card>

        <section className="mb-8">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Obrigações em aberto ({obligations.length})
          </h2>
          {obligations.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma obrigação pendente.</Card>
          ) : (
            <div className="space-y-2">
              {obligations.map((o) => {
                const overdue = o.due_date < today;
                return (
                  <Card key={o.id} className="p-3 flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-medium">{o.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.obligation_type.toUpperCase()} · Vence {new Date(o.due_date).toLocaleDateString("pt-BR")}
                        {o.amount && ` · R$ ${Number(o.amount).toFixed(2)}`}
                      </div>
                    </div>
                    <Badge variant={overdue ? "destructive" : "secondary"}>
                      {overdue ? "Atrasada" : o.status}
                    </Badge>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Documentos recentes ({documents.length})
          </h2>
          {documents.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum documento recente.</Card>
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <Card key={d.id} className="p-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.doc_type} {d.competence && `· ${d.competence.slice(0, 7)}`}
                    </div>
                  </div>
                  <Badge variant="outline">{d.status}</Badge>
                </Card>
              ))}
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-muted-foreground mt-12 py-4">
          Powered by <a href="https://impulsionando.com.br" target="_blank" rel="noopener" className="underline">Impulsionando</a>
        </footer>
      </div>
    </div>
  );
}
