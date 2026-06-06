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
import { Plus, Edit3, Trash2, Mail, MessageSquare, ArrowRight, History, X } from "lucide-react";
import { toast } from "sonner";
import { uid } from "@/lib/demoSandbox";
import {
  LEAD_STATUS, LEAD_INTERESSE_NIVEL, ORIGENS,
  validateLead, MSG_OBRIGATORIO, MSG_SUCESSO, MSG_DEMO_TAG, COMUNICACAO_PREFIXO,
  type LeadStatus, type LeadInteresseNivel,
} from "@/lib/demoCrmCrud";

export interface LeadDemoRecord {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  whatsapp?: string;
  origem: string;
  estagio: string;
  valor: number;
  score: number;
  tags: string[];
  criadoEm: string;
  status?: string;
  nivelInteresse?: string;
  campanha?: string;
  canal?: string;
  interesse?: string;
  produtoInteresse?: string;
  proximaAcao?: string;
  responsavel?: string;
  proximoContato?: string;
  observacoes?: string;
  motivoPerda?: string;
}

export interface ClienteDemoRecord {
  id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  produto: string;
  plano: string;
  status: string;
}

interface Props {
  leads: LeadDemoRecord[];
  setLeads: React.Dispatch<React.SetStateAction<LeadDemoRecord[]>>;
  origens: { id: string; nome: string }[];
  clientes: ClienteDemoRecord[];
  setClientes: React.Dispatch<React.SetStateAction<ClienteDemoRecord[]>>;
  onLog: (entry: { area: string; acao: string; registro?: string; canal?: "email" | "whatsapp"; destinatario?: string; status?: "ok" | "simulado" | "erro" }) => void;
  exigirOrigem?: boolean;
  exigirResponsavel?: boolean;
}

const FORM_INITIAL: Partial<LeadDemoRecord> = {
  nome: "",
  email: "",
  whatsapp: "",
  telefone: "",
  origem: "Site",
  status: "Novo",
  nivelInteresse: "Médio",
  responsavel: "Vendedor Demo",
  estagio: "Novo lead",
  valor: 0,
  score: 50,
  tags: [],
};

