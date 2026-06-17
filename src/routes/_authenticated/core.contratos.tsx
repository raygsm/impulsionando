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

  const list = useQuery({ queryKey: ["contracts"], queryFn: () => listFn() });
  const rows = list.data ?? [];

  const [selected, setSelected] = useState<any | null>(null);
  const sigs = useQuery({
    queryKey: ["contract-sigs", selected?.id],
    queryFn: () => sigsFn({ data: { contract_document_id: selected!.id } }),
    enabled: !!selected,
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
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gerado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum contrato gerado.</TableCell></TableRow>}
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.contract_number}</TableCell>
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
