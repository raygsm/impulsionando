/**
 * RoiSimulator — widget client-side de simulação de ROI e economia de tempo.
 * Reutilizável em páginas de módulo e na página /demo/simulador.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Sparkles, Clock, TrendingUp, DollarSign, RotateCcw } from "lucide-react";
import { ROI_PRESETS, computeRoi, type RoiPreset } from "@/lib/roiPresets";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type Props = {
  /** Chave do preset (ex: "crm"). Se omitido, exibe seletor de módulo. */
  presetKey?: string;
  compact?: boolean;
};

export function RoiSimulator({ presetKey, compact = false }: Props) {
  const [activeKey, setActiveKey] = useState<string>(
    presetKey ?? ROI_PRESETS[0]!.key
  );
  const preset: RoiPreset =
    ROI_PRESETS.find((p) => p.key === activeKey) ?? ROI_PRESETS[0]!;

  const [volume, setVolume] = useState(preset.inputs.volume.default);
  const [ticket, setTicket] = useState(preset.inputs.ticket?.default ?? 0);
  const [minutos, setMinutos] = useState(preset.inputs.minutosManuais.default);

  // Reset quando o preset muda
  const resetDefaults = () => {
    setVolume(preset.inputs.volume.default);
    setTicket(preset.inputs.ticket?.default ?? 0);
    setMinutos(preset.inputs.minutosManuais.default);
  };

  const result = useMemo(
    () => computeRoi(preset, volume, ticket, minutos),
    [preset, volume, ticket, minutos]
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="p-6 border-primary/20">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-gradient-primary">
                <Sparkles className="w-3 h-3 mr-1" /> Simulador
              </Badge>
              <h3 className="text-lg font-semibold">ROI & economia de tempo</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Ajuda">
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Estimativas conservadoras baseadas em benchmarks de mercado. Resultado real
                  depende do nicho, equipe e configuração. Ajuste os sliders à sua operação.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">{preset.description}</p>
          </div>
          <Button variant="outline" size="sm" onClick={resetDefaults} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Padrão
          </Button>
        </div>

        {!presetKey && (
          <div className="mb-4 flex flex-wrap gap-2">
            {ROI_PRESETS.map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={p.key === activeKey ? "default" : "outline"}
                onClick={() => {
                  setActiveKey(p.key);
                  setVolume(p.inputs.volume.default);
                  setTicket(p.inputs.ticket?.default ?? 0);
                  setMinutos(p.inputs.minutosManuais.default);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        )}

        <div className={compact ? "grid gap-4" : "grid gap-4 md:grid-cols-3"}>
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              {preset.inputs.volume.label}
              <span className="text-primary font-semibold">
                {volume.toLocaleString("pt-BR")}
              </span>
            </Label>
            <Slider
              min={preset.inputs.volume.min}
              max={preset.inputs.volume.max}
              step={preset.inputs.volume.step}
              value={[volume]}
              onValueChange={(v) => setVolume(v[0] ?? 0)}
            />
          </div>

          {preset.inputs.ticket && (
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                {preset.inputs.ticket.label}
                <span className="text-primary font-semibold">{brl(ticket)}</span>
              </Label>
              <Slider
                min={preset.inputs.ticket.min}
                max={preset.inputs.ticket.max}
                step={preset.inputs.ticket.step}
                value={[ticket]}
                onValueChange={(v) => setTicket(v[0] ?? 0)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              {preset.inputs.minutosManuais.label}
              <span className="text-primary font-semibold">{minutos} min</span>
            </Label>
            <Slider
              min={preset.inputs.minutosManuais.min}
              max={preset.inputs.minutosManuais.max}
              step={preset.inputs.minutosManuais.step}
              value={[minutos]}
              onValueChange={(v) => setMinutos(v[0] ?? 0)}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ResultCard
            icon={Clock}
            label="Horas economizadas/mês"
            value={result.horasEconomizadas.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " h"}
            tooltip="70% das horas manuais são automatizadas. O restante vira supervisão."
          />
          <ResultCard
            icon={TrendingUp}
            label="Ganho mensal estimado"
            value={brl(result.ganhoMensal)}
            tooltip="Uplift de conversão + retenção + economia operacional."
          />
          <ResultCard
            icon={DollarSign}
            label="Ganho anual estimado"
            value={brl(result.ganhoAnual)}
            tooltip="Projeção linear sobre 12 meses, sem reinvestimento."
            highlight
          />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Cálculos client-side, sem persistência. Use como guia para conversa comercial — não substitui
          análise contábil ou financeira.
        </p>
      </Card>
    </TooltipProvider>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  tooltip,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tooltip: string;
  highlight?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={
            "rounded-lg border p-4 " +
            (highlight ? "bg-gradient-primary text-primary-foreground border-transparent" : "bg-card")
          }
        >
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" />
            <span className="text-xs opacity-80">{label}</span>
          </div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
