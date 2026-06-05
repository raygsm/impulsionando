import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileText, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/paciente/")({
  head: () => ({ meta: [{ title: "Meus Prontuários — Impulsionando" }] }),
  component: PatientHome,
});

function PatientHome() {
  const { data: records, isLoading } = useQuery({
    queryKey: ["patient-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_records")
        .select("id, record_number, status, created_at, customers(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Meus prontuários</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Acesse os exames, evoluções e pareceres liberados pelo seu médico.
      </p>

      {isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
      ) : !records || records.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Nenhum prontuário disponível no momento. Assim que sua clínica liberar acesso,
          o registro aparecerá aqui.
        </Card>
      ) : (
        <div className="grid gap-3">
          {records.map((r: any) => (
            <Link key={r.id} to="/paciente/$id" params={{ id: r.id }}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {r.customers?.name || "Prontuário"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.record_number ? `Nº ${r.record_number} • ` : ""}
                        Aberto em {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
