import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, AlertTriangle, MessageSquare, CreditCard, Boxes, ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/saude")({
  head: () => ({ meta: [{ title: "Saúde do Core — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: SaudePage,
});

function SaudePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["core-saude"],
    queryFn: async () => {
      const [companies, overdueInv, failedMsgs, pendingChecklist, moduleErrors] = await Promise.all([
        supabase.from("companies").select("id, name, is_active, is_master").eq("is_master", false),
        supabase.from("billing_invoices")
          .select("id, company_id, due_date, amount, status")
          .in("status", ["overdue", "open"])
          .order("due_date", { ascending: true })
          .limit(50),
        supabase.from("message_outbox")
          .select("id, company_id, event_code, channel, last_error, created_at")
          .eq("status", "failed")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("onboarding_checklist")
          .select("id, company_id, item_key, status")
          .neq("status", "done")
          .limit(100),
        supabase.from("audit_logs")
          .select("id, company_id, action, entity_id, created_at")
          .like("action", "module.install%failed%")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      const cos = companies.data ?? [];
      const active = cos.filter((c) => c.is_active).length;
      const inactive = cos.length - active;
      return {
        companies: cos,
        active,
        inactive,
        overdueInv: overdueInv.data ?? [],
        failedMsgs: failedMsgs.data ?? [],
        pendingChecklist: pendingChecklist.data ?? [],
        moduleErrors: moduleErrors.data ?? [],
      };
    },
  });

  if (isLoading) return <Card className="p-6">Calculando saúde do sistema…</Card>;
  if (!data) return null;

  const companyMap = new Map(data.companies.map((c) => [c.id, c.name]));

  const pendingByCompany = new Map<string, number>();
  data.pendingChecklist.forEach((p) => {
    pendingByCompany.set(p.company_id, (pendingByCompany.get(p.company_id) ?? 0) + 1);
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Building2} label="Clientes ativos" value={data.active} tone="default" />
        <KpiCard icon={AlertTriangle} label="Clientes inativos" value={data.inactive} tone="warn" />
        <KpiCard icon={CreditCard} label="Faturas em aberto/vencidas" value={data.overdueInv.length} tone="warn" />
        <KpiCard icon={MessageSquare} label="Mensagens com erro" value={data.failedMsgs.length} tone="bad" />
        <KpiCard icon={ClipboardList} label="Checklists pendentes" value={data.pendingChecklist.length} tone="warn" />
        <KpiCard icon={Boxes} label="Erros de instalação" value={data.moduleErrors.length} tone="bad" />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Faturas em aberto / vencidas</h3>
        {data.overdueInv.length === 0 && <p className="text-sm text-muted-foreground">Tudo em dia.</p>}
        <div className="divide-y">
          {data.overdueInv.map((i) => (
            <div key={i.id} className="py-2 text-sm flex items-center gap-2">
              <Link to="/core/cliente/$id" params={{ id: i.company_id }} className="flex-1 min-w-0 hover:underline">
                <div className="font-medium truncate">{companyMap.get(i.company_id) ?? i.company_id}</div>
                <div className="text-xs text-muted-foreground">
                  Venc {new Date(i.due_date).toLocaleDateString("pt-BR")} · R$ {Number(i.amount).toFixed(2)}
                </div>
              </Link>
              <Badge variant={i.status === "overdue" ? "destructive" : "outline"}>{i.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Mensagens com falha</h3>
        {data.failedMsgs.length === 0 && <p className="text-sm text-muted-foreground">Sem falhas recentes.</p>}
        <div className="divide-y">
          {data.failedMsgs.map((m) => (
            <div key={m.id} className="py-2 text-sm">
              <Link
                to="/core/cliente/$id"
                params={{ id: m.company_id ?? "" }}
                className="font-medium hover:underline"
              >
                {m.company_id ? companyMap.get(m.company_id) ?? "—" : "Sem cliente"}
              </Link>
              <div className="text-xs text-muted-foreground">
                {m.event_code} · {m.channel}
              </div>
              {m.last_error && <div className="text-[11px] text-destructive truncate">{m.last_error}</div>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Clientes com checklist pendente</h3>
        {pendingByCompany.size === 0 && <p className="text-sm text-muted-foreground">Todos completos.</p>}
        <div className="divide-y">
          {[...pendingByCompany.entries()].map(([cid, count]) => (
            <Link
              key={cid}
              to="/core/cliente/$id"
              params={{ id: cid }}
              className="py-2 flex items-center justify-between text-sm hover:bg-muted/40"
            >
              <span className="font-medium truncate">{companyMap.get(cid) ?? cid}</span>
              <Badge variant="outline">{count} pendência(s)</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: "default" | "warn" | "bad" }) {
  const toneClass =
    tone === "bad" ? "text-destructive" :
    tone === "warn" ? "text-amber-600" :
    "text-primary";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`w-4 h-4 ${toneClass}`} />
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</div>
    </Card>
  );
}
