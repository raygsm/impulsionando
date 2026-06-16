import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useActiveCompany } from "@/hooks/use-active-company";
import {
  getEvent, upsertTicketType, issueTickets, transferTicket, cancelTicket, checkInByQr,
  updateTransferPolicy, listTransfers, decideTransfer,
} from "@/lib/events.functions";
import { Ticket, ArrowLeft, QrCode, ShieldCheck, Settings2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/eventos/$id")({
  head: () => ({ meta: [{ title: "Evento" }, { name: "robots", content: "noindex" }] }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { companyId: activeCompanyId } = useActiveCompany();
  const qc = useQueryClient();
  const get = useServerFn(getEvent);
  const upsertTt = useServerFn(upsertTicketType);
  const issue = useServerFn(issueTickets);
  const transfer = useServerFn(transferTicket);
  const cancel = useServerFn(cancelTicket);
  const checkin = useServerFn(checkInByQr);
  const savePolicy = useServerFn(updateTransferPolicy);
  const listTr = useServerFn(listTransfers);
  const decide = useServerFn(decideTransfer);

  const { data } = useQuery({
    queryKey: ["evt_event", id],
    queryFn: () => get({ data: { id } }),
  });

  const { data: transfersData } = useQuery({
    queryKey: ["evt_transfers", id],
    queryFn: () => listTr({ data: { eventId: id } }),
  });

  const [tt, setTt] = useState({ name: "", price: "", quantity: "", perPersonLimit: "5" });
  const [iss, setIss] = useState({ ttId: "", name: "", email: "", phone: "", qty: "1" });
  const [tr, setTr] = useState({ ticketId: "", toName: "", toEmail: "", toPhone: "", toDocument: "" });
  const [qrTok, setQrTok] = useState("");
  const [qrResult, setQrResult] = useState<unknown>(null);
  const [policy, setPolicy] = useState<{
    transferPolicy: "livre" | "com_aprovacao" | "bloqueada";
    transferDeadlineHours: string;
    transferFeeCents: string;
    transferRequiresDocument: boolean;
  } | null>(null);

  const mTt = useMutation({
    mutationFn: () => upsertTt({
      data: {
        companyId: activeCompanyId!, eventId: id,
        name: tt.name, price: Number(tt.price || 0), quantity: Number(tt.quantity || 0),
        perPersonLimit: Number(tt.perPersonLimit || 5),
        isActive: true, sortOrder: 0,
      },
    }),
    onSuccess: () => {
      toast.success("Lote criado");
      setTt({ name: "", price: "", quantity: "", perPersonLimit: "5" });
      qc.invalidateQueries({ queryKey: ["evt_event", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mIssue = useMutation({
    mutationFn: () => issue({
      data: {
        companyId: activeCompanyId!, eventId: id, ticketTypeId: iss.ttId,
        buyerName: iss.name, buyerEmail: iss.email, buyerPhone: iss.phone || undefined,
        quantity: Number(iss.qty || 1),
      },
    }),
    onSuccess: (r) => {
      toast.success(`${r.tickets.length} ingresso(s) emitido(s)`);
      setIss({ ttId: "", name: "", email: "", phone: "", qty: "1" });
      qc.invalidateQueries({ queryKey: ["evt_event", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mTransfer = useMutation({
    mutationFn: () => transfer({
      data: {
        ticketId: tr.ticketId, toName: tr.toName, toEmail: tr.toEmail,
        toPhone: tr.toPhone || undefined,
        toDocument: tr.toDocument || undefined,
      },
    }),
    onSuccess: () => {
      toast.success("Transferência registrada");
      setTr({ ticketId: "", toName: "", toEmail: "", toPhone: "", toDocument: "" });
      qc.invalidateQueries({ queryKey: ["evt_event", id] });
      qc.invalidateQueries({ queryKey: ["evt_transfers", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mCancel = useMutation({
    mutationFn: (ticketId: string) => cancel({ data: { ticketId } }),
    onSuccess: () => {
      toast.success("Ingresso cancelado");
      qc.invalidateQueries({ queryKey: ["evt_event", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mCheckin = useMutation({
    mutationFn: (token: string) => checkin({ data: { qrToken: token } }),
    onSuccess: (r) => {
      setQrResult(r);
      if (r.ok) toast.success(`Check-in OK — ${r.holder}`);
      else toast.error(`Falha: ${r.reason}`);
      qc.invalidateQueries({ queryKey: ["evt_event", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mPolicy = useMutation({
    mutationFn: () => savePolicy({
      data: {
        eventId: id,
        transferPolicy: policy!.transferPolicy,
        transferDeadlineHours: policy!.transferDeadlineHours === ""
          ? null
          : Number(policy!.transferDeadlineHours),
        transferFeeCents: Math.round(Number(policy!.transferFeeCents || 0) * 100),
        transferRequiresDocument: policy!.transferRequiresDocument,
      },
    }),
    onSuccess: () => {
      toast.success("Política de transferência atualizada");
      qc.invalidateQueries({ queryKey: ["evt_event", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDecide = useMutation({
    mutationFn: (v: { transferId: string; decision: "aprovada" | "rejeitada" }) =>
      decide({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.decision === "aprovada" ? "Transferência aprovada" : "Transferência rejeitada");
      qc.invalidateQueries({ queryKey: ["evt_transfers", id] });
      qc.invalidateQueries({ queryKey: ["evt_event", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ev = data?.event;

  useEffect(() => {
    if (ev && !policy) {
      setPolicy({
        transferPolicy: (ev.transfer_policy ?? "livre") as "livre" | "com_aprovacao" | "bloqueada",
        transferDeadlineHours: ev.transfer_deadline_hours == null ? "" : String(ev.transfer_deadline_hours),
        transferFeeCents: ev.transfer_fee_cents == null ? "0" : (Number(ev.transfer_fee_cents) / 100).toFixed(2),
        transferRequiresDocument: !!ev.transfer_requires_document,
      });
    }
  }, [ev, policy]);


  return (
    <div className="space-y-4">
      <Link to="/eventos"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button></Link>
      {ev && (
        <Card className="p-5">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> {ev.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(ev.starts_at).toLocaleString("pt-BR")} → {new Date(ev.ends_at).toLocaleString("pt-BR")} ·
            {" "}{ev.venue_name ?? "—"} · transferência: <Badge variant="secondary">{ev.transfer_policy}</Badge>
          </p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Lotes / Tipos de ingresso</h2>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nome (ex: Pista)" value={tt.name} onChange={(e) => setTt({ ...tt, name: e.target.value })} />
            <Input placeholder="Preço" type="number" value={tt.price} onChange={(e) => setTt({ ...tt, price: e.target.value })} />
            <Input placeholder="Qtd total" type="number" value={tt.quantity} onChange={(e) => setTt({ ...tt, quantity: e.target.value })} />
            <Input placeholder="Limite por pessoa" type="number" value={tt.perPersonLimit} onChange={(e) => setTt({ ...tt, perPersonLimit: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => mTt.mutate()} disabled={!tt.name || !tt.quantity}>Adicionar lote</Button>
          <div className="text-sm">
            {(data?.ticketTypes ?? []).map((t) => (
              <div key={t.id} className="flex justify-between py-1 border-t">
                <span>{t.name}</span>
                <span className="text-muted-foreground">R$ {Number(t.price).toFixed(2)} · {t.quantity_sold}/{t.quantity}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Emitir ingressos</h2>
          <div className="grid grid-cols-2 gap-2">
            <select className="border rounded-md p-2 text-sm bg-background" value={iss.ttId} onChange={(e) => setIss({ ...iss, ttId: e.target.value })}>
              <option value="">Lote…</option>
              {(data?.ticketTypes ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <Input placeholder="Qtd" type="number" value={iss.qty} onChange={(e) => setIss({ ...iss, qty: e.target.value })} />
            <Input placeholder="Nome do comprador" value={iss.name} onChange={(e) => setIss({ ...iss, name: e.target.value })} />
            <Input placeholder="E-mail" value={iss.email} onChange={(e) => setIss({ ...iss, email: e.target.value })} />
            <Input placeholder="Telefone" value={iss.phone} onChange={(e) => setIss({ ...iss, phone: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => mIssue.mutate()} disabled={!iss.ttId || !iss.name || !iss.email}>Emitir</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><QrCode className="w-4 h-4" /> Check-in por QR</h2>
          <p className="text-xs text-muted-foreground">Cole o <code>qr_token</code> do ingresso (do PDF/email/QRCode). A função impede duplo uso.</p>
          <Input placeholder="qr_token" value={qrTok} onChange={(e) => setQrTok(e.target.value)} />
          <Button size="sm" onClick={() => mCheckin.mutate(qrTok)} disabled={!qrTok}>
            <ShieldCheck className="w-4 h-4 mr-1" /> Validar
          </Button>
          {qrResult ? (
            <pre className="text-xs bg-muted/40 p-2 rounded overflow-auto">{JSON.stringify(qrResult, null, 2)}</pre>
          ) : null}
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Transferir ingresso</h2>
          <div className="grid grid-cols-2 gap-2">
            <select className="border rounded-md p-2 text-sm bg-background col-span-2" value={tr.ticketId} onChange={(e) => setTr({ ...tr, ticketId: e.target.value })}>
              <option value="">Ingresso…</option>
              {(data?.tickets ?? []).filter((t) => ["emitido", "transferido"].includes(t.status))
                .map((t) => <option key={t.id} value={t.id}>{t.code} · {t.holder_name}</option>)}
            </select>
            <Input placeholder="Para nome" value={tr.toName} onChange={(e) => setTr({ ...tr, toName: e.target.value })} />
            <Input placeholder="Para e-mail" value={tr.toEmail} onChange={(e) => setTr({ ...tr, toEmail: e.target.value })} />
            <Input placeholder="Para telefone" value={tr.toPhone} onChange={(e) => setTr({ ...tr, toPhone: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => mTransfer.mutate()} disabled={!tr.ticketId || !tr.toName || !tr.toEmail}>Transferir</Button>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b font-semibold">Ingressos ({data?.tickets.length ?? 0})</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr><th className="text-left p-3">Código</th><th className="text-left p-3">Portador</th><th className="text-left p-3">E-mail</th><th className="text-left p-3">Status</th><th className="text-left p-3">Emitido</th><th></th></tr>
          </thead>
          <tbody>
            {(data?.tickets ?? []).map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-mono">{t.code}</td>
                <td className="p-3">{t.holder_name}</td>
                <td className="p-3">{t.holder_email}</td>
                <td className="p-3"><Badge variant="outline">{t.status}</Badge></td>
                <td className="p-3">{new Date(t.issued_at).toLocaleString("pt-BR")}</td>
                <td className="p-3 text-right">
                  {t.status !== "cancelado" && t.status !== "usado" && (
                    <Button size="sm" variant="ghost" onClick={() => mCancel.mutate(t.id)}>Cancelar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
