import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  cloneStore,
  PRESET_DETAILS,
  type AgendaInitialConfig,
  type CloneInstance,
} from "@/lib/cloneCentral";

const STEPS = [
  "Identificação",
  "Estrutura básica",
  "Operação",
  "Comunicação",
  "Integrações",
  "Finalização",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instance: CloneInstance;
  actor: string;
  onSaved: () => void;
}

function bool(v: any, fallback = true) {
  return typeof v === "boolean" ? v : fallback;
}

export function AgendaConfigWizard({ open, onOpenChange, instance, actor, onSaved }: Props) {
  const [step, setStep] = useState(0);

  const initial: AgendaInitialConfig = useMemo(
    () =>
      instance.config ?? {
        publicName: instance.targetName,
        internalName: instance.fantasy ?? instance.targetName,
        niche: instance.niche ?? "Genérico",
        responsibleName: instance.responsibleName ?? "",
        responsibleEmail: instance.responsibleEmail ?? "",
        responsibleWhatsapp: "",
        environment: (instance.environment ?? "DEMO") as "DEMO" | "TESTE" | "REAL",
        notes: instance.notes ?? "",
        structure: {
          profissionais: true,
          servicos: true,
          unidades: false,
          salas: false,
          pagamento: true,
          fila: true,
          lembretes: true,
          reagendamento: true,
          cancelamentoCliente: true,
          dashboard: true,
          whatsapp: true,
          email: true,
        },
        operation: {
          horarioFuncionamento: "09:00–18:00",
          duracaoPadrao: 60,
          intervalo: 10,
          antecedenciaMin: 60,
          prazoCancelar: 120,
          prazoReagendar: 120,
          encaixe: true,
          noShow: true,
          listaEspera: true,
        },
        communication: {
          whatsapp: true,
          email: true,
          modelosPadrao: true,
          exigirConfirmacao: true,
          confirmacaoAgendamento: true,
          lembrete24h: true,
          lembrete2h: false,
          avisoReagendamento: true,
          avisoCancelamento: true,
          pesquisaPos: false,
        },
        integrations: {
          crm: !!instance.integrations?.includes("CRM"),
          whatsapp: !!instance.integrations?.includes("WhatsApp Inteligente"),
          pagamentos: !!instance.integrations?.includes("Pagamentos"),
          voip: !!instance.integrations?.includes("VoIP"),
          bi: !!instance.integrations?.includes("BI / Dashboards"),
          whiteLabel: !!instance.integrations?.includes("White Label"),
        },
      },
    [instance],
  );

  const [config, setConfig] = useState<AgendaInitialConfig>(initial);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const preset = PRESET_DETAILS[instance.preset ?? "Genérico"];

  const progress = ((step + 1) / STEPS.length) * 100;

  function next() {
    if (step === 0) {
      if (!config.publicName.trim() || !config.internalName.trim() || !config.responsibleName.trim()) {
        toast.error("Preencha os campos obrigatórios para continuar.");
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  function save() {
    const updated: CloneInstance = {
      ...instance,
      config,
      status:
        instance.environment === "REAL" ? "Aguardando configuração" : instance.status,
    };
    // Atualiza marcando como configurado
    if (instance.environment === "REAL") updated.status = "Aguardando configuração";
    if (instance.environment === "DEMO") updated.status = "DEMO pronta";
    if (instance.environment === "TESTE") updated.status = "TESTE pronto";

    // Substitui na lista
    const all = cloneStore.listInstances().map((i) => (i.id === instance.id ? updated : i));
    if (typeof window !== "undefined") {
      localStorage.setItem("imp.clone.instances.v1", JSON.stringify(all));
    }
    cloneStore.pushLog({
      actor,
      action: "configurou",
      detail: `Configuração inicial salva — ${instance.targetName}`,
      instanceId: instance.id,
    });
    toast.success("Configuração inicial salva com sucesso.");
    onSaved();
    onOpenChange(false);
    void bool;
  }

  function SwitchRow({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <label className="flex items-center justify-between gap-3 p-2 rounded border text-sm">
        <span>{label}</span>
        <Switch checked={checked} onCheckedChange={onChange} />
      </label>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CONFIGURAÇÃO INICIAL DA AGENDA ONLINE</DialogTitle>
          <DialogDescription>
            Etapa {step + 1} de {STEPS.length} — {STEPS[step]} ·{" "}
            <Badge variant="outline">{instance.environment}</Badge>{" "}
            <Badge variant="secondary">{instance.preset}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        {preset && (
          <Card className="p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Preset:</strong> {preset.labels.join(" · ")}
          </Card>
        )}

        <div className="space-y-3 py-2">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Nome público da agenda *</Label>
                <Input
                  value={config.publicName}
                  onChange={(e) => setConfig({ ...config, publicName: e.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nome interno do projeto *</Label>
                <Input
                  value={config.internalName}
                  onChange={(e) => setConfig({ ...config, internalName: e.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nicho</Label>
                <Input value={config.niche} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>Responsável interno *</Label>
                <Input
                  value={config.responsibleName}
                  onChange={(e) => setConfig({ ...config, responsibleName: e.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail do responsável</Label>
                <Input
                  type="email"
                  value={config.responsibleEmail ?? ""}
                  onChange={(e) => setConfig({ ...config, responsibleEmail: e.target.value })}
                  maxLength={255}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>WhatsApp do responsável</Label>
                <Input
                  value={config.responsibleWhatsapp ?? ""}
                  onChange={(e) => setConfig({ ...config, responsibleWhatsapp: e.target.value })}
                  maxLength={40}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ambiente</Label>
                <Input value={config.environment} readOnly />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={config.notes ?? ""}
                  onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-2">
              {(
                [
                  ["profissionais", "Terá profissionais?"],
                  ["servicos", "Terá serviços?"],
                  ["unidades", "Terá unidades?"],
                  ["salas", "Terá salas?"],
                  ["pagamento", "Terá pagamento para confirmar?"],
                  ["fila", "Terá fila de espera?"],
                  ["lembretes", "Terá lembretes?"],
                  ["reagendamento", "Terá reagendamento?"],
                  ["cancelamentoCliente", "Terá cancelamento pelo cliente?"],
                  ["dashboard", "Terá dashboard?"],
                  ["whatsapp", "Terá comunicação por WhatsApp?"],
                  ["email", "Terá comunicação por e-mail?"],
                ] as const
              ).map(([k, label]) => (
                <SwitchRow
                  key={k}
                  label={label}
                  checked={config.structure[k]}
                  onChange={(v) => setConfig({ ...config, structure: { ...config.structure, [k]: v } })}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Horário padrão de funcionamento</Label>
                <Input
                  value={config.operation.horarioFuncionamento}
                  onChange={(e) =>
                    setConfig({ ...config, operation: { ...config.operation, horarioFuncionamento: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duração padrão (min)</Label>
                <Input
                  type="number"
                  value={config.operation.duracaoPadrao}
                  onChange={(e) =>
                    setConfig({ ...config, operation: { ...config.operation, duracaoPadrao: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Intervalo entre horários (min)</Label>
                <Input
                  type="number"
                  value={config.operation.intervalo}
                  onChange={(e) =>
                    setConfig({ ...config, operation: { ...config.operation, intervalo: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Antecedência mínima para agendar (min)</Label>
                <Input
                  type="number"
                  value={config.operation.antecedenciaMin}
                  onChange={(e) =>
                    setConfig({ ...config, operation: { ...config.operation, antecedenciaMin: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prazo mínimo para cancelar (min)</Label>
                <Input
                  type="number"
                  value={config.operation.prazoCancelar}
                  onChange={(e) =>
                    setConfig({ ...config, operation: { ...config.operation, prazoCancelar: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prazo mínimo para reagendar (min)</Label>
                <Input
                  type="number"
                  value={config.operation.prazoReagendar}
                  onChange={(e) =>
                    setConfig({ ...config, operation: { ...config.operation, prazoReagendar: Number(e.target.value) } })
                  }
                />
              </div>
              <div className="md:col-span-2 grid md:grid-cols-3 gap-2">
                <SwitchRow
                  label="Permitir encaixe?"
                  checked={config.operation.encaixe}
                  onChange={(v) => setConfig({ ...config, operation: { ...config.operation, encaixe: v } })}
                />
                <SwitchRow
                  label="Permitir no-show?"
                  checked={config.operation.noShow}
                  onChange={(v) => setConfig({ ...config, operation: { ...config.operation, noShow: v } })}
                />
                <SwitchRow
                  label="Permitir lista de espera?"
                  checked={config.operation.listaEspera}
                  onChange={(v) => setConfig({ ...config, operation: { ...config.operation, listaEspera: v } })}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-2">
              {(
                [
                  ["whatsapp", "Enviar WhatsApp?"],
                  ["email", "Enviar e-mail?"],
                  ["modelosPadrao", "Usar modelos padrão?"],
                  ["exigirConfirmacao", "Exigir confirmação antes do envio?"],
                  ["confirmacaoAgendamento", "Enviar confirmação de agendamento?"],
                  ["lembrete24h", "Enviar lembrete 24h antes?"],
                  ["lembrete2h", "Enviar lembrete 2h antes?"],
                  ["avisoReagendamento", "Enviar aviso de reagendamento?"],
                  ["avisoCancelamento", "Enviar aviso de cancelamento?"],
                  ["pesquisaPos", "Enviar pesquisa pós-atendimento?"],
                ] as const
              ).map(([k, label]) => (
                <SwitchRow
                  key={k}
                  label={label}
                  checked={config.communication[k]}
                  onChange={(v) => setConfig({ ...config, communication: { ...config.communication, [k]: v } })}
                />
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selecionar uma integração nesta etapa prepara a estrutura. Credenciais reais devem ser
                configuradas separadamente.
              </p>
              <div className="grid md:grid-cols-2 gap-2">
                {(
                  [
                    ["crm", "Integrar com CRM?"],
                    ["whatsapp", "Integrar com WhatsApp?"],
                    ["pagamentos", "Integrar com Pagamentos?"],
                    ["voip", "Integrar com VoIP?"],
                    ["bi", "Integrar com BI?"],
                    ["whiteLabel", "Integrar com White Label?"],
                  ] as const
                ).map(([k, label]) => (
                  <SwitchRow
                    key={k}
                    label={label}
                    checked={config.integrations[k]}
                    onChange={(v) =>
                      setConfig({ ...config, integrations: { ...config.integrations, [k]: v } })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <Card className="p-4 space-y-1.5 text-sm">
              <div><span className="text-muted-foreground">Projeto:</span> {config.publicName} ({config.internalName})</div>
              <div><span className="text-muted-foreground">Ambiente:</span> {config.environment}</div>
              <div><span className="text-muted-foreground">Preset:</span> {instance.preset}</div>
              <div>
                <span className="text-muted-foreground">Estrutura básica:</span>{" "}
                {Object.entries(config.structure).filter(([, v]) => v).map(([k]) => k).join(", ") || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Comunicação:</span>{" "}
                {Object.entries(config.communication).filter(([, v]) => v).map(([k]) => k).join(", ") || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Integrações:</span>{" "}
                {Object.entries(config.integrations).filter(([, v]) => v).map(([k]) => k).join(", ") || "—"}
              </div>
              <div><span className="text-muted-foreground">Responsável:</span> {config.responsibleName}</div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {step > 0 && (
            <Button variant="outline" onClick={prev}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Continuar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={save}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Salvar configuração inicial
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
