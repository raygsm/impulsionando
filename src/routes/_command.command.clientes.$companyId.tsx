import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CommandPage } from "@/components/command/CommandPage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchTenantDetail } from "@/lib/tenant-detail.functions";
import { ArrowLeft, Building2 } from "lucide-react";

type Search = { tab?: string };

export const Route = createFileRoute("/_command/command/clientes/$companyId")({
  head: () => ({ meta: [{ title: "Cliente · Command" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
  }),
  component: Page,
});

const TABS = [
  { id: "overview", label: "Visão Geral" },
  { id: "cadastro", label: "Cadastro" },
  { id: "plano", label: "Plano" },
  { id: "usuarios", label: "Usuários" },
  { id: "permissoes", label: "Permissões" },
  { id: "nichos", label: "Nichos" },
  { id: "health", label: "Health Score" },
] as const;

function Page() {
  const { companyId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = search.tab ?? "overview";

  const fetchDetail = useServerFn(fetchTenantDetail);
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant-detail", companyId],
    queryFn: () => fetchDetail({ data: { companyId } }),
    staleTime: 30_000,
  });

  const company: any = (data as any)?.company ?? null;

  return (
    <CommandPage
      title={company?.trade_name || company?.name || "Cliente"}
      description={company?.segment || "Workspace do tenant"}
      actions={
        <Link
          to="/command/clientes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      }
    >
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Falha ao carregar: {(error as Error).message}
        </div>
      )}
      {isLoading && !company && (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Carregando…</div>
      )}

      {company && (
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
          {company.logo_url ? (
            <img src={company.logo_url} alt="" className="w-14 h-14 rounded-lg object-cover border" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold truncate">{company.trade_name || company.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {company.email || "—"} · {company.document || "sem CNPJ"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline">{company.status}</Badge>
            <span className="text-[10px] text-muted-foreground uppercase">{company.environment}</span>
          </div>
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => navigate({ search: { tab: v }, replace: true })}
      >
        <TabsList className="flex-wrap h-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <OverviewTab data={data} />
        </TabsContent>
        <TabsContent value="cadastro" className="mt-4">
          <CadastroTab company={company} />
        </TabsContent>
        <TabsContent value="plano" className="mt-4">
          <PlanoTab data={data} />
        </TabsContent>
        <TabsContent value="usuarios" className="mt-4">
          <UsuariosTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="permissoes" className="mt-4">
          <PlaceholderTab title="Permissões" hint="Perfis, papéis e ACL em construção nas próximas ondas." />
        </TabsContent>
        <TabsContent value="nichos" className="mt-4">
          <NichosTab company={company} />
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          <HealthTab data={data} />
        </TabsContent>
      </Tabs>
    </CommandPage>
  );
}

function OverviewTab({ data }: { data: any }) {
  const invoices = data?.invoices ?? [];
  const events = data?.events ?? [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Últimas faturas">
        {invoices.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem faturas.</p>
        ) : (
          <ul className="divide-y">
            {invoices.slice(0, 5).map((i: any) => (
              <li key={i.id} className="py-2 flex justify-between text-sm">
                <span>{new Date(i.created_at).toLocaleDateString("pt-BR")}</span>
                <span className="tabular-nums">R$ {((i.amount ?? 0) / 100).toFixed(2)}</span>
                <Badge variant="outline">{i.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Eventos recentes">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem eventos.</p>
        ) : (
          <ul className="divide-y">
            {events.slice(0, 6).map((e: any, idx: number) => (
              <li key={idx} className="py-2 text-xs">
                <div className="font-medium">{e.event_type}</div>
                <div className="text-muted-foreground truncate">{e.message ?? "—"}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CadastroTab({ company }: { company: any }) {
  if (!company) return <p className="text-sm text-muted-foreground">—</p>;
  const rows: [string, string | null | undefined][] = [
    ["Razão social", company.legal_name],
    ["Nome fantasia", company.trade_name],
    ["CNPJ", company.document],
    ["E-mail", company.email],
    ["Telefone", company.phone],
    ["WhatsApp", company.whatsapp],
    ["Website", company.website],
    ["Domínio", company.domain],
    ["Cidade", company.address_city],
    ["Estado", company.address_state],
    ["Responsável", company.owner_name],
  ];
  return (
    <Card title="Dados cadastrais">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function PlanoTab({ data }: { data: any }) {
  const contracts = data?.contracts ?? [];
  const modules = data?.modules ?? [];
  return (
    <div className="space-y-4">
      <Card title="Contratos">
        {contracts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem contratos.</p>
        ) : (
          <ul className="divide-y">
            {contracts.map((c: any) => (
              <li key={c.id} className="py-2 flex justify-between text-sm">
                <span>{c.plan_name || c.id.slice(0, 8)}</span>
                <Badge variant="outline">{c.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title={`Módulos habilitados (${modules.filter((m: any) => m.is_enabled).length})`}>
        <div className="flex flex-wrap gap-2">
          {modules.map((m: any) => (
            <Badge key={m.module_id} variant={m.is_enabled ? "default" : "outline"}>
              {m.module_id}
            </Badge>
          ))}
          {modules.length === 0 && <p className="text-xs text-muted-foreground">Nenhum módulo.</p>}
        </div>
      </Card>
    </div>
  );
}

function UsuariosTab({ companyId }: { companyId: string }) {
  return (
    <PlaceholderTab
      title="Usuários"
      hint={`Listagem de usuários do tenant ${companyId.slice(0, 8)}… — próxima onda integra à tela de gestão de acessos.`}
    />
  );
}

function NichosTab({ company }: { company: any }) {
  return (
    <Card title="Nicho">
      <div className="text-sm">
        <div className="text-xs text-muted-foreground">Segmento</div>
        <div className="font-medium">{company?.segment || "—"}</div>
        <div className="text-xs text-muted-foreground mt-3">Nicho demo</div>
        <div className="font-medium">{company?.demo_niche || "—"}</div>
      </div>
    </Card>
  );
}

function HealthTab({ data }: { data: any }) {
  const events = data?.events ?? [];
  const errors = events.filter((e: any) => e.severity === "error").length;
  const score = Math.max(0, 100 - errors * 5);
  return (
    <Card title="Health Score">
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-semibold tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {errors} eventos de erro recentes · saúde calculada em tempo real.
      </p>
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function PlaceholderTab({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
