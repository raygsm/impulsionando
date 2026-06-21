import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/insights/KpiCard";
import {
  Loader2, AlertTriangle, ArrowLeft, Building2, Power, PowerOff,
  Boxes, CreditCard, Receipt, Plug, Activity, ScrollText, Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { fetchTenantDetail, setTenantActiveFn } from "@/lib/tenant-detail.functions";

export const Route = createFileRoute("/_authenticated/admin/tenant/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Tenant ${params.id.slice(0, 8)} — Impulsionando` }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: TenantDetailPage,
});

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const fmtDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleString("pt-BR") : "—");

function TenantDetailPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(fetchTenantDetail);
  const toggleFn = useServerFn(setTenantActiveFn);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"resumo" | "billing" | "modulos" | "integracoes" | "eventos" | "audit">("resumo");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tenant-detail", id],
    queryFn: () => fn({ data: { companyId: id } }),
    staleTime: 30_000,
  });

  const d = data as any;

  async function toggleActive() {
    if (!d) return;
    const next = !d.company.is_active;
    const reason = window.prompt(`Motivo para ${next ? "ativar" : "desativar"} o tenant?`);
    if (reason === null) return;
    try {
      await toggleFn({ data: { companyId: id, active: next, reason: reason || undefined } });
      toast.success(`Tenant ${next ? "ativado" : "desativado"}`);
      qc.invalidateQueries({ queryKey: ["tenant-detail", id] });
      qc.invalidateQueries({ queryKey: ["tenant-cockpit"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/cockpit-tenants">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Cockpit
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      )}
      {error && (
        <Card className="p-4 text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {(error as Error).message}
        </Card>
      )}

      {d && (
        <>
          <PageHeader
            title={d.company.trade_name || d.company.name}
            description={
              [d.company.company_type, d.company.segment, d.company.subdomain]
                .filter(Boolean)
                .join(" · ") || "Tenant do ecossistema Impulsionando"
            }
          />

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={d.company.is_active ? "default" : "destructive"}>
              {d.company.is_active ? "Ativo" : "Inativo"}
            </Badge>
            {d.company.is_demo && <Badge variant="secondary">Demo</Badge>}
            {d.company.is_master && <Badge variant="secondary">Master</Badge>}
            {d.company.environment && <Badge variant="outline">{d.company.environment}</Badge>}
            {d.company.status && <Badge variant="outline">{d.company.status}</Badge>}
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>Atualizar</Button>
              <Button
                size="sm"
                variant={d.company.is_active ? "destructive" : "default"}
                onClick={toggleActive}
              >
                {d.company.is_active ? (
                  <><PowerOff className="h-4 w-4 mr-1" /> Desativar</>
                ) : (
                  <><Power className="h-4 w-4 mr-1" /> Ativar</>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="MRR" value={fmtBRL(d.kpis.mrrBRL)} hint="contratos ativos" />
            <KpiCard label="Receita 30d" value={fmtBRL(d.kpis.revenue30BRL)} hint="captura líquida" />
            <KpiCard label="Receita 90d" value={fmtBRL(d.kpis.revenue90BRL)} />
            <KpiCard label="Clientes" value={d.kpis.customers} hint="customers do tenant" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Módulos" value={`${d.kpis.modulesEnabled}/${d.kpis.modulesTotal}`} hint="habilitados" />
            <KpiCard label="Faturas em aberto" value={d.kpis.invoicesOpen} />
            <KpiCard label="Integrações com erro" value={d.kpis.integrationsErrors} />
            <KpiCard label="Eventos (últimos)" value={d.events.length} hint="amostra recente" />
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border/40">
            {([
              ["resumo", "Resumo", Building2],
              ["billing", "Billing & Faturas", CreditCard],
              ["modulos", "Módulos", Boxes],
              ["integracoes", "Integrações", Plug],
              ["eventos", "Eventos", Activity],
              ["audit", "Audit Trail", ScrollText],
            ] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-2 text-sm flex items-center gap-1.5 border-b-2 -mb-px ${
                  tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {tab === "resumo" && (
            <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Field k="ID" v={d.company.id} />
              <Field k="Documento" v={d.company.document} />
              <Field k="E-mail" v={d.company.email} />
              <Field k="Telefone" v={d.company.phone} />
              <Field k="WhatsApp" v={d.company.whatsapp} />
              <Field k="Subdomínio" v={d.company.subdomain} />
              <Field k="Domínio" v={d.company.domain} />
              <Field k="Cidade/UF" v={[d.company.address_city, d.company.address_state].filter(Boolean).join(" / ")} />
              <Field k="Status comercial" v={d.company.status_commercial} />
              <Field k="Status financeiro" v={d.company.status_financial} />
              <Field k="Status técnico" v={d.company.status_technical} />
              <Field k="Criado em" v={fmtDate(d.company.created_at)} />
            </Card>
          )}

          {tab === "billing" && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Contratos</h3>
                {d.contracts.length === 0 ? <Empty msg="Nenhum contrato." /> : (
                  <div className="space-y-1.5 text-sm">
                    {d.contracts.map((c: any) => (
                      <div key={c.id} className="grid grid-cols-12 border-b border-border/20 py-1">
                        <div className="col-span-3"><Badge variant="outline">{c.status}</Badge></div>
                        <div className="col-span-3">{fmtBRL(Number(c.recurring_amount ?? 0))}</div>
                        <div className="col-span-3 text-xs text-muted-foreground">Próx: {c.next_due_date ?? "—"}</div>
                        <div className="col-span-3 text-xs text-muted-foreground">Últ. pago: {fmtDate(c.last_paid_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Receipt className="h-4 w-4" /> Faturas ({d.invoices.length})</h3>
                {d.invoices.length === 0 ? <Empty msg="Nenhuma fatura." /> : (
                  <div className="space-y-1 text-sm">
                    {d.invoices.map((i: any) => (
                      <div key={i.id} className="grid grid-cols-12 border-b border-border/20 py-1">
                        <div className="col-span-2"><Badge variant={i.status === "paid" ? "default" : "secondary"}>{i.status}</Badge></div>
                        <div className="col-span-2 text-right">{fmtBRL(Number(i.amount ?? 0))}</div>
                        <div className="col-span-2 text-xs text-muted-foreground">Venc: {i.due_date ?? "—"}</div>
                        <div className="col-span-3 text-xs text-muted-foreground">Pago: {fmtDate(i.paid_at)}</div>
                        <div className="col-span-3 text-xs text-muted-foreground">Período: {i.period_start ?? "—"} → {i.period_end ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              {d.payouts.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Banknote className="h-4 w-4" /> Repasses</h3>
                  <div className="space-y-1 text-sm">
                    {d.payouts.map((p: any, i: number) => (
                      <div key={i} className="grid grid-cols-12 border-b border-border/20 py-1">
                        <div className="col-span-2"><Badge variant="outline">{p.status}</Badge></div>
                        <div className="col-span-3 text-right">{fmtBRL(Number(p.net_cents ?? 0) / 100)}</div>
                        <div className="col-span-3 text-xs text-muted-foreground">{fmtDate(p.period_start)} → {fmtDate(p.period_end)}</div>
                        <div className="col-span-4 text-xs text-muted-foreground">Pago: {fmtDate(p.paid_at)}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {tab === "modulos" && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Boxes className="h-4 w-4" /> Módulos ({d.modules.length})</h3>
              {d.modules.length === 0 ? <Empty msg="Nenhum módulo." /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {d.modules.map((m: any) => (
                    <div key={m.slug} className="border border-border/40 rounded p-2 text-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.slug} · {m.category ?? "—"} {m.version ? `· v${m.version}` : ""}</div>
                      </div>
                      <Badge variant={m.enabled ? "default" : "secondary"}>{m.enabled ? "ativo" : "off"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === "integracoes" && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Plug className="h-4 w-4" /> Integrações</h3>
              {d.integrations.length === 0 ? <Empty msg="Sem integrações." /> : (
                <div className="space-y-1.5 text-sm">
                  {d.integrations.map((i: any, idx: number) => {
                    const ok = i.status === "connected" || i.status === "healthy";
                    return (
                      <div key={idx} className="flex items-center justify-between border-b border-border/20 py-1.5">
                        <div>
                          <div className="font-medium">{i.provider}</div>
                          <div className="text-xs text-muted-foreground">Última verificação: {fmtDate(i.last_check_at)}</div>
                        </div>
                        <Badge variant={ok ? "default" : "destructive"}>{i.status ?? "?"}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {tab === "eventos" && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Activity className="h-4 w-4" /> Eventos recentes</h3>
              {d.events.length === 0 ? <Empty msg="Sem eventos." /> : (
                <div className="space-y-1 text-sm">
                  {d.events.map((e: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 border-b border-border/20 py-1.5">
                      <Badge
                        variant={
                          e.severity === "error" || e.severity === "critical" ? "destructive"
                          : e.severity === "warning" ? "secondary" : "outline"
                        }
                        className="text-xs shrink-0"
                      >
                        {e.severity ?? "info"}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{e.event_type}</div>
                        {e.message && <div className="text-xs text-muted-foreground truncate">{e.message}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{fmtDate(e.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === "audit" && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><ScrollText className="h-4 w-4" /> Audit Trail do tenant</h3>
              {d.audit.length === 0 ? <Empty msg="Sem registros de auditoria." /> : (
                <div className="space-y-1 text-sm">
                  {d.audit.map((a: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 border-b border-border/20 py-1.5">
                      <div className="col-span-3"><Badge variant="outline">{a.action}</Badge></div>
                      <div className="col-span-3 text-xs">{a.entity} {a.entity_id ? `· ${a.entity_id.slice(0,8)}` : ""}</div>
                      <div className="col-span-3 text-xs text-muted-foreground truncate">{a.user_email ?? "—"}</div>
                      <div className="col-span-3 text-xs text-muted-foreground text-right">{fmtDate(a.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/audit-trail">Abrir Audit Trail completo</Link>
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/20 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right truncate max-w-[60%]">{v || "—"}</span>
    </div>
  );
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-sm text-muted-foreground italic">{msg}</div>;
}
