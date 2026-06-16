import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/realestate.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Mail, Bell } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil/notificacoes")({
  head: () => ({ meta: [{ title: "Preferências de Notificação" }] }),
  component: Page,
});

type Channel = "in_app" | "email";
type Category = "realestate.approval.submitted" | "realestate.approval.decision";

const CATEGORY_LABEL: Record<Category, { title: string; desc: string }> = {
  "realestate.approval.submitted": {
    title: "Imóveis enviados para aprovação",
    desc: "Você é revisor e quer ser avisado quando um corretor envia um imóvel para análise.",
  },
  "realestate.approval.decision": {
    title: "Decisões sobre seus imóveis",
    desc: "Você enviou um imóvel e quer saber quando ele é aprovado, rejeitado ou recebe pedido de ajustes.",
  },
};

const SUPPRESSION_REASON: Record<string, string> = {
  bounce: "E-mail retornou (caixa inexistente ou cheia)",
  complaint: "Marcado como spam pelo destinatário",
  unsubscribe: "Você optou por sair dos envios",
};

function Page() {
  const qc = useQueryClient();
  const fetchPrefs = useServerFn(getNotificationPreferences);
  const updatePref = useServerFn(updateNotificationPreference);

  const { data, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => fetchPrefs({}),
  });

  const mutate = useMutation({
    mutationFn: (input: { category: Category; channel: Channel; enabled: boolean }) =>
      updatePref({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Preferência salva");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const prefMap = new Map<string, boolean>();
  for (const p of (data?.preferences ?? []) as Array<{ category: string; channel: string; enabled: boolean }>) {
    prefMap.set(`${p.category}:${p.channel}`, p.enabled);
  }
  const isEnabled = (cat: Category, ch: Channel) => prefMap.get(`${cat}:${ch}`) ?? true;

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title="Preferências de notificação"
        description="Escolha como você quer ser avisado sobre cada evento."
      />

      {isLoading ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Carregando…</p></Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Status do seu e-mail</div>
                <div className="text-xs text-muted-foreground">{data?.email ?? "Sem e-mail cadastrado"}</div>
              </div>
              {data?.suppression.suppressed ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Bloqueado: {SUPPRESSION_REASON[data.suppression.reason ?? ""] ?? data.suppression.reason}
                </Badge>
              ) : (
                <Badge variant="secondary">Apto a receber e-mails</Badge>
              )}
            </div>
            {data?.suppression.suppressed && (
              <p className="text-xs text-muted-foreground mt-2">
                Enquanto seu e-mail estiver na lista de supressão, não enviaremos novos e-mails. Notificações no app continuam funcionando.
              </p>
            )}
          </Card>

          <Card className="p-4 divide-y">
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => (
              <div key={cat} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div>
                  <div className="text-sm font-medium">{CATEGORY_LABEL[cat].title}</div>
                  <div className="text-xs text-muted-foreground">{CATEGORY_LABEL[cat].desc}</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <ChannelRow
                    icon={<Bell className="w-4 h-4" />}
                    label="No aplicativo"
                    checked={isEnabled(cat, "in_app")}
                    onChange={(v) => mutate.mutate({ category: cat, channel: "in_app", enabled: v })}
                    disabled={mutate.isPending}
                  />
                  <ChannelRow
                    icon={<Mail className="w-4 h-4" />}
                    label="Por e-mail"
                    checked={isEnabled(cat, "email")}
                    onChange={(v) => mutate.mutate({ category: cat, channel: "email", enabled: v })}
                    disabled={mutate.isPending || !!data?.suppression.suppressed}
                  />
                </div>
              </div>
            ))}
          </Card>

          <p className="text-xs text-muted-foreground">
            Sem alteração, todas as notificações ficam habilitadas. As preferências valem para todas as empresas vinculadas a este usuário.
          </p>
        </>
      )}
    </div>
  );
}

function ChannelRow({
  icon, label, checked, onChange, disabled,
}: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <Label className="flex items-center gap-2 text-sm cursor-pointer">
        {icon}
        {label}
      </Label>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
