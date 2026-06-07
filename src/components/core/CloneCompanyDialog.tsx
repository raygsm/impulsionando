import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cloneCompany } from "@/lib/governance.functions";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  sourceCompanyId: string;
  sourceName: string;
}

export function CloneCompanyDialog({ sourceCompanyId, sourceName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${sourceName} (Cópia)`);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const fn = useServerFn(cloneCompany);
  const navigate = useNavigate();

  async function submit() {
    if (!name.trim()) return toast.error("Informe o nome");
    setLoading(true);
    try {
      const res = await fn({ data: { source_company_id: sourceCompanyId, new_name: name.trim(), new_owner_email: email || null } });
      toast.success("Cliente clonado com sucesso");
      setOpen(false);
      navigate({ to: "/core/cliente/$id", params: { id: res.company_id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao clonar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Copy className="w-3.5 h-3.5 mr-1" /> Clonar projeto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Clonar {sourceName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome do novo cliente</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>E-mail do dono (opcional)</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <p className="text-xs text-muted-foreground">Serão copiados: parâmetros, módulos habilitados e templates de mensagem. Documento, domínio e usuários NÃO são copiados.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Clonando…" : "Clonar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
