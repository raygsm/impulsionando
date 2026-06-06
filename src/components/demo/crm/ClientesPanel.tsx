import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit3, Trash2, Mail, MessageSquare, History, X } from "lucide-react";
import { toast } from "sonner";
import { uid } from "@/lib/demoSandbox";
import {
  CLIENTE_STATUS, ORIGENS,
  validateCliente, MSG_OBRIGATORIO, MSG_SUCESSO, MSG_DEMO_TAG, COMUNICACAO_PREFIXO,
  type ClienteStatus, type TipoCliente,
} from "@/lib/demoCrmCrud";
import type { ClienteDemoRecord } from "./LeadsPanel";

interface Props {
  clientes: (ClienteDemoRecord & ClienteExtras)[];
  setClientes: React.Dispatch<React.SetStateAction<(ClienteDemoRecord & ClienteExtras)[]>>;
  produtos: { id: string; nome: string }[];
  planos: { id: string; nome: string }[];
  servicos: { id: string; nome: string }[];
  origens: { id: string; nome: string }[];
  onLog: (entry: { area: string; acao: string; registro?: string; canal?: "email" | "whatsapp"; destinatario?: string; status?: "ok" | "simulado" | "erro" }) => void;
  exigirResponsavel?: boolean;
}

export interface ClienteExtras {
  tipo?: TipoCliente;
  cidade?: string;
  estado?: string;
  origem?: string;
  campanha?: string;
  interesse?: string;
  produtoInteresse?: string;
  planoInteresse?: string;
  servicoInteresse?: string;
  responsavel?: string;
  tags?: string[];
  observacoes?: string;
  emailTeste?: string;
  whatsappTeste?: string;
}

type ClienteRecord = ClienteDemoRecord & ClienteExtras;

const FORM_INITIAL: Partial<ClienteRecord> = {
  nome: "",
  documento: "",
  email: "",
  telefone: "",
  produto: "",
  plano: "",
  status: "Novo",
  tipo: "PJ",
  responsavel: "Vendedor Demo",
  tags: [],
};

