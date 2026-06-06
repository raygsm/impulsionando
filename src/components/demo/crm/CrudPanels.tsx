import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit3, Trash2, X, Power, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { uid } from "@/lib/demoSandbox";
import {
  EMPRESA_SEGMENTOS, EMPRESA_PORTES, EMPRESA_STATUS,
  PRODUTO_CATEGORIAS, PRODUTO_STATUS,
  PLANO_RECORRENCIA, PLANO_STATUS,
  validateEmpresa, validateProduto, validatePlano, validateServico,
  MSG_OBRIGATORIO, MSG_SUCESSO, MSG_DEMO_TAG,
} from "@/lib/demoCrmCrud";

type LogFn = (e: { area: string; acao: string; registro?: string; status?: "ok" | "simulado" | "erro" }) => void;

function FormField({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function LockedBanner({ area }: { area: string }) {
  return (
    <Card className="p-4 border-warning/40 bg-warning/5">
      <div className="flex items-start gap-2 text-xs">
        <Lock className="w-4 h-4 mt-0.5 text-warning" />
        <div>
          <strong>{area} em modo somente leitura.</strong> Seu perfil DEMO não possui permissão para criar, editar ou remover registros nesta área. Ative a permissão em Parametrizações para liberar a edição. {MSG_DEMO_TAG}
        </div>
      </div>
    </Card>
  );
}

function ProdutosMultiSelect({
  produtos, selecionados, onChange, disabled,
}: {
  produtos: { id: string; nome: string; status?: string }[];
  selecionados: string[]; onChange: (next: string[]) => void; disabled?: boolean;
}) {
  if (produtos.length === 0) {
    return <p className="text-[11px] text-muted-foreground">Nenhum produto cadastrado para vincular. Crie um produto antes.</p>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2 border rounded-md max-h-44 overflow-y-auto">
      {produtos.map((p) => {
        const checked = selecionados.includes(p.nome);
        return (
          <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={(v) => {
                const next = v ? [...selecionados, p.nome] : selecionados.filter((n) => n !== p.nome);
                onChange(next);
              }}
            />
            <span>{p.nome}</span>
            {p.status && p.status !== "Ativo" && <Badge variant="outline" className="text-[10px]">{p.status}</Badge>}
          </label>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// EMPRESAS
// ────────────────────────────────────────────────────────────────────────────

export interface EmpresaRecord {
  id: string; razaoSocial: string; cnpj: string; segmento: string;
  nomeFantasia?: string; porte?: string; responsavel?: string;
  whatsapp?: string; email?: string; cidade?: string; estado?: string;
  modulosInteresse?: string[]; produtosVinculados?: string[];
  status?: string; observacoes?: string;
}

const EMPRESA_INIT: Partial<EmpresaRecord> = {
  razaoSocial: "", cnpj: "", segmento: "Outro", porte: "Pequena empresa",
  responsavel: "Comercial Demo", status: "Prospect", modulosInteresse: [], produtosVinculados: [],
};

export function EmpresasPanel({
  empresas, setEmpresas, produtos = [], onLog, exigirResponsavel, podeEditar = true,
}: {
  empresas: EmpresaRecord[]; setEmpresas: React.Dispatch<React.SetStateAction<EmpresaRecord[]>>;
  produtos?: { id: string; nome: string; status?: string }[];
  onLog: LogFn; exigirResponsavel?: boolean; podeEditar?: boolean;
}) {
  const [form, setForm] = useState<Partial<EmpresaRecord>>(EMPRESA_INIT);
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() { setForm(EMPRESA_INIT); setEditing(null); setErrors({}); }

  function persist() {
    if (!podeEditar) { toast.error("Sem permissão para editar Empresas."); return; }
    const r = validateEmpresa(
      { razaoSocial: form.razaoSocial, email: form.email, whatsapp: form.whatsapp,
        status: form.status as never, porte: form.porte as never, responsavel: form.responsavel ?? "" },
      { exigirResponsavel },
    );
    const novosProdutos = (form.produtosVinculados ?? []).filter(Boolean);
    const invalidos = novosProdutos.filter((n) => !produtos.some((p) => p.nome === n));
    if (invalidos.length > 0) {
      r.errors.produtosVinculados = `Produtos não encontrados: ${invalidos.join(", ")}`;
      r.ok = false;
    }
    setErrors(r.errors);
    if (!r.ok) { toast.error(MSG_OBRIGATORIO); return; }
    if (editing) {
      const antes = empresas.find((e) => e.id === editing);
      setEmpresas((prev) => prev.map((e) => e.id === editing ? { ...e, ...form, id: editing } as EmpresaRecord : e));
      onLog({ area: "Empresas", acao: "Editou empresa", registro: form.razaoSocial });
      if (antes) {
        const add = novosProdutos.filter((p) => !(antes.produtosVinculados ?? []).includes(p));
        const rem = (antes.produtosVinculados ?? []).filter((p) => !novosProdutos.includes(p));
        if (add.length) onLog({ area: "Empresas", acao: `Vinculou produto(s): ${add.join(", ")}`, registro: form.razaoSocial });
        if (rem.length) onLog({ area: "Empresas", acao: `Removeu vínculo de produto(s): ${rem.join(", ")}`, registro: form.razaoSocial });
      }
      toast.success(MSG_SUCESSO);
    } else {
      const nova: EmpresaRecord = {
        id: uid("emp"),
        razaoSocial: form.razaoSocial!,
        cnpj: form.cnpj ?? "—",
        segmento: form.segmento ?? "Outro",
        ...form,
        produtosVinculados: novosProdutos,
      } as EmpresaRecord;
      setEmpresas((prev) => [nova, ...prev]);
      onLog({ area: "Empresas", acao: "Criou empresa", registro: nova.razaoSocial });
      if (novosProdutos.length) onLog({ area: "Empresas", acao: `Vinculou produto(s): ${novosProdutos.join(", ")}`, registro: nova.razaoSocial });
      toast.success(`Empresa cadastrada. ${MSG_DEMO_TAG}`);
    }
    reset();
  }

  function remove(id: string) {
    if (!podeEditar) { toast.error("Sem permissão para remover Empresas."); return; }
    const e = empresas.find((x) => x.id === id);
    setEmpresas((prev) => prev.filter((x) => x.id !== id));
    onLog({ area: "Empresas", acao: "Removeu empresa demo", registro: e?.razaoSocial });
  }

  return (
    <div className="space-y-4">
      {!podeEditar && <LockedBanner area="Empresas" />}
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold">{editing ? "Editar empresa" : "Nova empresa"}</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Cadastre empresas para organizar oportunidades B2B, contatos, módulos de interesse, histórico comercial e relacionamento.
            </p>
          </div>
          {editing && <Button size="sm" variant="ghost" onClick={reset}><X className="w-4 h-4 mr-1" />Cancelar edição</Button>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField label="Razão social*" error={errors.razaoSocial}>
            <Input value={form.razaoSocial ?? ""} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
          </FormField>
          <FormField label="Nome fantasia">
            <Input value={form.nomeFantasia ?? ""} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} />
          </FormField>
          <FormField label="CNPJ">
            <Input value={form.cnpj ?? ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </FormField>
          <FormField label="Segmento">
            <Select value={form.segmento ?? ""} onValueChange={(v) => setForm({ ...form, segmento: v })}>
              <SelectTrigger><SelectValue placeholder="Segmento" /></SelectTrigger>
              <SelectContent>{EMPRESA_SEGMENTOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Porte*" error={errors.porte}>
            <Select value={form.porte ?? ""} onValueChange={(v) => setForm({ ...form, porte: v })}>
              <SelectTrigger><SelectValue placeholder="Porte" /></SelectTrigger>
              <SelectContent>{EMPRESA_PORTES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Status*" error={errors.status}>
            <Select value={form.status ?? ""} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{EMPRESA_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Responsável" error={errors.responsavel}>
            <Input value={form.responsavel ?? ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
          </FormField>
          <FormField label="WhatsApp" error={errors.whatsapp}>
            <Input value={form.whatsapp ?? ""} placeholder="(11) 90000-0000" onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
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
          <FormField label="Módulos de interesse (separados por vírgula)">
            <Input
              value={(form.modulosInteresse ?? []).join(", ")}
              onChange={(e) => setForm({ ...form, modulosInteresse: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          </FormField>
          <FormField label="Produtos vinculados à empresa" error={errors.produtosVinculados} className="sm:col-span-2 lg:col-span-4">
            <ProdutosMultiSelect
              produtos={produtos}
              selecionados={form.produtosVinculados ?? []}
              onChange={(next) => setForm({ ...form, produtosVinculados: next })}
              disabled={!podeEditar}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Selecione os produtos contratados ou em negociação por esta empresa. Cada alteração gera log DEMO.</p>
          </FormField>
          <FormField label="Observações" className="sm:col-span-2 lg:col-span-4">
            <Textarea value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </FormField>
        </div>
        <Button className="bg-gradient-primary" onClick={persist} disabled={!podeEditar}>
          <Plus className="w-4 h-4 mr-1" />{editing ? "Salvar alterações" : "Nova empresa"}
        </Button>
      </Card>

      <Card className="p-5">
        {empresas.length === 0 ? <p className="text-sm text-muted-foreground">Sem empresas cadastradas.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Razão social</TableHead><TableHead>CNPJ</TableHead><TableHead>Segmento</TableHead><TableHead>Porte</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {empresas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell><div className="font-medium">{e.razaoSocial}</div><div className="text-xs text-muted-foreground">{e.nomeFantasia ?? ""}</div></TableCell>
                  <TableCell className="text-xs">{e.cnpj}</TableCell>
                  <TableCell>{e.segmento}</TableCell>
                  <TableCell className="text-xs">{e.porte ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{e.status ?? "—"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(e.id); setForm(e); }}><Edit3 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PRODUTOS
// ────────────────────────────────────────────────────────────────────────────

export interface ProdutoRecord {
  id: string; nome: string; preco: number; descricao: string;
  categoria?: string; status?: string; prazoConsumoDias?: number;
  recompraAuto?: boolean; diasAviso1?: number; diasAviso2?: number;
  mensagemRecompra?: string; tags?: string[]; campanhas?: string[];
}

const PRODUTO_INIT: Partial<ProdutoRecord> = {
  nome: "", preco: 0, descricao: "", categoria: "Sistema", status: "Ativo",
  recompraAuto: false, tags: [], campanhas: [],
};

export function ProdutosPanel({
  produtos, setProdutos, onLog, podeEditar = true,
}: {
  produtos: ProdutoRecord[]; setProdutos: React.Dispatch<React.SetStateAction<ProdutoRecord[]>>; onLog: LogFn; podeEditar?: boolean;
}) {
  const [form, setForm] = useState<Partial<ProdutoRecord>>(PRODUTO_INIT);
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() { setForm(PRODUTO_INIT); setEditing(null); setErrors({}); }

  function persist() {
    if (!podeEditar) { toast.error("Sem permissão para editar Produtos."); return; }
    const r = validateProduto({
      nome: form.nome, categoria: form.categoria as never, status: form.status as never,
      valor: form.preco, prazoConsumoDias: form.prazoConsumoDias,
      recompraAuto: form.recompraAuto ?? false,
      diasAviso1: form.diasAviso1, diasAviso2: form.diasAviso2,
    });
    setErrors(r.errors);
    if (!r.ok) { toast.error(MSG_OBRIGATORIO); return; }
    if (editing) {
      setProdutos((prev) => prev.map((p) => p.id === editing ? { ...p, ...form, id: editing } as ProdutoRecord : p));
      onLog({ area: "Produtos", acao: "Editou produto", registro: form.nome });
      toast.success(MSG_SUCESSO);
    } else {
      const novo: ProdutoRecord = {
        id: uid("pr"),
        nome: form.nome!,
        preco: Number(form.preco ?? 0),
        descricao: form.descricao ?? "",
        categoria: form.categoria, status: form.status,
        prazoConsumoDias: form.prazoConsumoDias,
        recompraAuto: form.recompraAuto ?? false,
        diasAviso1: form.diasAviso1, diasAviso2: form.diasAviso2,
        mensagemRecompra: form.mensagemRecompra,
        tags: form.tags ?? [], campanhas: form.campanhas ?? [],
      };
      setProdutos((prev) => [novo, ...prev]);
      onLog({ area: "Produtos", acao: "Criou produto", registro: novo.nome });
      toast.success(`Produto criado. ${MSG_DEMO_TAG}`);
    }
    reset();
  }

  function toggleStatus(id: string) {
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, status: p.status === "Ativo" ? "Inativo" : "Ativo" } : p));
    const p = produtos.find((x) => x.id === id);
    onLog({ area: "Produtos", acao: "Alternou status do produto", registro: p?.nome });
  }

  function remove(id: string) {
    if (!podeEditar) { toast.error("Sem permissão para remover Produtos."); return; }
    const p = produtos.find((x) => x.id === id);
    setProdutos((prev) => prev.filter((x) => x.id !== id));
    onLog({ area: "Produtos", acao: "Removeu produto demo", registro: p?.nome });
  }

  return (
    <div className="space-y-4">
      {!podeEditar && <LockedBanner area="Produtos" />}
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold">{editing ? "Editar produto" : "Novo produto"}</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Cadastre produtos ou serviços para vincular leads, planos, campanhas, recompras e automações comerciais.
            </p>
          </div>
          {editing && <Button size="sm" variant="ghost" onClick={reset}><X className="w-4 h-4 mr-1" />Cancelar edição</Button>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField label="Nome*" error={errors.nome}>
            <Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="Categoria*" error={errors.categoria}>
            <Select value={form.categoria ?? ""} onValueChange={(v) => setForm({ ...form, categoria: v })}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>{PRODUTO_CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Status*" error={errors.status}>
            <Select value={form.status ?? ""} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{PRODUTO_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Valor (R$)*" error={errors.valor}>
            <Input type="number" min={0} value={form.preco ?? 0} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} />
          </FormField>
          <FormField label="Prazo médio de consumo (dias)" error={errors.prazoConsumoDias}>
            <Input type="number" min={0} step={1} value={form.prazoConsumoDias ?? ""} onChange={(e) => setForm({ ...form, prazoConsumoDias: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </FormField>
          <div className="flex items-end gap-2">
            <Switch checked={form.recompraAuto ?? false} onCheckedChange={(v) => setForm({ ...form, recompraAuto: v })} />
            <Label className="text-xs">Ativar recompra automática</Label>
          </div>
          {form.recompraAuto && (
            <>
              <FormField label="Dias antes — aviso 1" error={errors.diasAviso1}>
                <Input type="number" min={0} step={1} value={form.diasAviso1 ?? ""} onChange={(e) => setForm({ ...form, diasAviso1: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </FormField>
              <FormField label="Dias antes — aviso 2" error={errors.diasAviso2}>
                <Input type="number" min={0} step={1} value={form.diasAviso2 ?? ""} onChange={(e) => setForm({ ...form, diasAviso2: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </FormField>
              <FormField label="Mensagem de recompra" className="sm:col-span-2 lg:col-span-4">
                <Textarea value={form.mensagemRecompra ?? ""} onChange={(e) => setForm({ ...form, mensagemRecompra: e.target.value })} />
              </FormField>
            </>
          )}
          <FormField label="Descrição" className="sm:col-span-2 lg:col-span-4">
            <Textarea value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </FormField>
          <FormField label="Tags relacionadas (vírgula)">
            <Input value={(form.tags ?? []).join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </FormField>
          <FormField label="Campanhas relacionadas (vírgula)">
            <Input value={(form.campanhas ?? []).join(", ")} onChange={(e) => setForm({ ...form, campanhas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </FormField>
        </div>
        <Button className="bg-gradient-primary" onClick={persist} disabled={!podeEditar}>
          <Plus className="w-4 h-4 mr-1" />{editing ? "Salvar alterações" : "Novo produto"}
        </Button>
      </Card>

      <Card className="p-5">
        {produtos.length === 0 ? <p className="text-sm text-muted-foreground">Sem produtos.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead><TableHead>Prazo</TableHead><TableHead>Recompra</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {produtos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><div className="font-medium">{p.nome}</div><div className="text-xs text-muted-foreground">{p.descricao}</div></TableCell>
                  <TableCell className="text-xs">{p.categoria ?? "—"}</TableCell>
                  <TableCell>{Number(p.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-xs">{p.prazoConsumoDias ? `${p.prazoConsumoDias} dias` : "—"}</TableCell>
                  <TableCell className="text-xs">{p.recompraAuto ? `D-${p.diasAviso1 ?? 0} / D-${p.diasAviso2 ?? 0}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline">{p.status ?? "—"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(p.id)}><Power className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(p.id); setForm(p); }}><Edit3 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PLANOS
// ────────────────────────────────────────────────────────────────────────────

export interface PlanoRecord {
  id: string; nome: string; preco: number; ciclo: string; itens: string[];
  descricao?: string; valorSetup?: number; recorrencia?: string;
  contratoMinDias?: number; mensalidadesMinimas?: number;
  permiteAdicionais?: boolean; valorPorAdicional?: number;
  produtosIncluidos?: string[];
  status?: string; observacoes?: string;
}

const PLANO_INIT: Partial<PlanoRecord> = {
  nome: "", preco: 0, ciclo: "mensal", itens: [], descricao: "",
  valorSetup: 0, recorrencia: "Mensal", contratoMinDias: 90, mensalidadesMinimas: 3,
  permiteAdicionais: false, status: "Ativo", produtosIncluidos: [],
};

const RECORRENCIA_MULTIPLIER: Record<string, number> = {
  Mensal: 1, Trimestral: 3, Semestral: 6, Anual: 12,
};

export function PlanosPanel({
  planos, setPlanos, clientes, produtos = [], onLog, podeEditar = true,
}: {
  planos: PlanoRecord[]; setPlanos: React.Dispatch<React.SetStateAction<PlanoRecord[]>>;
  clientes: { id: string; planoInteresse?: string; plano?: string }[];
  produtos?: { id: string; nome: string; status?: string }[];
  onLog: LogFn; podeEditar?: boolean;
}) {
  const [form, setForm] = useState<Partial<PlanoRecord>>(PLANO_INIT);
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() { setForm(PLANO_INIT); setEditing(null); setErrors({}); }

  function persist() {
    if (!podeEditar) { toast.error("Sem permissão para editar Planos."); return; }
    const r = validatePlano({
      nome: form.nome, recorrencia: form.recorrencia as never, status: form.status as never,
      valorMensal: form.preco, valorSetup: form.valorSetup,
      contratoMinDias: form.contratoMinDias, mensalidadesMinimas: form.mensalidadesMinimas,
      permiteAdicionais: form.permiteAdicionais ?? false, valorPorAdicional: form.valorPorAdicional,
    });
    const novosProdutos = (form.produtosIncluidos ?? []).filter(Boolean);
    const invalidos = novosProdutos.filter((n) => !produtos.some((p) => p.nome === n));
    if (invalidos.length > 0) {
      r.errors.produtosIncluidos = `Produtos não encontrados: ${invalidos.join(", ")}`;
      r.ok = false;
    }
    setErrors(r.errors);
    if (!r.ok) { toast.error(MSG_OBRIGATORIO); return; }
    if (editing) {
      const antes = planos.find((p) => p.id === editing);
      setPlanos((prev) => prev.map((p) => p.id === editing ? { ...p, ...form, id: editing } as PlanoRecord : p));
      onLog({ area: "Planos", acao: "Editou plano", registro: form.nome });
      if (antes) {
        const add = novosProdutos.filter((n) => !(antes.produtosIncluidos ?? []).includes(n));
        const rem = (antes.produtosIncluidos ?? []).filter((n) => !novosProdutos.includes(n));
        if (add.length) onLog({ area: "Planos", acao: `Incluiu produto(s) como módulo(s): ${add.join(", ")}`, registro: form.nome });
        if (rem.length) onLog({ area: "Planos", acao: `Removeu produto(s) do plano: ${rem.join(", ")}`, registro: form.nome });
      }
      toast.success(MSG_SUCESSO);
    } else {
      const novo: PlanoRecord = {
        id: uid("pl"),
        nome: form.nome!,
        preco: Number(form.preco ?? 0),
        ciclo: form.ciclo ?? "mensal",
        itens: form.itens ?? [],
        descricao: form.descricao,
        valorSetup: Number(form.valorSetup ?? 0),
        recorrencia: form.recorrencia,
        contratoMinDias: form.contratoMinDias ?? 90,
        mensalidadesMinimas: form.mensalidadesMinimas ?? 3,
        permiteAdicionais: form.permiteAdicionais ?? false,
        valorPorAdicional: form.valorPorAdicional,
        produtosIncluidos: novosProdutos,
        status: form.status, observacoes: form.observacoes,
      };
      setPlanos((prev) => [novo, ...prev]);
      onLog({ area: "Planos", acao: "Criou plano", registro: novo.nome });
      if (novosProdutos.length) onLog({ area: "Planos", acao: `Incluiu produto(s) como módulo(s): ${novosProdutos.join(", ")}`, registro: novo.nome });
      toast.success(`Plano criado. ${MSG_DEMO_TAG}`);
    }
    reset();
  }

  function toggleStatus(id: string) {
    if (!podeEditar) { toast.error("Sem permissão para alterar Planos."); return; }
    setPlanos((prev) => prev.map((p) => p.id === id ? { ...p, status: p.status === "Ativo" ? "Inativo" : "Ativo" } : p));
    const p = planos.find((x) => x.id === id);
    onLog({ area: "Planos", acao: "Alternou status do plano", registro: p?.nome });
  }

  function remove(id: string) {
    if (!podeEditar) { toast.error("Sem permissão para remover Planos."); return; }
    const p = planos.find((x) => x.id === id);
    setPlanos((prev) => prev.filter((x) => x.id !== id));
    onLog({ area: "Planos", acao: "Removeu plano demo", registro: p?.nome });
  }

  function clientesVinculados(planoNome: string) {
    return clientes.filter((c) => c.planoInteresse === planoNome || c.plano === planoNome).length;
  }
  function receitaPorPeriodo(p: PlanoRecord, meses: number) {
    return clientesVinculados(p.nome) * (p.preco ?? 0) * meses;
  }
  function valorMinimoContrato(p: PlanoRecord) {
    return (p.valorSetup ?? 0) + (p.preco ?? 0) * (p.mensalidadesMinimas ?? 0);
  }

  const fmt = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-4">
      {!podeEditar && <LockedBanner area="Planos" />}
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold">{editing ? "Editar plano" : "Novo plano"}</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Configure planos comerciais, recorrência, setup, contrato mínimo, módulos incluídos e regras de contratação.
            </p>
            <p className="text-[11px] text-warning mt-1">
              A contratação real dos planos pode exigir aceite de contrato, pagamento do setup e permanência mínima conforme regra comercial configurada.
            </p>
          </div>
          {editing && <Button size="sm" variant="ghost" onClick={reset}><X className="w-4 h-4 mr-1" />Cancelar edição</Button>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField label="Nome*" error={errors.nome}>
            <Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="Recorrência*" error={errors.recorrencia}>
            <Select value={form.recorrencia ?? ""} onValueChange={(v) => setForm({ ...form, recorrencia: v })}>
              <SelectTrigger><SelectValue placeholder="Recorrência" /></SelectTrigger>
              <SelectContent>{PLANO_RECORRENCIA.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Status*" error={errors.status}>
            <Select value={form.status ?? ""} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{PLANO_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Valor mensal (R$)*" error={errors.valorMensal}>
            <Input type="number" min={0} value={form.preco ?? 0} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} />
          </FormField>
          <FormField label="Valor de setup (R$)*" error={errors.valorSetup}>
            <Input type="number" min={0} value={form.valorSetup ?? 0} onChange={(e) => setForm({ ...form, valorSetup: Number(e.target.value) })} />
          </FormField>
          <FormField label="Contrato mínimo (dias)" error={errors.contratoMinDias}>
            <Input type="number" min={0} step={1} value={form.contratoMinDias ?? 90} onChange={(e) => setForm({ ...form, contratoMinDias: Number(e.target.value) })} />
          </FormField>
          <FormField label="Mensalidades mínimas" error={errors.mensalidadesMinimas}>
            <Input type="number" min={0} step={1} value={form.mensalidadesMinimas ?? 3} onChange={(e) => setForm({ ...form, mensalidadesMinimas: Number(e.target.value) })} />
          </FormField>
          <div className="flex items-end gap-2">
            <Switch checked={form.permiteAdicionais ?? false} onCheckedChange={(v) => setForm({ ...form, permiteAdicionais: v })} />
            <Label className="text-xs">Permite módulos adicionais</Label>
          </div>
          {form.permiteAdicionais && (
            <FormField label="Valor por módulo adicional (R$)" error={errors.valorPorAdicional}>
              <Input type="number" min={0} value={form.valorPorAdicional ?? 0} onChange={(e) => setForm({ ...form, valorPorAdicional: Number(e.target.value) })} />
            </FormField>
          )}
          <FormField label="Produtos incluídos no plano (módulos)" error={errors.produtosIncluidos} className="sm:col-span-2 lg:col-span-4">
            <ProdutosMultiSelect
              produtos={produtos}
              selecionados={form.produtosIncluidos ?? []}
              onChange={(next) => setForm({ ...form, produtosIncluidos: next })}
              disabled={!podeEditar}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Vincule produtos como módulos deste plano. Cada inclusão ou remoção gera log DEMO.</p>
          </FormField>
          <FormField label="Outros itens incluídos (texto livre, vírgula)" className="sm:col-span-2 lg:col-span-4">
            <Input value={(form.itens ?? []).join(", ")} onChange={(e) => setForm({ ...form, itens: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </FormField>
          <FormField label="Descrição" className="sm:col-span-2 lg:col-span-4">
            <Textarea value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </FormField>
        </div>
        <Button className="bg-gradient-primary" onClick={persist} disabled={!podeEditar}>
          <Plus className="w-4 h-4 mr-1" />{editing ? "Salvar alterações" : "Novo plano"}
        </Button>
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        {planos.map((p) => {
          const vinc = clientesVinculados(p.nome);
          const mult = RECORRENCIA_MULTIPLIER[p.recorrencia ?? "Mensal"] ?? 1;
          const alertaContrato = (p.contratoMinDias ?? 0) < 90;
          const alertaMensalidades = (p.mensalidadesMinimas ?? 0) < 3;
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{p.nome}</div>
                  <div className="text-xs text-muted-foreground">{p.recorrencia ?? p.ciclo}</div>
                </div>
                <Badge variant="outline">{p.status ?? "Ativo"}</Badge>
              </div>
              <div className="text-2xl font-bold mt-2">
                {fmt(p.preco)}
                <span className="text-xs text-muted-foreground font-normal">/{p.ciclo}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Setup {fmt(p.valorSetup ?? 0)} • Contrato mín. {p.contratoMinDias ?? 90} dias • {p.mensalidadesMinimas ?? 3} mensalidades obrigatórias
              </div>
              {(alertaContrato || alertaMensalidades) && (
                <div className="mt-2 text-[11px] text-warning flex items-start gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                  <span>
                    {alertaContrato && "Contrato mínimo abaixo de 90 dias. "}
                    {alertaMensalidades && "Menos de 3 mensalidades obrigatórias. "}
                    Verifique a regra comercial do plano.
                  </span>
                </div>
              )}
              {(p.produtosIncluidos ?? []).length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Produtos/módulos</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(p.produtosIncluidos ?? []).map((n) => <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>)}
                  </div>
                </div>
              )}
              {p.itens.length > 0 && (
                <ul className="text-xs text-muted-foreground mt-3 space-y-1">{p.itens.map((it, i) => <li key={i}>• {it}</li>)}</ul>
              )}
              <div className="mt-3 p-2 rounded border bg-muted/30 text-[11px] space-y-0.5">
                <div><strong>{vinc}</strong> cliente(s) vinculado(s)</div>
                <div>Valor mínimo de contrato: <strong>{fmt(valorMinimoContrato(p))}</strong></div>
                <div>Receita prevista/mês: <strong>{fmt(receitaPorPeriodo(p, 1))}</strong></div>
                <div>Receita por ciclo ({mult}m): <strong>{fmt(receitaPorPeriodo(p, mult))}</strong></div>
                <div>Receita prevista 12 meses: <strong>{fmt(receitaPorPeriodo(p, 12))}</strong></div>
              </div>
              <div className="flex gap-1 mt-3">
                <Button size="sm" variant="outline" onClick={() => toggleStatus(p.id)} disabled={!podeEditar}><Power className="w-3.5 h-3.5 mr-1" />Ativar/Inativar</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(p.id); setForm(p); }} disabled={!podeEditar}><Edit3 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)} disabled={!podeEditar}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SERVIÇOS
// ────────────────────────────────────────────────────────────────────────────

export interface ServicoRecord {
  id: string; nome: string; preco: number; duracao: string;
  descricao?: string; prazoEntregaDias?: number;
  produtoRelacionado?: string; planoRelacionado?: string;
  responsavel?: string; ativo?: boolean; observacoes?: string;
}

const SERVICO_INIT: Partial<ServicoRecord> = {
  nome: "", preco: 0, duracao: "", descricao: "", prazoEntregaDias: 5,
  ativo: true, responsavel: "Operações Demo",
};

export function ServicosPanel({
  servicos, setServicos, produtos, planos, onLog, exigirResponsavel, podeEditar = true,
}: {
  servicos: ServicoRecord[]; setServicos: React.Dispatch<React.SetStateAction<ServicoRecord[]>>;
  produtos: { id: string; nome: string }[]; planos: { id: string; nome: string }[];
  onLog: LogFn; exigirResponsavel?: boolean; podeEditar?: boolean;
}) {
  const [form, setForm] = useState<Partial<ServicoRecord>>(SERVICO_INIT);
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() { setForm(SERVICO_INIT); setEditing(null); setErrors({}); }

  function persist() {
    if (!podeEditar) { toast.error("Sem permissão para editar Serviços."); return; }

    const r = validateServico(
      { nome: form.nome, valor: form.preco, prazoEntregaDias: form.prazoEntregaDias, responsavel: form.responsavel ?? "" },
      { exigirResponsavel },
    );
    setErrors(r.errors);
    if (!r.ok) { toast.error(MSG_OBRIGATORIO); return; }
    if (editing) {
      setServicos((prev) => prev.map((s) => s.id === editing ? { ...s, ...form, id: editing } as ServicoRecord : s));
      onLog({ area: "Serviços", acao: "Editou serviço", registro: form.nome });
      toast.success(MSG_SUCESSO);
    } else {
      const novo: ServicoRecord = {
        id: uid("sv"),
        nome: form.nome!,
        preco: Number(form.preco ?? 0),
        duracao: form.duracao ?? "",
        descricao: form.descricao,
        prazoEntregaDias: form.prazoEntregaDias,
        produtoRelacionado: form.produtoRelacionado,
        planoRelacionado: form.planoRelacionado,
        responsavel: form.responsavel,
        ativo: form.ativo ?? true,
        observacoes: form.observacoes,
      };
      setServicos((prev) => [novo, ...prev]);
      onLog({ area: "Serviços", acao: "Criou serviço", registro: novo.nome });
      toast.success(`Serviço criado. ${MSG_DEMO_TAG}`);
    }
    reset();
  }

  function toggleStatus(id: string) {
    if (!podeEditar) { toast.error("Sem permissão para alterar Serviços."); return; }
    setServicos((prev) => prev.map((s) => s.id === id ? { ...s, ativo: !(s.ativo ?? true) } : s));
    const s = servicos.find((x) => x.id === id);
    onLog({ area: "Serviços", acao: "Alternou status do serviço", registro: s?.nome });
  }

  function remove(id: string) {
    if (!podeEditar) { toast.error("Sem permissão para remover Serviços."); return; }
    const s = servicos.find((x) => x.id === id);
    setServicos((prev) => prev.filter((x) => x.id !== id));
    onLog({ area: "Serviços", acao: "Removeu serviço demo", registro: s?.nome });
  }

  return (
    <div className="space-y-4">
      {!podeEditar && <LockedBanner area="Serviços" />}
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold">{editing ? "Editar serviço" : "Novo serviço"}</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Cadastre serviços para organizar entregas, prazos, responsáveis, planos relacionados e comunicações automáticas.
            </p>
          </div>
          {editing && <Button size="sm" variant="ghost" onClick={reset}><X className="w-4 h-4 mr-1" />Cancelar edição</Button>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField label="Nome*" error={errors.nome}>
            <Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="Valor (R$)*" error={errors.valor}>
            <Input type="number" min={0} value={form.preco ?? 0} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} />
          </FormField>
          <FormField label="Prazo de entrega (dias)" error={errors.prazoEntregaDias}>
            <Input type="number" min={0} step={1} value={form.prazoEntregaDias ?? ""} onChange={(e) => setForm({ ...form, prazoEntregaDias: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </FormField>
          <FormField label="Duração estimada">
            <Input value={form.duracao ?? ""} placeholder="ex.: 5 dias úteis" onChange={(e) => setForm({ ...form, duracao: e.target.value })} />
          </FormField>
          <FormField label="Responsável" error={errors.responsavel}>
            <Input value={form.responsavel ?? ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
          </FormField>
          <FormField label="Produto relacionado">
            <Select value={form.produtoRelacionado ?? ""} onValueChange={(v) => setForm({ ...form, produtoRelacionado: v })}>
              <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
              <SelectContent>
                {produtos.length === 0 && <SelectItem value="—">Sem produtos</SelectItem>}
                {produtos.map((p) => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Plano relacionado">
            <Select value={form.planoRelacionado ?? ""} onValueChange={(v) => setForm({ ...form, planoRelacionado: v })}>
              <SelectTrigger><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                {planos.length === 0 && <SelectItem value="—">Sem planos</SelectItem>}
                {planos.map((p) => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex items-end gap-2">
            <Switch checked={form.ativo ?? true} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            <Label className="text-xs">Serviço ativo</Label>
          </div>
          <FormField label="Descrição" className="sm:col-span-2 lg:col-span-4">
            <Textarea value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </FormField>
        </div>
        <Button className="bg-gradient-primary" onClick={persist}>
          <Plus className="w-4 h-4 mr-1" />{editing ? "Salvar alterações" : "Novo serviço"}
        </Button>
      </Card>

      <Card className="p-5">
        {servicos.length === 0 ? <p className="text-sm text-muted-foreground">Sem serviços.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Valor</TableHead><TableHead>Prazo</TableHead><TableHead>Responsável</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {servicos.map((s) => (
                <TableRow key={s.id}>
                  <TableCell><div className="font-medium">{s.nome}</div><div className="text-xs text-muted-foreground">{s.descricao ?? ""}</div></TableCell>
                  <TableCell>{Number(s.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-xs">{s.prazoEntregaDias ? `${s.prazoEntregaDias} dias` : (s.duracao ?? "—")}</TableCell>
                  <TableCell className="text-xs">{s.responsavel ?? "—"}</TableCell>
                  <TableCell><Badge variant={s.ativo === false ? "outline" : "default"}>{s.ativo === false ? "Inativo" : "Ativo"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(s.id)}><Power className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(s.id); setForm(s); }}><Edit3 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
