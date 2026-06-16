import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useActiveCompany } from "@/hooks/use-active-company";
import {
  getCommunity, upsertMember, createMembership, markMembershipPaid, recordAttendance, recordDonation,
} from "@/lib/community.functions";
import { Users, ArrowLeft, HandCoins, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/comunidade/$id")({
  head: () => ({ meta: [{ title: "Comunidade" }, { name: "robots", content: "noindex" }] }),
  component: CommDetail,
});

function CommDetail() {
  const { id } = Route.useParams();
  const { companyId: activeCompanyId } = useActiveCompany();
  const qc = useQueryClient();
  const get = useServerFn(getCommunity);
  const upM = useServerFn(upsertMember);
  const newMb = useServerFn(createMembership);
  const payMb = useServerFn(markMembershipPaid);
  const att = useServerFn(recordAttendance);
  const don = useServerFn(recordDonation);

  const { data } = useQuery({
    queryKey: ["comm_detail", id],
    queryFn: () => get({ data: { id } }),
  });
  const [mem, setMem] = useState({ name: "", email: "", phone: "" });
  const [mb, setMb] = useState({ memberId: "", year: new Date().getFullYear(), month: new Date().getMonth() + 1, amount: "", dueDate: "" });
  const [at, setAt] = useState({ memberId: "", eventName: "", eventDate: "", status: "presente" as "presente" | "ausente" | "justificado" });
  const [dn, setDn] = useState({ donorName: "", amount: "", purpose: "" });

  const refresh = () => qc.invalidateQueries({ queryKey: ["comm_detail", id] });

  const mMem = useMutation({
    mutationFn: () => upM({
      data: { companyId: activeCompanyId!, communityId: id, name: mem.name, email: mem.email || undefined, phone: mem.phone || undefined },
    }),
    onSuccess: () => { toast.success("Membro adicionado"); setMem({ name: "", email: "", phone: "" }); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mMb = useMutation({
    mutationFn: () => newMb({
      data: {
        companyId: activeCompanyId!, communityId: id, memberId: mb.memberId,
        year: Number(mb.year), month: Number(mb.month), amount: Number(mb.amount || 0),
        dueDate: mb.dueDate,
      },
    }),
    onSuccess: () => { toast.success("Mensalidade gerada"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mAt = useMutation({
    mutationFn: () => att({
      data: {
        companyId: activeCompanyId!, communityId: id, memberId: at.memberId,
        eventName: at.eventName, eventDate: at.eventDate, status: at.status,
      },
    }),
    onSuccess: () => { toast.success("Presença registrada"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDn = useMutation({
    mutationFn: () => don({
      data: {
        companyId: activeCompanyId!, communityId: id,
        donorName: dn.donorName, amount: Number(dn.amount || 0), purpose: dn.purpose || undefined,
      },
    }),
    onSuccess: () => { toast.success("Doação registrada"); setDn({ donorName: "", amount: "", purpose: "" }); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const c = data?.community;

  return (
    <div className="space-y-4">
      <Link to="/comunidade"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button></Link>
      {c && (
        <Card className="p-5">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> {c.name} <Badge variant="secondary">{c.kind}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Mensalidade padrão R$ {Number(c.monthly_fee).toFixed(2)} · {c.accepts_donations ? "aceita doações" : "sem doações"}
          </p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Adicionar membro</h2>
          <Input placeholder="Nome" value={mem.name} onChange={(e) => setMem({ ...mem, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="E-mail" value={mem.email} onChange={(e) => setMem({ ...mem, email: e.target.value })} />
            <Input placeholder="Telefone" value={mem.phone} onChange={(e) => setMem({ ...mem, phone: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => mMem.mutate()} disabled={!mem.name}>Adicionar</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Gerar mensalidade</h2>
          <select className="border rounded-md p-2 text-sm bg-background w-full" value={mb.memberId} onChange={(e) => setMb({ ...mb, memberId: e.target.value })}>
            <option value="">Membro…</option>
            {(data?.members ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="grid grid-cols-4 gap-2">
            <Input placeholder="Ano" type="number" value={mb.year} onChange={(e) => setMb({ ...mb, year: Number(e.target.value) })} />
            <Input placeholder="Mês" type="number" value={mb.month} onChange={(e) => setMb({ ...mb, month: Number(e.target.value) })} />
            <Input placeholder="Valor" type="number" value={mb.amount} onChange={(e) => setMb({ ...mb, amount: e.target.value })} />
            <Input type="date" value={mb.dueDate} onChange={(e) => setMb({ ...mb, dueDate: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => mMb.mutate()} disabled={!mb.memberId || !mb.amount || !mb.dueDate}>Gerar</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><CalendarCheck className="w-4 h-4" /> Registrar presença</h2>
          <select className="border rounded-md p-2 text-sm bg-background w-full" value={at.memberId} onChange={(e) => setAt({ ...at, memberId: e.target.value })}>
            <option value="">Membro…</option>
            {(data?.members ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Encontro" value={at.eventName} onChange={(e) => setAt({ ...at, eventName: e.target.value })} />
            <Input type="date" value={at.eventDate} onChange={(e) => setAt({ ...at, eventDate: e.target.value })} />
            <select className="border rounded-md p-2 text-sm bg-background" value={at.status} onChange={(e) => setAt({ ...at, status: e.target.value as typeof at.status })}>
              <option value="presente">Presente</option><option value="ausente">Ausente</option><option value="justificado">Justificado</option>
            </select>
          </div>
          <Button size="sm" onClick={() => mAt.mutate()} disabled={!at.memberId || !at.eventName || !at.eventDate}>Registrar</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><HandCoins className="w-4 h-4" /> Registrar doação</h2>
          <Input placeholder="Doador" value={dn.donorName} onChange={(e) => setDn({ ...dn, donorName: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Valor" type="number" value={dn.amount} onChange={(e) => setDn({ ...dn, amount: e.target.value })} />
            <Input placeholder="Finalidade" value={dn.purpose} onChange={(e) => setDn({ ...dn, purpose: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => mDn.mutate()} disabled={!dn.donorName || !dn.amount}>Registrar</Button>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b font-semibold">Membros ({data?.members.length ?? 0})</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">E-mail</th><th className="text-left p-3">Status</th><th className="text-left p-3">Desde</th></tr>
          </thead>
          <tbody>
            {(data?.members ?? []).map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3">{m.name}</td>
                <td className="p-3">{m.email ?? "—"}</td>
                <td className="p-3"><Badge variant="outline">{m.status}</Badge></td>
                <td className="p-3">{new Date(m.member_since).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b font-semibold">Mensalidades ({data?.memberships.length ?? 0})</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase"><tr><th className="text-left p-3">Período</th><th className="text-left p-3">Valor</th><th className="text-left p-3">Status</th><th></th></tr></thead>
            <tbody>
              {(data?.memberships ?? []).map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{String(m.period_month).padStart(2, "0")}/{m.period_year}</td>
                  <td className="p-3">R$ {Number(m.amount).toFixed(2)}</td>
                  <td className="p-3"><Badge variant="outline">{m.status}</Badge></td>
                  <td className="p-3 text-right">
                    {m.status === "em_aberto" && (
                      <Button size="sm" variant="ghost" onClick={() => payMb({ data: { id: m.id } }).then(() => { toast.success("Pago"); refresh(); }).catch((e: Error) => toast.error(e.message))}>Marcar pago</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b font-semibold">Doações ({data?.donations.length ?? 0})</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase"><tr><th className="text-left p-3">Doador</th><th className="text-left p-3">Valor</th><th className="text-left p-3">Finalidade</th><th className="text-left p-3">Quando</th></tr></thead>
            <tbody>
              {(data?.donations ?? []).map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.donor_name}</td>
                  <td className="p-3">R$ {Number(d.amount).toFixed(2)}</td>
                  <td className="p-3">{d.purpose ?? "—"}</td>
                  <td className="p-3">{new Date(d.received_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
