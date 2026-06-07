import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applyModuleVersion, listClientsForGovernance } from "@/lib/governance.functions";
import { GitBranch } from "lucide-react";
import { toast } from "sonner";

interface Props {
  moduleId: string;
  moduleName: string;
  defaultVersion?: string;
}

export function ApplyVersionScopeDialog({ moduleId, moduleName, defaultVersion = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(defaultVersion);
  const [scope, setScope] = useState<"all" | "white_label" | "company">("all");
  const [targetId, setTargetId] = useState("");
  const [segment, setSegment] = useState("");
  const [loading, setLoading] = useState(false);
  const fn = useServerFn(applyModuleVersion);
  const listClients = useServerFn(listClientsForGovernance);
  const { data } = useQuery({ queryKey: ["gov-clients"], queryFn: () => listClients(), enabled: open });

  async function submit() {
    if (!version.trim()) return toast.error("Informe a versão");
    setLoading(true);
    try {
      const res = await fn({
        data: {
          module_id: moduleId,
          version: version.trim(),
          scope,
          target_id: scope === "company" ? targetId || null : null,
          segment_filter: scope === "white_label" ? segment || null : null,
        },
      });
      toast.success(`Versão aplicada em ${res.affected} cliente(s)`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao aplicar versão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><GitBranch className="w-3.5 h-3.5 mr-1" /> Aplicar versão em escopo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Aplicar versão — {moduleName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Versão a aplicar</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="ex: 1.4.0" />
          </div>
          <div>
            <Label>Escopo</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                <SelectItem value="white_label">Por segmento</SelectItem>
                <SelectItem value="company">Cliente específico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {scope === "company" && (
            <div>
              <Label>Cliente</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  {(data?.companies ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {scope === "white_label" && (
            <div>
              <Label>Segmento</Label>
              <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="ex: clinica" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Aplicando…" : "Aplicar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
