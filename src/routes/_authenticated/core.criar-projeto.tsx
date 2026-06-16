import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  createProjectFromFactory,
  listInstallableModules,
  listSiteTemplates,
  listBillingPlansForFactory,
} from "@/lib/factory.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEGMENT_LABELS, type SegmentKey } from "@/data/moduleSegmentTemplates";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Rocket, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/criar-projeto")({
  head: () => ({ meta: [{ title: "Criar Projeto — Fábrica de Projetos" }] }),
  component: CriarProjetoPage,
});

const NICHES = [
  "Clínica / Consultório",
  "Bar / Restaurante",
  "Microcervejaria",
  "Jurídico",
  "Estética",
  "Fitness / Academia",
  "Eventos / WMP",
  "Serviços profissionais",
  "Delivery",
  "E-commerce",
  "White Label",
  "Genérico",
];

type Step = 1 | 2 | 3 | 4;

type PlanForm = {
  planId?: string;
  setupAmount?: number;
  recurringAmount?: number;
  dueDay?: number;
  setupPaid: boolean;
  pixKey: string;
  generateFirstInvoice: boolean;
};

type AdminForm = {
  email: string;
  name: string;
  phone: string;
  sendWelcome: boolean;
};

type ClientForm = {
  existingCompanyId?: string;
  name: string;
  tradeName: string;
  legalName: string;
  ownerName: string;
  whatsapp: string;
  email: string;
  document: string;
  segment: string;
  notes: string;
};

type ProjectForm = {
  name: string;
  niche: string;
  environment: "demo" | "teste" | "real";
  domain: string;
  subdomain: string;
  internalOwner: string;
  clientOwner: string;
  status: string;
};

function CriarProjetoPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [client, setClient] = useState<ClientForm>({
    name: "", tradeName: "", legalName: "", ownerName: "", whatsapp: "", email: "",
    document: "", segment: "", notes: "",
  });
  const [project, setProject] = useState<ProjectForm>({
    name: "", niche: "", environment: "real", domain: "", subdomain: "",
    internalOwner: "", clientOwner: "", status: "active",
  });
  const [modelKind, setModelKind] = useState<"template" | "clone" | "empty" | "demo-base" | "module-base" | "combo">("empty");
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [sourceCompanyId, setSourceCompanyId] = useState<string | undefined>();
  const [preset, setPreset] = useState<SegmentKey>("default");
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    agendamento_online: true, whatsapp: true, email: true, pagamentos: false,
    voip: false, dashboard: true, logs_avancados: false, area_cliente: true,
    permissoes_padrao: true, modelos_mensagens: true, automacoes_padrao: true,
  });
  const [confirm, setConfirm] = useState(false);
  const [plan, setPlan] = useState<PlanForm>({
    setupPaid: false,
    pixKey: "",
    generateFirstInvoice: true,
  });
  const [admin, setAdmin] = useState<AdminForm>({
    email: "",
    name: "",
    phone: "",
    sendWelcome: true,
  });
  const [result, setResult] = useState<null | { companyId: string; generationId: string | null; installed: string[]; failed: { slug: string; reason: string }[]; contractId?: string | null; firstInvoiceId?: string | null; adminUserId?: string | null }>(null);

  // Search existing companies by document/name
  const { data: searchData } = useQuery({
    queryKey: ["criar-projeto-search", client.document || client.name],
    enabled: !client.existingCompanyId && (client.document.length >= 3 || client.name.length >= 3),
    queryFn: async () => {
      let q = supabase.from("companies").select("id, name, trade_name, document, environment").eq("is_master", false).limit(8);
      if (client.document.length >= 3) q = q.ilike("document", `%${client.document}%`);
      else q = q.ilike("name", `%${client.name}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const listModulesFn = useServerFn(listInstallableModules);
  const { data: modulesData } = useQuery({
    queryKey: ["factory-modules"],
    queryFn: () => listModulesFn(),
  });
  const listTemplatesFn = useServerFn(listSiteTemplates);
  const { data: templatesData } = useQuery({
    queryKey: ["factory-templates"],
    queryFn: () => listTemplatesFn(),
    enabled: modelKind === "template",
  });
  const listPlansFn = useServerFn(listBillingPlansForFactory);
  const { data: plansData } = useQuery({
    queryKey: ["factory-plans"],
    queryFn: () => listPlansFn(),
  });

  const createFn = useServerFn(createProjectFromFactory);
  const createMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          client,
          project,
          model: { kind: modelKind, templateId, sourceCompanyId },
          modules: Array.from(selectedModules).map((slug) => ({ slug, segment: preset })),
          toggles,
          plan: plan.planId
            ? {
                planId: plan.planId,
                setupAmount: plan.setupAmount,
                recurringAmount: plan.recurringAmount,
                dueDay: plan.dueDay,
                setupPaid: plan.setupPaid,
                pixKey: plan.pixKey || undefined,
                generateFirstInvoice: plan.generateFirstInvoice,
              }
            : undefined,
          adminUser: {
            email: admin.email || client.email || undefined,
            name: admin.name || client.ownerName || undefined,
            phone: admin.phone || client.whatsapp || undefined,
            sendWelcome: admin.sendWelcome,
          },
          confirm: true,
        },
      }),
    onSuccess: (r) => {
      setResult(r);
      toast.success("Projeto criado com sucesso!");
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao criar projeto"),
  });

  const canNextFrom1 = client.name.trim().length > 0;
  const canNextFrom2 = project.name.trim().length > 0;

  const reuseCompany = (c: { id: string; name: string; trade_name: string | null; document: string | null }) => {
    setClient((s) => ({
      ...s,
      existingCompanyId: c.id,
      name: c.name,
      tradeName: c.trade_name ?? "",
      document: c.document ?? "",
    }));
    toast.info("Cliente existente reutilizado — campos não preenchidos serão complementados.");
  };

  if (result) return <SuccessScreen result={result} onReset={() => navigate({ to: "/core/criar-projeto" })} />;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Criar Projeto — Fábrica de Projetos
          </h1>
          <p className="text-sm text-muted-foreground">Sem prompt de IA. Sem consumir crédito. Estrutura criada com módulos certificados.</p>
        </div>
        <Link to="/core/nova-implantacao" className="text-xs text-muted-foreground hover:underline">via prompt de IA →</Link>
      </div>

      <Stepper step={step} />

      {step === 1 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Etapa 1 — Cliente + Projeto</h2>
          {client.existingCompanyId && (
            <div className="text-xs bg-amber-500/10 border border-amber-500/40 rounded p-2 text-amber-900 dark:text-amber-300">
              Reutilizando cliente existente. Campos vazios serão complementados sem sobrescrever os existentes.
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Nome / Razão social *">
              <Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
            </Field>
            <Field label="Nome fantasia">
              <Input value={client.tradeName} onChange={(e) => setClient({ ...client, tradeName: e.target.value })} />
            </Field>
            <Field label="CPF/CNPJ">
              <div className="relative">
                <Input value={client.document} onChange={(e) => setClient({ ...client, document: e.target.value })} placeholder="apenas números" />
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>
            <Field label="Responsável">
              <Input value={client.ownerName} onChange={(e) => setClient({ ...client, ownerName: e.target.value })} />
            </Field>
            <Field label="WhatsApp">
              <Input value={client.whatsapp} onChange={(e) => setClient({ ...client, whatsapp: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <Input value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
            </Field>
            <Field label="Segmento">
              <Input value={client.segment} onChange={(e) => setClient({ ...client, segment: e.target.value })} />
            </Field>
            <Field label="Observações">
              <Textarea rows={2} value={client.notes} onChange={(e) => setClient({ ...client, notes: e.target.value })} />
            </Field>
          </div>

          {(searchData?.length ?? 0) > 0 && !client.existingCompanyId && (
            <div className="border rounded p-2 space-y-1">
              <div className="text-xs text-muted-foreground">Possíveis duplicidades — reutilizar?</div>
              {searchData!.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => reuseCompany(c as never)}
                  className="text-left w-full text-sm px-2 py-1 hover:bg-muted rounded flex justify-between"
                >
                  <span>{c.name} {c.trade_name ? `(${c.trade_name})` : ""}</span>
                  <span className="text-xs text-muted-foreground">{c.document ?? "—"} · {c.environment}</span>
                </button>
              ))}
            </div>
          )}

          <hr className="my-2" />

          <h3 className="font-semibold text-sm">Dados do projeto</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Nome do projeto *">
              <Input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
            </Field>
            <Field label="Nicho">
              <Select value={project.niche} onValueChange={(v) => setProject({ ...project, niche: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ambiente *">
              <Select value={project.environment} onValueChange={(v) => setProject({ ...project, environment: v as ProjectForm["environment"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">DEMO (mocks, sem dados reais)</SelectItem>
                  <SelectItem value="teste">TESTE (validação)</SelectItem>
                  <SelectItem value="real">REAL (produção)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Subdomínio">
              <Input value={project.subdomain} onChange={(e) => setProject({ ...project, subdomain: e.target.value })} placeholder="cliente.impulsionando.com.br" />
            </Field>
            <Field label="Domínio próprio">
              <Input value={project.domain} onChange={(e) => setProject({ ...project, domain: e.target.value })} />
            </Field>
            <Field label="Responsável interno (Impulsionando)">
              <Input value={project.internalOwner} onChange={(e) => setProject({ ...project, internalOwner: e.target.value })} />
            </Field>
            <Field label="Responsável do cliente">
              <Input value={project.clientOwner} onChange={(e) => setProject({ ...project, clientOwner: e.target.value })} />
            </Field>
            <Field label="Status inicial">
              <Select value={project.status} onValueChange={(v) => setProject({ ...project, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button disabled={!canNextFrom1 || !canNextFrom2} onClick={() => setStep(2)}>
              Continuar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Etapa 2 — Modelo + Módulos + Preset</h2>

          <div>
            <Label className="text-xs">Como começar?</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
              {([
                ["empty", "Projeto vazio"],
                ["template", "Template pronto"],
                ["clone", "Clonar projeto existente"],
                ["demo-base", "Usar DEMO como base"],
                ["module-base", "Módulo-base específico"],
                ["combo", "Combinação de módulos"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setModelKind(k)}
                  className={`text-sm rounded border p-2 text-left ${modelKind === k ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              A clonagem copia apenas estrutura, templates, módulos e configurações padrão. Dados reais, credenciais, usuários e informações sensíveis NÃO são copiados.
            </p>
          </div>

          {modelKind === "template" && (
            <Field label="Template">
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Escolha um template…" /></SelectTrigger>
                <SelectContent>
                  {(templatesData?.templates ?? []).map((t: { id: string; name: string; niche: string | null }) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} {t.niche ? `· ${t.niche}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {modelKind === "clone" && (
            <Field label="Projeto fonte">
              <Input placeholder="UUID da empresa-fonte (opcional)" value={sourceCompanyId ?? ""} onChange={(e) => setSourceCompanyId(e.target.value || undefined)} />
            </Field>
          )}

          <div>
            <Label className="text-xs">Preset por nicho (parâmetros padrão)</Label>
            <Select value={preset} onValueChange={(v) => setPreset(v as SegmentKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SEGMENT_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Módulos a instalar</Label>
            <div className="grid md:grid-cols-2 gap-2 mt-1">
              {(modulesData?.modules ?? []).map((m: { id: string; slug: string; name: string; description: string | null; readiness_status: string | null; current_version: string | null; category: string | null }) => {
                const checked = selectedModules.has(m.slug);
                const certified = m.readiness_status === "certificado" || m.readiness_status === "publicado";
                return (
                  <label
                    key={m.id}
                    className={`flex items-start gap-2 border rounded p-2 cursor-pointer ${checked ? "border-primary bg-primary/5" : "hover:bg-muted"} ${!certified ? "opacity-60" : ""}`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!certified}
                      onCheckedChange={(v) => {
                        setSelectedModules((s) => {
                          const next = new Set(s);
                          if (v) next.add(m.slug); else next.delete(m.slug);
                          return next;
                        });
                      }}
                    />
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.name}</span>
                        {certified ? <Badge variant="secondary" className="text-[10px]">{m.readiness_status}</Badge> : <Badge variant="outline" className="text-[10px]">não certificado</Badge>}
                      </div>
                      {m.description && <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {m.category ?? "—"} · v{m.current_version ?? "?"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs">Configurações iniciais</Label>
            <div className="grid md:grid-cols-2 gap-1 mt-1">
              {Object.entries(toggles).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={v} onCheckedChange={(val) => setToggles({ ...toggles, [k]: !!val })} />
                  <span>Ativar {k.replace(/_/g, " ")}?</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => setStep(3)}>Continuar <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Etapa 3 — Plano, Cobrança & Administrador</h2>

          <div>
            <Label className="text-xs">Plano contratado</Label>
            <Select
              value={plan.planId ?? ""}
              onValueChange={(v) => {
                const p = (plansData?.plans ?? []).find((pl: { id: string }) => pl.id === v);
                setPlan((s) => ({
                  ...s,
                  planId: v,
                  setupAmount: p ? Number(p.setup_fee) : undefined,
                  recurringAmount: p ? Number(p.recurring_amount) : undefined,
                  dueDay: p ? p.due_day : undefined,
                }));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione o plano…" /></SelectTrigger>
              <SelectContent>
                {(plansData?.plans ?? []).map((p: { id: string; name: string; recurring_amount: number; setup_fee: number; cycle: string }) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — R$ {Number(p.recurring_amount).toFixed(2)}/{p.cycle === "monthly" ? "mês" : p.cycle}
                    {Number(p.setup_fee) > 0 ? ` · setup R$ ${Number(p.setup_fee).toFixed(2)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">Sem plano? Pule esta seção — você pode contratar depois.</p>
          </div>

          {plan.planId && (
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Mensalidade (R$)">
                <Input
                  type="number"
                  step="0.01"
                  value={plan.recurringAmount ?? ""}
                  onChange={(e) => setPlan({ ...plan, recurringAmount: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="Setup (R$)">
                <Input
                  type="number"
                  step="0.01"
                  value={plan.setupAmount ?? ""}
                  onChange={(e) => setPlan({ ...plan, setupAmount: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="Dia de vencimento">
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={plan.dueDay ?? ""}
                  onChange={(e) => setPlan({ ...plan, dueDay: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="Chave PIX (cobrança)">
                <Input value={plan.pixKey} onChange={(e) => setPlan({ ...plan, pixKey: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <Checkbox checked={plan.setupPaid} onCheckedChange={(v) => setPlan({ ...plan, setupPaid: !!v })} />
                <span>Setup já pago / cortesia</span>
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <Checkbox checked={plan.generateFirstInvoice} onCheckedChange={(v) => setPlan({ ...plan, generateFirstInvoice: !!v })} />
                <span>Gerar 1ª fatura automaticamente</span>
              </label>
            </div>
          )}

          <hr />

          <h3 className="font-semibold text-sm">Usuário Administrador da Empresa</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="E-mail do administrador">
              <Input
                type="email"
                value={admin.email}
                placeholder={client.email || "admin@empresa.com.br"}
                onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
              />
            </Field>
            <Field label="Nome do administrador">
              <Input
                value={admin.name}
                placeholder={client.ownerName || "Nome do responsável"}
                onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={admin.phone}
                placeholder={client.whatsapp || "(00) 00000-0000"}
                onChange={(e) => setAdmin({ ...admin, phone: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm mt-6">
              <Checkbox checked={admin.sendWelcome} onCheckedChange={(v) => setAdmin({ ...admin, sendWelcome: !!v })} />
              <span>Enviar e-mail de boas-vindas com link de acesso</span>
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Se em branco, usaremos o e-mail/nome/whatsapp do cliente da Etapa 1.
            O usuário é criado já vinculado à empresa com o perfil <b>Gestor da Empresa</b>.
          </p>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => setStep(4)}>Continuar <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Etapa 4 — Revisão</h2>
          <Summary client={client} project={project} modelKind={modelKind} preset={preset} modules={Array.from(selectedModules)} toggles={toggles} plan={plan} admin={admin} plansData={plansData?.plans ?? []} />
          <label className="flex items-start gap-2 text-sm bg-muted/40 p-3 rounded">
            <Checkbox checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} className="mt-0.5" />
            <span>Confirmo que desejo criar este projeto e entendo que a estrutura será gerada sem copiar dados reais de outros clientes.</span>
          </label>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button disabled={!confirm || createMut.isPending} onClick={() => createMut.mutate()}>
              {createMut.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Criando…</> : <><Rocket className="w-4 h-4 mr-1" /> Criar Projeto</>}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Cliente + Projeto", "Modelo + Módulos", "Plano & Admin", "Revisão"];
  return (
    <div className="flex gap-2 text-xs">
      {labels.map((l, i) => {
        const idx = (i + 1) as Step;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={l} className={`flex-1 border rounded p-2 ${active ? "border-primary bg-primary/5" : done ? "border-green-500/40" : ""}`}>
            <div className="font-medium">Etapa {idx}</div>
            <div className="text-muted-foreground">{l}</div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Summary({ client, project, modelKind, preset, modules, toggles, plan, admin, plansData }: {
  client: ClientForm; project: ProjectForm; modelKind: string; preset: SegmentKey; modules: string[]; toggles: Record<string, boolean>;
  plan?: PlanForm; admin?: AdminForm; plansData?: Array<{ id: string; name: string; recurring_amount: number; setup_fee: number }>;
}) {
  const selectedPlan = plan?.planId ? plansData?.find((p) => p.id === plan.planId) : undefined;
  return (
    <div className="grid md:grid-cols-2 gap-3 text-sm">
      <Block title="Cliente">
        <b>{client.name}</b>
        <div>{client.tradeName}</div>
        <div className="text-muted-foreground">{client.document}</div>
        <div className="text-muted-foreground">{client.ownerName} · {client.whatsapp} · {client.email}</div>
      </Block>
      <Block title="Projeto">
        <b>{project.name}</b>
        <div>{project.niche} · ambiente <Badge variant="secondary">{project.environment}</Badge></div>
        <div className="text-muted-foreground">{project.subdomain || project.domain || "sem domínio"}</div>
      </Block>
      <Block title="Modelo & Preset">
        <div>Modelo: <b>{modelKind}</b></div>
        <div>Preset: <b>{SEGMENT_LABELS[preset]}</b></div>
      </Block>
      <Block title="Módulos">
        {modules.length === 0 ? <span className="text-muted-foreground">Nenhum</span> : modules.map((m) => <Badge key={m} variant="outline" className="mr-1 mb-1">{m}</Badge>)}
      </Block>
      <Block title="Plano & Cobrança">
        {selectedPlan ? (
          <>
            <b>{selectedPlan.name}</b>
            <div>Mensalidade: R$ {(plan?.recurringAmount ?? Number(selectedPlan.recurring_amount)).toFixed(2)}</div>
            <div>Setup: R$ {(plan?.setupAmount ?? Number(selectedPlan.setup_fee)).toFixed(2)} {plan?.setupPaid ? "(pago)" : ""}</div>
            <div className="text-muted-foreground">Venc. dia {plan?.dueDay ?? "—"} · {plan?.generateFirstInvoice ? "1ª fatura será gerada" : "sem fatura inicial"}</div>
          </>
        ) : <span className="text-muted-foreground">Sem plano (contratar depois)</span>}
      </Block>
      <Block title="Administrador">
        <b>{admin?.name || client.ownerName || "—"}</b>
        <div className="text-muted-foreground">{admin?.email || client.email || "sem e-mail"}</div>
        <div className="text-muted-foreground">{admin?.phone || client.whatsapp || ""}</div>
        <div className="text-xs mt-1">{admin?.sendWelcome ? "✓ Boas-vindas será enviado" : "Boas-vindas desativado"}</div>
      </Block>
      <Block title="Configurações iniciais">
        <ul className="text-xs space-y-0.5">
          {Object.entries(toggles).filter(([, v]) => v).map(([k]) => <li key={k}>✓ {k.replace(/_/g, " ")}</li>)}
        </ul>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      {children}
    </div>
  );
}

function SuccessScreen({ result, onReset }: { result: { companyId: string; generationId: string | null; installed: string[]; failed: { slug: string; reason: string }[] }; onReset: () => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">Projeto criado com sucesso!</h1>
        <p className="text-sm text-muted-foreground">
          Estrutura provisionada com {result.installed.length} módulo(s) instalado(s).
          {result.failed.length > 0 && ` ${result.failed.length} módulo(s) com falha — veja os logs.`}
        </p>
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Link to="/core/cliente/$id" params={{ id: result.companyId }}><Button>Acessar projeto</Button></Link>
          <Link to="/core/instalar-modulo" search={{ companyId: result.companyId }}><Button variant="outline">Configurar módulos</Button></Link>
          <Link to="/core/templates"><Button variant="outline">Criar páginas</Button></Link>
          <Link to="/core/eventos"><Button variant="outline">Ver logs</Button></Link>
          <Button variant="ghost" onClick={onReset}>Voltar à Fábrica</Button>
        </div>
        {result.installed.length > 0 && (
          <div className="text-xs text-muted-foreground pt-3">
            Instalados: {result.installed.join(", ")}
          </div>
        )}
      </Card>
    </div>
  );
}
