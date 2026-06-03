import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Bell, Download, Trash2, FileCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/privacy")({
  head: () => ({ meta: [{ title: "Privacidade & Notificações — Impulsionando" }] }),
  component: PrivacyPage,
});

const CATEGORIES = [
  { code: "agenda", label: "Agenda" },
  { code: "finance", label: "Financeiro" },
  { code: "sales", label: "Vendas" },
  { code: "crm", label: "CRM" },
  { code: "inventory", label: "Estoque" },
  { code: "security", label: "Segurança" },
  { code: "system", label: "Sistema" },
  { code: "marketing", label: "Marketing" },
];

const CHANNELS = [
  { code: "in_app", label: "No app" },
  { code: "email", label: "E-mail" },
  { code: "whatsapp", label: "WhatsApp" },
];

const CONSENT_TYPES = [
  { code: "cookies_analytics", label: "Cookies de análise", desc: "Métricas anônimas para melhorar a plataforma." },
  { code: "cookies_marketing", label: "Cookies de marketing", desc: "Personalização de ofertas e conteúdo." },
  { code: "marketing_comm", label: "Comunicação de marketing", desc: "Novidades, promoções e dicas por e-mail/WhatsApp." },
];

function PrivacyPage() {
  const { data: me } = useCurrentUser();
  const userId = me?.user.id;

  return (
    <div>
      <PageHeader
        title="Privacidade & Notificações"
        description="Gerencie consentimentos, comunicação e seus dados pessoais (LGPD)."
      />

      <Tabs defaultValue="consents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consents"><Shield className="w-4 h-4 mr-1.5" />Consentimentos</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1.5" />Notificações</TabsTrigger>
          <TabsTrigger value="data"><FileCheck className="w-4 h-4 mr-1.5" />Meus dados</TabsTrigger>
        </TabsList>

        <TabsContent value="consents">
          <ConsentsPanel userId={userId} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsPanel userId={userId} />
        </TabsContent>
        <TabsContent value="data">
          <DataRightsPanel userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConsentsPanel({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const { data: consents } = useQuery({
    queryKey: ["my-consents", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgpd_consents")
        .select("consent_type, accepted, accepted_at, revoked_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  function latestFor(type: string) {
    return consents?.find((c) => c.consent_type === type);
  }

  const toggle = useMutation({
    mutationFn: async ({ type, accepted }: { type: string; accepted: boolean }) => {
      if (!userId) return;
      const now = new Date().toISOString();
      const { error } = await supabase.from("lgpd_consents").insert({
        user_id: userId,
        consent_type: type,
        accepted,
        accepted_at: accepted ? now : null,
        revoked_at: accepted ? null : now,
        user_agent: navigator.userAgent,
        terms_version: "1.0",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preferência atualizada");
      qc.invalidateQueries({ queryKey: ["my-consents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="shadow-card divide-y">
      {CONSENT_TYPES.map((c) => {
        const latest = latestFor(c.code);
        const active = !!latest?.accepted && !latest?.revoked_at;
        return (
          <div key={c.code} className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium">{c.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
              {latest && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  Última alteração: {new Date(latest.created_at).toLocaleString("pt-BR")}
                </div>
              )}
            </div>
            <Switch checked={active} onCheckedChange={(b) => toggle.mutate({ type: c.code, accepted: b })} />
          </div>
        );
      })}
    </Card>
  );
}

function NotificationsPanel({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const { data: prefs } = useQuery({
    queryKey: ["my-notif-prefs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("id, category, channel, enabled")
        .is("company_id", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  function isOn(category: string, channel: string) {
    const row = prefs?.find((p) => p.category === category && p.channel === channel);
    return row ? row.enabled : true; // default: ativo
  }

  const toggle = useMutation({
    mutationFn: async ({ category, channel, enabled }: { category: string; channel: string; enabled: boolean }) => {
      if (!userId) return;
      const existing = prefs?.find((p) => p.category === category && p.channel === channel);
      if (existing) {
        const { error } = await supabase
          .from("notification_preferences")
          .update({ enabled })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notification_preferences").insert({
          user_id: userId,
          category,
          channel,
          enabled,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notif-prefs"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="shadow-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="text-left p-3 font-medium">Categoria</th>
            {CHANNELS.map((c) => (
              <th key={c.code} className="text-center p-3 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat) => (
            <tr key={cat.code} className="border-t">
              <td className="p-3 font-medium">{cat.label}</td>
              {CHANNELS.map((ch) => (
                <td key={ch.code} className="p-3 text-center">
                  <Switch
                    checked={isOn(cat.code, ch.code)}
                    onCheckedChange={(b) => toggle.mutate({ category: cat.code, channel: ch.code, enabled: b })}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function DataRightsPanel({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const { data: exports } = useQuery({
    queryKey: ["my-exports", userId],
    enabled: !!userId,
    queryFn: async () => (await supabase.from("data_export_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: deletions } = useQuery({
    queryKey: ["my-deletions", userId],
    enabled: !!userId,
    queryFn: async () => (await supabase.from("data_deletion_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const requestExport = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase.from("data_export_requests").insert({ user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação registrada. Você receberá um e-mail quando estiver pronta.");
      qc.invalidateQueries({ queryKey: ["my-exports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestDeletion = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase.from("data_deletion_requests").insert({ user_id: userId, reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação de exclusão registrada");
      setOpen(false);
      setReason("");
      qc.invalidateQueries({ queryKey: ["my-deletions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-5 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Exportar meus dados</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Receba uma cópia em formato estruturado de todos os seus dados pessoais armazenados na plataforma (Art. 18 LGPD).
        </p>
        <Button onClick={() => requestExport.mutate()} disabled={requestExport.isPending}>
          Solicitar exportação
        </Button>
        {(exports?.length ?? 0) > 0 && (
          <ul className="text-xs space-y-1 pt-2 border-t">
            {exports!.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center justify-between">
                <span>{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                <Badge variant="outline" className="capitalize">{e.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 shadow-card space-y-3 border-destructive/20">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h3 className="font-semibold">Excluir minha conta</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Apaga seus dados pessoais conforme a LGPD. Alguns registros podem ser retidos por obrigação legal.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Solicitar exclusão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar solicitação de exclusão</DialogTitle>
              <DialogDescription>
                Sua conta entrará em fila de revisão. Você pode cancelar enquanto estiver pendente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Conte-nos por que está saindo…" maxLength={500} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => requestDeletion.mutate()} disabled={requestDeletion.isPending}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {(deletions?.length ?? 0) > 0 && (
          <ul className="text-xs space-y-1 pt-2 border-t">
            {deletions!.slice(0, 5).map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <span>{new Date(d.created_at).toLocaleString("pt-BR")}</span>
                <Badge variant="outline" className="capitalize">{d.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