export function LeadsPanel({ leads, setLeads, origens, clientes, setClientes, onLog, exigirOrigem, exigirResponsavel }: Props) {
  const [form, setForm] = useState<Partial<LeadDemoRecord>>(FORM_INITIAL);
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [preview, setPreview] = useState<{ canal: "email" | "whatsapp"; lead: LeadDemoRecord; corpo: string } | null>(null);
  const [historyLead, setHistoryLead] = useState<LeadDemoRecord | null>(null);

  const origensList = useMemo(() => {
    const fromMock = origens.map((o) => o.nome);
    const merged = Array.from(new Set([...ORIGENS, ...fromMock]));
    return merged;
  }, [origens]);

  function resetForm() {
    setForm(FORM_INITIAL);
    setEditing(null);
    setErrors({});
  }

  function persist() {
    const result = validateLead(form as Partial<import("@/lib/demoCrmCrud").LeadFull>, { exigirOrigem, exigirResponsavel });
    setErrors(result.errors);
    if (!result.ok) {
      toast.error(MSG_OBRIGATORIO);
      return;
    }
    const now = new Date().toISOString();
    if (editing) {
      setLeads((prev) => prev.map((l) => (l.id === editing ? { ...l, ...form, id: editing } as LeadDemoRecord : l)));
      onLog({ area: "Leads", acao: "Editou lead", registro: form.nome });
      toast.success(MSG_SUCESSO);
    } else {
      const novo: LeadDemoRecord = {
        id: uid("ld"),
        nome: form.nome!,
        email: form.email ?? "",
        telefone: form.telefone ?? form.whatsapp ?? "",
        whatsapp: form.whatsapp ?? form.telefone ?? "",
        origem: form.origem ?? "Site",
        estagio: form.estagio ?? "Novo lead",
        valor: Number(form.valor ?? 0),
        score: Number(form.score ?? 50),
        tags: form.tags ?? [],
        criadoEm: now,
        status: form.status ?? "Novo",
        nivelInteresse: form.nivelInteresse ?? "Médio",
        campanha: form.campanha,
        canal: form.canal,
        interesse: form.interesse,
        produtoInteresse: form.produtoInteresse,
        proximaAcao: form.proximaAcao,
        responsavel: form.responsavel,
        proximoContato: form.proximoContato,
        observacoes: form.observacoes,
      };
      setLeads((prev) => [novo, ...prev]);
      onLog({ area: "Leads", acao: "Criou lead", registro: novo.nome });
      toast.success(MSG_SUCESSO + " " + MSG_DEMO_TAG);
    }
    resetForm();
  }

  function startEdit(l: LeadDemoRecord) {
    setEditing(l.id);
    setForm(l);
    setErrors({});
  }

  function remove(id: string) {
    const l = leads.find((x) => x.id === id);
    setLeads((prev) => prev.filter((x) => x.id !== id));
    onLog({ area: "Leads", acao: "Removeu lead demo", registro: l?.nome });
    toast.success("Lead removido da demonstração.");
  }

  function moverFunil(id: string, dir: 1 | -1) {
    const stages = ["Novo lead", "Primeiro contato", "Qualificação", "Proposta enviada", "Aguardando pagamento", "Contratado", "Onboarding", "Reativação"];
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const idx = stages.indexOf(l.estagio);
      const nx = Math.min(stages.length - 1, Math.max(0, idx + dir));
      return { ...l, estagio: stages[nx] };
    }));
    const lead = leads.find((x) => x.id === id);
    onLog({ area: "Leads", acao: `Moveu no funil (${dir > 0 ? "→" : "←"})`, registro: lead?.nome });
  }

  function qualificar(l: LeadDemoRecord) {
    setLeads((prev) => prev.map((x) => x.id === l.id ? { ...x, status: "Qualificado" as LeadStatus, estagio: "Qualificação", score: Math.min(100, (x.score ?? 50) + 10) } : x));
    onLog({ area: "Leads", acao: "Qualificou lead", registro: l.nome });
    toast.success(`Lead ${l.nome} qualificado.`);
  }

  function marcarPerdido(l: LeadDemoRecord) {
    const motivo = window.prompt("Motivo da perda?") ?? "Não informado";
    setLeads((prev) => prev.map((x) => x.id === l.id ? { ...x, status: "Perdido" as LeadStatus, motivoPerda: motivo } : x));
    onLog({ area: "Leads", acao: "Marcou como perdido", registro: `${l.nome} — ${motivo}` });
    toast.message(`Lead marcado como perdido na demonstração.`);
  }

  function converterEmCliente(l: LeadDemoRecord) {
    const novoCliente: ClienteDemoRecord = {
      id: uid("cl"),
      nome: l.nome,
      documento: "—",
      email: l.email ?? "",
      telefone: l.whatsapp ?? l.telefone ?? "",
      produto: l.produtoInteresse ?? "—",
      plano: "—",
      status: "Ativo",
    };
    setClientes((prev) => [novoCliente, ...prev]);
    setLeads((prev) => prev.map((x) => x.id === l.id ? { ...x, status: "Convertido" as LeadStatus, estagio: "Contratado" } : x));
    onLog({ area: "Leads", acao: "Converteu lead em cliente", registro: l.nome });
    toast.success("Lead convertido em cliente na demonstração. Histórico preservado.");
  }

  function abrirPreviewComunicacao(l: LeadDemoRecord, canal: "email" | "whatsapp") {
    const base = canal === "email"
      ? `Olá ${l.nome},\n\nRecebemos seu interesse e em breve um consultor entrará em contato.\n\nObrigado!`
      : `Oi ${l.nome}! Tudo bem? Posso te ajudar com mais informações sobre o que você procura.`;
    setPreview({ canal, lead: l, corpo: `${COMUNICACAO_PREFIXO}\n\n${base}` });
  }

  function confirmarEnvio() {
    if (!preview) return;
    onLog({
      area: "Leads",
      acao: preview.canal === "email" ? "E-mail teste enviado (simulado)" : "WhatsApp teste enviado (simulado)",
      registro: preview.lead.nome,
      canal: preview.canal,
      destinatario: preview.canal === "email" ? preview.lead.email : (preview.lead.whatsapp ?? preview.lead.telefone),
      status: "simulado",
    });
    toast.success(`${preview.canal === "email" ? "E-mail" : "WhatsApp"} de teste simulado com sucesso.`);
    setPreview(null);
  }

  const filtered = leads.filter((l) => !filter || l.nome.toLowerCase().includes(filter.toLowerCase()) || (l.email ?? "").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold">{editing ? "Editar lead" : "Novo lead"}</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Organize oportunidades desde o primeiro contato até a conversão. Cada lead pode ter origem, campanha, interesse, responsável, próxima ação e histórico de comunicação.
            </p>
          </div>
          {editing && <Button size="sm" variant="ghost" onClick={resetForm}><X className="w-4 h-4 mr-1" />Cancelar edição</Button>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField label="Nome*" error={errors.nome}>
            <Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="E-mail" error={errors.email}>
            <Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="WhatsApp" error={errors.whatsapp}>
            <Input value={form.whatsapp ?? ""} placeholder="(11) 90000-0000" onChange={(e) => setForm({ ...form, whatsapp: e.target.value, telefone: e.target.value })} />
          </FormField>
          <FormField label="Origem" error={errors.origem}>
            <Select value={form.origem ?? ""} onValueChange={(v) => setForm({ ...form, origem: v })}>
              <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
              <SelectContent>{origensList.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Campanha">
            <Input value={form.campanha ?? ""} onChange={(e) => setForm({ ...form, campanha: e.target.value })} />
          </FormField>
          <FormField label="Canal">
            <Input value={form.canal ?? ""} placeholder="Site, WhatsApp..." onChange={(e) => setForm({ ...form, canal: e.target.value })} />
          </FormField>
          <FormField label="Interesse">
            <Input value={form.interesse ?? ""} onChange={(e) => setForm({ ...form, interesse: e.target.value })} />
          </FormField>
          <FormField label="Nível*" error={errors.nivelInteresse}>
            <Select value={form.nivelInteresse ?? ""} onValueChange={(v) => setForm({ ...form, nivelInteresse: v as LeadInteresseNivel })}>
              <SelectTrigger><SelectValue placeholder="Nível" /></SelectTrigger>
              <SelectContent>{LEAD_INTERESSE_NIVEL.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Produto/Módulo interesse">
            <Input value={form.produtoInteresse ?? ""} onChange={(e) => setForm({ ...form, produtoInteresse: e.target.value })} />
          </FormField>
          <FormField label="Próxima ação">
            <Input value={form.proximaAcao ?? ""} onChange={(e) => setForm({ ...form, proximaAcao: e.target.value })} />
          </FormField>
          <FormField label="Responsável" error={errors.responsavel}>
            <Input value={form.responsavel ?? ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
          </FormField>
          <FormField label="Status*" error={errors.status}>
            <Select value={form.status ?? ""} onValueChange={(v) => setForm({ ...form, status: v as LeadStatus })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{LEAD_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Data próximo contato">
            <Input type="date" value={form.proximoContato ?? ""} onChange={(e) => setForm({ ...form, proximoContato: e.target.value })} />
          </FormField>
          <FormField label="Valor (R$)" error={errors.valor}>
            <Input type="number" min={0} value={form.valor ?? 0} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
          </FormField>
          <div className="sm:col-span-2 lg:col-span-4">
            <Label className="text-xs">Observações</Label>
            <Textarea value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button className="bg-gradient-primary" onClick={persist}>
            <Plus className="w-4 h-4 mr-1" />{editing ? "Salvar alterações" : "Novo lead"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <Input placeholder="Filtrar por nome ou e-mail..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />
          <span className="text-xs text-muted-foreground">{filtered.length} lead(s)</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lead encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="font-medium">{l.nome}</div>
                      <div className="text-xs text-muted-foreground">Score {l.score}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{l.email || "—"}</div>
                      <div className="text-muted-foreground">{l.whatsapp || l.telefone || "—"}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{l.origem}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{l.nivelInteresse ?? "—"}</Badge></TableCell>
                    <TableCell><Badge>{l.status ?? "—"}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{l.estagio}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <Button size="sm" variant="outline" title="Mover" onClick={() => moverFunil(l.id, 1)}><ArrowRight className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" title="Qualificar" onClick={() => qualificar(l)}>Qualificar</Button>
                        <Button size="sm" variant="outline" title="Converter em cliente" onClick={() => converterEmCliente(l)}>Converter</Button>
                        <Button size="sm" variant="outline" title="E-mail teste" onClick={() => abrirPreviewComunicacao(l, "email")}><Mail className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" title="WhatsApp teste" onClick={() => abrirPreviewComunicacao(l, "whatsapp")}><MessageSquare className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" title="Histórico" onClick={() => setHistoryLead(l)}><History className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" title="Editar" onClick={() => startEdit(l)}><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" title="Marcar como perdido" onClick={() => marcarPerdido(l)}>Perdido</Button>
                        <Button size="sm" variant="ghost" title="Excluir" onClick={() => remove(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
              Para <strong>{preview?.lead.nome}</strong>. Nenhum envio real será feito — apenas simulação na demonstração.
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

      <Dialog open={!!historyLead} onOpenChange={(o) => !o && setHistoryLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico — {historyLead?.nome}</DialogTitle>
            <DialogDescription>Resumo dos dados deste lead na demonstração.</DialogDescription>
          </DialogHeader>
          {historyLead && (
            <div className="text-sm space-y-1">
              <p><strong>Status:</strong> {historyLead.status ?? "—"}</p>
              <p><strong>Etapa:</strong> {historyLead.estagio}</p>
              <p><strong>Origem:</strong> {historyLead.origem} {historyLead.campanha ? `(${historyLead.campanha})` : ""}</p>
              <p><strong>Responsável:</strong> {historyLead.responsavel ?? "—"}</p>
              <p><strong>Próxima ação:</strong> {historyLead.proximaAcao ?? "—"} {historyLead.proximoContato ? `em ${historyLead.proximoContato}` : ""}</p>
              <p><strong>Interesse:</strong> {historyLead.interesse ?? "—"} {historyLead.produtoInteresse ? `— ${historyLead.produtoInteresse}` : ""}</p>
              <p><strong>Observações:</strong> {historyLead.observacoes ?? "—"}</p>
              {historyLead.motivoPerda && <p><strong>Motivo da perda:</strong> {historyLead.motivoPerda}</p>}
              <p className="text-xs text-muted-foreground pt-2">Criado em {new Date(historyLead.criadoEm).toLocaleString("pt-BR")}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setHistoryLead(null)}>Fechar</Button>
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
