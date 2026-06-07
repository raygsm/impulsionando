import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, MessageCircle, Bell, Pencil } from "lucide-react";
import { COMMUNICATION_EVENTS, EVENT_BY_CODE, type CommChannel } from "@/data/communicationEvents";

type Template = {
  id: string;
  company_id: string | null;
  event_code: string;
  channel: string;
  locale: string;
  subject: string | null;
  body: string;
  is_active: boolean;
};

const CHANNEL_ICON: Record<string, any> = {
  email: Mail,
  whatsapp: MessageCircle,
  in_app: Bell,
};

const CHANNEL_LABEL: Record<string, string> = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  in_app: "In-app",
};

export function ClientCommunicationPanel({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Template | null>(null);
  const [filter, setFilter] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["comm-templates", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .order("event_code", { ascending: true })
        .order("channel", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Template[];
    },
  });

  const { data: outbox } = useQuery({
    queryKey: ["comm-outbox", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_outbox")
        .select("id,event_code,channel,recipient_email,recipient_phone,status,sent_at,created_at,last_error")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Merge: per-event+channel, prefer per-company override over global
  const merged = useMemo(() => {
    const map = new Map<string, Template>();
    (templates ?? []).forEach((t) => {
      const key = `${t.event_code}::${t.channel}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, t);
      } else if (t.company_id && !existing.company_id) {
        map.set(key, t); // override wins
      }
    });
    return Array.from(map.values()).filter((t) =>
      filter
        ? t.event_code.toLowerCase().includes(filter.toLowerCase()) ||
          t.channel.toLowerCase().includes(filter.toLowerCase())
        : true,
    );
  }, [templates, filter]);

  const saveMut = useMutation({
    mutationFn: async (payload: { tpl: Template; subject: string; body: string; is_active: boolean }) => {
      const { tpl, subject, body, is_active } = payload;
      if (tpl.company_id === companyId) {
        const { error } = await supabase
          .from("message_templates")
          .update({ subject, body, is_active })
          .eq("id", tpl.id);
        if (error) throw error;
      } else {
        // Create a per-company override
        const { error } = await supabase.from("message_templates").insert({
          company_id: companyId,
          event_code: tpl.event_code,
          channel: tpl.channel,
          locale: tpl.locale ?? "pt-BR",
          subject,
          body,
          is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Modelo salvo");
      qc.invalidateQueries({ queryKey: ["comm-templates", companyId] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const toggleActive = useMutation({
    mutationFn: async (tpl: Template) => {
      if (tpl.company_id === companyId) {
        const { error } = await supabase
          .from("message_templates")
          .update({ is_active: !tpl.is_active })
          .eq("id", tpl.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("message_templates").insert({
          company_id: companyId,
          event_code: tpl.event_code,
          channel: tpl.channel,
          locale: tpl.locale ?? "pt-BR",
          subject: tpl.subject,
          body: tpl.body,
          is_active: !tpl.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comm-templates", companyId] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  if (isLoading) return <Card className="p-4">Carregando comunicação…</Card>;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold">Modelos de comunicação</h3>
          <Input
            placeholder="Filtrar por evento…"
            className="max-w-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Ative/desative ou personalize o conteúdo enviado por evento. Edições criam uma versão exclusiva deste cliente sem alterar o modelo padrão.
        </p>
        <div className="divide-y">
          {merged.map((t) => {
            const Icon = CHANNEL_ICON[t.channel] ?? Mail;
            const isOverride = t.company_id === companyId;
            return (
              <div key={`${t.event_code}-${t.channel}`} className="flex items-center gap-3 py-2.5 text-sm">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.event_code}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>{CHANNEL_LABEL[t.channel] ?? t.channel}</span>
                    {isOverride && <Badge variant="outline" className="text-[10px] h-4">personalizado</Badge>}
                  </div>
                </div>
                <Switch
                  checked={t.is_active}
                  onCheckedChange={() => toggleActive.mutate(t)}
                />
                <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
          {merged.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Nenhum modelo encontrado.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Histórico de envios (últimos 30)</h3>
        {(!outbox || outbox.length === 0) && (
          <p className="text-sm text-muted-foreground">Nenhum envio registrado.</p>
        )}
        <div className="divide-y">
          {(outbox ?? []).map((m: any) => (
            <div key={m.id} className="py-2 text-sm flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.event_code}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {CHANNEL_LABEL[m.channel] ?? m.channel} ·{" "}
                  {m.recipient_email || m.recipient_phone || "—"}
                </div>
                {m.last_error && (
                  <div className="text-[11px] text-destructive truncate">{m.last_error}</div>
                )}
              </div>
              <Badge
                variant={
                  m.status === "sent"
                    ? "default"
                    : m.status === "failed"
                    ? "destructive"
                    : "outline"
                }
              >
                {m.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.event_code} · {editing && (CHANNEL_LABEL[editing.channel] ?? editing.channel)}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <EditForm
              key={editing.id}
              initial={editing}
              onSave={(vals) => saveMut.mutate({ tpl: editing, ...vals })}
              saving={saveMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditForm({
  initial,
  onSave,
  saving,
}: {
  initial: Template;
  onSave: (v: { subject: string; body: string; is_active: boolean }) => void;
  saving: boolean;
}) {
  const [subject, setSubject] = useState(initial.subject ?? "");
  const [body, setBody] = useState(initial.body ?? "");
  const [isActive, setIsActive] = useState(initial.is_active);

  return (
    <div className="space-y-3">
      {initial.channel === "email" && (
        <div>
          <Label>Assunto</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      )}
      <div>
        <Label>Conteúdo</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Use variáveis como <code>{"{{nome_cliente}}"}</code>, <code>{"{{company_name}}"}</code>, etc.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label className="text-sm">Ativo</Label>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({ subject, body, is_active: isActive })} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </DialogFooter>
    </div>
  );
}
