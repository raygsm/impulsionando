import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getTenant360 } from "@/lib/tenant-360.functions";
import { getTenantInsights } from "@/lib/tenant-insights.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, Package, AlertTriangle, Activity, Mail, Users, Sparkles } from "lucide-react";

type Search = { companyId?: string };

export const Route = createFileRoute("/_authenticated/admin/tenant-360")({
  validateSearch: (s: Record<string, unknown>): Search => ({ companyId: typeof s.companyId === "string" ? s.companyId : undefined }),
  head: () => ({ meta: [{ title: "Tenant 360 — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Tenant360Page,
});

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString("pt-BR") : "—";

function Tenant360Page() {
  const { companyId } = useSearch({ from: "/_authenticated/admin/tenant-360" });
  const navigate = Route.useNavigate();

  const companiesQuery = useQuery({
    queryKey: ["t360-companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name").eq("is_active", true).order("name").limit(500);
      return data ?? [];
    },
  });

  const fn = useServerFn(getTenant360);
  const detail = useQuery({
    queryKey: ["tenant-360", companyId],
    queryFn: () => fn({ data: { companyId: companyId! } }),
    enabled: Boolean(companyId),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" /> Tenant 360º</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada por tenant: contrato, módulos, suporte, CRM e runtime.</p>
      </div>

      <Card className="p-4">
        <label className="text-sm font-medium mb-1 block">Selecionar tenant</label>
        <Select value={companyId ?? ""} onValueChange={(v) => navigate({ search: { companyId: v } })}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder="Escolha um tenant…" /></SelectTrigger>
          <SelectContent>
            {(companiesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {!companyId && <Card className="p-6 text-sm text-muted-foreground">Selecione um tenant para ver o panorama.</Card>}
      {companyId && detail.isLoading && <Skeleton className="h-96" />}
      {companyId && detail.data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" /> MRR ativo</div><div className="text-2xl font-bold mt-1">{fmtBRL(detail.data.mrr.active)}</div></Card>
            <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4" /> Módulos</div><div className="text-2xl font-bold mt-1">{detail.data.modules.total}</div></Card>
            <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" /> Tickets abertos</div><div className="text-2xl font-bold mt-1">{detail.data.tickets.open}</div></Card>
            <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="h-4 w-4" /> Eventos 90d</div><div className="text-2xl font-bold mt-1">{detail.data.runtime.length}</div></Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Tickets recentes</h2>
              <div className="space-y-2 text-sm">
                {detail.data.tickets.recent.length === 0 && <p className="text-muted-foreground">Nenhum ticket.</p>}
                {detail.data.tickets.recent.map((t: any) => (
                  <div key={t.id} className="flex justify-between border-b pb-2 last:border-0">
                    <div className="truncate"><div className="font-medium truncate">{t.subject ?? "(sem assunto)"}</div><div className="text-xs text-muted-foreground">{fmtDate(t.created_at)}</div></div>
                    <Badge variant={t.status === "open" ? "destructive" : "outline"}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Atividade CRM</h2>
              <div className="space-y-2 text-sm">
                {detail.data.crm.length === 0 && <p className="text-muted-foreground">Sem atividade.</p>}
                {detail.data.crm.map((a: any) => (
                  <div key={a.id} className="flex justify-between border-b pb-2 last:border-0">
                    <div className="truncate"><div className="font-medium truncate">{a.subject ?? a.type}</div><div className="text-xs text-muted-foreground">{a.type} · {fmtDate(a.occurred_at)}</div></div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Módulos instalados</h2>
              <div className="flex flex-wrap gap-2">
                {detail.data.modules.all.map((m: any) => (
                  <Badge key={m.module_id} variant={m.is_enabled === false ? "outline" : "secondary"}>{m.module_id}</Badge>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Mail className="h-4 w-4" /> Leads vinculados ao e-mail</h2>
              <div className="space-y-2 text-sm">
                {detail.data.leads.length === 0 && <p className="text-muted-foreground">Sem leads associados.</p>}
                {detail.data.leads.map((l: any) => (
                  <div key={l.id} className="flex justify-between border-b pb-2 last:border-0">
                    <div className="truncate"><div className="font-medium truncate">{l.email}</div><div className="text-xs text-muted-foreground">{l.origin ?? "—"} · {l.niche ?? "—"}</div></div>
                    <div className="text-xs text-muted-foreground">{fmtDate(l.created_at)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
