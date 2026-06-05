import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Activity, FileText, Stethoscope, ShieldCheck, Download,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/paciente/$id")({
  head: () => ({ meta: [{ title: "Prontuário — Área do Paciente" }] }),
  component: PatientRecord,
});

function PatientRecord() {
  const { id } = Route.useParams();

  const { data: record } = useQuery({
    queryKey: ["patient-record", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_records")
        .select("id, record_number, created_at, customers(name, birthdate)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["patient-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_documents")
        .select("id, title, category, source, storage_path, mime_type, occurred_at, created_at, ai_summary")
        .eq("record_id", id)
        .eq("visible_to_patient", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: evolutions } = useQuery({
    queryKey: ["patient-evolutions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_evolutions")
        .select("id, occurred_at, doctor_name, chief_complaint, hypothesis, conduct, prescription, follow_up")
        .eq("record_id", id)
        .eq("released_to_patient", true)
        .not("signed_at", "is", null)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: opinions } = useQuery({
    queryKey: ["patient-opinions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_opinions")
        .select("id, summary, interpretation, conduct, doctor_name, confirmed_at, created_at")
        .eq("record_id", id)
        .eq("released_to_patient", true)
        .not("confirmed_at", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function download(d: any) {
    const { data, error } = await supabase.storage
      .from("ehr-documents")
      .createSignedUrl(d.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  const timeline = [
    ...(documents ?? []).map((d) => ({
      ts: d.created_at, kind: "Documento", title: d.title,
    })),
    ...(evolutions ?? []).map((e) => ({
      ts: e.occurred_at, kind: "Consulta",
      title: e.chief_complaint || "Evolução clínica",
    })),
    ...(opinions ?? []).map((o) => ({
      ts: o.created_at, kind: "Parecer",
      title: o.summary || "Parecer médico",
    })),
  ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts));

  return (
    <div>
      <div className="mb-4">
        <Link to="/paciente" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{record?.customers?.name ?? "Prontuário"}</h1>
            <div className="text-xs text-muted-foreground mt-1">
              {record?.record_number ? `Nº ${record.record_number}` : ""}
            </div>
          </div>
          <Badge variant="outline">Liberado pela clínica</Badge>
        </div>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline"><Activity className="w-4 h-4 mr-1" /> Linha do tempo</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="w-4 h-4 mr-1" /> Exames</TabsTrigger>
          <TabsTrigger value="evolutions"><Stethoscope className="w-4 h-4 mr-1" /> Consultas</TabsTrigger>
          <TabsTrigger value="opinions"><ShieldCheck className="w-4 h-4 mr-1" /> Pareceres</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          {timeline.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              Nenhum registro liberado ainda.
            </Card>
          ) : (
            <div className="space-y-3">
              {timeline.map((it, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="mb-1">{it.kind}</Badge>
                      <div className="font-medium text-sm">{it.title}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(it.ts).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {(documents ?? []).length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">Nenhum exame liberado ainda.</Card>
          ) : (
            <div className="grid gap-3">
              {documents!.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{d.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(d.created_at).toLocaleDateString("pt-BR")}
                      </div>
                      {d.ai_summary && (
                        <div className="mt-2 text-xs bg-muted/50 rounded p-2">
                          <span className="font-medium">Resumo: </span>{d.ai_summary}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => download(d)}>
                      <Download className="w-3.5 h-3.5" /> Abrir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evolutions" className="mt-4">
          {(evolutions ?? []).length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">Nenhuma consulta liberada ainda.</Card>
          ) : (
            <div className="space-y-3">
              {evolutions!.map((e) => (
                <Card key={e.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm">{e.chief_complaint || "Consulta"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.occurred_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  {e.doctor_name && <div className="text-xs text-muted-foreground mb-2">Dr(a). {e.doctor_name}</div>}
                  <div className="grid gap-2 text-sm">
                    {e.hypothesis && <div><span className="font-medium">Hipótese: </span>{e.hypothesis}</div>}
                    {e.conduct && <div><span className="font-medium">Conduta: </span>{e.conduct}</div>}
                    {e.prescription && <div><span className="font-medium">Prescrição: </span>{e.prescription}</div>}
                    {e.follow_up && <div><span className="font-medium">Retorno: </span>{e.follow_up}</div>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="opinions" className="mt-4">
          {(opinions ?? []).length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">Nenhum parecer liberado ainda.</Card>
          ) : (
            <div className="space-y-3">
              {opinions!.map((o) => (
                <Card key={o.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm">{o.summary || "Parecer médico"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  {o.doctor_name && <div className="text-xs text-muted-foreground mb-2">Dr(a). {o.doctor_name}</div>}
                  <div className="grid gap-2 text-sm">
                    {o.interpretation && <div><span className="font-medium">Interpretação: </span>{o.interpretation}</div>}
                    {o.conduct && <div><span className="font-medium">Conduta: </span>{o.conduct}</div>}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-primary" /> Confirmado eletronicamente em{" "}
                    {new Date(o.confirmed_at!).toLocaleDateString("pt-BR")}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
