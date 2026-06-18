import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Copy, Handshake } from "lucide-react";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader } from "@/components/app/PageElements";
import { listPartnerBrokers, upsertPartnerBroker } from "@/lib/realestate-partner.functions";

export const Route = createFileRoute("/_authenticated/imobiliaria/parceiros")({
  head: () => ({ meta: [{ title: "Corretores parceiros — Imobiliária" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const listFn = useServerFn(listPartnerBrokers);
  const q = useQuery({
    queryKey: ["re-partners", companyId],
    enabled: !!companyId,
    queryFn: () => listFn({ data: { companyId: companyId! } }),
  });
  const brokers = q.data?.brokers ?? [];

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/parceiro-corretor/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  if (!companyId) return <Card className="p-6"><p className="text-sm text-muted-foreground">Selecione uma empresa.</p></Card>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Corretores parceiros"
        description="Cadastre corretores externos e compartilhe um link público para que indiquem interessados nos seus imóveis."
        actions={<NewBrokerDialog companyId={companyId} onCreated={() => qc.invalidateQueries({ queryKey: ["re-partners"] })} />}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Corretor</TableHead><TableHead>Contato</TableHead><TableHead>Status</TableHead>
              <TableHead>Aceite</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {brokers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Nenhum parceiro ainda.</TableCell></TableRow>
              )}
              {brokers.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell><div className="font-medium">{b.broker_name}</div></TableCell>
                  <TableCell className="text-xs">{b.email ?? "—"}<br/>{b.phone ?? ""}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "active" ? "default" : b.status === "paused" ? "destructive" : "secondary"}>
                      {b.status === "active" ? "Ativo" : b.status === "paused" ? "Pausado" : "Convite pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{b.contract_started_at ? new Date(b.contract_started_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => copyLink(b.portal_token)}>
                      <Copy className="w-3 h-3 mr-1" />Copiar link
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewBrokerDialog({ companyId, onCreated }: { companyId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"pending" | "active">("pending");

  const fn = useServerFn(upsertPartnerBroker);
  const mut = useMutation({
    mutationFn: () => fn({ data: { companyId, broker_name: name, email: email || null, phone: phone || null, status } }),
    onSuccess: () => { toast.success("Parceiro criado!"); onCreated(); setOpen(false); setName(""); setEmail(""); setPhone(""); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo parceiro</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Handshake className="w-5 h-5" />Convidar corretor parceiro</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome*</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>WhatsApp</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div>
            <Label>Status inicial</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Convite pendente</SelectItem>
                <SelectItem value="active">Já ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={!name || mut.isPending}>{mut.isPending ? "Criando…" : "Criar e gerar link"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
