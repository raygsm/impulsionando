import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  updateModuleCertification,
  READINESS_CHECKLIST_KEYS,
  READINESS_CHECKLIST_LABELS,
  READINESS_STATUS_LABELS,
} from "@/lib/modules.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEGMENT_LABELS, type SegmentKey } from "@/data/moduleSegmentTemplates";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ModuleData = {
  slug: string;
  readiness_status?: string | null;
  readiness_checklist?: Record<string, boolean> | null;
  demo_url?: string | null;
  docs_url?: string | null;
  segments?: string[] | null;
};

export function ModuleCertificationPanel({ module }: { module: ModuleData }) {
  const qc = useQueryClient();
  const save = useServerFn(updateModuleCertification);

  const [status, setStatus] = useState<string>(module.readiness_status ?? "em_desenvolvimento");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    (module.readiness_checklist as Record<string, boolean>) ?? {},
  );
  const [demoUrl, setDemoUrl] = useState(module.demo_url ?? "");
  const [docsUrl, setDocsUrl] = useState(module.docs_url ?? "");
  const [segments, setSegments] = useState<string[]>(module.segments ?? []);

  useEffect(() => {
    setStatus(module.readiness_status ?? "em_desenvolvimento");
    setChecklist((module.readiness_checklist as Record<string, boolean>) ?? {});
    setDemoUrl(module.demo_url ?? "");
    setDocsUrl(module.docs_url ?? "");
    setSegments(module.segments ?? []);
  }, [module]);

  const completed = READINESS_CHECKLIST_KEYS.filter((k) => checklist[k]).length;
  const total = READINESS_CHECKLIST_KEYS.length;
  const allDone = completed === total;

  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          slug: module.slug,
          readiness_status: status as never,
          readiness_checklist: checklist as never,
          demo_url: demoUrl || null,
          docs_url: docsUrl || null,
          segments,
        },
      }),
    onSuccess: () => {
      toast.success("Certificação atualizada");
      qc.invalidateQueries({ queryKey: ["module-detail", module.slug] });
      qc.invalidateQueries({ queryKey: ["core-modules-lib"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao salvar"),
  });

  const markCertified = () => {
    if (!allDone) {
      toast.error(`Conclua os ${total} itens do checklist antes de certificar.`);
      return;
    }
    setStatus("certificado");
    setTimeout(() => mut.mutate(), 0);
  };

  const toggleSegment = (key: string) => {
    setSegments((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Status de prontidão</h3>
            <p className="text-xs text-muted-foreground">
              Somente módulos certificados ou publicados podem ser instalados em clientes.
            </p>
          </div>
          <Badge variant={status === "certificado" || status === "publicado" ? "default" : "outline"}>
            {READINESS_STATUS_LABELS[status] ?? status}
          </Badge>
        </div>
        <div className="grid sm:grid-cols-[200px_1fr] gap-3 items-center">
          <Label className="text-sm">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(READINESS_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Checklist de Certificação</h3>
          <Badge variant={allDone ? "default" : "outline"}>
            {completed}/{total}
          </Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {READINESS_CHECKLIST_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={!!checklist[key]}
                onCheckedChange={(v) => setChecklist((p) => ({ ...p, [key]: !!v }))}
              />
              <span>{READINESS_CHECKLIST_LABELS[key]}</span>
            </label>
          ))}
        </div>
        {!allDone && (
          <div className="flex items-start gap-2 mt-3 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Para certificar o módulo, todos os 13 itens devem estar concluídos.</span>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Recursos do módulo</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">URL da demonstração</Label>
            <Input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="/demo.agenda" />
          </div>
          <div>
            <Label className="text-xs">URL da documentação</Label>
            <Input value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)} placeholder="https://docs..." />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Segmentos suportados</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(SEGMENT_LABELS) as [SegmentKey, string][])
            .filter(([k]) => k !== "default")
            .map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={segments.includes(key)} onCheckedChange={() => toggleSegment(key)} />
                <span>{label}</span>
              </label>
            ))}
        </div>
      </Card>

      <div className="flex items-center gap-2 justify-end">
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} variant="outline">
          Salvar
        </Button>
        <Button onClick={markCertified} disabled={mut.isPending || !allDone}>
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Marcar como Certificado
        </Button>
      </div>
    </div>
  );
}
