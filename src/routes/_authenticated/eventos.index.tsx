import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { listEvents, upsertEvent } from "@/lib/events.functions";
import { Ticket, Plus, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/eventos/")({
  head: () => ({ meta: [{ title: "Eventos & Ingressos" }, { name: "robots", content: "noindex" }] }),
  component: EventsList,
});

function EventsList() {
  const { activeCompanyId } = useCompanyContext();
  const qc = useQueryClient();
  const list = useServerFn(listEvents);
  const upsert = useServerFn(upsertEvent);
  const { data } = useQuery({
    queryKey: ["evt_events", activeCompanyId],
    queryFn: () => list({ data: { companyId: activeCompanyId! } }),
    enabled: !!activeCompanyId,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", venue: "", city: "", startsAt: "", endsAt: "", capacity: "",
    transferPolicy: "livre" as "livre" | "com_aprovacao" | "bloqueada",
  });
  const m = useMutation({
    mutationFn: async () =>
      upsert({
        data: {
          companyId: activeCompanyId!,
          title: form.title, slug: form.slug,
          venueName: form.venue || undefined, city: form.city || undefined,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          capacity: form.capacity ? Number(form.capacity) : undefined,
          status: "rascunho", transferPolicy: form.transferPolicy, isPublished: false,
        },
      }),
    onSuccess: () => {
      toast.success("Evento criado");
      setOpen(false);
      setForm({ title: "", slug: "", venue: "", city: "", startsAt: "", endsAt: "", capacity: "", transferPolicy: "livre" });
      qc.invalidateQueries({ queryKey: ["evt_events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!activeCompanyId) return <Card className="p-6">Selecione uma empresa.</Card>;

  return (
    <div className="space-y-4">
      <Card className="p-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> Eventos & Ingressos
          </h1>
          <p className="text-sm text-muted-foreground">Eventos, lotes, emissão, transferência e check-in.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus className="w-4 h-4 mr-1" /> Novo evento
        </Button>
      </Card>

      {open && (
        <Card className="p-5 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug (kebab-case)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></div>
            <div><Label>Local</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Início</Label><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
            <div><Label>Fim</Label><Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
            <div><Label>Capacidade</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
            <div>
              <Label>Política de transferência</Label>
              <Select value={form.transferPolicy} onValueChange={(v) => setForm({ ...form, transferPolicy: v as typeof form.transferPolicy })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre">Livre</SelectItem>
                  <SelectItem value="com_aprovacao">Com aprovação</SelectItem>
                  <SelectItem value="bloqueada">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !form.title || !form.slug || !form.startsAt || !form.endsAt}>
            Criar evento
          </Button>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr><th className="text-left p-3">Evento</th><th className="text-left p-3">Quando</th><th className="text-left p-3">Local</th><th className="text-left p-3">Status</th><th className="text-left p-3">Transferência</th><th></th></tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 font-medium">{e.title}</td>
                <td className="p-3">{new Date(e.starts_at).toLocaleString("pt-BR")}</td>
                <td className="p-3">{e.venue_name ?? "—"} {e.city ? `· ${e.city}` : ""}</td>
                <td className="p-3"><Badge variant="outline">{e.status}</Badge></td>
                <td className="p-3"><Badge variant="secondary">{e.transfer_policy}</Badge></td>
                <td className="p-3 text-right">
                  <Link to="/eventos/$id" params={{ id: e.id }}>
                    <Button size="sm" variant="ghost"><ExternalLink className="w-4 h-4" /></Button>
                  </Link>
                </td>
              </tr>
            ))}
            {(!data || data.items.length === 0) && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum evento ainda.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