export function ClientesPanel({ clientes, setClientes, produtos, planos, servicos, origens, onLog, exigirResponsavel }: Props) {
  const [form, setForm] = useState<Partial<ClienteRecord>>(FORM_INITIAL);
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [preview, setPreview] = useState<{ canal: "email" | "whatsapp"; cliente: ClienteRecord; corpo: string } | null>(null);
  const [history, setHistory] = useState<ClienteRecord | null>(null);

  const origensList = useMemo(() => Array.from(new Set([...ORIGENS, ...origens.map((o) => o.nome)])), [origens]);

  function resetForm() {
    setForm(FORM_INITIAL);
    setEditing(null);
    setErrors({});
  }

  function persist() {
    const result = validateCliente(
      {
        nome: form.nome, tipo: form.tipo, email: form.email, whatsapp: form.telefone,
        emailTeste: form.emailTeste, whatsappTeste: form.whatsappTeste,
        status: (form.status as ClienteStatus) ?? "Novo",
        responsavel: form.responsavel ?? "",
      },
      { exigirResponsavel },
    );
    setErrors(result.errors);
    if (!result.ok) {
      toast.error(MSG_OBRIGATORIO);
      return;
    }
    if (editing) {
      setClientes((prev) => prev.map((c) => c.id === editing ? { ...c, ...form, id: editing } as ClienteRecord : c));
      onLog({ area: "Clientes", acao: "Editou cliente", registro: form.nome });
      toast.success(MSG_SUCESSO);
    } else {
      const novo: ClienteRecord = {
        id: uid("cl"),
        nome: form.nome!,
        documento: form.documento ?? "—",
        email: form.email ?? "—",
        telefone: form.telefone ?? "—",
        produto: form.produtoInteresse ?? form.produto ?? "—",
        plano: form.planoInteresse ?? form.plano ?? "—",
        status: (form.status as ClienteStatus) ?? "Novo",
        tipo: form.tipo,
        cidade: form.cidade,
        estado: form.estado,
        origem: form.origem,
        campanha: form.campanha,
        interesse: form.interesse,
        produtoInteresse: form.produtoInteresse,
        planoInteresse: form.planoInteresse,
        servicoInteresse: form.servicoInteresse,
        responsavel: form.responsavel,
        tags: form.tags ?? [],
        observacoes: form.observacoes,
        emailTeste: form.emailTeste,
        whatsappTeste: form.whatsappTeste,
      };
      setClientes((prev) => [novo, ...prev]);
      onLog({ area: "Clientes", acao: "Criou cliente", registro: novo.nome });
      toast.success(`Cliente cadastrado com sucesso na demonstração. ${MSG_DEMO_TAG}`);
    }
    resetForm();
  }

  function startEdit(c: ClienteRecord) {
    setEditing(c.id);
    setForm(c);
    setErrors({});
  }

  function remove(id: string) {
    const c = clientes.find((x) => x.id === id);
    setClientes((prev) => prev.filter((x) => x.id !== id));
    onLog({ area: "Clientes", acao: "Removeu cliente demo", registro: c?.nome });
    toast.success("Cliente removido da demonstração.");
  }

  function abrirPreviewComunicacao(c: ClienteRecord, canal: "email" | "whatsapp") {
    const base = canal === "email"
      ? `Olá ${c.nome},\n\nSeja bem-vindo(a)! Estamos felizes em ter você como cliente.\n\nQualquer dúvida, nossa equipe está à disposição.`
      : `Oi ${c.nome}! Seja muito bem-vindo(a). Qualquer dúvida estamos por aqui.`;
    setPreview({ canal, cliente: c, corpo: `${COMUNICACAO_PREFIXO}\n\n${base}` });
  }

  function confirmarEnvio() {
    if (!preview) return;
    onLog({
      area: "Clientes",
      acao: preview.canal === "email" ? "E-mail de boas-vindas (simulado)" : "WhatsApp de boas-vindas (simulado)",
      registro: preview.cliente.nome,
      canal: preview.canal,
      destinatario: preview.canal === "email" ? (preview.cliente.emailTeste || preview.cliente.email) : (preview.cliente.whatsappTeste || preview.cliente.telefone),
      status: "simulado",
    });
    toast.success(preview.canal === "email"
      ? "E-mail de boas-vindas preparado para envio teste."
      : "WhatsApp de boas-vindas simulado com sucesso.");
    setPreview(null);
  }

  const filtered = clientes.filter((c) => !filter || c.nome.toLowerCase().includes(filter.toLowerCase()) || (c.documento ?? "").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold">{editing ? "Editar cliente" : "Novo cliente"}</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Cadastre clientes para centralizar histórico, produtos, planos, comunicações, oportunidades e relacionamento comercial.
            </p>
          </div>
          {editing && <Button size="sm" variant="ghost" onClick={resetForm}><X className="w-4 h-4 mr-1" />Cancelar edição</Button>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField label="Nome / Razão social*" error={errors.nome}>
            <Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="Tipo">
            <Select value={form.tipo ?? "PJ"} onValueChange={(v) => setForm({ ...form, tipo: v as TipoCliente })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PF">Pessoa Física</SelectItem>
                <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="CPF/CNPJ">
            <Input value={form.documento ?? ""} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
          </FormField>
          <FormField label="Status*" error={errors.status}>
            <Select value={form.status ?? ""} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{CLIENTE_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="WhatsApp" error={errors.whatsapp}>
            <Input value={form.telefone ?? ""} placeholder="(11) 90000-0000" onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </FormField>
          <FormField label="E-mail" error={errors.email}>
            <Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Cidade">
            <Input value={form.cidade ?? ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
          </FormField>
          <FormField label="Estado">
            <Input value={form.estado ?? ""} onChange={(e) => setForm({ ...form, estado: e.target.value })} />
          </FormField>
          <FormField label="Origem">
            <Select value={form.origem ?? ""} onValueChange={(v) => setForm({ ...form, origem: v })}>
              <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
              <SelectContent>{origensList.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Campanha">
            <Input value={form.campanha ?? ""} onChange={(e) => setForm({ ...form, campanha: e.target.value })} />
          </FormField>
          <FormField label="Interesse principal">
            <Input value={form.interesse ?? ""} onChange={(e) => setForm({ ...form, interesse: e.target.value })} />
          </FormField>
          <FormField label="Responsável" error={errors.responsavel}>
            <Input value={form.responsavel ?? ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
          </FormField>
          <FormField label="Produto de interesse">
            <Select value={form.produtoInteresse ?? ""} onValueChange={(v) => setForm({ ...form, produtoInteresse: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar produto" /></SelectTrigger>
              <SelectContent>
                {produtos.length === 0 && <SelectItem value="—">Sem produtos cadastrados</SelectItem>}
                {produtos.map((p) => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Plano de interesse">
            <Select value={form.planoInteresse ?? ""} onValueChange={(v) => setForm({ ...form, planoInteresse: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
              <SelectContent>
                {planos.length === 0 && <SelectItem value="—">Sem planos cadastrados</SelectItem>}
                {planos.map((p) => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Serviço de interesse">
            <Select value={form.servicoInteresse ?? ""} onValueChange={(v) => setForm({ ...form, servicoInteresse: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar serviço" /></SelectTrigger>
              <SelectContent>
                {servicos.length === 0 && <SelectItem value="—">Sem serviços cadastrados</SelectItem>}
                {servicos.map((s) => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="E-mail de teste" error={errors.emailTeste}>
            <Input value={form.emailTeste ?? ""} onChange={(e) => setForm({ ...form, emailTeste: e.target.value })} />
          </FormField>
          <FormField label="WhatsApp de teste" error={errors.whatsappTeste}>
            <Input value={form.whatsappTeste ?? ""} onChange={(e) => setForm({ ...form, whatsappTeste: e.target.value })} />
          </FormField>
          <div className="sm:col-span-2 lg:col-span-4">
            <Label className="text-xs">Observações</Label>
            <Textarea value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button className="bg-gradient-primary" onClick={persist}>
            <Plus className="w-4 h-4 mr-1" />{editing ? "Salvar alterações" : "Novo cliente"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <Input placeholder="Filtrar por nome ou documento..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />
          <span className="text-xs text-muted-foreground">{filtered.length} cliente(s)</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Produto/Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><div className="font-medium">{c.nome}</div><div className="text-xs text-muted-foreground">{c.tipo ?? "—"}</div></TableCell>
                    <TableCell className="text-xs">{c.documento || "—"}</TableCell>
                    <TableCell className="text-xs"><div>{c.email || "—"}</div><div className="text-muted-foreground">{c.telefone || "—"}</div></TableCell>
                    <TableCell className="text-xs"><div>{c.produtoInteresse ?? c.produto ?? "—"}</div><div className="text-muted-foreground">{c.planoInteresse ?? c.plano ?? "—"}</div></TableCell>
                    <TableCell><Badge>{c.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button size="sm" variant="outline" title="E-mail teste" onClick={() => abrirPreviewComunicacao(c, "email")}><Mail className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" title="WhatsApp teste" onClick={() => abrirPreviewComunicacao(c, "whatsapp")}><MessageSquare className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" title="Histórico" onClick={() => setHistory(c)}><History className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" title="Editar" onClick={() => startEdit(c)}><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" title="Remover" onClick={() => remove(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prévia — {preview?.canal === "email" ? "E-mail" : "WhatsApp"} teste</DialogTitle>
            <DialogDescription>
              Para <strong>{preview?.cliente.nome}</strong>. Nenhum envio real será feito — apenas simulação na demonstração.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            value={preview?.corpo ?? ""}
            onChange={(e) => setPreview((p) => p ? { ...p, corpo: e.target.value } : p)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={confirmarEnvio}>Simular envio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!history} onOpenChange={(o) => !o && setHistory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico — {history?.nome}</DialogTitle>
            <DialogDescription>Resumo deste cliente na demonstração.</DialogDescription>
          </DialogHeader>
          {history && (
            <div className="text-sm space-y-1">
              <p><strong>Tipo:</strong> {history.tipo ?? "—"} • <strong>Documento:</strong> {history.documento}</p>
              <p><strong>Contato:</strong> {history.email || "—"} • {history.telefone || "—"}</p>
              <p><strong>Localização:</strong> {history.cidade ?? "—"} {history.estado ? `/ ${history.estado}` : ""}</p>
              <p><strong>Origem:</strong> {history.origem ?? "—"} {history.campanha ? `(${history.campanha})` : ""}</p>
              <p><strong>Produto / Plano / Serviço:</strong> {history.produtoInteresse ?? history.produto ?? "—"} • {history.planoInteresse ?? history.plano ?? "—"} • {history.servicoInteresse ?? "—"}</p>
              <p><strong>Responsável:</strong> {history.responsavel ?? "—"}</p>
              <p><strong>Status:</strong> {history.status}</p>
              <p><strong>Observações:</strong> {history.observacoes ?? "—"}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setHistory(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
