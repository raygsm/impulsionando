/**
 * Bloco 3/4 do CRM DEMO — Áreas de configuração: Prazos, Regras, Funis, Etapas,
 * Tags, Origens, Campanhas, Follow-ups, Automações, Usuários, Permissões e
 * Simular visão por perfil.
 *
 * Todos os painéis seguem o padrão DEMO: validação simples, prefixo de
 * comunicação `TESTE — DEMONSTRAÇÃO — VERSÃO TESTE`, logs via `onLog`.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Send, Pencil, Save, X, AlertTriangle, ArrowUp, ArrowDown, Copy, Star, PlayCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { uid } from "@/lib/demoSandbox";
import { COMUNICACAO_PREFIXO, type DemoLogInput, MSG_OBRIGATORIO, MSG_SUCESSO } from "@/lib/demoCrmCrud";

type LogFn = (e: DemoLogInput) => void;

const DEMO_NOTE = "Este registro foi criado apenas na versão demonstrativa.";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

// ───────────────────────── PRAZOS ─────────────────────────

type Prazo = {
  id: string; nome: string; dias: number; tipo?: string; quando?: string;
  evento?: string; acao?: string; canal?: string; responsavel?: string;
  status?: string; ativo?: boolean;
};

const PRAZO_TIPOS = ["Primeiro contato","Follow-up comercial","Reativação","Recompra","Cobrança","Renovação","Pesquisa","Contrato","Tarefa","Outro"];
const PRAZO_EVENTOS = ["Lead criado","Cliente criado","Proposta enviada","Produto comprado","Plano contratado","Pagamento pendente","Pagamento confirmado","Cliente inativo","Contrato próximo do vencimento","Serviço concluído"];
const PRAZO_ACOES = ["Enviar e-mail","Enviar WhatsApp","Criar tarefa","Adicionar tag","Mover no funil","Notificar responsável","Criar alerta","Enviar pesquisa","Enviar link de pagamento"];
const CANAIS = ["email","whatsapp","sms","interno"];

export function PrazosPanel({
  prazos, setPrazos, onLog,
}: { prazos: Prazo[]; setPrazos: (p: Prazo[] | ((prev: Prazo[]) => Prazo[])) => void; onLog: LogFn }) {
  const [novo, setNovo] = useState<Partial<Prazo>>({ nome: "", dias: 1, tipo: "Follow-up comercial", quando: "depois", evento: "Lead criado", acao: "Criar tarefa", canal: "interno", responsavel: "Vendedor Demo", status: "Ativo", ativo: true });
  const [erros, setErros] = useState<Record<string, string>>({});

  function salvar() {
    const e: Record<string, string> = {};
    if (!novo.nome?.trim()) e.nome = "Nome obrigatório";
    if (!novo.dias || novo.dias < 1 || !Number.isInteger(Number(novo.dias))) e.dias = "Dias deve ser inteiro positivo";
    setErros(e);
    if (Object.keys(e).length) { toast.error(MSG_OBRIGATORIO); return; }
    const p: Prazo = { id: uid("pz"), ativo: true, status: "Ativo", ...novo } as Prazo;
    setPrazos((prev) => [p, ...prev]);
    onLog({ area: "Prazos", acao: "Prazo criado", registro: p.nome, status: "ok" });
    toast.success(MSG_SUCESSO);
    setNovo({ nome: "", dias: 1, tipo: "Follow-up comercial", quando: "depois", evento: "Lead criado", acao: "Criar tarefa", canal: "interno", responsavel: "Vendedor Demo", status: "Ativo", ativo: true });
  }

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-sm">Prazos em Dias</h3>
        <p className="text-xs text-muted-foreground">Configure prazos para follow-ups, lembretes, cobranças, reativações, pesquisas e ações comerciais automáticas.</p>
      </div>
      <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-2 items-end">
        <div className="sm:col-span-2"><Label className="text-xs">Nome *</Label><Input value={novo.nome ?? ""} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /><FieldError msg={erros.nome} /></div>
        <div><Label className="text-xs">Dias *</Label><Input type="number" min={1} value={novo.dias ?? 1} onChange={(e) => setNovo({ ...novo, dias: Number(e.target.value) })} /><FieldError msg={erros.dias} /></div>
        <div><Label className="text-xs">Antes/Depois</Label><Select value={novo.quando} onValueChange={(v) => setNovo({ ...novo, quando: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="antes">Antes</SelectItem><SelectItem value="depois">Depois</SelectItem></SelectContent></Select></div>
        <div><Label className="text-xs">Tipo</Label><Select value={novo.tipo} onValueChange={(v) => setNovo({ ...novo, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRAZO_TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Evento</Label><Select value={novo.evento} onValueChange={(v) => setNovo({ ...novo, evento: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRAZO_EVENTOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Ação</Label><Select value={novo.acao} onValueChange={(v) => setNovo({ ...novo, acao: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRAZO_ACOES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Canal</Label><Select value={novo.canal} onValueChange={(v) => setNovo({ ...novo, canal: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CANAIS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Responsável</Label><Input value={novo.responsavel ?? ""} onChange={(e) => setNovo({ ...novo, responsavel: e.target.value })} /></div>
        <Button className="bg-gradient-primary" onClick={salvar}><Plus className="w-4 h-4 mr-1" />Novo prazo</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">{DEMO_NOTE}</p>
      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Dias</TableHead><TableHead>Evento</TableHead><TableHead>Ação</TableHead><TableHead>Ativo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {prazos.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="text-sm">{p.nome}</TableCell>
              <TableCell><Badge variant="outline">{p.tipo ?? "—"}</Badge></TableCell>
              <TableCell><Input type="number" value={p.dias} className="w-20 h-8" onChange={(e) => setPrazos((prev) => prev.map((x) => x.id === p.id ? { ...x, dias: Number(e.target.value) } : x))} /> <span className="text-xs text-muted-foreground">{p.quando}</span></TableCell>
              <TableCell className="text-xs">{p.evento ?? "—"}</TableCell>
              <TableCell className="text-xs">{p.acao ?? "—"}</TableCell>
              <TableCell><Switch checked={p.ativo ?? true} onCheckedChange={(v) => { setPrazos((prev) => prev.map((x) => x.id === p.id ? { ...x, ativo: v } : x)); onLog({ area: "Prazos", acao: v ? "Prazo ativado" : "Prazo inativado", registro: p.nome }); }} /></TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="outline" onClick={() => { toast.success(`Regra "${p.nome}" simulada com sucesso.`); onLog({ area: "Prazos", acao: "Prazo testado (simulado)", registro: p.nome, status: "simulado", canal: p.canal as "email"|"whatsapp"|undefined }); }}><PlayCircle className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setPrazos((prev) => prev.filter((x) => x.id !== p.id)); onLog({ area: "Prazos", acao: "Prazo removido", registro: p.nome }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ───────────────────────── REGRAS ─────────────────────────

type Regra = { id: string; nome: string; ativa: boolean; descricao?: string; impacto?: string; tooltip?: string; dependencia?: string; status?: string };

export function RegrasPanel({ regras, setRegras, onLog }: { regras: Regra[]; setRegras: (p: Regra[] | ((prev: Regra[]) => Regra[])) => void; onLog: LogFn }) {
  function toggle(r: Regra, v: boolean) {
    setRegras((prev) => prev.map((x) => x.id === r.id ? { ...x, ativa: v } : x));
    onLog({ area: "Regras", acao: `Regra ${v ? "ativada" : "desativada"}`, registro: `${r.nome} — anterior: ${r.ativa ? "SIM" : "NÃO"} → novo: ${v ? "SIM" : "NÃO"}` });
    toast.success(`Regra "${r.nome}" atualizada na demonstração.`);
  }
  function restaurar() {
    setRegras((prev) => prev.map((r) => ({ ...r, ativa: true })));
    onLog({ area: "Regras", acao: "Regras restauradas para padrão" });
    toast.success("Regras restauradas para o padrão DEMO.");
  }
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm">Regras do CRM</h3>
          <p className="text-xs text-muted-foreground">Cada regra altera o comportamento do CRM em SIM/NÃO. Alterações são registradas em log.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={restaurar}>Restaurar padrão</Button>
          <Button size="sm" variant="outline" onClick={() => { toast.success("Regras salvas na demonstração."); onLog({ area: "Regras", acao: "Regras salvas" }); }}><Save className="w-3.5 h-3.5 mr-1" />Salvar regras</Button>
        </div>
      </div>
      <div className="space-y-2">
        {regras.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3 border rounded p-3">
            <div className="flex-1">
              <div className="text-sm font-medium flex items-center gap-2 flex-wrap">{r.nome}
                {r.status && <Badge variant="outline" className="text-[10px]">{r.status}</Badge>}
                {r.dependencia && <Badge variant="outline" className="text-[10px]">Depende: {r.dependencia}</Badge>}
              </div>
              {r.descricao && <p className="text-xs text-muted-foreground mt-1">{r.descricao}</p>}
              {r.impacto && <p className="text-xs text-muted-foreground"><strong>Impacto:</strong> {r.impacto}</p>}
              {r.tooltip && <p className="text-[11px] text-muted-foreground italic mt-1">{r.tooltip}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Switch checked={r.ativa} onCheckedChange={(v) => toggle(r, v)} />
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { toast.message(`Regra testada (DEMO): "${r.nome}"`); onLog({ area: "Regras", acao: "Regra testada", registro: r.nome, status: "simulado" }); }}><PlayCircle className="w-3.5 h-3.5 mr-1" />Testar</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ───────────────────────── FUNIS ─────────────────────────

type Funil = { id: string; nome: string; ativo: boolean; descricao?: string; produto?: string; campanha?: string; responsavel?: string; padrao?: boolean };

export function FunisPanel({
  funis, setFunis, onLog,
}: { funis: Funil[]; setFunis: (p: Funil[] | ((prev: Funil[]) => Funil[])) => void; onLog: LogFn }) {
  const [nome, setNome] = useState("");
  function add() {
    if (!nome.trim()) { toast.error(MSG_OBRIGATORIO); return; }
    const f: Funil = { id: uid("fn"), nome: nome.trim(), ativo: true, padrao: false };
    setFunis((p) => [f, ...p]);
    onLog({ area: "Funis", acao: "Funil criado", registro: f.nome });
    toast.success(MSG_SUCESSO);
    setNome("");
  }
  function duplicar(f: Funil) {
    const novo = { ...f, id: uid("fn"), nome: `${f.nome} (cópia)`, padrao: false };
    setFunis((p) => [novo, ...p]);
    onLog({ area: "Funis", acao: "Funil duplicado", registro: novo.nome });
    toast.success("Funil duplicado na demonstração.");
  }
  function definirPadrao(f: Funil) {
    setFunis((p) => p.map((x) => ({ ...x, padrao: x.id === f.id })));
    onLog({ area: "Funis", acao: "Definido como padrão", registro: f.nome });
    toast.success(`"${f.nome}" definido como funil padrão.`);
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Funis</h3>
      <p className="text-xs text-muted-foreground">Crie funis para organizar a jornada comercial dos leads, desde o primeiro contato até a contratação, reativação ou perda.</p>
      <div className="flex gap-2"><Input placeholder="Nome do novo funil" value={nome} onChange={(e) => setNome(e.target.value)} /><Button onClick={add}><Plus className="w-4 h-4 mr-1" />Novo funil</Button></div>
      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Produto</TableHead><TableHead>Campanha</TableHead><TableHead>Responsável</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {funis.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="text-sm font-medium">{f.nome} {f.padrao && <Badge className="ml-1">Padrão</Badge>}</TableCell>
              <TableCell className="text-xs">{f.produto || "—"}</TableCell>
              <TableCell className="text-xs">{f.campanha || "—"}</TableCell>
              <TableCell className="text-xs">{f.responsavel || "—"}</TableCell>
              <TableCell><Switch checked={f.ativo} onCheckedChange={(v) => { setFunis((p) => p.map((x) => x.id === f.id ? { ...x, ativo: v } : x)); onLog({ area: "Funis", acao: v ? "Funil ativado" : "Funil inativado", registro: f.nome }); }} /></TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="ghost" onClick={() => definirPadrao(f)}><Star className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => duplicar(f)}><Copy className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setFunis((p) => p.filter((x) => x.id !== f.id)); onLog({ area: "Funis", acao: "Funil removido", registro: f.nome }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ───────────────────────── ETAPAS ─────────────────────────

type Etapa = { id: string; funilId: string; nome: string; ordem: number; cor?: string; prazoMaxDias?: number; aoEntrar?: string; aoSair?: string; descricao?: string; responsavel?: string; ativa?: boolean };

export function EtapasPanel({
  etapas, setEtapas, funis, onLog,
}: { etapas: Etapa[]; setEtapas: (p: Etapa[] | ((prev: Etapa[]) => Etapa[])) => void; funis: Funil[]; onLog: LogFn }) {
  const padrao = funis.find((f) => f.padrao) ?? funis[0];
  const [funilId, setFunilId] = useState(padrao?.id ?? "");
  const [nome, setNome] = useState("");
  const filtradas = useMemo(() => etapas.filter((e) => e.funilId === funilId).sort((a, b) => a.ordem - b.ordem), [etapas, funilId]);

  function add() {
    if (!nome.trim()) { toast.error(MSG_OBRIGATORIO); return; }
    const maxOrd = filtradas.reduce((m, e) => Math.max(m, e.ordem), 0);
    const nova: Etapa = { id: uid("et"), funilId, nome: nome.trim(), ordem: maxOrd + 1, cor: "#64748B", prazoMaxDias: 3, aoEntrar: "", aoSair: "", responsavel: "", ativa: true };
    setEtapas((p) => [...p, nova]);
    onLog({ area: "Etapas", acao: "Etapa criada", registro: nova.nome });
    toast.success(MSG_SUCESSO);
    setNome("");
  }
  function mover(e: Etapa, dir: -1 | 1) {
    const ordenadas = [...filtradas];
    const idx = ordenadas.findIndex((x) => x.id === e.id);
    const swap = ordenadas[idx + dir];
    if (!swap) return;
    setEtapas((prev) => prev.map((x) => x.id === e.id ? { ...x, ordem: swap.ordem } : x.id === swap.id ? { ...x, ordem: e.ordem } : x));
    onLog({ area: "Etapas", acao: "Etapa reordenada", registro: `${e.nome} ↔ ${swap.nome}` });
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Etapas do Funil</h3>
      <p className="text-xs text-muted-foreground">Cada etapa pode ter prazo, cor, ação automática ao entrar/sair e responsável.</p>
      <div className="flex gap-2 flex-wrap items-end">
        <div className="min-w-[220px]"><Label className="text-xs">Funil</Label><Select value={funilId} onValueChange={setFunilId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{funis.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex-1 min-w-[200px]"><Label className="text-xs">Nova etapa</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Ordem</TableHead><TableHead>Nome</TableHead><TableHead>Cor</TableHead><TableHead>Prazo (dias)</TableHead><TableHead>Ao entrar</TableHead><TableHead>Ao sair</TableHead><TableHead>Ativa</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {filtradas.map((e) => (
            <TableRow key={e.id}>
              <TableCell><span className="inline-flex items-center gap-1"><Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => mover(e, -1)}><ArrowUp className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => mover(e, 1)}><ArrowDown className="w-3 h-3" /></Button> <Badge variant="outline">{e.ordem}</Badge></span></TableCell>
              <TableCell className="text-sm font-medium">{e.nome}</TableCell>
              <TableCell><input type="color" value={e.cor ?? "#64748B"} onChange={(ev) => setEtapas((p) => p.map((x) => x.id === e.id ? { ...x, cor: ev.target.value } : x))} className="w-10 h-7 rounded cursor-pointer border" /></TableCell>
              <TableCell><Input type="number" value={e.prazoMaxDias ?? 0} className="w-20 h-8" onChange={(ev) => setEtapas((p) => p.map((x) => x.id === e.id ? { ...x, prazoMaxDias: Number(ev.target.value) } : x))} /></TableCell>
              <TableCell><Select value={e.aoEntrar || "—"} onValueChange={(v) => setEtapas((p) => p.map((x) => x.id === e.id ? { ...x, aoEntrar: v === "—" ? "" : v } : x))}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="—">—</SelectItem>{PRAZO_ACOES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></TableCell>
              <TableCell><Select value={e.aoSair || "—"} onValueChange={(v) => setEtapas((p) => p.map((x) => x.id === e.id ? { ...x, aoSair: v === "—" ? "" : v } : x))}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="—">—</SelectItem>{PRAZO_ACOES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></TableCell>
              <TableCell><Switch checked={e.ativa ?? true} onCheckedChange={(v) => setEtapas((p) => p.map((x) => x.id === e.id ? { ...x, ativa: v } : x))} /></TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="outline" onClick={() => { toast.success(`Ação "${e.aoEntrar || "—"}" simulada na etapa "${e.nome}".`); onLog({ area: "Etapas", acao: "Ação de etapa testada", registro: e.nome, status: "simulado" }); }}><PlayCircle className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setEtapas((p) => p.filter((x) => x.id !== e.id)); onLog({ area: "Etapas", acao: "Etapa removida", registro: e.nome }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ───────────────────────── TAGS ─────────────────────────

type TagItem = { id: string; nome: string; cor?: string; categoria?: string; descricao?: string; ativa?: boolean };
const TAG_CATEGORIAS = ["Prioridade","Comercial","Cliente","Financeiro","Operacional","Outro"];

export function TagsPanel({ tags, setTags, onLog }: { tags: TagItem[]; setTags: (p: TagItem[] | ((prev: TagItem[]) => TagItem[])) => void; onLog: LogFn }) {
  const [novo, setNovo] = useState<Partial<TagItem>>({ nome: "", cor: "#3B82F6", categoria: "Prioridade", descricao: "", ativa: true });
  function add() {
    if (!novo.nome?.trim()) { toast.error(MSG_OBRIGATORIO); return; }
    const t: TagItem = { id: uid("tg"), ativa: true, ...novo } as TagItem;
    setTags((p) => [t, ...p]);
    onLog({ area: "Tags", acao: "Tag criada", registro: t.nome });
    toast.success(MSG_SUCESSO);
    setNovo({ nome: "", cor: "#3B82F6", categoria: "Prioridade", descricao: "", ativa: true });
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Tags</h3>
      <p className="text-xs text-muted-foreground">Classifique leads e clientes, organize prioridades e dispare automações.</p>
      <div className="grid sm:grid-cols-5 gap-2 items-end">
        <div className="sm:col-span-2"><Label className="text-xs">Nome *</Label><Input value={novo.nome ?? ""} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></div>
        <div><Label className="text-xs">Cor</Label><input type="color" value={novo.cor} onChange={(e) => setNovo({ ...novo, cor: e.target.value })} className="w-full h-9 rounded cursor-pointer border" /></div>
        <div><Label className="text-xs">Categoria</Label><Select value={novo.categoria} onValueChange={(v) => setNovo({ ...novo, categoria: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TAG_CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Nova tag</Button>
        <div className="sm:col-span-5"><Label className="text-xs">Descrição</Label><Input value={novo.descricao ?? ""} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t.id} className="inline-flex items-center gap-2 border rounded-full pl-2 pr-1 py-1 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ background: t.cor ?? "#64748B" }} />
            <span className="font-medium">{t.nome}</span>
            <Badge variant="outline" className="text-[10px]">{t.categoria ?? "—"}</Badge>
            {t.ativa === false && <Badge variant="outline" className="text-[10px]">Inativa</Badge>}
            <button className="opacity-70 hover:opacity-100 ml-1" onClick={() => { setTags((p) => p.filter((x) => x.id !== t.id)); onLog({ area: "Tags", acao: "Tag removida", registro: t.nome }); }}><Trash2 className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
    </Card>
  );
}

// ───────────────────────── ORIGENS ─────────────────────────

type Origem = { id: string; nome: string; tipo?: string; descricao?: string; ativa?: boolean };
const ORIGEM_TIPOS = ["Pago","Orgânico","Indicação","Afiliado","Evento","Manual","Outro"];

export function OrigensPanel({ origens, setOrigens, leads, onLog }: { origens: Origem[]; setOrigens: (p: Origem[] | ((prev: Origem[]) => Origem[])) => void; leads: { origem: string; estagio: string }[]; onLog: LogFn }) {
  const [novo, setNovo] = useState<Partial<Origem>>({ nome: "", tipo: "Pago", descricao: "", ativa: true });
  function add() {
    if (!novo.nome?.trim()) { toast.error(MSG_OBRIGATORIO); return; }
    const o: Origem = { id: uid("og"), ativa: true, ...novo } as Origem;
    setOrigens((p) => [o, ...p]);
    onLog({ area: "Origens", acao: "Origem criada", registro: o.nome });
    toast.success(MSG_SUCESSO);
    setNovo({ nome: "", tipo: "Pago", descricao: "", ativa: true });
  }
  function leadsPor(nome: string) {
    const total = leads.filter((l) => l.origem === nome).length;
    const conv = leads.filter((l) => l.origem === nome && l.estagio === "Contratado").length;
    return { total, conv, tx: total ? Math.round((conv / total) * 100) : 0 };
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Origens</h3>
      <p className="text-xs text-muted-foreground">Cadastre origens para entender de onde vêm seus leads e quais canais convertem mais.</p>
      <div className="grid sm:grid-cols-4 gap-2 items-end">
        <div><Label className="text-xs">Nome *</Label><Input value={novo.nome ?? ""} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></div>
        <div><Label className="text-xs">Tipo</Label><Select value={novo.tipo} onValueChange={(v) => setNovo({ ...novo, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ORIGEM_TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Descrição</Label><Input value={novo.descricao ?? ""} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} /></div>
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Nova origem</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Leads</TableHead><TableHead>Conversão</TableHead><TableHead>Ativa</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {origens.map((o) => {
            const s = leadsPor(o.nome);
            return (
              <TableRow key={o.id}>
                <TableCell className="text-sm font-medium">{o.nome}</TableCell>
                <TableCell><Badge variant="outline">{o.tipo ?? "—"}</Badge></TableCell>
                <TableCell className="text-xs">{s.total}</TableCell>
                <TableCell className="text-xs">{s.conv} ({s.tx}%)</TableCell>
                <TableCell><Switch checked={o.ativa ?? true} onCheckedChange={(v) => { setOrigens((p) => p.map((x) => x.id === o.id ? { ...x, ativa: v } : x)); onLog({ area: "Origens", acao: v ? "Origem ativada" : "Origem inativada", registro: o.nome }); }} /></TableCell>
                <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => { setOrigens((p) => p.filter((x) => x.id !== o.id)); onLog({ area: "Origens", acao: "Origem removida", registro: o.nome }); }}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

// ───────────────────────── CAMPANHAS ─────────────────────────

type Campanha = { id: string; nome: string; canal: string; status: string; leads: number; origem?: string; produto?: string; funil?: string; dataInicial?: string; dataFinal?: string; investimento?: number; conversoes?: number; receitaPrevista?: number };

export function CampanhasPanel({
  campanhas, setCampanhas, origens, onLog,
}: { campanhas: Campanha[]; setCampanhas: (p: Campanha[] | ((prev: Campanha[]) => Campanha[])) => void; origens: Origem[]; onLog: LogFn }) {
  const [novo, setNovo] = useState<Partial<Campanha>>({ nome: "", origem: origens[0]?.nome ?? "", canal: "Google Ads", status: "Configurado", leads: 0, investimento: 0, conversoes: 0, receitaPrevista: 0 });
  function add() {
    if (!novo.nome?.trim()) { toast.error(MSG_OBRIGATORIO); return; }
    const c: Campanha = { id: uid("cp"), leads: 0, status: "Configurado", canal: "Google Ads", ...novo } as Campanha;
    setCampanhas((p) => [c, ...p]);
    onLog({ area: "Campanhas", acao: "Campanha criada", registro: c.nome });
    toast.success(MSG_SUCESSO);
    setNovo({ nome: "", origem: origens[0]?.nome ?? "", canal: "Google Ads", status: "Configurado", leads: 0, investimento: 0, conversoes: 0, receitaPrevista: 0 });
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Campanhas</h3>
      <p className="text-xs text-muted-foreground">Acompanhe origem, investimento, leads, conversões e retorno comercial por campanha.</p>
      <div className="grid sm:grid-cols-5 gap-2 items-end">
        <div className="sm:col-span-2"><Label className="text-xs">Nome *</Label><Input value={novo.nome ?? ""} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></div>
        <div><Label className="text-xs">Origem</Label><Select value={novo.origem} onValueChange={(v) => setNovo({ ...novo, origem: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{origens.map((o) => <SelectItem key={o.id} value={o.nome}>{o.nome}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Investimento</Label><Input type="number" value={novo.investimento ?? 0} onChange={(e) => setNovo({ ...novo, investimento: Number(e.target.value) })} /></div>
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Nova campanha</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Campanha</TableHead><TableHead>Origem</TableHead><TableHead>Funil</TableHead><TableHead>Invest.</TableHead><TableHead>Leads</TableHead><TableHead>Conv.</TableHead><TableHead>Receita</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {campanhas.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-sm font-medium">{c.nome}</TableCell>
              <TableCell><Badge variant="outline">{c.origem ?? c.canal}</Badge></TableCell>
              <TableCell className="text-xs">{c.funil ?? "—"}</TableCell>
              <TableCell className="text-xs">{(c.investimento ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
              <TableCell className="text-xs">{c.leads}</TableCell>
              <TableCell className="text-xs">{c.conversoes ?? 0}</TableCell>
              <TableCell className="text-xs">{(c.receitaPrevista ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
              <TableCell><Badge>{c.status}</Badge></TableCell>
              <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => { setCampanhas((p) => p.filter((x) => x.id !== c.id)); onLog({ area: "Campanhas", acao: "Campanha removida", registro: c.nome }); }}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ───────────────────────── FOLLOW-UPS ─────────────────────────

type Followup = { id: string; nome?: string; evento?: string; canal?: string; envios?: number; intervaloDias?: number; mensagem1?: string; mensagem2?: string; mensagem3?: string; criarTarefa?: boolean; encerrarSeResponder?: boolean; ativo?: boolean };
const FU_EVENTOS = ["Lead criado","Proposta enviada","Pagamento pendente","Cliente inativo","Produto próximo do fim","Contrato próximo do vencimento","Serviço concluído","Pesquisa não respondida"];

export function FollowupsPanel({ followups, setFollowups, onLog }: { followups: Followup[]; setFollowups: (p: Followup[] | ((prev: Followup[]) => Followup[])) => void; onLog: LogFn }) {
  const [novo, setNovo] = useState<Partial<Followup>>({ nome: "", evento: "Lead criado", canal: "whatsapp", envios: 3, intervaloDias: 2, mensagem1: "", mensagem2: "", mensagem3: "", criarTarefa: true, encerrarSeResponder: true, ativo: true });
  const [erros, setErros] = useState<Record<string, string>>({});
  function add() {
    const e: Record<string, string> = {};
    if (!novo.nome?.trim()) e.nome = "Nome obrigatório";
    if (!novo.mensagem1?.trim()) e.mensagem1 = "Mensagem 1 obrigatória";
    setErros(e);
    if (Object.keys(e).length) { toast.error(MSG_OBRIGATORIO); return; }
    const f: Followup = { id: uid("fu"), ativo: true, ...novo } as Followup;
    setFollowups((p) => [f, ...p]);
    onLog({ area: "Follow-ups", acao: "Follow-up criado", registro: f.nome });
    toast.success(MSG_SUCESSO);
    setNovo({ nome: "", evento: "Lead criado", canal: "whatsapp", envios: 3, intervaloDias: 2, mensagem1: "", mensagem2: "", mensagem3: "", criarTarefa: true, encerrarSeResponder: true, ativo: true });
  }
  function testar(f: Followup) {
    const dest = window.prompt(`Informe e-mail ou WhatsApp de teste para "${f.nome}":`, "teste@demo.com");
    if (!dest) return;
    toast.success(`Follow-up "${f.nome}" simulado para ${dest}.\nPrefixo: ${COMUNICACAO_PREFIXO}`);
    onLog({ area: "Follow-ups", acao: "Follow-up testado (simulado)", registro: f.nome, status: "simulado", canal: f.canal === "email" ? "email" : f.canal === "whatsapp" ? "whatsapp" : undefined, destinatario: dest });
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Follow-ups</h3>
      <p className="text-xs text-muted-foreground">Sequências de relacionamento. Configure mensagens, intervalos e canais. Toda mensagem teste contém TESTE — DEMONSTRAÇÃO — VERSÃO TESTE.</p>
      <div className="grid sm:grid-cols-4 gap-2 items-end">
        <div className="sm:col-span-2"><Label className="text-xs">Nome *</Label><Input value={novo.nome ?? ""} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /><FieldError msg={erros.nome} /></div>
        <div><Label className="text-xs">Evento</Label><Select value={novo.evento} onValueChange={(v) => setNovo({ ...novo, evento: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FU_EVENTOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Canal</Label><Select value={novo.canal} onValueChange={(v) => setNovo({ ...novo, canal: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">E-mail</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="ambos">Ambos</SelectItem><SelectItem value="interno">Notificação interna</SelectItem></SelectContent></Select></div>
        <div><Label className="text-xs">Envios</Label><Input type="number" min={1} max={3} value={novo.envios ?? 1} onChange={(e) => setNovo({ ...novo, envios: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Intervalo (dias)</Label><Input type="number" min={1} value={novo.intervaloDias ?? 1} onChange={(e) => setNovo({ ...novo, intervaloDias: Number(e.target.value) })} /></div>
        <div className="sm:col-span-4"><Label className="text-xs">Mensagem 1 *</Label><Textarea rows={2} value={novo.mensagem1 ?? ""} onChange={(e) => setNovo({ ...novo, mensagem1: e.target.value })} /><FieldError msg={erros.mensagem1} /></div>
        <div className="sm:col-span-4"><Label className="text-xs">Mensagem 2</Label><Textarea rows={2} value={novo.mensagem2 ?? ""} onChange={(e) => setNovo({ ...novo, mensagem2: e.target.value })} /></div>
        <div className="sm:col-span-4"><Label className="text-xs">Mensagem 3</Label><Textarea rows={2} value={novo.mensagem3 ?? ""} onChange={(e) => setNovo({ ...novo, mensagem3: e.target.value })} /></div>
        <div className="sm:col-span-2 flex gap-3 items-center"><Switch checked={novo.criarTarefa ?? true} onCheckedChange={(v) => setNovo({ ...novo, criarTarefa: v })} /><span className="text-xs">Criar tarefa após falha</span></div>
        <div className="sm:col-span-2 flex gap-3 items-center"><Switch checked={novo.encerrarSeResponder ?? true} onCheckedChange={(v) => setNovo({ ...novo, encerrarSeResponder: v })} /><span className="text-xs">Encerrar se responder</span></div>
        <Button className="sm:col-span-4 bg-gradient-primary" onClick={add}><Plus className="w-4 h-4 mr-1" />Novo follow-up</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Evento</TableHead><TableHead>Canal</TableHead><TableHead>Envios</TableHead><TableHead>Intervalo</TableHead><TableHead>Ativo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {followups.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="text-sm font-medium">{f.nome ?? "—"}</TableCell>
              <TableCell className="text-xs">{f.evento ?? "—"}</TableCell>
              <TableCell><Badge variant="outline">{f.canal ?? "—"}</Badge></TableCell>
              <TableCell className="text-xs">{f.envios ?? 0}</TableCell>
              <TableCell className="text-xs">{f.intervaloDias ?? 0}d</TableCell>
              <TableCell><Switch checked={f.ativo ?? true} onCheckedChange={(v) => { setFollowups((p) => p.map((x) => x.id === f.id ? { ...x, ativo: v } : x)); onLog({ area: "Follow-ups", acao: v ? "Follow-up ativado" : "Follow-up inativado", registro: f.nome ?? "" }); }} /></TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="outline" onClick={() => testar(f)}><Send className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setFollowups((p) => p.filter((x) => x.id !== f.id)); onLog({ area: "Follow-ups", acao: "Follow-up removido", registro: f.nome ?? "" }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ───────────────────────── AUTOMAÇÕES ─────────────────────────

type Automacao = { id: string; nome: string; gatilho: string; acao: string; ativa: boolean; condicao?: string; canal?: string; tempoEsperaDias?: number; observacoes?: string };
const AUT_GATILHOS = ["novo lead cadastrado","novo cliente cadastrado","proposta enviada","pagamento pendente","pagamento confirmado","lead parado","cliente inativo","produto próximo do fim","contrato vencendo","tarefa atrasada","formulário preenchido","tag aplicada","etapa alterada","plano contratado"];
const AUT_ACOES = ["enviar e-mail","enviar WhatsApp","criar tarefa","adicionar tag","remover tag","mover no funil","notificar responsável","criar alerta","enviar pesquisa","enviar link de pagamento","alterar status","criar log","iniciar follow-up"];

export function AutomacoesPanel({ autos, setAutos, onLog }: { autos: Automacao[]; setAutos: (p: Automacao[] | ((prev: Automacao[]) => Automacao[])) => void; onLog: LogFn }) {
  const [novo, setNovo] = useState<Partial<Automacao>>({ nome: "", gatilho: AUT_GATILHOS[0], acao: AUT_ACOES[0], canal: "whatsapp", tempoEsperaDias: 0, condicao: "", ativa: true });
  function add() {
    if (!novo.nome?.trim()) { toast.error(MSG_OBRIGATORIO); return; }
    const a: Automacao = { id: uid("au"), ativa: true, ...novo } as Automacao;
    setAutos((p) => [a, ...p]);
    onLog({ area: "Automações", acao: "Automação criada", registro: a.nome });
    toast.success(MSG_SUCESSO);
    setNovo({ nome: "", gatilho: AUT_GATILHOS[0], acao: AUT_ACOES[0], canal: "whatsapp", tempoEsperaDias: 0, condicao: "", ativa: true });
  }
  function testar(a: Automacao) {
    const ok = window.confirm(`Simular gatilho: "${a.gatilho}"?\n\nO CRM executaria: ${a.acao}${a.tempoEsperaDias ? ` em ${a.tempoEsperaDias} dia(s)` : ""}.`);
    if (!ok) return;
    toast.success(`Automação "${a.nome}" simulada com sucesso.`);
    onLog({ area: "Automações", acao: "Automação testada (simulada)", registro: a.nome, status: "simulado", canal: a.canal === "email" ? "email" : a.canal === "whatsapp" ? "whatsapp" : undefined });
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Automações</h3>
      <p className="text-xs text-muted-foreground">Monte regras simples: Quando acontecer X → Fazer Y. Toda automação pode ser testada (simulação) e gera log.</p>
      <div className="grid sm:grid-cols-3 gap-2 items-end">
        <div><Label className="text-xs">Nome *</Label><Input value={novo.nome ?? ""} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></div>
        <div><Label className="text-xs">Gatilho</Label><Select value={novo.gatilho} onValueChange={(v) => setNovo({ ...novo, gatilho: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUT_GATILHOS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Ação</Label><Select value={novo.acao} onValueChange={(v) => setNovo({ ...novo, acao: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUT_ACOES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Condição</Label><Input placeholder="Ex.: score > 80" value={novo.condicao ?? ""} onChange={(e) => setNovo({ ...novo, condicao: e.target.value })} /></div>
        <div><Label className="text-xs">Canal</Label><Select value={novo.canal} onValueChange={(v) => setNovo({ ...novo, canal: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Tempo de espera (dias)</Label><Input type="number" min={0} value={novo.tempoEsperaDias ?? 0} onChange={(e) => setNovo({ ...novo, tempoEsperaDias: Number(e.target.value) })} /></div>
        <Button className="sm:col-span-3 bg-gradient-primary" onClick={add}><Plus className="w-4 h-4 mr-1" />Nova automação</Button>
      </div>
      <div className="space-y-2">
        {autos.map((a) => (
          <div key={a.id} className="border rounded p-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm font-medium">{a.nome}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-1">
                <Badge variant="outline">Quando: {a.gatilho}</Badge>
                {a.condicao && <Badge variant="outline">Se: {a.condicao}</Badge>}
                <Badge>Faz: {a.acao}</Badge>
                {a.canal && <Badge variant="outline">{a.canal}</Badge>}
                {a.tempoEsperaDias ? <Badge variant="outline">+{a.tempoEsperaDias}d</Badge> : null}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Switch checked={a.ativa} onCheckedChange={(v) => { setAutos((p) => p.map((x) => x.id === a.id ? { ...x, ativa: v } : x)); onLog({ area: "Automações", acao: v ? "Automação ativada" : "Automação inativada", registro: a.nome }); }} />
              <Button size="sm" variant="outline" onClick={() => testar(a)}><PlayCircle className="w-3.5 h-3.5 mr-1" />Testar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAutos((p) => p.filter((x) => x.id !== a.id)); onLog({ area: "Automações", acao: "Automação removida", registro: a.nome }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ───────────────────────── USUÁRIOS ─────────────────────────

type Usuario = { id: string; nome: string; email: string; papel: string; status: string; whatsapp?: string; cargo?: string; setor?: string; observacoes?: string };
const PERFIS_USUARIO = ["Administrador","Gestor","Vendedor","Atendimento","Financeiro","Operação","Auditor"];
const SETORES = ["Comercial","Atendimento","Financeiro","Operação","Marketing","Gestão","Suporte"];
const USU_STATUS = ["Ativo","Inativo","Convite enviado — DEMO","Aguardando confirmação — DEMO"];

export function UsuariosPanel({ usuarios, setUsuarios, onLog }: { usuarios: Usuario[]; setUsuarios: (p: Usuario[] | ((prev: Usuario[]) => Usuario[])) => void; onLog: LogFn }) {
  const [novo, setNovo] = useState<Partial<Usuario>>({ nome: "", email: "", whatsapp: "", cargo: "", setor: "Comercial", papel: "Vendedor", status: "Ativo", observacoes: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  function add() {
    const e: Record<string, string> = {};
    if (!novo.nome?.trim()) e.nome = "Nome obrigatório";
    if (novo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(novo.email)) e.email = "E-mail inválido";
    setErros(e);
    if (Object.keys(e).length) { toast.error(MSG_OBRIGATORIO); return; }
    const u: Usuario = { id: uid("us"), ...novo } as Usuario;
    setUsuarios((p) => [u, ...p]);
    onLog({ area: "Usuários", acao: "Usuário criado", registro: u.nome });
    toast.success(MSG_SUCESSO);
    setNovo({ nome: "", email: "", whatsapp: "", cargo: "", setor: "Comercial", papel: "Vendedor", status: "Ativo", observacoes: "" });
  }
  function enviarConvite(u: Usuario, canal: "email" | "whatsapp") {
    const corpo = `${COMUNICACAO_PREFIXO}\n\nOlá ${u.nome}, você foi convidado(a) para acessar o CRM da demonstração.`;
    toast.success(`Convite ${canal} simulado para ${canal === "email" ? u.email : u.whatsapp || "—"}.\n${corpo.slice(0, 80)}…`);
    onLog({ area: "Usuários", acao: `Convite ${canal === "email" ? "e-mail" : "WhatsApp"} enviado (simulado)`, registro: u.nome, status: "simulado", canal, destinatario: canal === "email" ? u.email : u.whatsapp });
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Usuários</h3>
      <p className="text-xs text-muted-foreground">Simule equipes, setores, responsabilidades e perfis dentro do CRM. Todo convite teste contém TESTE — DEMONSTRAÇÃO — VERSÃO TESTE.</p>
      <div className="grid sm:grid-cols-4 gap-2 items-end">
        <div><Label className="text-xs">Nome *</Label><Input value={novo.nome ?? ""} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /><FieldError msg={erros.nome} /></div>
        <div><Label className="text-xs">E-mail</Label><Input value={novo.email ?? ""} onChange={(e) => setNovo({ ...novo, email: e.target.value })} /><FieldError msg={erros.email} /></div>
        <div><Label className="text-xs">WhatsApp</Label><Input value={novo.whatsapp ?? ""} onChange={(e) => setNovo({ ...novo, whatsapp: e.target.value })} /></div>
        <div><Label className="text-xs">Cargo</Label><Input value={novo.cargo ?? ""} onChange={(e) => setNovo({ ...novo, cargo: e.target.value })} /></div>
        <div><Label className="text-xs">Setor</Label><Select value={novo.setor} onValueChange={(v) => setNovo({ ...novo, setor: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SETORES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Perfil</Label><Select value={novo.papel} onValueChange={(v) => setNovo({ ...novo, papel: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PERFIS_USUARIO.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Status</Label><Select value={novo.status} onValueChange={(v) => setNovo({ ...novo, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{USU_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Novo usuário</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Setor</TableHead><TableHead>Cargo</TableHead><TableHead>Perfil</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {usuarios.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="text-sm font-medium">{u.nome}</TableCell>
              <TableCell className="text-xs">{u.email}</TableCell>
              <TableCell className="text-xs">{u.setor ?? "—"}</TableCell>
              <TableCell className="text-xs">{u.cargo ?? "—"}</TableCell>
              <TableCell><Badge variant="outline">{u.papel}</Badge></TableCell>
              <TableCell><Badge>{u.status}</Badge></TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="outline" onClick={() => enviarConvite(u, "email")} disabled={!u.email}><Send className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => enviarConvite(u, "whatsapp")} disabled={!u.whatsapp}><MessageDot /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setUsuarios((p) => p.filter((x) => x.id !== u.id)); onLog({ area: "Usuários", acao: "Usuário removido", registro: u.nome }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
function MessageDot() { return <span className="text-[10px] font-bold">WA</span>; }

// ───────────────────────── PERMISSÕES ─────────────────────────

type Permissao = { papel: string; permissao?: string; permitido: boolean; acao?: "ver" | "criar" | "editar" | "excluir" };

const PERMS_DEMO = ["Ver clientes","Criar clientes","Editar clientes","Excluir clientes","Ver leads","Criar leads","Editar leads","Converter leads","Editar funis","Editar etapas","Criar produtos","Editar produtos","Criar planos","Editar planos","Ver financeiro","Enviar WhatsApp","Enviar e-mail","Configurar automações","Configurar follow-ups","Acessar dashboards","Exportar dados","Ver logs","Zerar dados da DEMO"];

export function PermissoesPanel({ permissoes, setPermissoes, onLog }: { permissoes: Permissao[]; setPermissoes: (p: Permissao[] | ((prev: Permissao[]) => Permissao[])) => void; onLog: LogFn }) {
  // Trabalha apenas com formato "permissao" (novo). Linhas antigas com "acao" são ignoradas visualmente.
  const novos = permissoes.filter((p) => p.permissao);
  const papeis = Array.from(new Set(novos.map((p) => p.papel)));
  if (papeis.length === 0) {
    return <Card className="p-5 text-sm text-muted-foreground">Carregando matriz de permissões… Recarregue a DEMO clicando em <strong>Popular demo</strong>.</Card>;
  }
  function toggle(papel: string, perm: string, v: boolean) {
    const anterior = permissoes.find((p) => p.papel === papel && p.permissao === perm)?.permitido;
    setPermissoes((prev) => prev.map((p) => p.papel === papel && p.permissao === perm ? { ...p, permitido: v } : p));
    onLog({ area: "Permissões", acao: "Permissão alterada", registro: `${papel} • ${perm} — ${anterior ? "SIM" : "NÃO"} → ${v ? "SIM" : "NÃO"}` });
    toast.success("Alteração registrada apenas na demonstração.");
  }
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-semibold text-sm">Permissões</h3>
          <p className="text-xs text-muted-foreground">Defina o que cada perfil pode visualizar, criar, editar, excluir ou disparar no CRM.</p>
        </div>
        <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { toast.success("Permissões salvas na demonstração."); onLog({ area: "Permissões", acao: "Permissões salvas" }); }}><Save className="w-3.5 h-3.5 mr-1" />Salvar</Button></div>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader><TableRow><TableHead className="sticky left-0 bg-background">Permissão</TableHead>{papeis.map((p) => <TableHead key={p} className="text-center text-xs">{p}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {PERMS_DEMO.map((perm) => (
              <TableRow key={perm}>
                <TableCell className="sticky left-0 bg-background text-xs">{perm}</TableCell>
                {papeis.map((papel) => {
                  const v = novos.find((x) => x.papel === papel && x.permissao === perm)?.permitido ?? false;
                  return <TableCell key={papel} className="text-center"><Switch checked={v} onCheckedChange={(nv) => toggle(papel, perm, nv)} /></TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// ───────────────────────── SIMULAR PERFIL ─────────────────────────

export function SimularPerfilPanel({ permissoes, onLog }: { permissoes: Permissao[]; onLog: LogFn }) {
  const novos = permissoes.filter((p) => p.permissao);
  const papeis = Array.from(new Set(novos.map((p) => p.papel)));
  const [papel, setPapel] = useState(papeis[0] ?? "Vendedor");
  const permitidas = novos.filter((p) => p.papel === papel && p.permitido).map((p) => p.permissao!);
  const negadas = novos.filter((p) => p.papel === papel && !p.permitido).map((p) => p.permissao!);
  function simular() {
    onLog({ area: "Simular visão", acao: "Visão simulada", registro: papel, status: "simulado" });
    toast.success(`Visão simulada para o perfil "${papel}".`);
  }
  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2"><Eye className="w-4 h-4" />Simular visão por perfil</h3>
      <p className="text-xs text-muted-foreground">Selecione um perfil e visualize, de forma simplificada, o que ele poderia acessar.</p>
      <div className="flex gap-2 items-end">
        <div className="min-w-[240px]"><Label className="text-xs">Perfil</Label><Select value={papel} onValueChange={setPapel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{papeis.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
        <Button onClick={simular}><PlayCircle className="w-4 h-4 mr-1" />Simular agora</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-xs font-semibold text-emerald-700 mb-2">Permitido ({permitidas.length})</div>
          <div className="flex flex-wrap gap-1">{permitidas.length === 0 ? <span className="text-xs text-muted-foreground">Nenhuma permissão.</span> : permitidas.map((p) => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs font-semibold text-destructive mb-2">Negado ({negadas.length})</div>
          <div className="flex flex-wrap gap-1">{negadas.length === 0 ? <span className="text-xs text-muted-foreground">Acesso total.</span> : negadas.map((p) => <Badge key={p} variant="outline" className="text-[10px] opacity-60">{p}</Badge>)}</div>
        </Card>
      </div>
      <p className="text-[11px] text-muted-foreground">Use este recurso para entender como o controle de acesso funciona em uma operação real.</p>
    </Card>
  );
}

// Re-exports para evitar imports não-utilizados em variantes do bundler.
export const _unused = { AlertTriangle, Pencil, X };
