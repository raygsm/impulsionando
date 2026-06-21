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
import { Ticket, ArrowLeft, QrCode, ShieldCheck, Settings2, Check, X, Download, FileText, Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv, downloadTablePdf } from "@/lib/exports";
import { logExport } from "@/lib/core-export-logs.functions";

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
  const logger = useServerFn(logExport);
  const trackExport = (kind: "csv" | "pdf", scope: string, rowCount: number) =>
    logger({ data: { kind, scope, params: { eventId: id }, rowCount, companyId: activeCompanyId ?? null } }).catch(() => {});

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

  // Ingressos restantes ao vivo: assina mudanças nos tipos de ingresso deste evento
  const [liveOn, setLiveOn] = useState(false);
  useEffect(() => {
    const ch = supabase
      .channel(`evt-types-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "evt_ticket_types", filter: `event_id=eq.${id}` },
        () => { qc.invalidateQueries({ queryKey: ["evt_event", id] }); })
      .on("postgres_changes", { event: "*", schema: "public", table: "evt_tickets", filter: `event_id=eq.${id}` },
        () => { qc.invalidateQueries({ queryKey: ["evt_event", id] }); })
      .subscribe((s) => setLiveOn(s === "SUBSCRIBED"));
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);


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
          <h2 className="font-semibold flex items-center gap-2">
            Lotes / Tipos de ingresso
            <Badge variant="outline" className="gap-1 text-[10px] font-normal">
              <Radio className={`w-3 h-3 ${liveOn ? "text-emerald-500 animate-pulse" : "text-muted-foreground"}`} />
              Ao vivo
            </Badge>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nome (ex: Pista)" value={tt.name} onChange={(e) => setTt({ ...tt, name: e.target.value })} />
            <Input placeholder="Preço" type="number" value={tt.price} onChange={(e) => setTt({ ...tt, price: e.target.value })} />
            <Input placeholder="Qtd total" type="number" value={tt.quantity} onChange={(e) => setTt({ ...tt, quantity: e.target.value })} />
            <Input placeholder="Limite por pessoa" type="number" value={tt.perPersonLimit} onChange={(e) => setTt({ ...tt, perPersonLimit: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => mTt.mutate()} disabled={!tt.name || !tt.quantity}>Adicionar lote</Button>
          <div className="text-sm">
            {(data?.ticketTypes ?? []).map((t) => {
              const sold = Number(t.quantity_sold ?? 0);
              const total = Number(t.quantity ?? 0);
              const remaining = Math.max(0, total - sold);
              const pct = total > 0 ? (sold / total) * 100 : 0;
              const status = remaining <= 0 ? "esgotado" : pct >= 90 ? "ultimos" : pct >= 60 ? "alta" : "ok";
              const cls =
                status === "esgotado" ? "bg-destructive/15 text-destructive" :
                status === "ultimos" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                status === "alta" ? "bg-sky-500/15 text-sky-700 dark:text-sky-400" :
                "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
              const label =
                status === "esgotado" ? "Esgotado" :
                status === "ultimos" ? `${remaining} restantes — últimos!` :
                `${remaining} restantes`;
              return (
                <div key={t.id} className="py-2 border-t">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                    <span>R$ {Number(t.price).toFixed(2)} · vendidos {sold}/{total}</span>
                  </div>
                  <div className="h-1 mt-1 rounded bg-muted overflow-hidden">
                    <div className={`h-full ${status === "esgotado" ? "bg-destructive" : status === "ultimos" ? "bg-amber-500" : status === "alta" ? "bg-sky-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Emitir ingressos</h2>
          <div className="grid grid-cols-2 gap-2">
            <select className="border rounded-md p-2 text-sm bg-background" value={iss.ttId} onChange={(e) => setIss({ ...iss, ttId: e.target.value })}>
              <option value="">Lote…</option>
              {(data?.ticketTypes ?? []).map((t) => {
                const remaining = Math.max(0, Number(t.quantity ?? 0) - Number(t.quantity_sold ?? 0));
                return <option key={t.id} value={t.id} disabled={remaining <= 0}>{t.name} — {remaining > 0 ? `${remaining} restantes` : "esgotado"}</option>;
              })}
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
            <Input
              placeholder={ev?.transfer_requires_document ? "Documento do novo titular *" : "Documento do novo titular (opcional)"}
              value={tr.toDocument}
              onChange={(e) => setTr({ ...tr, toDocument: e.target.value })}
            />
          </div>
          {ev?.transfer_policy === "bloqueada" && (
            <p className="text-xs text-destructive">Transferências bloqueadas pelo organizador.</p>
          )}
          {ev?.transfer_policy === "com_aprovacao" && (
            <p className="text-xs text-muted-foreground">Vai para análise do organizador antes de trocar o titular.</p>
          )}
          {ev?.transfer_fee_cents ? (
            <p className="text-xs text-muted-foreground">
              Taxa: R$ {(Number(ev.transfer_fee_cents) / 100).toFixed(2)}
            </p>
          ) : null}
          <Button
            size="sm"
            onClick={() => mTransfer.mutate()}
            disabled={
              !tr.ticketId || !tr.toName || !tr.toEmail ||
              ev?.transfer_policy === "bloqueada" ||
              (!!ev?.transfer_requires_document && !tr.toDocument)
            }
          >Transferir</Button>
        </Card>

        {policy && (
          <Card className="p-5 space-y-3 md:col-span-2">
            <h2 className="font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Política de transferência (organizador)
            </h2>
            <div className="grid md:grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Modo</Label>
                <select
                  className="border rounded-md p-2 text-sm bg-background w-full"
                  value={policy.transferPolicy}
                  onChange={(e) => setPolicy({ ...policy, transferPolicy: e.target.value as "livre" | "com_aprovacao" | "bloqueada" })}
                >
                  <option value="livre">Livre (aprovação automática)</option>
                  <option value="com_aprovacao">Com aprovação do organizador</option>
                  <option value="bloqueada">Bloqueada</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prazo mínimo antes do evento (h)</Label>
                <Input
                  type="number" min={0} placeholder="ex: 24 — vazio = sem prazo"
                  value={policy.transferDeadlineHours}
                  onChange={(e) => setPolicy({ ...policy, transferDeadlineHours: e.target.value })}
                  disabled={policy.transferPolicy === "bloqueada"}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Taxa por transferência (R$)</Label>
                <Input
                  type="number" min={0} step="0.01"
                  value={policy.transferFeeCents}
                  onChange={(e) => setPolicy({ ...policy, transferFeeCents: e.target.value })}
                  disabled={policy.transferPolicy === "bloqueada"}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Documento obrigatório</Label>
                <div className="flex items-center gap-2 h-10 px-2">
                  <input
                    type="checkbox"
                    checked={policy.transferRequiresDocument}
                    onChange={(e) => setPolicy({ ...policy, transferRequiresDocument: e.target.checked })}
                    disabled={policy.transferPolicy === "bloqueada"}
                  />
                  <span className="text-sm text-muted-foreground">Exigir CPF/RG do novo titular</span>
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => mPolicy.mutate()} disabled={mPolicy.isPending}>
              Salvar política
            </Button>
          </Card>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b font-semibold flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>Transferências ({transfersData?.items.length ?? 0})</span>
            <span className="text-xs text-muted-foreground">
              Pendentes: {(transfersData?.items ?? []).filter((t) => t.status === "pendente").length}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              const rows = (transfersData?.items ?? []).map((t) => ({
                criada_em: new Date(t.created_at).toLocaleString("pt-BR"),
                ingresso: (t as { evt_tickets?: { code?: string } }).evt_tickets?.code ?? "",
                de_nome: t.from_name, de_email: t.from_email,
                para_nome: t.to_name, para_email: t.to_email,
                para_doc: t.to_document ?? "",
                status: t.status,
                taxa_brl: t.fee_cents ? (Number(t.fee_cents) / 100).toFixed(2).replace(".", ",") : "0,00",
                decidida_em: t.decided_at ? new Date(t.decided_at).toLocaleString("pt-BR") : "",
              }));
              downloadCsv(`transferencias-${id}.csv`,
                ["criada_em", "ingresso", "de_nome", "de_email", "para_nome", "para_email", "para_doc", "status", "taxa_brl", "decidida_em"], rows);
              trackExport("csv", "evt_transfers.csv", rows.length);
            }} disabled={!transfersData?.items?.length}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => { downloadTablePdf({
              filename: `transferencias-${id}.pdf`,
              title: `Transferências — ${ev?.title ?? id}`,
              subtitle: `${transfersData?.items?.length ?? 0} registros`,
              columns: [
                { key: "criada", label: "Criada" },
                { key: "ingresso", label: "Ingresso", width: 80 },
                { key: "de", label: "De" },
                { key: "para", label: "Para" },
                { key: "status", label: "Status", width: 80 },
                { key: "taxa", label: "Taxa", align: "right", width: 70 },
              ],
              rows: (transfersData?.items ?? []).map((t) => ({
                criada: new Date(t.created_at).toLocaleString("pt-BR"),
                ingresso: (t as { evt_tickets?: { code?: string } }).evt_tickets?.code ?? "—",
                de: `${t.from_name} <${t.from_email}>`,
                para: `${t.to_name} <${t.to_email}>`,
                status: t.status,
                taxa: t.fee_cents ? `R$ ${(Number(t.fee_cents) / 100).toFixed(2)}` : "—",
              })),
            }); trackExport("pdf", "evt_transfers.pdf", transfersData?.items?.length ?? 0); }} disabled={!transfersData?.items?.length}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Quando</th>
              <th className="text-left p-3">Ingresso</th>
              <th className="text-left p-3">De</th>
              <th className="text-left p-3">Para</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Taxa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(transfersData?.items ?? []).map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 text-xs">{new Date(t.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-3 font-mono text-xs">{(t as { evt_tickets?: { code?: string } }).evt_tickets?.code ?? "—"}</td>
                <td className="p-3 text-xs">{t.from_name}<br /><span className="text-muted-foreground">{t.from_email}</span></td>
                <td className="p-3 text-xs">{t.to_name}<br /><span className="text-muted-foreground">{t.to_email}</span>{t.to_document ? <><br /><span className="text-muted-foreground">Doc: {t.to_document}</span></> : null}</td>
                <td className="p-3"><Badge variant={t.status === "aprovada" ? "default" : t.status === "rejeitada" ? "destructive" : "secondary"}>{t.status}</Badge></td>
                <td className="p-3 text-xs">{t.fee_cents ? `R$ ${(Number(t.fee_cents) / 100).toFixed(2)}` : "—"}</td>
                <td className="p-3 text-right">
                  {t.status === "pendente" && (
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => mDecide.mutate({ transferId: t.id, decision: "aprovada" })}>
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => mDecide.mutate({ transferId: t.id, decision: "rejeitada" })}>
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(!transfersData?.items || transfersData.items.length === 0) && (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">Nenhuma transferência registrada.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b font-semibold flex items-center justify-between flex-wrap gap-2">
          <span>Check-ins ({data?.checkins.length ?? 0})</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              const ticketByCode = new Map((data?.tickets ?? []).map((t) => [t.id, t]));
              const rows = (data?.checkins ?? []).map((c) => {
                const tk = ticketByCode.get(c.ticket_id);
                return {
                  quando: new Date(c.checked_in_at).toLocaleString("pt-BR"),
                  ingresso: tk?.code ?? "",
                  portador: tk?.holder_name ?? "",
                  email: tk?.holder_email ?? "",
                  portao: c.gate ?? "",
                };
              });
              downloadCsv(`checkins-${id}.csv`, ["quando", "ingresso", "portador", "email", "portao"], rows);
              trackExport("csv", "evt_checkins.csv", rows.length);
            }} disabled={!data?.checkins?.length}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const ticketByCode = new Map((data?.tickets ?? []).map((t) => [t.id, t]));
              downloadTablePdf({
                filename: `checkins-${id}.pdf`,
                title: `Check-ins — ${ev?.title ?? id}`,
                subtitle: `${data?.checkins.length ?? 0} entradas registradas`,
                columns: [
                  { key: "quando", label: "Quando", width: 140 },
                  { key: "ingresso", label: "Ingresso", width: 90 },
                  { key: "portador", label: "Portador" },
                  { key: "email", label: "E-mail" },
                  { key: "portao", label: "Portão", width: 80 },
                ],
                rows: (data?.checkins ?? []).map((c) => {
                  const tk = ticketByCode.get(c.ticket_id);
                  return {
                    quando: new Date(c.checked_in_at).toLocaleString("pt-BR"),
                    ingresso: tk?.code ?? "—",
                    portador: tk?.holder_name ?? "—",
                    email: tk?.holder_email ?? "—",
                    portao: c.gate ?? "—",
                  };
                }),
              });
              trackExport("pdf", "evt_checkins.pdf", data?.checkins?.length ?? 0);
            }} disabled={!data?.checkins?.length}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr><th className="text-left p-3">Quando</th><th className="text-left p-3">Ingresso</th><th className="text-left p-3">Portão</th></tr>
          </thead>
          <tbody>
            {(data?.checkins ?? []).map((c) => {
              const tk = (data?.tickets ?? []).find((x) => x.id === c.ticket_id);
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-3 text-xs">{new Date(c.checked_in_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3 font-mono text-xs">{tk?.code ?? "—"} <span className="text-muted-foreground">{tk?.holder_name ?? ""}</span></td>
                  <td className="p-3 text-xs">{c.gate ?? "—"}</td>
                </tr>
              );
            })}
            {(!data?.checkins || data.checkins.length === 0) && (
              <tr><td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">Nenhum check-in registrado.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

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
