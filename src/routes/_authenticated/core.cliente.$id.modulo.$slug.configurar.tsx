import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCompanyModuleSettings, saveModuleAssistantSettings } from "@/lib/factory.functions";
import { getModuleAssistant } from "@/data/moduleAssistantSteps";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/cliente/$id/modulo/$slug/configurar")({
  head: () => ({ meta: [{ title: "Configurar Módulo Instalado — Fábrica" }] }),
  component: ConfigurarModuloPage,
});

function ConfigurarModuloPage() {
  const { id: companyId, slug } = Route.useParams();
  const navigate = useNavigate();
  const assistant = getModuleAssistant(slug);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [done, setDone] = useState(false);

  const fetchSettings = useServerFn(getCompanyModuleSettings);
  const { data: existing } = useQuery({
    queryKey: ["module-assistant", companyId, slug],
    queryFn: () => fetchSettings({ data: { companyId, prefix: `${slug}.` } }),
  });

  // Seed values from defaults + existing
  useEffect(() => {
    const seed: Record<string, unknown> = {};
    for (const s of assistant.steps) {
      for (const f of s.fields) {
        if (f.default !== undefined) seed[f.key] = f.default;
      }
    }
    for (const row of existing?.settings ?? []) {
      seed[row.key] = row.value;
    }
    setValues(seed);
  }, [existing, assistant]);

  const saveFn = useServerFn(saveModuleAssistantSettings);
  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { companyId, values, moduleSlug: slug, markConfigured: true } }),
    onSuccess: () => {
      toast.success("Configuração salva");
      setDone(true);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao salvar"),
  });

  const current = assistant.steps[step];
  const isLast = step === assistant.steps.length - 1;

  if (done) {
    return (
      <Card className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">Módulo configurado!</h1>
        <p className="text-sm text-muted-foreground">As configurações iniciais foram aplicadas. Você pode ajustar tudo em Parâmetros depois.</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link to="/core/cliente/$id" params={{ id: companyId }}><Button>Voltar ao Cliente</Button></Link>
          <Link to="/core/instalar-modulo" search={{ companyId }}><Button variant="outline">Instalar outro módulo</Button></Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Configurar módulo <Badge variant="secondary">{slug}</Badge>
        </h1>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/core/cliente/$id", params: { id: companyId } })}>
          Cancelar
        </Button>
      </div>

      <div className="flex gap-1 text-[11px]">
        {assistant.steps.map((s, i) => (
          <div key={i} className={`flex-1 border rounded p-1.5 ${i === step ? "border-primary bg-primary/5" : i < step ? "border-green-500/40" : ""}`}>
            {i + 1}. {s.title}
          </div>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="font-semibold">{current.title}</h2>
          {current.description && <p className="text-xs text-muted-foreground">{current.description}</p>}
        </div>

        {current.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma configuração nesta etapa. Avance para continuar.</p>
        )}

        <div className="space-y-2">
          {current.fields.map((f) => {
            if (f.type === "boolean") {
              return (
                <label key={f.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!values[f.key]}
                    onCheckedChange={(v) => setValues({ ...values, [f.key]: !!v })}
                  />
                  <span>{f.label}</span>
                </label>
              );
            }
            return (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type={f.type === "number" ? "number" : "text"}
                  value={(values[f.key] as string) ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          {isLast ? (
            <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando…</> : "Concluir"}
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)}>
              Avançar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
