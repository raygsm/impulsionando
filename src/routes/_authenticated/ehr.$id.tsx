import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useActiveCompany } from "@/hooks/use-active-company";
import {
  ArrowLeft, Upload, FileText, FileImage, Activity, Stethoscope, Download, ShieldCheck, UserPlus,
} from "lucide-react";
import { invitePatient } from "@/lib/ehr-patient.functions";

export const Route = createFileRoute("/_authenticated/ehr/$id")({
  head: () => ({ meta: [{ title: "Prontuário — Impulsionando" }] }),
  component: EhrDetail,
});

const CATEGORIES = [
  { v: "exam_lab", l: "Exame laboratorial" },
  { v: "exam_image", l: "Exame de imagem" },
  { v: "report", l: "Laudo" },
  { v: "prescription", l: "Receita" },
  { v: "request", l: "Solicitação" },
  { v: "personal_doc", l: "Documento pessoal" },
  { v: "external", l: "Relatório externo" },
  { v: "referral", l: "Encaminhamento" },
  { v: "term", l: "Termo" },
  { v: "other", l: "Outro" },
];

const SOURCES = [
  { v: "clinic", l: "Clínica" },
  { v: "doctor", l: "Médico" },
  { v: "patient", l: "Paciente" },
  { v: "other", l: "Outro" },
];

function EhrDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();

  const { data: record } = useQuery({
    queryKey: ["ehr-record", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_records")
        .select("*, customers(id, name, document, phone, email, birthdate, patient_user_id, patient_invited_at)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["ehr-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_documents")
        .select("*")
        .eq("record_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: evolutions } = useQuery({
    queryKey: ["ehr-evolutions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_evolutions")
        .select("*")
        .eq("record_id", id)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: opinions } = useQuery({
    queryKey: ["ehr-opinions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_opinions")
        .select("*")
        .eq("record_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <div className="mb-4">
        <Link to="/ehr" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>
      </div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <PageHeader
          title={record?.customers?.name ?? "Prontuário"}
          description={
            record?.customers
              ? [
                  record.customers.document,
                  record.customers.phone,
                  record.customers.email,
                ].filter(Boolean).join(" • ")
              : "Carregando…"
          }
        />
        <PatientAccessButton
          recordId={id}
          customer={record?.customers}
          onChange={() => qc.invalidateQueries({ queryKey: ["ehr-record", id] })}
        />
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">
            <Activity className="w-4 h-4 mr-1" /> Linha do tempo
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-1" /> Documentos
          </TabsTrigger>
          <TabsTrigger value="evolutions">
            <Stethoscope className="w-4 h-4 mr-1" /> Evoluções
          </TabsTrigger>
          <TabsTrigger value="opinions">
            <ShieldCheck className="w-4 h-4 mr-1" /> Pareceres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <TimelineTab
            documents={documents ?? []}
            evolutions={evolutions ?? []}
            opinions={opinions ?? []}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsTab
            recordId={id}
            companyId={companyId}
            documents={documents ?? []}
            onChange={() => qc.invalidateQueries({ queryKey: ["ehr-documents", id] })}
          />
        </TabsContent>

        <TabsContent value="evolutions" className="mt-4">
          <EvolutionsTab
            recordId={id}
            companyId={companyId}
            evolutions={evolutions ?? []}
            onChange={() => qc.invalidateQueries({ queryKey: ["ehr-evolutions", id] })}
          />
        </TabsContent>

        <TabsContent value="opinions" className="mt-4">
          <OpinionsTab
            recordId={id}
            companyId={companyId}
            opinions={opinions ?? []}
            documents={documents ?? []}
            onChange={() => qc.invalidateQueries({ queryKey: ["ehr-opinions", id] })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Timeline ---------- */
function TimelineTab({
  documents, evolutions, opinions,
}: { documents: any[]; evolutions: any[]; opinions: any[] }) {
  type Item = { ts: string; kind: string; title: string; subtitle?: string };
  const items: Item[] = [
    ...documents.map((d) => ({
      ts: d.created_at, kind: "Documento",
      title: d.title, subtitle: catLabel(d.category) + " • " + srcLabel(d.source),
    })),
    ...evolutions.map((e) => ({
      ts: e.occurred_at, kind: "Evolução",
      title: e.chief_complaint || "Evolução clínica",
      subtitle: e.doctor_name || "",
    })),
    ...opinions.map((o) => ({
      ts: o.created_at, kind: "Parecer",
      title: o.summary || "Parecer médico",
      subtitle: o.confirmed_at ? "Confirmado eletronicamente" : "Em aberto",
    })),
  ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts));

  if (items.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground shadow-card">Sem registros ainda.</Card>;
  }
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <Card key={i} className="p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge variant="outline" className="mb-1">{it.kind}</Badge>
              <div className="font-medium text-sm">{it.title}</div>
              {it.subtitle && <div className="text-xs text-muted-foreground">{it.subtitle}</div>}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(it.ts).toLocaleString("pt-BR")}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------- Documents ---------- */
function DocumentsTab({
  recordId, companyId, documents, onChange,
}: { recordId: string; companyId: string | undefined; documents: any[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("exam_lab");
  const [source, setSource] = useState("clinic");
  const [visibleToPatient, setVisibleToPatient] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload() {
    if (!companyId) return toast.error("Selecione uma empresa");
    const f = fileRef.current?.files?.[0];
    if (!f) return toast.error("Selecione um arquivo");
    if (!title.trim()) return toast.error("Informe um título");
    setUploading(true);
    try {
      const ext = f.name.split(".").pop() || "bin";
      const path = `${companyId}/${recordId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("ehr-documents").upload(path, f, {
        contentType: f.type || undefined,
      });
      if (up.error) throw up.error;
      const { error } = await supabase.from("ehr_documents").insert({
        company_id: companyId,
        record_id: recordId,
        title,
        category,
        source,
        storage_path: path,
        mime_type: f.type || null,
        size_bytes: f.size,
        visible_to_patient: visibleToPatient,
      });
      if (error) throw error;
      toast.success("Documento anexado");
      setOpen(false);
      setTitle("");
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function download(d: any) {
    const { data, error } = await supabase.storage
      .from("ehr-documents")
      .createSignedUrl(d.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="w-4 h-4" /> Anexar documento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Anexar documento ou exame</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Categoria</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Origem</label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm">Arquivo</label>
                <Input ref={fileRef} type="file" accept="application/pdf,image/*,.doc,.docx" />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Visível para o paciente</div>
                  <div className="text-xs text-muted-foreground">Libera consulta na área do paciente</div>
                </div>
                <Switch checked={visibleToPatient} onCheckedChange={setVisibleToPatient} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={upload} disabled={uploading}>
                {uploading ? "Enviando…" : "Anexar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground shadow-card">
          Nenhum documento anexado ainda.
        </Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((d) => (
            <Card key={d.id} className="p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {d.category === "exam_image" ? (
                      <FileImage className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm truncate">{d.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {catLabel(d.category)} • {srcLabel(d.source)} •{" "}
                    {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {d.visible_to_patient && <Badge variant="outline">Visível ao paciente</Badge>}
                    {d.requires_review && <Badge variant="outline">Aguarda revisão</Badge>}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => download(d)}>
                  <Download className="w-3.5 h-3.5" /> Abrir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Evolutions ---------- */
function EvolutionsTab({
  recordId, companyId, evolutions, onChange,
}: { recordId: string; companyId: string | undefined; evolutions: any[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [releaseToPatient, setReleaseToPatient] = useState(false);
  const [form, setForm] = useState({
    chief_complaint: "", clinical_history: "", physical_exam: "",
    hypothesis: "", conduct: "", exams_requested: "", prescription: "", follow_up: "", notes: "",
  });

  async function save() {
    if (!companyId) return toast.error("Selecione uma empresa");
    const { error } = await supabase.from("ehr_evolutions").insert({
      company_id: companyId, record_id: recordId, ...form,
      released_to_patient: releaseToPatient,
      signed_at: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success("Evolução registrada");
    setOpen(false);
    setReleaseToPatient(false);
    setForm({
      chief_complaint: "", clinical_history: "", physical_exam: "",
      hypothesis: "", conduct: "", exams_requested: "", prescription: "", follow_up: "", notes: "",
    });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Nova evolução</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar evolução clínica</DialogTitle></DialogHeader>
            <div className="space-y-2">
              {([
                ["chief_complaint", "Queixa principal"],
                ["clinical_history", "História clínica"],
                ["physical_exam", "Exame físico"],
                ["hypothesis", "Hipótese diagnóstica"],
                ["conduct", "Conduta"],
                ["exams_requested", "Exames solicitados"],
                ["prescription", "Prescrição"],
                ["follow_up", "Retorno recomendado"],
                ["notes", "Observações"],
              ] as const).map(([k, l]) => (
                <div key={k}>
                  <label className="text-sm">{l}</label>
                  <Textarea
                    rows={2}
                    value={(form as any)[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </div>
              ))}
              <Toggle l="Liberar evolução para o paciente"
                v={releaseToPatient} onChange={setReleaseToPatient} />
            </div>
            <DialogFooter><Button onClick={save}>Confirmar evolução</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {evolutions.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground shadow-card">Sem evoluções registradas.</Card>
      ) : (
        <div className="space-y-3">
          {evolutions.map((e) => (
            <Card key={e.id} className="p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm">
                  {e.chief_complaint || "Evolução clínica"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.occurred_at).toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {e.hypothesis && <Field l="Hipótese" v={e.hypothesis} />}
                {e.conduct && <Field l="Conduta" v={e.conduct} />}
                {e.exams_requested && <Field l="Exames solicitados" v={e.exams_requested} />}
                {e.prescription && <Field l="Prescrição" v={e.prescription} />}
                {e.follow_up && <Field l="Retorno" v={e.follow_up} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Opinions ---------- */
function OpinionsTab({
  recordId, companyId, opinions, documents, onChange,
}: {
  recordId: string; companyId: string | undefined;
  opinions: any[]; documents: any[]; onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [docId, setDocId] = useState<string>("");
  const [form, setForm] = useState({
    summary: "", interpretation: "", conduct: "",
    request_followup: false, request_new_exam: false, released_to_patient: false,
    internal_notes: "",
  });

  async function save(confirm: boolean) {
    if (!companyId) return toast.error("Selecione uma empresa");
    const { error } = await supabase.from("ehr_opinions").insert({
      company_id: companyId, record_id: recordId,
      document_id: docId || null,
      ...form,
      confirmed_at: confirm ? new Date().toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success(confirm ? "Parecer confirmado eletronicamente" : "Parecer salvo");
    setOpen(false);
    setDocId("");
    setForm({
      summary: "", interpretation: "", conduct: "",
      request_followup: false, request_new_exam: false, released_to_patient: false,
      internal_notes: "",
    });
    onChange();
  }

  async function confirmExisting(o: any) {
    const { error } = await supabase
      .from("ehr_opinions")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Parecer confirmado eletronicamente");
    onChange();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Novo parecer</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar parecer médico</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Documento relacionado (opcional)</label>
                <Select value={docId} onValueChange={setDocId}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    {documents.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {([
                ["summary", "Resumo médico"],
                ["interpretation", "Interpretação médica"],
                ["conduct", "Conduta sugerida"],
                ["internal_notes", "Observações internas"],
              ] as const).map(([k, l]) => (
                <div key={k}>
                  <label className="text-sm">{l}</label>
                  <Textarea
                    rows={2}
                    value={(form as any)[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </div>
              ))}
              <Toggle l="Solicitar retorno" v={form.request_followup}
                onChange={(v) => setForm({ ...form, request_followup: v })} />
              <Toggle l="Solicitar novo exame" v={form.request_new_exam}
                onChange={(v) => setForm({ ...form, request_new_exam: v })} />
              <Toggle l="Liberar para o paciente" v={form.released_to_patient}
                onChange={(v) => setForm({ ...form, released_to_patient: v })} />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => save(false)}>Salvar rascunho</Button>
              <Button onClick={() => save(true)}>Confirmar eletronicamente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {opinions.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground shadow-card">Sem pareceres registrados.</Card>
      ) : (
        <div className="space-y-3">
          {opinions.map((o) => (
            <Card key={o.id} className="p-4 shadow-card">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-medium text-sm">{o.summary || "Parecer"}</div>
                <div className="flex items-center gap-2">
                  {o.confirmed_at ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                      Confirmado
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => confirmExisting(o)}>
                      Confirmar
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {o.interpretation && <Field l="Interpretação" v={o.interpretation} />}
                {o.conduct && <Field l="Conduta" v={o.conduct} />}
              </div>
              <div className="flex gap-1.5 mt-2">
                {o.released_to_patient && <Badge variant="outline">Liberado ao paciente</Badge>}
                {o.request_followup && <Badge variant="outline">Retorno solicitado</Badge>}
                {o.request_new_exam && <Badge variant="outline">Novo exame</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function Field({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
      <div className="text-sm whitespace-pre-wrap">{v}</div>
    </div>
  );
}
function Toggle({ l, v, onChange }: { l: string; v: boolean; onChange: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-sm">{l}</span>
      <Switch checked={v} onCheckedChange={onChange} />
    </div>
  );
}
function catLabel(v: string) { return CATEGORIES.find((c) => c.v === v)?.l ?? v; }
function srcLabel(v: string) { return SOURCES.find((s) => s.v === v)?.l ?? v; }

/* ---------- Patient Access Button ---------- */
function PatientAccessButton({
  recordId, customer, onChange,
}: {
  recordId: string;
  customer: { id: string; name: string | null; email: string | null; patient_user_id: string | null; patient_invited_at: string | null } | null | undefined;
  onChange: () => void;
}) {
  const invite = useServerFn(invitePatient);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(customer?.email ?? "");
  const [name, setName] = useState(customer?.name ?? "");
  const [loading, setLoading] = useState(false);

  if (!customer) return null;

  const isLinked = !!customer.patient_user_id;

  async function submit() {
    if (!email.trim()) return toast.error("Informe um e-mail");
    setLoading(true);
    try {
      const r: any = await invite({ data: { recordId, email: email.trim(), name: name.trim() || undefined } });
      if (r?.alreadyLinked) toast.success("Paciente já tinha acesso vinculado");
      else toast.success("Convite enviado ao paciente");
      setOpen(false);
      onChange();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao convidar paciente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isLinked ? "outline" : "default"} size="sm">
          <UserPlus className="w-4 h-4" />
          {isLinked ? "Acesso liberado" : "Liberar acesso ao paciente"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLinked ? "Acesso do paciente" : "Convidar paciente"}
          </DialogTitle>
        </DialogHeader>
        {isLinked ? (
          <div className="text-sm space-y-2">
            <p>Este paciente já possui acesso à área exclusiva.</p>
            {customer.patient_invited_at && (
              <p className="text-xs text-muted-foreground">
                Convidado em {new Date(customer.patient_invited_at).toLocaleString("pt-BR")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Ele(a) verá apenas documentos, evoluções e pareceres que você marcar como liberados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">E-mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Enviaremos um e-mail com link de acesso. O paciente verá apenas conteúdos liberados.
            </p>
            <DialogFooter>
              <Button onClick={submit} disabled={loading}>
                {loading ? "Enviando…" : "Enviar convite"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
