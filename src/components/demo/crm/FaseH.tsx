/**
 * Fase H — Blocos 40 a 51 do /demo/crm
 *
 * Comunicação, Modelos de Mensagem, Logs avançados, Dashboard específico,
 * Jornada Guiada e barra de CTAs. Tudo opera apenas localmente (DEMO) e
 * gera logs via `onLog` (DemoLogInput → DemoLogEntry).
 *
 * Mantém prefixo obrigatório: TESTE — DEMONSTRAÇÃO — VERSÃO TESTE.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Send, Eye, Trash2, Filter, Download, Compass, Sparkles,
  Users, MessageSquare, ShoppingCart, RefreshCw, FileText,
  ListChecks, Megaphone, Briefcase, Mail, ArrowRight, ArrowLeft, SkipForward, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { uid } from "@/lib/demoSandbox";
import type { DemoLogInput } from "@/lib/demoCrmCrud";

const PREFIX = "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE";

// ─────────────────── Tipos públicos ───────────────────

export type Canal = "email" | "whatsapp" | "interno";

export interface ModeloMsg {
  id: string;
  nome: string;
  canal: Canal;
  evento: string;
  assunto?: string;
  corpo: string;
  ativo: boolean;
}

export interface ComunicacaoTipo {
  id: string;
  nome: string;
  canal: Canal;
  evento: string;
}

export const TIPOS_COMUNICACAO: ComunicacaoTipo[] = [
  { id: "boas_vindas_lead_email", nome: "Boas-vindas ao lead", canal: "email", evento: "Lead criado" },
  { id: "boas_vindas_lead_wa", nome: "Boas-vindas ao lead", canal: "whatsapp", evento: "Lead criado" },
  { id: "boas_vindas_cliente_email", nome: "Boas-vindas ao cliente", canal: "email", evento: "Cliente criado" },
  { id: "boas_vindas_cliente_wa", nome: "Boas-vindas ao cliente", canal: "whatsapp", evento: "Cliente criado" },
  { id: "followup_email", nome: "Follow-up", canal: "email", evento: "Follow-up disparado" },
  { id: "followup_wa", nome: "Follow-up", canal: "whatsapp", evento: "Follow-up disparado" },
  { id: "proposta_email", nome: "Proposta", canal: "email", evento: "Proposta enviada" },
  { id: "proposta_wa", nome: "Proposta", canal: "whatsapp", evento: "Proposta enviada" },
  { id: "cobranca_email", nome: "Cobrança", canal: "email", evento: "Pagamento pendente" },
  { id: "cobranca_wa", nome: "Cobrança", canal: "whatsapp", evento: "Pagamento pendente" },
  { id: "lembrete", nome: "Lembrete", canal: "whatsapp", evento: "Lembrete agendado" },
  { id: "pesquisa", nome: "Pesquisa de satisfação", canal: "email", evento: "Pós-venda" },
  { id: "reativacao", nome: "Reativação", canal: "whatsapp", evento: "Cliente inativo" },
  { id: "recompra", nome: "Recompra / Renovação", canal: "email", evento: "Ciclo próximo do fim" },
  { id: "convite_usuario", nome: "Convite de usuário", canal: "email", evento: "Usuário convidado" },
  { id: "confirmacao_cadastro", nome: "Confirmação de cadastro", canal: "email", evento: "Cadastro realizado" },
  { id: "aviso_plano", nome: "Aviso de plano vinculado", canal: "interno", evento: "Plano vinculado" },
];

export const VARIAVEIS = [
  "nome_lead", "nome_cliente", "nome_empresa", "produto", "plano", "servico",
  "responsavel", "data", "hora", "valor", "status", "link", "modulo", "ambiente",
];

// ─────────────────── Seed dos 6 modelos obrigatórios ───────────────────

export function seedModelosCrm(): ModeloMsg[] {
  return [
    {
      id: uid("md"), nome: "Boas-vindas ao lead", canal: "email", evento: "Lead criado",
      assunto: `${PREFIX} — Bem-vindo`,
      corpo: `${PREFIX}. Olá, {{nome_lead}}. Seu contato foi recebido com sucesso. Em uma operação real, nossa equipe acompanharia sua solicitação pelo CRM.`,
      ativo: true,
    },
    {
      id: uid("md"), nome: "Boas-vindas ao cliente", canal: "email", evento: "Cliente criado",
      assunto: `${PREFIX} — Cadastro realizado`,
      corpo: `${PREFIX}. Olá, {{nome_cliente}}. Seu cadastro foi criado com sucesso. Em uma operação real, você receberia avisos, propostas, lembretes e atualizações por aqui.`,
      ativo: true,
    },
    {
      id: uid("md"), nome: "Follow-up de proposta", canal: "email", evento: "Proposta enviada",
      assunto: `${PREFIX} — Retorno sobre sua proposta`,
      corpo: `${PREFIX}. Olá, {{nome_cliente}}. Estamos retornando sobre a proposta enviada. Em uma operação real, esse contato poderia ser feito automaticamente pelo CRM.`,
      ativo: true,
    },
    {
      id: uid("md"), nome: "Reativação", canal: "whatsapp", evento: "Cliente inativo",
      corpo: `${PREFIX}. Olá, {{nome_cliente}}. Identificamos que faz algum tempo desde o último contato e gostaríamos de retomar a conversa.`,
      ativo: true,
    },
    {
      id: uid("md"), nome: "Recompra / renovação", canal: "email", evento: "Ciclo próximo do fim",
      assunto: `${PREFIX} — Seu ciclo está próximo do fim`,
      corpo: `${PREFIX}. Olá, {{nome_cliente}}. O ciclo do produto ou plano {{produto}} está próximo do fim. Em uma operação real, este seria o momento ideal para recompra ou renovação.`,
      ativo: true,
    },
    {
      id: uid("md"), nome: "Pesquisa de satisfação", canal: "email", evento: "Pós-venda",
      assunto: `${PREFIX} — Como foi sua experiência?`,
      corpo: `${PREFIX}. Olá, {{nome_cliente}}. Gostaríamos de saber como foi sua experiência. Sua opinião ajuda a melhorar o atendimento.`,
      ativo: true,
    },
  ];
}

function aplicarVariaveis(texto: string, mocks: Record<string, string> = {}): string {
  const base: Record<string, string> = {
    nome_lead: "Ana Souza",
    nome_cliente: "Clínica Saúde Mais",
    nome_empresa: "Impulsionando Demo",
    produto: "CRM Profissional",
    plano: "Plano Profissional",
    servico: "Onboarding assistido",
    responsavel: "Vendedor Demo",
    data: new Date().toLocaleDateString("pt-BR"),
    hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    valor: "R$ 397,00",
    status: "Demonstração",
    link: "https://impulsionando.com.br/demo/crm",
    modulo: "CRM",
    ambiente: "DEMONSTRAÇÃO",
    ...mocks,
  };
  return texto.replace(/\{\{(\w+)\}\}/g, (_, k) => base[k] ?? `{{${k}}}`);
}

function ensurePrefix(text: string, kind: "subject" | "body", tipo?: string): string {
  const t = text?.trim() ?? "";
  if (kind === "subject") {
    if (t.startsWith("TESTE")) return t;
    return `${PREFIX}${tipo ? ` — ${tipo}` : ""}${t ? ` — ${t}` : ""}`;
  }
  if (t.startsWith("TESTE")) return t;
  return `${PREFIX}. Esta mensagem foi gerada em ambiente demonstrativo da Impulsionando Tecnologia. Nenhuma ação real foi executada.\n\n${t}`;
}

// ═══════════════════════════════════════════════════════════════════
// 1) DASHBOARD DO CRM (Bloco 43)
// ═══════════════════════════════════════════════════════════════════

interface DashboardArgs {
  leads: Array<{ id: string; origem: string; estagio: string; valor: number }>;
  clientes: Array<{ id: string; produto?: string; status?: string }>;
  produtos: Array<{ id: string; nome: string }>;
  followups: Array<{ id: string; status?: "Pendente" | "Concluído"; ativo?: boolean }>;
  campanhas: Array<{ id: string; nome: string; status: string; conversoes?: number; leads?: number; receitaPrevista?: number; origem?: string }>;
  automacoes: Array<{ id: string; ativa: boolean }>;
  mensagensEnviadas: number;
  onGoto: (tab: string) => void;
}

export function DashboardPanel(args: DashboardArgs) {
  const { leads, clientes, produtos, followups, campanhas, automacoes, mensagensEnviadas, onGoto } = args;

  const m = useMemo(() => {
    const novos = leads.filter((l) => l.estagio === "Novo lead").length;
    const contratados = leads.filter((l) => l.estagio === "Contratado").length;
    const propostas = leads.filter((l) => l.estagio === "Proposta enviada").length;
    const oportunidades = leads.filter((l) => !["Contratado", "Reativação"].includes(l.estagio)).length;
    const fpPend = followups.filter((f) => f.status !== "Concluído" && f.ativo !== false).length;
    const conv = leads.length ? Math.round((contratados / leads.length) * 100) : 0;
    const receita = leads.filter((l) => l.estagio === "Contratado").reduce((a, b) => a + (b.valor || 0), 0)
      + campanhas.reduce((a, c) => a + (c.receitaPrevista || 0), 0);
    const porOrigem = leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.origem || "—"] = (acc[l.origem || "—"] || 0) + 1; return acc;
    }, {});
    const origemTop = Object.entries(porOrigem).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const porProduto = produtos.map((p) => ({ nome: p.nome, n: clientes.filter((c) => c.produto === p.nome).length }));
    const porEtapa = ["Novo lead", "Qualificação", "Proposta enviada", "Aguardando pagamento", "Contratado"]
      .map((s) => ({ etapa: s, n: leads.filter((l) => l.estagio === s).length }));
    return {
      novos, contratados, propostas, oportunidades, fpPend, conv, receita,
      porOrigem: Object.entries(porOrigem), origemTop, porProduto, porEtapa,
      autosAtivas: automacoes.filter((a) => a.ativa).length,
      campAtivas: campanhas.filter((c) => c.status === "Ativo" || c.status === "Ativa").length,
    };
  }, [leads, clientes, produtos, followups, campanhas, automacoes]);

  const cards = [
    { t: "Leads novos", v: String(m.novos), icon: Users },
    { t: "Clientes ativos", v: String(clientes.length), icon: Users },
    { t: "Oportunidades abertas", v: String(m.oportunidades), icon: ListChecks },
    { t: "Propostas enviadas", v: String(m.propostas), icon: FileText },
    { t: "Follow-ups pendentes", v: String(m.fpPend), icon: RefreshCw },
    { t: "Conversão estimada", v: `${m.conv}%`, icon: CheckCircle2 },
    { t: "Origem com melhor desempenho", v: m.origemTop, icon: Megaphone },
    { t: "Receita prevista", v: m.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), icon: Briefcase },
    { t: "Automações ativas", v: String(m.autosAtivas), icon: Sparkles },
    { t: "Mensagens enviadas — DEMO", v: String(mensagensEnviadas), icon: Send },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 text-sm text-muted-foreground">
        O dashboard do CRM mostra a evolução comercial da operação: origem dos leads, conversões, follow-ups, clientes, produtos, planos e automações.
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <Card key={c.t} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.t}</div>
              <c.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xl font-bold mt-2">{c.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-3">Leads por origem</h4>
          {m.porOrigem.length === 0 ? <p className="text-xs text-muted-foreground">Sem leads.</p> :
            <div className="space-y-1.5">{m.porOrigem.map(([o, n]) => (
              <div key={o} className="flex items-center gap-3">
                <span className="text-xs w-40">{o}</span>
                <div className="flex-1 h-2 bg-muted rounded"><div className="h-2 bg-primary rounded" style={{ width: `${Math.min(100, (n / leads.length) * 100)}%` }} /></div>
                <span className="text-xs w-10 text-right">{n}</span>
              </div>
            ))}</div>}
        </Card>
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-3">Leads por etapa</h4>
          <div className="space-y-1.5">{m.porEtapa.map((e) => (
            <div key={e.etapa} className="flex items-center gap-3">
              <span className="text-xs w-40">{e.etapa}</span>
              <div className="flex-1 h-2 bg-muted rounded"><div className="h-2 bg-gradient-primary rounded" style={{ width: `${Math.min(100, leads.length ? (e.n / leads.length) * 100 : 0)}%` }} /></div>
              <span className="text-xs w-10 text-right">{e.n}</span>
            </div>
          ))}</div>
        </Card>
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-3">Clientes por produto</h4>
          {m.porProduto.length === 0 ? <p className="text-xs text-muted-foreground">Sem produtos.</p> :
            <div className="space-y-1.5">{m.porProduto.map((p) => (
              <div key={p.nome} className="flex items-center gap-3">
                <span className="text-xs w-40 truncate">{p.nome}</span>
                <div className="flex-1 h-2 bg-muted rounded"><div className="h-2 bg-emerald-500 rounded" style={{ width: `${Math.min(100, clientes.length ? (p.n / clientes.length) * 100 : 0)}%` }} /></div>
                <span className="text-xs w-10 text-right">{p.n}</span>
              </div>
            ))}</div>}
        </Card>
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-3">Campanhas por conversão</h4>
          {campanhas.length === 0 ? <p className="text-xs text-muted-foreground">Sem campanhas.</p> :
            <div className="space-y-1.5">{campanhas.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-xs w-40 truncate">{c.nome}</span>
                <div className="flex-1 h-2 bg-muted rounded"><div className="h-2 bg-orange-500 rounded" style={{ width: `${Math.min(100, c.leads ? ((c.conversoes || 0) / c.leads) * 100 : 0)}%` }} /></div>
                <span className="text-xs w-12 text-right">{c.conversoes ?? 0}/{c.leads ?? 0}</span>
              </div>
            ))}</div>}
        </Card>
      </div>

      <Card className="p-5 flex gap-2 flex-wrap">
        <Button variant="outline" onClick={() => { toast.success("Dashboard atualizado."); }}><RefreshCw className="w-4 h-4 mr-1" />Atualizar dashboard</Button>
        <Button variant="outline" onClick={() => onGoto("leads")}><Users className="w-4 h-4 mr-1" />Ver leads</Button>
        <Button variant="outline" onClick={() => onGoto("clientes")}><Users className="w-4 h-4 mr-1" />Ver clientes</Button>
        <Button variant="outline" onClick={() => onGoto("followups")}><ListChecks className="w-4 h-4 mr-1" />Ver follow-ups</Button>
        <Button variant="outline" onClick={() => onGoto("campanhas")}><Megaphone className="w-4 h-4 mr-1" />Ver campanhas</Button>
        <Button variant="outline" onClick={() => onGoto("logs")}><FileText className="w-4 h-4 mr-1" />Ver logs</Button>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2) MODAL DE ENVIO DE TESTE (compartilhado por Comunicação e Modelos)
// ═══════════════════════════════════════════════════════════════════

interface EnvioForm {
  canal: Canal;
  remetenteNome: string;
  remetenteEmail: string;
  destinatario: string;
  destinatarioNome: string;
  tipoMensagem: string;
  assunto: string;
  corpo: string;
  evento: string;
}

function EnvioTesteDialog({
  open, onOpenChange, inicial, onLog, onEnviado,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  inicial: Partial<EnvioForm>;
  onLog: (input: DemoLogInput) => void;
  onEnviado: () => void;
}) {
  const [form, setForm] = useState<EnvioForm>({
    canal: "email",
    remetenteNome: "Impulsionando Demo",
    remetenteEmail: "demo@impulsionando.com.br",
    destinatario: "",
    destinatarioNome: "Contato fictício",
    tipoMensagem: "Boas-vindas",
    assunto: "",
    corpo: "",
    evento: "Lead criado",
    ...inicial,
  });
  const [step, setStep] = useState<"form" | "preview">("form");

  function reset() { setStep("form"); }

  const assuntoFinal = ensurePrefix(form.assunto, "subject", form.tipoMensagem);
  const corpoFinal = ensurePrefix(form.corpo, "body");

  function registrar(status: "simulado" | "ok", forcadoSimulado: boolean) {
    onLog({
      area: "Comunicação",
      acao: forcadoSimulado ? `Envio simulado — ${form.tipoMensagem}` : `Envio de teste — ${form.tipoMensagem}`,
      registro: form.destinatario,
      status,
      canal: form.canal,
      destinatario: form.destinatario,
    });
    toast.success(forcadoSimulado
      ? "Envio simulado registrado. Recurso preparado — aguardando credenciais externas."
      : "Envio de teste registrado nos logs.");
    onEnviado();
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Configurar envio de teste" : "Prévia da mensagem"}</DialogTitle>
          <DialogDescription>
            Tudo é demonstrativo. O prefixo <strong>{PREFIX}</strong> é aplicado automaticamente.
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Canal</Label>
                <Select value={form.canal} onValueChange={(v) => setForm({ ...form, canal: v as Canal })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="interno">Notificação interna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tipo da mensagem</Label>
                <Input value={form.tipoMensagem} onChange={(e) => setForm({ ...form, tipoMensagem: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Evento disparador</Label>
                <Input value={form.evento} onChange={(e) => setForm({ ...form, evento: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Destinatário (nome)</Label>
                <Input value={form.destinatarioNome} onChange={(e) => setForm({ ...form, destinatarioNome: e.target.value })} />
              </div>

              {form.canal === "email" && (
                <>
                  <div>
                    <Label className="text-xs">Nome do remetente</Label>
                    <Input value={form.remetenteNome} onChange={(e) => setForm({ ...form, remetenteNome: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">E-mail de origem</Label>
                    <Input value={form.remetenteEmail} onChange={(e) => setForm({ ...form, remetenteEmail: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">E-mail de destino</Label>
                    <Input value={form.destinatario} onChange={(e) => setForm({ ...form, destinatario: e.target.value })} placeholder="teste@exemplo.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Assunto</Label>
                    <Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} placeholder="(será prefixado automaticamente)" />
                  </div>
                </>
              )}

              {form.canal === "whatsapp" && (
                <div className="sm:col-span-2">
                  <Label className="text-xs">WhatsApp de teste</Label>
                  <Input value={form.destinatario} onChange={(e) => setForm({ ...form, destinatario: e.target.value })} placeholder="(11) 90000-0000" />
                </div>
              )}

              {form.canal === "interno" && (
                <div className="sm:col-span-2">
                  <Label className="text-xs">Usuário interno (destino)</Label>
                  <Input value={form.destinatario} onChange={(e) => setForm({ ...form, destinatario: e.target.value })} placeholder="Vendedor Demo" />
                </div>
              )}

              <div className="sm:col-span-2">
                <Label className="text-xs">Corpo</Label>
                <Textarea rows={4} value={form.corpo} onChange={(e) => setForm({ ...form, corpo: e.target.value })} placeholder="(o prefixo TESTE — DEMONSTRAÇÃO — VERSÃO TESTE é adicionado automaticamente)" />
              </div>
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button variant="outline" disabled={!form.destinatario || !form.corpo} onClick={() => setStep("preview")}>
                <Eye className="w-4 h-4 mr-1" />Ver prévia
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3 text-sm">
            <div className="rounded-md border bg-muted/30 p-3 space-y-1.5 text-xs">
              <div><strong>Módulo de origem:</strong> CRM</div>
              <div><strong>Evento disparador:</strong> {form.evento}</div>
              <div><strong>Canal:</strong> {form.canal}</div>
              <div><strong>Remetente:</strong> {form.canal === "email" ? `${form.remetenteNome} <${form.remetenteEmail}>` : form.remetenteNome}</div>
              <div><strong>Destinatário:</strong> {form.destinatarioNome} ({form.destinatario || "—"})</div>
              {form.canal === "email" && <div><strong>Assunto:</strong> {assuntoFinal}</div>}
              <div><strong>Ambiente:</strong> DEMONSTRAÇÃO</div>
              <div><strong>Status:</strong> Pronto para envio</div>
              <div><strong>Tipo de envio:</strong> simulado (sem credencial externa)</div>
              <div className="text-warning-foreground"><strong>Credencial externa:</strong> aguardando credenciais externas — registrado como simulado.</div>
              <div><strong>Log que será criado:</strong> Comunicação · {form.tipoMensagem} · {form.canal}</div>
            </div>
            <div className="rounded-md border p-3 whitespace-pre-wrap text-xs bg-card">{corpoFinal}</div>

            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => setStep("form")}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
              <Button variant="outline" onClick={() => registrar("simulado", true)}>
                <Sparkles className="w-4 h-4 mr-1" />Simular envio
              </Button>
              <Button onClick={() => registrar("simulado", false)}>
                <Send className="w-4 h-4 mr-1" />Enviar teste
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3) COMUNICAÇÃO DO CRM (Bloco 40)
// ═══════════════════════════════════════════════════════════════════

export function ComunicacaoPanel({
  onLog, onEnviado,
}: {
  onLog: (input: DemoLogInput) => void;
  onEnviado: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [inicial, setInicial] = useState<Partial<EnvioForm>>({});

  function abrir(t: ComunicacaoTipo) {
    setInicial({
      canal: t.canal,
      tipoMensagem: t.nome,
      evento: t.evento,
      assunto: t.nome,
      corpo: `Olá {{nome_lead}}, esta é uma mensagem demonstrativa do tipo "${t.nome}".`,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 text-sm text-muted-foreground">
        Teste todos os tipos de comunicação do CRM: e-mail, WhatsApp e notificação interna.
        Toda mensagem é prefixada com <strong>{PREFIX}</strong>. Sem credenciais externas, o envio é registrado como simulado.
      </Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TIPOS_COMUNICACAO.map((t) => (
          <Card key={t.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{t.nome}</div>
              <Badge variant="outline" className="text-[10px]">{t.canal}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Evento: {t.evento}</div>
            <Button size="sm" variant="outline" onClick={() => abrir(t)}>
              <Send className="w-3.5 h-3.5 mr-1" />Configurar envio
            </Button>
          </Card>
        ))}
      </div>

      <EnvioTesteDialog open={open} onOpenChange={setOpen} inicial={inicial} onLog={onLog} onEnviado={onEnviado} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4) MODELOS DE MENSAGEM (Bloco 41)
// ═══════════════════════════════════════════════════════════════════

export function ModelosPanel({
  modelos, setModelos, onLog, onEnviado,
}: {
  modelos: ModeloMsg[];
  setModelos: (next: ModeloMsg[] | ((prev: ModeloMsg[]) => ModeloMsg[])) => void;
  onLog: (input: DemoLogInput) => void;
  onEnviado: () => void;
}) {
  const [editor, setEditor] = useState<ModeloMsg | null>(null);
  const [preview, setPreview] = useState<ModeloMsg | null>(null);
  const [envio, setEnvio] = useState<Partial<EnvioForm> | null>(null);

  function novo() {
    setEditor({
      id: uid("md"), nome: "Novo modelo", canal: "email", evento: "Lead criado",
      assunto: `${PREFIX} — Novo modelo`,
      corpo: `${PREFIX}. Olá, {{nome_lead}}.`,
      ativo: true,
    });
  }

  function salvar() {
    if (!editor) return;
    if (!editor.nome.trim()) { toast.error("Nome obrigatório"); return; }
    setModelos((p) => {
      const exists = p.some((x) => x.id === editor.id);
      return exists ? p.map((x) => x.id === editor.id ? editor : x) : [editor, ...p];
    });
    onLog({ area: "Comunicação", acao: "Modelo de mensagem salvo", registro: editor.nome, canal: editor.canal });
    setEditor(null);
    toast.success("Modelo salvo.");
  }

  function remover(m: ModeloMsg) {
    setModelos((p) => p.filter((x) => x.id !== m.id));
    onLog({ area: "Comunicação", acao: "Modelo de mensagem removido", registro: m.nome });
    toast.success("Modelo removido.");
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Modelos editáveis com variáveis dinâmicas. Cada modelo pode ter prévia e simulação de envio.
        </p>
        <Button onClick={novo}><Plus className="w-4 h-4 mr-1" />Novo modelo</Button>
      </Card>

      <Card className="p-3">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Canal</TableHead><TableHead>Evento</TableHead><TableHead>Ativo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {modelos.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm font-medium">{m.nome}</TableCell>
                <TableCell><Badge variant="outline">{m.canal}</Badge></TableCell>
                <TableCell className="text-xs">{m.evento}</TableCell>
                <TableCell>
                  <Switch checked={m.ativo} onCheckedChange={(v) => {
                    setModelos((p) => p.map((x) => x.id === m.id ? { ...x, ativo: v } : x));
                    onLog({ area: "Comunicação", acao: `Modelo ${v ? "ativado" : "desativado"}`, registro: m.nome });
                  }} />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => setPreview(m)}><Eye className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEnvio({
                    canal: m.canal === "interno" ? "interno" : m.canal,
                    tipoMensagem: m.nome,
                    evento: m.evento,
                    assunto: m.assunto ?? m.nome,
                    corpo: aplicarVariaveis(m.corpo),
                  })}><Send className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditor(m)}><FileText className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remover(m)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {modelos.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Sem modelos. Clique em "Novo modelo".</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Editor */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editor && modelos.some((x) => x.id === editor.id) ? "Editar modelo" : "Novo modelo"}</DialogTitle>
          </DialogHeader>
          {editor && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome</Label><Input value={editor.nome} onChange={(e) => setEditor({ ...editor, nome: e.target.value })} /></div>
                <div>
                  <Label className="text-xs">Canal</Label>
                  <Select value={editor.canal} onValueChange={(v) => setEditor({ ...editor, canal: v as Canal })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="interno">Notificação interna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Evento</Label><Input value={editor.evento} onChange={(e) => setEditor({ ...editor, evento: e.target.value })} /></div>
                <div className="flex items-end gap-2"><Switch checked={editor.ativo} onCheckedChange={(v) => setEditor({ ...editor, ativo: v })} /><span className="text-xs">Ativo</span></div>
              </div>
              {editor.canal === "email" && (
                <div><Label className="text-xs">Assunto</Label><Input value={editor.assunto ?? ""} onChange={(e) => setEditor({ ...editor, assunto: e.target.value })} /></div>
              )}
              <div>
                <Label className="text-xs">Corpo</Label>
                <Textarea rows={6} value={editor.corpo} onChange={(e) => setEditor({ ...editor, corpo: e.target.value })} />
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Variáveis disponíveis:</strong> {VARIAVEIS.map((v) => `{{${v}}}`).join(", ")}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditor(null)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prévia */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Prévia — {preview?.nome}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-2 text-sm">
              <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                <div><strong>Canal:</strong> {preview.canal}</div>
                <div><strong>Evento:</strong> {preview.evento}</div>
                {preview.canal === "email" && <div><strong>Assunto:</strong> {aplicarVariaveis(preview.assunto ?? "")}</div>}
              </div>
              <div className="rounded-md border p-3 whitespace-pre-wrap text-xs bg-card">
                {aplicarVariaveis(preview.corpo)}
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setPreview(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <EnvioTesteDialog open={!!envio} onOpenChange={(o) => !o && setEnvio(null)} inicial={envio ?? {}} onLog={onLog} onEnviado={onEnviado} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5) LOGS DO CRM (Bloco 42)
// ═══════════════════════════════════════════════════════════════════

export interface LogRich {
  id: string;
  quando: string;
  usuario: string;
  acao: string;
  area?: string;
  modulo?: string;
  registro?: string;
  status?: string;
  ambiente?: string;
  canal?: string;
  destinatario?: string;
  remetente?: string;
  evento?: string;
  erro?: string;
}

export function LogsPanel({ logs }: { logs: LogRich[] }) {
  const [fArea, setFArea] = useState<string>("__all");
  const [fAcao, setFAcao] = useState<string>("");
  const [fCanal, setFCanal] = useState<string>("__all");
  const [detalhe, setDetalhe] = useState<LogRich | null>(null);

  const areas = useMemo(() => Array.from(new Set(logs.map((l) => l.area).filter(Boolean))) as string[], [logs]);
  const canais = useMemo(() => Array.from(new Set(logs.map((l) => l.canal).filter(Boolean))) as string[], [logs]);

  const filtrados = useMemo(() => logs.filter((l) =>
    (fArea === "__all" || l.area === fArea) &&
    (!fAcao || l.acao.toLowerCase().includes(fAcao.toLowerCase())) &&
    (fCanal === "__all" || l.canal === fCanal)
  ), [logs, fArea, fAcao, fCanal]);

  return (
    <div className="space-y-4">
      <Card className="p-4 text-sm text-muted-foreground">
        Os logs mostram o histórico das ações realizadas dentro da demonstração. Em ambiente real, eles ajudam na auditoria, rastreabilidade, controle operacional e segurança.
      </Card>

      <Card className="p-4">
        <div className="grid sm:grid-cols-4 gap-2 mb-3">
          <div>
            <Label className="text-xs">Filtrar por área</Label>
            <Select value={fArea} onValueChange={setFArea}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas</SelectItem>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filtrar por ação</Label>
            <Input value={fAcao} onChange={(e) => setFAcao(e.target.value)} placeholder="Buscar..." />
          </div>
          <div>
            <Label className="text-xs">Filtrar por canal</Label>
            <Select value={fCanal} onValueChange={setFCanal}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos</SelectItem>
                {canais.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setFArea("__all"); setFAcao(""); setFCanal("__all"); }}>
              <Filter className="w-4 h-4 mr-1" />Limpar filtros
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.message("Exportação preparada — recurso disponível em ambiente real conforme contratação.")}>
              <Download className="w-4 h-4 mr-1" />Exportar demo
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs">{new Date(l.quando).toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-xs">{l.area ?? "—"}</TableCell>
                <TableCell className="text-xs">{l.acao}</TableCell>
                <TableCell className="text-xs">{l.canal ?? "—"}</TableCell>
                <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{l.status ?? "ok"}</Badge></TableCell>
                <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => setDetalhe(l)}><Eye className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Sem registros para os filtros aplicados.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do log</DialogTitle></DialogHeader>
          {detalhe && (
            <div className="text-xs space-y-1.5">
              {[
                ["ID", detalhe.id], ["Quando", new Date(detalhe.quando).toLocaleString("pt-BR")],
                ["Módulo", detalhe.modulo ?? "CRM"], ["Área", detalhe.area ?? "—"],
                ["Ação", detalhe.acao], ["Registro", detalhe.registro ?? "—"],
                ["Status", detalhe.status ?? "ok"], ["Ambiente", detalhe.ambiente ?? "DEMO"],
                ["Usuário/Sessão", detalhe.usuario], ["Canal", detalhe.canal ?? "—"],
                ["Remetente", detalhe.remetente ?? "—"], ["Destinatário", detalhe.destinatario ?? "—"],
                ["Evento", detalhe.evento ?? "—"], ["Erro", detalhe.erro ?? "—"],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-3 border-b last:border-0 pb-1">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right break-all">{v as string}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button onClick={() => setDetalhe(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6) JORNADA GUIADA (Bloco 44)
// ═══════════════════════════════════════════════════════════════════

interface JornadaArgs {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onLog: (input: DemoLogInput) => void;
  onGoto: (tab: string) => void;
}

const JORNADA_ETAPAS = [
  { titulo: "Criar lead", texto: "Comece cadastrando um lead com origem, interesse e responsável.", area: "Leads", tab: "leads" },
  { titulo: "Qualificar lead", texto: "Classifique o lead por nível de interesse e próxima ação.", area: "Leads", tab: "leads" },
  { titulo: "Converter em cliente", texto: "Quando o lead avança, ele pode ser convertido em cliente preservando histórico, origem e campanha.", area: "Clientes", tab: "clientes" },
  { titulo: "Vincular produto", texto: "Associe um produto ou módulo de interesse para organizar oportunidades, recompra e relacionamento.", area: "Produtos", tab: "produtos" },
  { titulo: "Vincular plano", texto: "Associe o cliente a um plano para controlar recorrência, setup, contrato mínimo e automações.", area: "Planos", tab: "planos" },
  { titulo: "Definir prazo de follow-up", texto: "Configure em quantos dias o sistema deve gerar retorno automático.", area: "Prazos", tab: "prazos" },
  { titulo: "Enviar boas-vindas", texto: "Teste o envio de boas-vindas por e-mail ou WhatsApp.", area: "Comunicação", tab: "comunicacao" },
  { titulo: "Criar tarefa automática", texto: "O CRM pode criar tarefas automaticamente para que nenhum contato seja esquecido.", area: "Regras", tab: "regras" },
  { titulo: "Mover no funil", texto: "Acompanhe a evolução do lead entre as etapas comerciais.", area: "Pipeline", tab: "pipeline" },
  { titulo: "Simular proposta", texto: "Registre proposta enviada e acione follow-up automático.", area: "Leads", tab: "leads" },
  { titulo: "Simular pagamento pendente", texto: "Marque o status como aguardando pagamento para testar cobrança e acompanhamento.", area: "Leads", tab: "leads" },
  { titulo: "Enviar follow-up", texto: "Teste uma mensagem automática de retorno.", area: "Follow-ups", tab: "followups" },
  { titulo: "Marcar como contratado", texto: "Finalize a jornada convertendo em cliente contratado.", area: "Clientes", tab: "clientes" },
  { titulo: "Ver dashboard atualizado", texto: "Veja os indicadores do CRM atualizados com base nas ações realizadas.", area: "Dashboard", tab: "dashboard" },
];

export function JornadaGuiadaDialog({ open, onOpenChange, onLog, onGoto }: JornadaArgs) {
  const [step, setStep] = useState(0);
  const finalizada = step >= JORNADA_ETAPAS.length;

  function avancar(pular = false) {
    const cur = JORNADA_ETAPAS[step];
    if (cur) {
      onLog({
        area: "Jornada Guiada",
        acao: pular ? `Etapa pulada — ${cur.titulo}` : `Etapa concluída — ${cur.titulo}`,
        registro: cur.area,
        status: pular ? "simulado" : "ok",
      });
    }
    setStep((s) => s + 1);
  }

  function fechar() {
    setStep(0);
    onOpenChange(false);
  }

  function irPara(tab: string) {
    onGoto(tab);
    fechar();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setStep(0); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Jornada guiada do CRM</DialogTitle>
          <DialogDescription>Conheça, na prática, o fluxo do primeiro contato à pós-venda.</DialogDescription>
        </DialogHeader>

        {!finalizada ? (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">Etapa {step + 1} de {JORNADA_ETAPAS.length}</div>
            <div className="h-1.5 bg-muted rounded overflow-hidden">
              <div className="h-1.5 bg-gradient-primary" style={{ width: `${((step + 1) / JORNADA_ETAPAS.length) * 100}%` }} />
            </div>
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold">{step + 1}. {JORNADA_ETAPAS[step].titulo}</h3>
              <p className="text-sm text-muted-foreground">{JORNADA_ETAPAS[step].texto}</p>
              <div className="text-xs">
                <Button size="sm" variant="link" className="px-0" onClick={() => irPara(JORNADA_ETAPAS[step].tab)}>
                  Abrir área: {JORNADA_ETAPAS[step].area} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </Card>
            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                <ArrowLeft className="w-4 h-4 mr-1" />Voltar
              </Button>
              <Button variant="outline" onClick={() => avancar(true)}>
                <SkipForward className="w-4 h-4 mr-1" />Pular etapa
              </Button>
              <Button onClick={() => avancar(false)}>
                Continuar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <Card className="p-4 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-semibold">Jornada guiada concluída.</h3>
              <p className="text-sm text-muted-foreground">Você testou o fluxo principal do CRM em ambiente demonstrativo.</p>
            </Card>
            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="ghost" onClick={fechar}>Fechar</Button>
              <Button variant="outline" asChild><Link to="/demo">Testar outros módulos</Link></Button>
              <Button variant="outline" asChild><Link to="/orcamento">Adicionar CRM ao orçamento</Link></Button>
              <Button asChild className="bg-gradient-primary"><Link to="/planos">Contratar CRM real</Link></Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 7) Barra de CTAs (Bloco 45)
// ═══════════════════════════════════════════════════════════════════

export function CrmCtaBar({ onIniciarJornada }: { onIniciarJornada: () => void }) {
  return (
    <Card className="p-4 mt-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-sm">Gostou do CRM? Transforme esta demonstração em operação real.</div>
          <p className="text-xs text-muted-foreground">Pare de perder leads e organize sua jornada comercial agora.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={onIniciarJornada}>
            <Compass className="w-4 h-4 mr-1" />Iniciar jornada guiada
          </Button>
          <Button size="sm" variant="outline" asChild><Link to="/planos">Ver planos</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/orcamento">Adicionar CRM ao orçamento</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/contato">Falar com consultor</Link></Button>
          <Button size="sm" className="bg-gradient-primary" asChild><Link to="/planos">Contratar CRM real</Link></Button>
        </div>
      </div>
    </Card>
  );
}

// Marker reuse to avoid unused-import warnings in some tsx parsers
export const _faseHIcons: ReactNode = (
  <span className="hidden">{[MessageSquare, ShoppingCart, Mail].map((I, i) => <I key={i} />)}</span>
);
