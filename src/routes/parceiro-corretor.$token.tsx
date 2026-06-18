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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Home, Handshake, UserPlus } from "lucide-react";
import {
  fetchPartnerBrokerPortal, acceptPartnerBrokerInvite, submitPartnerInterest,
} from "@/lib/realestate-partner.functions";

export const Route = createFileRoute("/parceiro-corretor/$token")({
  component: Page,
  head: () => ({ meta: [{ title: "Portal do Corretor Parceiro" }, { name: "robots", content: "noindex" }] }),
});

function brl(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function Page() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const portalFn = useServerFn(fetchPartnerBrokerPortal);
  const acceptFn = useServerFn(acceptPartnerBrokerInvite);

  const q = useQuery({ queryKey: ["partner-broker-portal", token], queryFn: () => portalFn({ data: { token } }) });

  const acceptMut = useMutation({
    mutationFn: () => acceptFn({ data: { token } }),
    onSuccess: () => { toast.success("Parceria aceita!"); qc.invalidateQueries({ queryKey: ["partner-broker-portal", token] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  if (q.isLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  if (!q.data?.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-2">
            <Home className="w-10 h-10 mx-auto text-muted-foreground" />
            <h1 className="text-lg font-semibold">Link inválido</h1>
            <p className="text-sm text-muted-foreground">Este link de convite não é mais válido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { partner, company, properties } = q.data;
  const isActive = partner.status === "active";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="max-w-5xl mx-auto p-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">{company.name}</h1>
            <p className="text-sm text-muted-foreground">Portal do corretor parceiro · {partner.broker_name}</p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Parceria ativa" : "Aguardando aceite"}</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {!isActive && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Handshake className="w-5 h-5" /> Aceite de parceria</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">Ao aceitar, você poderá indicar interessados aos imóveis desta carteira e receber atualizações.</p>
              <Button onClick={() => acceptMut.mutate()} disabled={acceptMut.isPending}>
                {acceptMut.isPending ? "Confirmando…" : "Aceitar parceria"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Carteira de imóveis disponíveis ({properties.length})</CardTitle></CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem imóveis publicados no momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {properties.map((p: any) => (
                  <Card key={p.id} className="overflow-hidden">
                    {p.photos?.[0] && (
                      <img src={p.photos[0]} alt={p.title} className="w-full h-40 object-cover" loading="lazy" />
                    )}
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium leading-tight">{p.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.reference_code && `[${p.reference_code}] `}{p.neighborhood ?? ""}{p.city ? `, ${p.city}` : ""}
                          </div>
                        </div>
                        <Badge variant="outline">{p.operation}</Badge>
                      </div>
                      <div className="text-sm flex gap-3">
                        {p.sale_price && <span><b>{brl(p.sale_price)}</b> venda</span>}
                        {p.rent_price && <span><b>{brl(p.rent_price)}</b>/mês</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.bedrooms ?? 0} dorm · {p.bathrooms ?? 0} banh · {p.parking_spots ?? 0} vagas
                      </div>
                      {isActive && (
                        <SubmitInterestDialog token={token} propertyId={p.id} title={p.title} />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function SubmitInterestDialog({ token, propertyId, title }: { token: string; propertyId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const fn = useServerFn(submitPartnerInterest);
  const mut = useMutation({
    mutationFn: () => fn({ data: { token, property_id: propertyId, contact_name: name, contact_email: email || null, contact_phone: phone || null, message: message || null } }),
    onSuccess: () => { toast.success("Interessado enviado!"); setOpen(false); setName(""); setEmail(""); setPhone(""); setMessage(""); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full"><UserPlus className="w-4 h-4 mr-2" />Indicar interessado</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Indicar interessado · {title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome*</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>WhatsApp</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Label>Observação</Label><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={!name || mut.isPending}>{mut.isPending ? "Enviando…" : "Enviar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
