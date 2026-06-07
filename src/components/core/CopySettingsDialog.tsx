import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { copyCompanySettings, listClientsForGovernance } from "@/lib/governance.functions";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  targetCompanyId: string;
  targetName: string;
}

const AREAS = [
  { key: "settings", label: "Parâmetros (company_settings)" },
  { key: "modules", label: "Módulos habilitados" },
  { key: "templates", label: "Templates de comunicação" },
] as const;

export function CopySettingsDialog({ targetCompanyId, targetName }: Props) {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [areas, setAreas] = useState<Record<string, boolean>>({ settings: true, modules: true, templates: false });
  const [loading, setLoading] = useState(false);
  const fn = useServerFn(copyCompanySettings);
  const listClients = useServerFn(listClientsForGovernance);
  const { data } = useQuery({ queryKey: ["gov-clients"], queryFn: () => listClients(), enabled: open });

  async function submit() {
    const selected = Object.entries(areas).filter(([_, v]) => v).map(([k]) => k);
    if (!sourceId) return toast.error("Selecione a origem");
    if (!selected.length) return toast.error("Selecione ao menos uma área");
    setLoading(true);
    try {
      const res = await fn({ data: { source_id: sourceId, target_id: targetCompanyId, areas: selected as any } });
      toast.success(`Copiado: ${JSON.stringify(res.summary)}`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao copiar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ClipboardCopy className="w-3.5 h-3.5 mr-1" /> Copiar configurações</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Copiar configurações para {targetName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Cliente de origem</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
              <SelectContent>
                {(data?.companies ?? []).filter((c: any) => c.id !== targetCompanyId).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Áreas a copiar</Label>
            {AREAS.map((a) => (
              <label key={a.key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={areas[a.key]} onCheckedChange={(v) => setAreas((s) => ({ ...s, [a.key]: !!v }))} />
                {a.label}
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Copiando…" : "Copiar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
