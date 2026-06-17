import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Download, Trash2, FileText, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/documentos")({
  head: () => ({ meta: [{ title: "Documentos Contábeis — Impulsionando" }] }),
  component: ContabDocumentos,
});

interface Doc {
  id: string; client_id: string; doc_type: string; title: string;
  competence: string | null; status: string; file_path: string | null;
  file_size: number | null; mime_type: string | null; source: string;
  created_at: string;
}
interface Client { id: string; legal_name: string; trade_name: string | null; }

const DOC_TYPES = [
  { v: "nota_fiscal", l: "Nota Fiscal" },
  { v: "extrato", l: "Extrato Bancário" },
  { v: "folha", l: "Folha de Pagamento" },
  { v: "contrato", l: "Contrato" },
  { v: "balancete", l: "Balancete" },
  { v: "darf", l: "DARF/Guia" },
  { v: "outros", l: "Outros" },
];

const STATUS = [
  { v: "pending", l: "Pendente", c: "bg-amber-500/15 text-amber-700" },
  { v: "received", l: "Recebido", c: "bg-blue-500/15 text-blue-700" },
  { v: "processed", l: "Processado", c: "bg-green-500/15 text-green-700" },
  { v: "rejected", l: "Rejeitado", c: "bg-red-500/15 text-red-700" },
  { v: "archived", l: "Arquivado", c: "bg-gray-500/15 text-gray-600" },
];

function fmtSize(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function ContabDocumentos() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    client_id: "", doc_type: "nota_fiscal", title: "", competence: "", file: null as File | null,
  });

  const { data: clients } = useQuery({
    queryKey: ["contab-clients-min", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contab_clients").select("id, legal_name, trade_name")
        .eq("company_id", companyId!).order("legal_name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: docs, isLoading } = useQuery({
    queryKey: ["contab-docs", companyId, filterClient, filterStatus],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("contab_documents").select("*").eq("company_id", companyId!).order("created_at", { ascending: false });
      if (filterClient !== "all") q = q.eq("client_id", filterClient);
      if (filterStatus !== "all") q = q.eq("status", filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data as Doc[];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!form.file || !form.client_id) throw new Error("Selecione cliente e arquivo");
      const ext = form.file.name.split(".").pop() || "bin";
      const path = `${companyId}/${form.client_id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("contab-documents").upload(path, form.file, {
        cacheControl: "3600", upsert: false,
      });
      if (upErr) throw upErr;
      const { error } = await supabase.from("contab_documents").insert({
        company_id: companyId!,
        client_id: form.client_id,
        doc_type: form.doc_type,
        title: form.title || form.file.name,
        competence: form.competence || null,
        status: "received",
        file_path: path,
        file_size: form.file.size,
        mime_type: form.file.type,
        source: "upload",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento enviado");
      qc.invalidateQueries({ queryKey: ["contab-docs"] });
      setOpen(false);
      setForm({ client_id: "", doc_type: "nota_fiscal", title: "", competence: "", file: null });
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (d: Doc) => {
      if (d.file_path) await supabase.storage.from("contab-documents").remove([d.file_path]);
      const { error } = await supabase.from("contab_documents").delete().eq("id", d.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["contab-docs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function download(d: Doc) {
    if (!d.file_path) return;
    const { data, error } = await supabase.storage.from("contab-documents").createSignedUrl(d.file_path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Documentos enviados pelos clientes — notas fiscais, extratos, folhas, contratos."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Enviar
            </Button>
          </div>
        }
      />

      <Card className="p-3 mb-4 flex gap-2 items-center flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}
      {!isLoading && !docs?.length && (
        <EmptyState title="Nenhum documento" description="Envie o primeiro documento do escritório." />
      )}

      <div className="space-y-2">
        {docs?.map((d) => {
          const st = STATUS.find((s) => s.v === d.status);
          const dt = DOC_TYPES.find((t) => t.v === d.doc_type);
          const client = clients?.find((c) => c.id === d.client_id);
          return (
            <Card key={d.id} className="p-3 flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2"><FileText className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{d.title}</div>
                <div className="text-xs text-muted-foreground flex gap-2 flex-wrap mt-0.5">
                  <span>{client?.trade_name || client?.legal_name || "—"}</span>
                  <span>·</span>
                  <span>{dt?.l ?? d.doc_type}</span>
                  {d.competence && <><span>·</span><span>{d.competence.slice(0, 7)}</span></>}
                  <span>·</span>
                  <span>{fmtSize(d.file_size)}</span>
                </div>
              </div>
              {st && <Badge className={st.c} variant="secondary">{st.l}</Badge>}
              <Button size="sm" variant="ghost" onClick={() => download(d)} disabled={!d.file_path}>
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover documento?")) remove.mutate(d); }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar documento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Competência</Label>
                <Input type="month" value={form.competence ? form.competence.slice(0, 7) : ""}
                  onChange={(e) => setForm({ ...form, competence: e.target.value ? `${e.target.value}-01` : "" })} />
              </div>
            </div>
            <div>
              <Label>Título (opcional)</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: NF 1234 — Cliente X" />
            </div>
            <div>
              <Label>Arquivo *</Label>
              <Input ref={fileRef} type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} />
            </div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.client_id || !form.file || upload.isPending}
              onClick={() => upload.mutate()}>
              {upload.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
