import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Wallet, LockOpen, Lock, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales/cash")({
  head: () => ({ meta: [{ title: "Fechamento de caixa — Vendas" }] }),
  component: Page,
});

const fmt = (n: number) => Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const { companyId } = useActiveCompany();
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [openOpen, setOpenOpen] = useState(false);
  const [openAccount, setOpenAccount] = useState("");
  const [openAmount, setOpenAmount] = useState("0");
  const [openNotes, setOpenNotes] = useState("");
  const [closeId, setCloseId] = useState<string | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ["fin-accounts-active", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_accounts").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });

  const { data: sessions } = useQuery({
    queryKey: ["cash-sessions", companyId], enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_cash_sessions")
        .select("id, status, opened_at, closed_at, opening_amount, closing_amount, expected_total, difference_total, opened_by, closed_by, account_id, notes")
        .eq("company_id", companyId).order("opened_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const openSession = useMutation({
    mutationFn: async () => {
      if (!openAccount) throw new Error("Selecione uma conta");
      if (!me?.user?.id) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("sales_cash_sessions").insert({
        company_id: companyId, account_id: openAccount,
        opened_by: me.user.id,
        opening_amount: Number(openAmount || 0),
        notes: openNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Caixa aberto"); setOpenOpen(false); setOpenAmount("0"); setOpenNotes(""); qc.invalidateQueries({ queryKey: ["cash-sessions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Fechamento de caixa" description="Abertura, fechamento e divergências por operador." action={
        <div className="flex gap-2">
          <CompanyPicker />
          <Button onClick={() => setOpenOpen(true)}><LockOpen className="w-4 h-4 mr-1" />Abrir caixa</Button>
        </div>
      } />

      <Card className="shadow-card">
        <div className="p-4 border-b text-sm font-semibold flex items-center gap-2"><Wallet className="w-4 h-4" />Sessões</div>
        <div className="divide-y">
          {!sessions?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem sessões.</div>}
          {sessions?.map((s) => {
            const acc = accounts?.find((a) => a.id === s.account_id)?.name ?? "—";
            return (
              <div key={s.id} className="p-3 flex flex-wrap items-center gap-3 text-sm">
                <Badge variant={s.status === "open" ? "default" : "secondary"} className="uppercase">
                  {s.status === "open" ? "Aberto" : "Fechado"}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{acc}</div>
                  <div className="text-xs text-muted-foreground">
                    Aberto {new Date(s.opened_at).toLocaleString("pt-BR")}
                    {s.closed_at && <> · Fechado {new Date(s.closed_at).toLocaleString("pt-BR")}</>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Abertura: <span className="font-medium text-foreground">{fmt(Number(s.opening_amount))}</span></div>
                {s.status === "closed" && (
                  <>
                    <div className="text-xs text-muted-foreground">Esperado: <span className="font-medium text-foreground">{fmt(Number(s.expected_total))}</span></div>
                    <div className="text-xs text-muted-foreground">Contado: <span className="font-medium text-foreground">{fmt(Number(s.closing_amount))}</span></div>
                    <div className={`text-xs font-semibold ${Number(s.difference_total) === 0 ? "text-emerald-600" : Number(s.difference_total) > 0 ? "text-amber-600" : "text-red-600"}`}>
                      {Number(s.difference_total) >= 0 ? "+" : ""}{fmt(Number(s.difference_total))}
                    </div>
                  </>
                )}
                {s.status === "open"
                  ? <Button size="sm" onClick={() => setCloseId(s.id)}><Lock className="w-4 h-4 mr-1" />Fechar</Button>
                  : <Button size="sm" variant="outline" asChild><Link to="/sales/cash/$id" params={{ id: s.id }}><Eye className="w-4 h-4 mr-1" />Detalhes</Link></Button>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Open dialog */}
      <Dialog open={openOpen} onOpenChange={setOpenOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abrir caixa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Conta financeira</Label>
              <Select value={openAccount} onValueChange={setOpenAccount}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valor de abertura</Label>
              <Input type="number" step="0.01" value={openAmount} onChange={(e) => setOpenAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Input value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenOpen(false)}>Cancelar</Button>
            <Button onClick={() => openSession.mutate()} disabled={openSession.isPending}>Confirmar abertura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {closeId && <CloseDialog sessionId={closeId} companyId={companyId} onClose={() => setCloseId(null)} />}
    </div>
  );
}

function CloseDialog({ sessionId, companyId, onClose }: { sessionId: string; companyId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const { data: session } = useQuery({
    queryKey: ["cash-session", sessionId],
    queryFn: async () => (await supabase.from("sales_cash_sessions").select("*").eq("id", sessionId).single()).data,
  });

  const { data: methods } = useQuery({
    queryKey: ["fin-methods-active", companyId],
    queryFn: async () => (await supabase.from("fin_payment_methods").select("id,name,code").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });

  const { data: preview } = useQuery({
    queryKey: ["cash-session-preview", sessionId, session?.opened_at, session?.opened_by, session?.account_id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_payments")
        .select("amount, payment_method_id, sales_orders!inner(status, confirmed_at, created_by, company_id)")
        .eq("account_id", session!.account_id)
        .eq("sales_orders.company_id", companyId)
        .eq("sales_orders.status", "confirmed")
        .eq("sales_orders.created_by", session!.opened_by)
        .gte("sales_orders.confirmed_at", session!.opened_at);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        if (!r.payment_method_id) return;
        map[r.payment_method_id] = (map[r.payment_method_id] ?? 0) + Number(r.amount);
      });
      return map;
    },
  });

  const closeMut = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(counts).map(([payment_method_id, v]) => ({
        payment_method_id, counted_amount: Number(v || 0),
      }));
      const { error } = await supabase.rpc("sales_cash_session_close", {
        _session_id: sessionId,
        _counts: payload,
        _notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Caixa fechado"); qc.invalidateQueries({ queryKey: ["cash-sessions"] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Fechar caixa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Informe os valores contados por método de pagamento. O esperado é calculado a partir das vendas confirmadas pelo operador nesta sessão.</div>
          <div className="border rounded-md divide-y">
            <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium bg-muted/50">
              <div className="col-span-5">Método</div>
              <div className="col-span-3 text-right">Esperado</div>
              <div className="col-span-4 text-right">Contado</div>
            </div>
            {methods?.map((m) => {
              const expected = preview?.[m.id] ?? 0;
              return (
                <div key={m.id} className="grid grid-cols-12 gap-2 p-2 items-center text-sm">
                  <div className="col-span-5">{m.name}</div>
                  <div className="col-span-3 text-right text-muted-foreground">{fmt(expected)}</div>
                  <div className="col-span-4">
                    <Input type="number" step="0.01" className="text-right"
                      value={counts[m.id] ?? ""} placeholder="0,00"
                      onChange={(e) => setCounts((p) => ({ ...p, [m.id]: e.target.value }))} />
                  </div>
                </div>
              );
            })}
            {!methods?.length && <div className="p-3 text-sm text-muted-foreground">Sem métodos cadastrados.</div>}
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>Confirmar fechamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
