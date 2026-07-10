import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getTenant360 } from "@/lib/tenant-360.functions";
import { getTenantInsights } from "@/lib/tenant-insights.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, Package, AlertTriangle, Activity, Mail, Users, Sparkles } from "lucide-react";
import { CoreSection, LoadingState, EmptyState, ErrorState } from "@/components/impulsionando";
import { formatBRL, formatInt, formatDateTime } from "@/lib/format";

type Search = { companyId?: string };

export const Route = createFileRoute("/_authenticated/admin/tenant-360")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    companyId: typeof s.companyId === "string" ? s.companyId : undefined,
  }),
  head: () => ({ meta: [{ title: "Cliente 360° — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Tenant360Page,
});

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

  const insightsFn = useServerFn(getTenantInsights);
  const insights = useMutation({ mutationFn: (cid: string) => insightsFn({ data: { companyId: cid } }) });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" aria-hidden="true" /> Cliente 360°
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada por cliente conectado ao Core: contrato, módulos, suporte, CRM e runtime.
        </p>
      </header>

      <Card className="p-4">
        <label htmlFor="t360-company" className="text-sm font-medium mb-1 block">Selecionar cliente</label>
        <Select value={companyId ?? ""} onValueChange={(v) => navigate({ search: { companyId: v } })}>
          <SelectTrigger id="t360-company" className="max-w-md" aria-label="Selecionar cliente">
            <SelectValue placeholder="Escolha um cliente…" />
          </SelectTrigger>
          <SelectContent>
            {(companiesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {!companyId && (
        <EmptyState
          title="Selecione um cliente para ver o panorama"
          description="Escolha uma empresa conectada ao Core no seletor acima para visualizar contrato, módulos, tickets, atividade de CRM e leads vinculados."
        />
      )}

      {companyId && detail.isLoading && <LoadingState label="Carregando panorama do cliente…" />}

      {companyId && detail.error && (
        <ErrorState
          title="Falha ao carregar panorama do cliente"
          description="Verifique suas permissões ou tente novamente em instantes."
          action={<Button size="sm" variant="outline" onClick={() => detail.refetch()}>Tentar novamente</Button>}
          detail={(detail.error as Error).message}
        />
      )}

      {companyId && detail.data && (
        <>
          <CoreSection title="Indicadores primários">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" aria-hidden="true" /> MRR ativo</div>
                <div className="text-2xl font-bold mt-1 tabular-nums">{formatBRL(detail.data.mrr.active)}</div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4" aria-hidden="true" /> Módulos</div>
                <div className="text-2xl font-bold mt-1 tabular-nums">{formatInt(detail.data.modules.total)}</div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Tickets abertos</div>
                <div className={`text-2xl font-bold mt-1 tabular-nums ${detail.data.tickets.open > 0 ? "text-destructive" : ""}`}>
                  {formatInt(detail.data.tickets.open)}
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="h-4 w-4" aria-hidden="true" /> Eventos 90d</div>
                <div className="text-2xl font-bold mt-1 tabular-nums">{formatInt(detail.data.runtime.length)}</div>
              </Card>
            </div>
          </CoreSection>

          <Card className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Insights de IA
              </h2>
              <Button
                size="sm"
                onClick={() => insights.mutate(companyId!)}
                disabled={insights.isPending}
                aria-label={insights.isPending ? "Analisando cliente" : insights.data ? "Reanalisar cliente" : "Gerar análise do cliente"}
              >
                {insights.isPending ? "Analisando…" : insights.data ? "Reanalisar" : "Gerar análise"}
              </Button>
            </div>
            {insights.data?.error && <p className="text-sm text-destructive" role="alert">{insights.data.error}</p>}
            {insights.data?.insights && (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{insights.data.insights}</div>
            )}
            {!insights.data && !insights.isPending && (
              <p className="text-sm text-muted-foreground">
                Gere uma análise individual baseada em contrato, módulos, suporte e atividade dos últimos 30 dias.
              </p>
            )}
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Tickets recentes
              </h2>
              {detail.data.tickets.recent.length === 0 ? (
                <EmptyState title="Nenhum ticket recente" variant="compact" description="Assim que este cliente abrir um chamado, ele aparecerá aqui." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {detail.data.tickets.recent.map((t: any) => (
                    <li key={t.id} className="flex justify-between border-b pb-2 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{t.subject ?? "(sem assunto)"}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</div>
                      </div>
                      <Badge variant={t.status === "open" ? "destructive" : "outline"}>{t.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" aria-hidden="true" /> Atividade CRM
              </h2>
              {detail.data.crm.length === 0 ? (
                <EmptyState title="Sem atividade de CRM registrada" variant="compact" description="As interações registradas no CRM deste cliente aparecerão aqui." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {detail.data.crm.map((a: any) => (
                    <li key={a.id} className="flex justify-between border-b pb-2 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{a.subject ?? a.type}</div>
                        <div className="text-xs text-muted-foreground">{a.type} · {formatDateTime(a.occurred_at)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" aria-hidden="true" /> Módulos instalados
              </h2>
              {detail.data.modules.all.length === 0 ? (
                <EmptyState title="Nenhum módulo instalado" variant="compact" description="Os módulos ativados para este cliente serão listados aqui." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.data.modules.all.map((m: any) => (
                    <Badge key={m.module_id} variant={m.is_enabled === false ? "outline" : "secondary"}>{m.module_id}</Badge>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" aria-hidden="true" /> Leads vinculados ao e-mail
              </h2>
              {detail.data.leads.length === 0 ? (
                <EmptyState title="Sem leads associados" variant="compact" description="Assim que um lead for capturado com o e-mail deste cliente, ele aparecerá aqui." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {detail.data.leads.map((l: any) => (
                    <li key={l.id} className="flex justify-between border-b pb-2 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{l.email}</div>
                        <div className="text-xs text-muted-foreground">{l.origin ?? "—"} · {l.niche ?? "—"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{formatDateTime(l.created_at)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
