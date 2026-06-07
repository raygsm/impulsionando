import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import {
  cloneStore,
  ENVIRONMENTS,
  INTEGRATIONS,
  NICHE_PRESETS,
  PURPOSES,
  uid,
  type CloneWizardInput,
  type Environment,
  type Integration,
  type ModuleBase,
  type NichePreset,
  type PurposeValue,
} from "@/lib/cloneCentral";

const schema = z.object({
  projectName: z.string().trim().min(2, "Nome do projeto obrigatório").max(120),
  fantasy: z.string().trim().max(120).optional().or(z.literal("")),
  niche: z.string().min(1, "Nicho obrigatório"),
  responsibleName: z.string().trim().min(2, "Responsável interno obrigatório").max(120),
  responsibleEmail: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  responsibleWhatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  base: ModuleBase;
  actor: string;
  canClone: boolean;
  onCreated: () => void;
}

const STEPS = ["Módulo-base", "Finalidade", "Dados", "Ambiente", "Preset", "Integrações", "Revisão"];

export function CloneWizard({ open, onOpenChange, base, actor, canClone, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<PurposeValue>("demo");
  const [projectName, setProjectName] = useState("");
  const [fantasy, setFantasy] = useState("");
  const [niche, setNiche] = useState<string>("Genérico");
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [responsibleWhatsapp, setResponsibleWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [environment, setEnvironment] = useState<Environment>("DEMO");
  const [preset, setPreset] = useState<NichePreset>("Genérico");
  const [integrations, setIntegrations] = useState<Integration[]>(["CRM", "WhatsApp Inteligente"]);
  const [securityAck, setSecurityAck] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setSecurityAck(false);
    }
  }, [open]);

  // Sincroniza finalidade -> ambiente sugerido
  useEffect(() => {
    if (purpose === "cliente-real" || purpose === "white-label") setEnvironment("REAL");
    else if (purpose === "demo") setEnvironment("DEMO");
    else if (purpose === "teste") setEnvironment("TESTE");
  }, [purpose]);

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  function next() {
    // Validações por etapa
    if (step === 2) {
      const parsed = schema.safeParse({
        projectName,
        fantasy,
        niche,
        responsibleName,
        responsibleEmail,
        responsibleWhatsapp,
        notes,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Preencha os campos obrigatórios para continuar.");
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleCancel() {
    if (confirm("Deseja cancelar a clonagem? Nenhum módulo será criado.")) {
      onOpenChange(false);
    }
  }

  function handleConfirm() {
    if (!canClone) {
      toast.error("Você não possui permissão para clonar módulos.");
      return;
    }
    if (!environment) {
      toast.error("Selecione um ambiente antes de continuar.");
      return;
    }
    if (!securityAck) {
      toast.error("Marque a confirmação de segurança para concluir.");
      return;
    }
    const layer = environment === "REAL" ? "real" : "demo";
    const status =
      environment === "REAL"
        ? "REAL aguardando configuração"
        : environment === "TESTE"
        ? "TESTE pronto"
        : "DEMO pronta";
    const id = uid();
    cloneStore.saveInstance({
      id,
      baseId: base.id,
      layer,
      targetName: projectName,
      fantasy,
      niche,
      preset,
      purpose,
      environment,
      status,
      responsibleName,
      responsibleEmail,
      createdBy: actor,
      integrations,
      internalUrl: `/admin/modulos/clonagem/instancia/${id}`,
      notes,
      createdAt: new Date().toISOString(),
    });
    cloneStore.pushLog({
      actor,
      action: layer === "real" ? "clonou-real" : "clonou-demo",
      detail: `${base.name} → ${projectName} (${environment} / ${preset})`,
      instanceId: id,
    });

    toast.success(
      "Módulo clonado com sucesso. A nova instância foi criada a partir do módulo-base selecionado, sem copiar dados reais de outros clientes."
    );
    onCreated(id);
    onOpenChange(false);
  }


  function toggleIntegration(i: Integration) {
    setIntegrations((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleCancel() : onOpenChange(v))}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clonar módulo para novo projeto / cliente</DialogTitle>
          <DialogDescription>
            Etapa {step + 1} de {STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Barra de progresso */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-4 py-2">
          {step === 0 && (
            <Card className="p-4 space-y-2">
              <div className="text-xs text-muted-foreground">Módulo-base selecionado</div>
              <div className="font-semibold">{base.name} — v{base.version}</div>
              <div className="text-sm text-muted-foreground">{base.description}</div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">Código: {base.slug}</Badge>
                <Badge variant="outline">Status: {base.status}</Badge>
              </div>
            </Card>
          )}

          {step === 1 && (
            <div className="space-y-2">
              {PURPOSES.map((p) => (
                <Card
                  key={p.value}
                  className={`p-3 cursor-pointer transition border ${
                    purpose === p.value ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setPurpose(p.value)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 mt-1 ${
                        purpose === p.value ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    />
                    <div>
                      <div className="font-medium text-sm">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.desc}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome do novo projeto/cliente *</Label>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label>Nome fantasia</Label>
                <Input value={fantasy} onChange={(e) => setFantasy(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label>Nicho *</Label>
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NICHE_PRESETS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável interno Impulsionando *</Label>
                <Input value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label>E-mail do responsável</Label>
                <Input type="email" value={responsibleEmail} onChange={(e) => setResponsibleEmail(e.target.value)} maxLength={255} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>WhatsApp do responsável</Label>
                <Input value={responsibleWhatsapp} onChange={(e) => setResponsibleWhatsapp(e.target.value)} maxLength={40} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações internas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              {ENVIRONMENTS.map((e) => (
                <Card
                  key={e.value}
                  className={`p-3 cursor-pointer border ${environment === e.value ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setEnvironment(e.value)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-1 ${environment === e.value ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                    <div>
                      <div className="font-medium text-sm">{e.value}</div>
                      <div className="text-xs text-muted-foreground">{e.desc}</div>
                    </div>
                  </div>
                </Card>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                REAL nasce vazio. DEMO recebe mocks. TESTE recebe dados técnicos de validação.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {NICHE_PRESETS.map((p) => (
                <Card
                  key={p}
                  className={`p-3 cursor-pointer text-sm border ${preset === p ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setPreset(p)}
                >
                  {p}
                </Card>
              ))}
              <p className="col-span-full text-xs text-muted-foreground">
                O preset adapta labels, exemplos, serviços padrão, status, textos, comunicações,
                dashboards, permissões sugeridas e parametrizações padrão.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selecione as integrações que devem nascer preparadas. Selecionar não ativa credenciais reais —
                apenas prepara a estrutura.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {INTEGRATIONS.map((i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent"
                  >
                    <Checkbox checked={integrations.includes(i)} onCheckedChange={() => toggleIntegration(i)} />
                    <span className="text-sm">{i}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <Card className="p-4 space-y-1 text-sm">
                <div><span className="text-muted-foreground">Módulo-base:</span> <strong>{base.name}</strong></div>
                <div><span className="text-muted-foreground">Versão-base:</span> v{base.version}</div>
                <div><span className="text-muted-foreground">Finalidade:</span> {PURPOSES.find((p) => p.value === purpose)?.label}</div>
                <div><span className="text-muted-foreground">Projeto/Cliente:</span> {projectName} {fantasy ? `(${fantasy})` : ""}</div>
                <div><span className="text-muted-foreground">Nicho:</span> {niche}</div>
                <div><span className="text-muted-foreground">Ambiente:</span> {environment}</div>
                <div><span className="text-muted-foreground">Preset:</span> {preset}</div>
                <div><span className="text-muted-foreground">Integrações:</span> {integrations.length ? integrations.join(", ") : "Nenhuma"}</div>
                <div><span className="text-muted-foreground">Responsável:</span> {responsibleName} {responsibleEmail ? `· ${responsibleEmail}` : ""}</div>
                {notes ? <div><span className="text-muted-foreground">Obs:</span> {notes}</div> : null}
              </Card>
              <Card className="p-3 border-amber-500/40 bg-amber-500/5 text-sm flex gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                <p>
                  A clonagem criará uma nova instância estrutural do módulo. Dados reais,
                  credenciais, tokens, webhooks privados e informações sensíveis de outros
                  clientes não serão copiados.
                </p>
              </Card>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={securityAck} onCheckedChange={(v) => setSecurityAck(!!v)} />
                <span>
                  Entendo que esta ação criará uma nova instância estrutural do módulo e não
                  copiará dados reais, credenciais ou informações sensíveis de outros clientes.
                </span>
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
          {step > 0 && (
            <Button variant="outline" onClick={prev}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Continuar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={!securityAck || !canClone}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Confirmar clonagem
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
