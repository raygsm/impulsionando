import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { installModuleWithTemplate } from "@/lib/modules.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { SEGMENT_LABELS, type SegmentKey } from "@/data/moduleSegmentTemplates";
import { toast } from "sonner";

type Props = {
  moduleSlug: string;
  moduleName: string;
  allowedSegments?: string[];
  /** When provided, locks the company selector. */
  companyId?: string;
  trigger?: React.ReactNode;
  onInstalled?: () => void;
};

export function InstallModuleDialog({ moduleSlug, moduleName, allowedSegments, companyId, trigger, onInstalled }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>(companyId);
  const [segment, setSegment] = useState<SegmentKey>("default");
  const [installDeps, setInstallDeps] = useState(true);

  const { data: companies } = useQuery({
    queryKey: ["companies-for-install"],
    enabled: open && !companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_master", false)
        .eq("is_active", true)
        .order("name");
      return data ?? [];
    },
  });

  const install = useServerFn(installModuleWithTemplate);
  const mut = useMutation({
    mutationFn: () => {
      if (!selectedCompany) throw new Error("Selecione uma empresa");
      return install({ data: { companyId: selectedCompany, slug: moduleSlug, segment, installDependencies: installDeps } });
    },
    onSuccess: (res) => {
      toast.success(`Módulo instalado em 1 clique (${res.installed.length} módulo(s), ${res.settingsApplied.length} parâmetro(s))`);
      qc.invalidateQueries({ queryKey: ["client-modules", selectedCompany] });
      qc.invalidateQueries({ queryKey: ["client-360", selectedCompany] });
      qc.invalidateQueries({ queryKey: ["module-detail", moduleSlug] });
      setOpen(false);
      onInstalled?.();
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao instalar"),
  });

  // Permite todos os segmentos se módulo não restringe; caso contrário só os listados + default.
  const availableSegments: SegmentKey[] = (() => {
    if (!allowedSegments || allowedSegments.length === 0) return Object.keys(SEGMENT_LABELS) as SegmentKey[];
    return ["default", ...(allowedSegments as SegmentKey[])];
  })();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Download className="w-4 h-4 mr-1" /> Instalar no Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Instalar {moduleName} em 1 clique</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!companyId && (
            <div>
              <Label className="text-xs">Cliente</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa…" />
                </SelectTrigger>
                <SelectContent>
                  {(companies ?? []).map((c: { id: string; name: string }) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Template de configuração</Label>
            <Select value={segment} onValueChange={(v) => setSegment(v as SegmentKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSegments.map((k) => (
                  <SelectItem key={k} value={k}>
                    {SEGMENT_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aplica automaticamente os parâmetros recomendados para esse segmento.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={installDeps} onCheckedChange={(v) => setInstallDeps(!!v)} />
            <span>Instalar dependências automaticamente</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !selectedCompany}>
            <Download className="w-4 h-4 mr-1" /> Instalar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
