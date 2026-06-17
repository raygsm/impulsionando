import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Download, FileSpreadsheet, FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listContractDocuments, createContractDocument, getContractSignedUrl, listContractSignatures,
  prepareContractReissue,
} from "@/lib/contracts.functions";
import {
  listContractVersionsWithEvidence, listContractEmailLogs, resendContractEmail,
} from "@/lib/contracts-admin.functions";
import { Mail, History, RotateCw } from "lucide-react";
import { generateAndUploadContract } from "@/lib/contractPdf";
import { downloadCsv, downloadTablePdf } from "@/lib/exports";
import { supabase } from "@/integrations/supabase/client";
import { useMinimumWage } from "@/hooks/useCoreSetting";

export const Route = createFileRoute("/_authenticated/core/contratos")({
  head: () => ({ meta: [{ title: "Contratos Digitais — Core Impulsionando" }] }),
  component: ContractsPage,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho", sent: "Enviado", signed: "Assinado", cancelled: "Cancelado", archived: "Arquivado", superseded: "Substituído",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-sky-100 text-sky-700",
  signed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  archived: "bg-zinc-100 text-zinc-700",
  superseded: "bg-amber-100 text-amber-700",
};

function ContractsPage() {
  const qc = useQueryClient();
  const wage = useMinimumWage();

  const listFn = useServerFn(listContractDocuments);
  const createFn = useServerFn(createContractDocument);
  const urlFn = useServerFn(getContractSignedUrl);
  const sigsFn = useServerFn(listContractSignatures);
  const reissueFn = useServerFn(prepareContractReissue);
  const versionsFn = useServerFn(listContractVersionsWithEvidence);
  const emailLogsFn = useServerFn(listContractEmailLogs);
  const resendFn = useServerFn(resendContractEmail);

  const list = useQuery({ queryKey: ["contracts"], queryFn: () => listFn() });
  const rows = list.data ?? [];

  const [selected, setSelected] = useState<any | null>(null);
  const sigs = useQuery({
    queryKey: ["contract-sigs", selected?.id],
    queryFn: () => sigsFn({ data: { contract_document_id: selected!.id } }),
    enabled: !!selected,
  });
  const versions = useQuery({
    queryKey: ["contract-versions", selected?.id],
    queryFn: () => versionsFn({ data: { contract_document_id: selected!.id } }),
    enabled: !!selected,
  });
  const emailLogs = useQuery({
    queryKey: ["contract-emails", selected?.id],
    queryFn: () => emailLogsFn({ data: { contract_document_id: selected!.id } }),
    enabled: !!selected,
  });

  const resend = useMutation({
    mutationFn: (vars: { kind: "generated" | "signed"; to?: string }) =>
      resendFn({ data: { contract_document_id: selected!.id, kind: vars.kind, to: vars.to } }),
    onSuccess: (r: any) => {
      toast.success(`E-mail ${r.status === "queued" ? "enfileirado" : r.status}`);
      emailLogs.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao reenviar"),
  });


  // Geração de novo contrato
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company_id: "",
    plan: "integrado" as "essencial" | "integrado" | "avancado",
    cycle: "mensal" as "mensal" | "anual",
    signer_name: "",
    signer_email: "",
  });
  const companies = useQuery({
    queryKey: ["companies-min"],
    queryFn: async () =>
      (await supabase.from("companies").select("id, name, document").order("name").limit(500)).data ?? [],
  });

  const planMonthly = form.plan === "essencial" ? wage / 2 : form.plan === "avancado" ? wage * 2 : wage;
  const planName = form.plan === "essencial" ? "Essencial (½ SM)" : form.plan === "avancado" ? "Avançado (2 SM)" : "Integrado (1 SM)";

  const generate = useMutation({
    mutationFn: async () => {
      const company = companies.data?.find((c) => c.id === form.company_id);
      if (!company) throw new Error("Selecione uma empresa");
      const contractNumber = `IMP-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
      const meta = await generateAndUploadContract({
        company_id: company.id,
        company_name: company.name,
        company_doc: (company as any).document ?? undefined,
        contract_number: contractNumber,
        plan_name: planName,
        modules: form.plan === "essencial"
          ? [{ name: "CRM" }]
          : form.plan === "integrado"
          ? [{ name: "CRM" }, { name: "Agenda" }]
          : [{ name: "CRM" }, { name: "Agenda" }, { name: "Financeiro" }],
        monthly_brl: planMonthly,
        setup_brl: planMonthly,
        cycle: form.cycle,
        minimum_term_days: 90,
        signer_name: form.signer_name,
        signer_email: form.signer_email,
      });
      return createFn({
        data: {
          company_id: company.id,
          contract_number: contractNumber,
          storage_path: meta.storage_path,
          file_hash: meta.file_hash,
          file_size_bytes: meta.file_size_bytes,
          snapshot: meta.snapshot,
          notify_email: form.signer_email || null,
          signer_name: form.signer_name || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Contrato gerado e armazenado");
      qc.invalidateQueries({ queryKey: ["contracts"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao gerar contrato"),
  });

  const download = useMutation({
    mutationFn: (id: string) => urlFn({ data: { id } }),
    onSuccess: (r) => window.open(r.url, "_blank"),
    onError: (e: any) => toast.error(e?.message ?? "Falha ao baixar"),
  });

  const reissue = useMutation({
    mutationFn: async (parentId: string) => {
      const { parent, nextVersion } = await reissueFn({ data: { parent_id: parentId } });
      const snap = (parent.snapshot ?? {}) as any;
      const meta = await generateAndUploadContract({
        company_id: parent.company_id,
        company_name: snap.company_name ?? "",
        company_doc: snap.company_doc,
        contract_number: parent.contract_number,
        plan_name: snap.plan ?? "",
        modules: snap.modules ?? [],
        monthly_brl: snap.monthly_brl ?? 0,
        setup_brl: snap.setup_brl ?? 0,
        cycle: snap.cycle ?? "mensal",
        minimum_term_days: snap.minimum_term_days ?? 90,
        version: nextVersion,
      });
      return createFn({
        data: {
          company_id: parent.company_id,
          white_label_id: parent.white_label_id,
          billing_contract_id: parent.billing_contract_id,
          contract_number: parent.contract_number,
          storage_path: meta.storage_path,
          file_hash: meta.file_hash,
          file_size_bytes: meta.file_size_bytes,
          snapshot: { ...meta.snapshot, version: nextVersion },
          parent_document_id: parent.id,
          version: nextVersion,
        },
      });
    },
    onSuccess: () => {
      toast.success("Nova versão do contrato emitida");
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha na reemissão"),
  });

  const exportRows = useMemo(
    () =>
      rows.map((r: any) => ({
        numero: r.contract_number,
        empresa: r.companies?.name ?? "",
        plano: (r.snapshot as any)?.plan ?? "",
        ciclo: (r.snapshot as any)?.cycle ?? "",
        mensalidade: (r.snapshot as any)?.monthly_brl ?? "",
        status: STATUS_LABEL[r.status] ?? r.status,
        gerado_em: new Date(r.generated_at).toLocaleString("pt-BR"),
      })),
    [rows],
  );

  return (
    <div>
      <PageHeader
        title="Contratos Digitais"
        description="Geração de contrato em PDF, persistência no banco e assinatura eletrônica com evidência."
      />

      <Card className="p-4 mb-4 shadow-card flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{rows.length} contrato(s)</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadCsv(
            `contratos-${new Date().toISOString().slice(0,10)}.csv`,
            ["numero","empresa","plano","ciclo","mensalidade","status","gerado_em"], exportRows
          )}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadTablePdf({
            filename: `contratos-${new Date().toISOString().slice(0,10)}.pdf`,
            title: "Contratos Digitais",
            subtitle: `${rows.length} contrato(s) · gerado em ${new Date().toLocaleString("pt-BR")}`,
            columns: [
              { key: "numero", label: "Nº", width: 110 },
              { key: "empresa", label: "Empresa" },
              { key: "plano", label: "Plano" },
              { key: "status", label: "Status", width: 80 },
              { key: "gerado_em", label: "Gerado em", width: 130 },
            ],
            rows: exportRows,
          })}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo contrato</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Gerar contrato</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Empresa</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(companies.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Plano</Label>
                    <Select value={form.plan} onValueChange={(v: any) => setForm({ ...form, plan: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essencial">Essencial — ½ SM</SelectItem>
                        <SelectItem value="integrado">Integrado — 1 SM</SelectItem>
                        <SelectItem value="avancado">Avançado — 2 SM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Ciclo</Label>
                    <Select value={form.cycle} onValueChange={(v: any) => setForm({ ...form, cycle: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual (paga 10, usa 12)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Responsável</Label>
                    <Input value={form.signer_name} onChange={(e) => setForm({ ...form, signer_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">E-mail</Label>
                    <Input type="email" value={form.signer_email} onChange={(e) => setForm({ ...form, signer_email: e.target.value })} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Mensalidade calculada: <strong>{planMonthly.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong> · Setup: <strong>{planMonthly.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => generate.mutate()} disabled={generate.isPending || !form.company_id}>
                  {generate.isPending ? "Gerando…" : "Gerar PDF e arquivar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>v</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gerado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum contrato gerado.</TableCell></TableRow>}
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.contract_number}</TableCell>
                  <TableCell className="text-xs">v{r.version ?? 1}</TableCell>
                  <TableCell className="text-sm">{r.companies?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{(r.snapshot as any)?.plan ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_COLOR[r.status] ?? ""}>{STATUS_LABEL[r.status] ?? r.status}</Badge></TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(r.generated_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Sheet open={selected?.id === r.id} onOpenChange={(o) => setSelected(o ? r : null)}>
                      <SheetTrigger asChild><Button size="sm" variant="ghost">Detalhes</Button></SheetTrigger>
                      <SheetContent className="w-full sm:max-w-xl overflow-auto">
                        <SheetHeader><SheetTitle>{r.contract_number}</SheetTitle></SheetHeader>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-muted-foreground">Empresa:</span> {r.companies?.name}</div>
                            <div><span className="text-muted-foreground">Status:</span> {STATUS_LABEL[r.status]}</div>
                            <div><span className="text-muted-foreground">Hash:</span> <span className="font-mono text-[10px]">{r.file_hash?.slice(0, 24)}…</span></div>
                            <div><span className="text-muted-foreground">Tamanho:</span> {(r.file_size_bytes / 1024).toFixed(1)} KB</div>
                          </div>
                          <div>
                            <div className="font-medium mb-1">Snapshot</div>
                            <pre className="bg-muted/40 p-3 rounded text-xs overflow-auto max-h-72">{JSON.stringify(r.snapshot, null, 2)}</pre>
                          </div>
                          <div>
                            <div className="font-medium mb-1 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Assinaturas</div>
                            {sigs.isLoading && <div className="text-xs text-muted-foreground">Carregando…</div>}
                            {(sigs.data ?? []).length === 0 && !sigs.isLoading && <div className="text-xs text-muted-foreground">Ainda não assinado.</div>}
                            <div className="space-y-2">
                              {(sigs.data ?? []).map((s: any) => (
                                <div key={s.id} className="border rounded p-2 text-xs">
                                  <div className="font-medium">{s.signer_name} <span className="text-muted-foreground">· {s.signer_email}</span></div>
                                  <div className="text-muted-foreground">Assinado em {new Date(s.signed_at).toLocaleString("pt-BR")} · status {s.status}</div>
                                  <div className="font-mono text-[10px] mt-1">hash: {s.signature_hash?.slice(0, 32)}…</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium mb-1 flex items-center gap-1"><History className="w-4 h-4" /> Versões do contrato</div>
                            {versions.isLoading && <div className="text-xs text-muted-foreground">Carregando…</div>}
                            <div className="space-y-1">
                              {(versions.data ?? []).map((v: any) => (
                                <div key={v.id} className="border rounded p-2 text-xs flex items-start justify-between gap-2">
                                  <div>
                                    <div><strong>v{v.version}</strong> · <span className={`px-1 rounded ${STATUS_COLOR[v.status] ?? ""}`}>{STATUS_LABEL[v.status] ?? v.status}</span></div>
                                    <div className="text-muted-foreground">Gerado {new Date(v.generated_at).toLocaleString("pt-BR")} {v.signed_at && `· assinado ${new Date(v.signed_at).toLocaleString("pt-BR")}`}</div>
                                    {v.signatures?.[0] && (
                                      <div className="font-mono text-[10px] mt-1">evidência: {v.signatures[0].signature_hash?.slice(0,28)}… · {v.signatures[0].signer_email}</div>
                                    )}
                                  </div>
                                  {v.signed_storage_path && <Badge variant="outline" className="bg-emerald-100 text-emerald-700">PDF carimbado</Badge>}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="font-medium mb-1 flex items-center gap-1"><Mail className="w-4 h-4" /> E-mails enviados</div>
                            <div className="flex gap-2 mb-2">
                              <Button size="sm" variant="outline" onClick={() => resend.mutate({ kind: "generated" })} disabled={resend.isPending}>
                                <RotateCw className="w-3 h-3 mr-1" /> Reenviar "contrato gerado"
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => resend.mutate({ kind: "signed" })} disabled={resend.isPending}>
                                <RotateCw className="w-3 h-3 mr-1" /> Reenviar "contrato assinado"
                              </Button>
                            </div>
                            {emailLogs.isLoading && <div className="text-xs text-muted-foreground">Carregando logs…</div>}
                            {(emailLogs.data ?? []).length === 0 && !emailLogs.isLoading && <div className="text-xs text-muted-foreground">Nenhum envio registrado.</div>}
                            <div className="space-y-1">
                              {(emailLogs.data ?? []).map((l: any) => (
                                <div key={l.id} className="border rounded p-2 text-xs">
                                  <div className="flex justify-between gap-2">
                                    <div><strong>{l.template_name}</strong> → {l.recipient_email}</div>
                                    <Badge variant="outline" className={
                                      l.status === "sent" ? "bg-emerald-100 text-emerald-700" :
                                      l.status === "pending" ? "bg-sky-100 text-sky-700" :
                                      l.status === "suppressed" ? "bg-amber-100 text-amber-700" :
                                      "bg-red-100 text-red-700"
                                    }>{l.status}</Badge>
                                  </div>
                                  <div className="text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</div>
                                  {l.error_message && <div className="text-destructive mt-1">⚠ {l.error_message}</div>}
                                  {l.metadata?.idempotency_key && <div className="font-mono text-[10px] text-muted-foreground">key: {l.metadata.idempotency_key}</div>}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2">
                            <Button size="sm" onClick={() => download.mutate(r.id)} disabled={download.isPending}>
                              <Download className="w-4 h-4 mr-1" /> Baixar PDF
                            </Button>
                            <a className="text-xs underline ml-3" href={`/contrato/${r.id}`} target="_blank" rel="noreferrer">
                              Abrir link de assinatura do cliente
                            </a>
                          </div>

                        </div>
                      </SheetContent>
                    </Sheet>
                    <Button size="sm" variant="outline" onClick={() => download.mutate(r.id)}>
                      <Download className="w-4 h-4 mr-1" /> PDF
                    </Button>
                    {r.status !== "superseded" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => reissue.mutate(r.id)}
                        disabled={reissue.isPending}
                        title="Emite nova versão a partir do snapshot atual e marca esta como Substituída"
                      >
                        Reemitir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
