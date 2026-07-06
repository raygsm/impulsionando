import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLlmConfig } from "@/lib/impulsionito-ic/llm-config";
import type { LlmProviderId } from "@/lib/impulsionito/types";
import { Cpu, RotateCcw, Save } from "lucide-react";

const PROVIDER_OPTIONS: Array<{ id: LlmProviderId; label: string; hint: string; ready: boolean }> = [
  { id: "openai", label: "OpenAI (padrão)", hint: "gpt-4o-mini / gpt-4o", ready: true },
  { id: "gemini", label: "Gemini (fallback)", hint: "google/gemini-2.5-flash", ready: true },
  { id: "claude", label: "Claude (preparado)", hint: "não instanciado", ready: false },
  { id: "ollama", label: "Ollama (preparado)", hint: "não instanciado", ready: false },
];

const MODEL_HINTS: Record<LlmProviderId, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  gemini: ["google/gemini-2.5-flash", "google/gemini-2.5-pro"],
  claude: ["claude-3-5-sonnet-latest"],
  ollama: ["llama3.1"],
};

export function LlmConfigPanel() {
  const { config, update, reset } = useLlmConfig();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function persist<K extends keyof typeof config>(key: K, value: (typeof config)[K]) {
    update({ [key]: value } as Partial<typeof config>);
    setSavedAt(new Date().toLocaleTimeString("pt-BR"));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Cpu className="h-6 w-6 text-primary" />
          Motor LLM
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          O modelo é apenas o motor de geração — o cérebro fica no Centro de Inteligência.
          Trocar aqui não altera código; o backend detecta a chave disponível e faz fallback
          automático quando o provedor pedido não está pronto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provedor ativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Provedor</Label>
              <Select
                value={config.provider}
                onValueChange={(v) => persist("provider", v as LlmProviderId)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span>{p.label}</span>
                        {!p.ready && <Badge variant="outline" className="text-[10px]">soon</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Sem código: o backend detecta `OPENAI_API_KEY` e usa OpenAI; senão cai para Gemini
                via Lovable Gateway.
              </p>
            </div>
            <div>
              <Label className="text-xs">Modelo</Label>
              <Input
                value={config.model}
                onChange={(e) => persist("model", e.target.value)}
                placeholder={MODEL_HINTS[config.provider][0]}
                list="impulsionito-model-hints"
              />
              <datalist id="impulsionito-model-hints">
                {MODEL_HINTS[config.provider].map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Label className="text-xs">Temperatura</Label>
              <Input
                type="number" min={0} max={2} step={0.1}
                value={config.temperature}
                onChange={(e) => persist("temperature", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Máx. tokens</Label>
              <Input
                type="number" min={64} max={8192} step={64}
                value={config.maxTokens}
                onChange={(e) => persist("maxTokens", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Timeout (ms)</Label>
              <Input
                type="number" min={5000} step={1000}
                value={config.timeoutMs}
                onChange={(e) => persist("timeoutMs", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Retries</Label>
              <Input
                type="number" min={0} max={5}
                value={config.retry}
                onChange={(e) => persist("retry", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Streaming</div>
              <div className="text-xs text-muted-foreground">
                Resposta chega em tempo real (recomendado). Desligue apenas para depurar.
              </div>
            </div>
            <Switch checked={config.streaming} onCheckedChange={(v) => persist("streaming", v)} />
          </div>

          <div>
            <Label className="text-xs">Cadeia de fallback</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {config.fallback.map((id) => (
                <Badge key={id} variant="secondary">{id}</Badge>
              ))}
              {config.fallback.length === 0 && (
                <span className="text-xs text-muted-foreground">Sem fallback declarado.</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              O backend sempre tenta OpenAI e Gemini como último recurso, mesmo que não estejam
              nesta cadeia.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar padrões
            </Button>
            {savedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="h-3 w-3" /> salvo às {savedAt}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como o backend resolve o provedor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>1. Provedor pedido acima (se a chave existir).</p>
          <p>2. Cadeia de fallback declarada.</p>
          <p>3. OpenAI se <code>OPENAI_API_KEY</code> estiver nos Secrets.</p>
          <p>4. Gemini via Lovable Gateway como último recurso.</p>
          <p className="pt-2 text-xs">A chave nunca vai ao navegador — a resolução acontece só no servidor.</p>
        </CardContent>
      </Card>
    </div>
  );
}
