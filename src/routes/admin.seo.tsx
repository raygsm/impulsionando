import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listGscSitesFn,
  querySearchAnalyticsFn,
  inspectUrlFn,
  type GscSite,
  type GscQueryRow,
} from "@/lib/search-console.functions";
import { validateJsonLd, type JsonLdResult } from "@/lib/seo-jsonld";
import { auditRouteFn, listRouteAuditsFn } from "@/lib/seo-audit.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, AlertTriangle, ExternalLink, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/seo")({
  head: () => ({
    meta: [
      { title: "Painel SEO — Search Console | Impulsionando Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSeoPanel,
});

type Dim = "query" | "page";

function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
function fmtNum(n: number) {
  return Math.round(n).toLocaleString("pt-BR");
}
function fmtPos(n: number) {
  return n.toFixed(1);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function AdminSeoPanel() {
  const listSites = useServerFn(listGscSitesFn);
  const runQuery = useServerFn(querySearchAnalyticsFn);

  const sitesQ = useQuery({
    queryKey: ["gsc", "sites"],
    queryFn: () => listSites({ data: undefined as unknown as never }),
    retry: false,
  });

  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [dim, setDim] = useState<Dim>("query");
  const [days, setDays] = useState(28);

  const effectiveSite = siteUrl ?? sitesQ.data?.[0]?.siteUrl ?? null;

  const analyticsQ = useQuery<GscQueryRow[]>({
    queryKey: ["gsc", "analytics", effectiveSite, dim, days],
    enabled: Boolean(effectiveSite),
    queryFn: () =>
      runQuery({
        data: {
          siteUrl: effectiveSite!,
          startDate: daysAgo(days),
          endDate: daysAgo(1),
          dimensions: [dim],
          rowLimit: 25,
        },
      }),
    retry: false,
  });

  const totals = useMemo(() => {
    const rows = analyticsQ.data ?? [];
    return {
      clicks: rows.reduce((s, r) => s + r.clicks, 0),
      impressions: rows.reduce((s, r) => s + r.impressions, 0),
      avgPos:
        rows.length > 0
          ? rows.reduce((s, r) => s + r.position, 0) / rows.length
          : 0,
    };
  }, [analyticsQ.data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Search className="size-5" /> Painel SEO — Search Console
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dados diretos do Google Search Console conectado. Somente admins.
            </p>
          </div>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Abrir GSC <ExternalLink className="size-3.5" />
          </a>
        </header>

        {sitesQ.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando propriedades…
          </div>
        )}

        {sitesQ.error && (
          <Card className="p-4 border-destructive/40 bg-destructive/5 flex gap-3">
            <AlertTriangle className="size-5 text-destructive shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">
                Não foi possível carregar as propriedades.
              </p>
              <p className="text-muted-foreground mt-1">
                {(sitesQ.error as Error).message}
              </p>
              <p className="text-muted-foreground mt-2">
                Verifique a conexão Google Search Console em <b>Connectors</b>{" "}
                do workspace e reautentique se necessário.
              </p>
            </div>
          </Card>
        )}

        {sitesQ.data && sitesQ.data.length === 0 && (
          <Card className="p-4">
            <p className="text-sm">
              Nenhuma propriedade verificada nesta conta Google. Verifique um
              domínio no{" "}
              <a
                href="https://search.google.com/search-console"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                Google Search Console
              </a>{" "}
              antes de consultar aqui.
            </p>
          </Card>
        )}

        {sitesQ.data && sitesQ.data.length > 0 && (
          <Tabs defaultValue="analytics">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="inspect">Inspeção de URL</TabsTrigger>
              <TabsTrigger value="audit">Auditoria de rota</TabsTrigger>
              <TabsTrigger value="jsonld">Validador JSON-LD</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="mt-4 space-y-4">
              <Card className="p-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Propriedade</Label>
                  <select
                    className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                    value={effectiveSite ?? ""}
                    onChange={(e) => setSiteUrl(e.target.value)}
                  >
                    {sitesQ.data.map((s: GscSite) => (
                      <option key={s.siteUrl} value={s.siteUrl}>
                        {s.siteUrl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Dimensão</Label>
                  <select
                    className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                    value={dim}
                    onChange={(e) => setDim(e.target.value as Dim)}
                  >
                    <option value="query">Consultas (queries)</option>
                    <option value="page">Páginas</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Período</Label>
                  <select
                    className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    <option value={7}>Últimos 7 dias</option>
                    <option value={28}>Últimos 28 dias</option>
                    <option value={90}>Últimos 90 dias</option>
                  </select>
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Cliques</p>
                  <p className="text-2xl font-semibold">{fmtNum(totals.clicks)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Impressões</p>
                  <p className="text-2xl font-semibold">{fmtNum(totals.impressions)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Posição média</p>
                  <p className="text-2xl font-semibold">{fmtPos(totals.avgPos)}</p>
                </Card>
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h2 className="text-sm font-medium">
                    Top 25 {dim === "query" ? "consultas" : "páginas"}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analyticsQ.refetch()}
                    disabled={analyticsQ.isFetching}
                  >
                    {analyticsQ.isFetching ? <Loader2 className="size-3.5 animate-spin" /> : "Atualizar"}
                  </Button>
                </div>
                {analyticsQ.error && (
                  <div className="p-4 text-sm text-destructive">{(analyticsQ.error as Error).message}</div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-2">{dim === "query" ? "Consulta" : "Página"}</th>
                        <th className="text-right px-4 py-2">Cliques</th>
                        <th className="text-right px-4 py-2">Impr.</th>
                        <th className="text-right px-4 py-2">CTR</th>
                        <th className="text-right px-4 py-2">Pos.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsQ.data ?? []).map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2 truncate max-w-[420px]">{r.keys?.[0]}</td>
                          <td className="px-4 py-2 text-right">{fmtNum(r.clicks)}</td>
                          <td className="px-4 py-2 text-right">{fmtNum(r.impressions)}</td>
                          <td className="px-4 py-2 text-right">{fmtPct(r.ctr)}</td>
                          <td className="px-4 py-2 text-right">{fmtPos(r.position)}</td>
                        </tr>
                      ))}
                      {!analyticsQ.isLoading && (analyticsQ.data ?? []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            Sem dados no período selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="inspect" className="mt-4">
              <UrlInspectPanel siteUrl={effectiveSite} />
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <RouteAuditPanel />
            </TabsContent>

            <TabsContent value="jsonld" className="mt-4">
              <JsonLdValidatorPanel />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
      </div>
    </div>
  );
}

function UrlInspectPanel({ siteUrl }: { siteUrl: string | null }) {
  const inspect = useServerFn(inspectUrlFn);
  const [url, setUrl] = useState("https://impulsionando.com.br/");
  const m = useMutation({
    mutationFn: (u: string) => inspect({ data: { siteUrl: siteUrl!, inspectionUrl: u } }),
  });
  const result: any = m.data;
  const idx = result?.indexStatusResult;
  const rich = result?.richResultsResult;
  const mobile = result?.mobileUsabilityResult;

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[260px]">
          <Label className="text-xs">URL para inspecionar</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </div>
        <Button onClick={() => m.mutate(url)} disabled={!siteUrl || !url || m.isPending}>
          {m.isPending ? <Loader2 className="size-4 animate-spin" /> : "Inspecionar"}
        </Button>
      </Card>

      {m.error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(m.error as Error).message}
        </Card>
      )}

      {result && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard title="Indexação" state={idx?.verdict} extra={[
            ["Cobertura", idx?.coverageState],
            ["Robots", idx?.robotsTxtState],
            ["Canonical usada", idx?.googleCanonical],
            ["Canonical declarada", idx?.userCanonical],
            ["Última rastreada", idx?.lastCrawlTime],
          ]} />
          <StatusCard title="Rich Results" state={rich?.verdict} extra={
            (rich?.detectedItems ?? []).map((it: any) => [it.richResultType, `${it.items?.length ?? 0} itens`])
          } />
          <StatusCard title="Mobile" state={mobile?.verdict} extra={
            (mobile?.issues ?? []).map((it: any) => [it.issueType, it.severity])
          } />
        </div>
      )}
    </div>
  );
}

function StatusCard({
  title,
  state,
  extra,
}: {
  title: string;
  state?: string;
  extra?: Array<[string, any]>;
}) {
  const good = state === "PASS";
  const bad = state === "FAIL";
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="outline" className={good ? "border-emerald-500/40 text-emerald-600" : bad ? "border-destructive/40 text-destructive" : ""}>
          {state ?? "—"}
        </Badge>
      </div>
      <dl className="text-xs space-y-1">
        {(extra ?? []).filter(([, v]) => v).map(([k, v], i) => (
          <div key={i} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium truncate max-w-[180px]" title={String(v)}>{String(v)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function JsonLdValidatorPanel() {
  const [html, setHtml] = useState("");
  const [urlFetch, setUrlFetch] = useState("");
  const results: JsonLdResult[] = useMemo(() => (html ? validateJsonLd(html) : []), [html]);

  async function fetchHtml() {
    try {
      const r = await fetch(urlFetch);
      setHtml(await r.text());
    } catch (e: any) {
      setHtml(`<!-- Erro ao buscar: ${e.message} -->`);
    }
  }

  const errors = results.reduce((n, r) => n + r.issues.filter((i) => i.level === "error").length, 0);
  const warnings = results.reduce((n, r) => n + r.issues.filter((i) => i.level === "warning").length, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar HTML de https://… (opcional)"
            value={urlFetch}
            onChange={(e) => setUrlFetch(e.target.value)}
          />
          <Button variant="outline" onClick={fetchHtml} disabled={!urlFetch}>Buscar</Button>
        </div>
        <div>
          <Label className="text-xs">Cole o HTML da página (o validador extrai todos os &lt;script type="application/ld+json"&gt;)</Label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={8}
            className="w-full mt-1 rounded-md border bg-background p-2 text-xs font-mono"
            placeholder="<html>…</html>"
          />
        </div>
      </Card>

      {html && (
        <div className="flex gap-3 text-sm">
          <Badge variant="outline">{results.length} blocos</Badge>
          <Badge variant="outline" className={errors ? "border-destructive/40 text-destructive" : "border-emerald-500/40 text-emerald-600"}>
            {errors} erros
          </Badge>
          <Badge variant="outline" className={warnings ? "border-amber-500/40 text-amber-600" : ""}>
            {warnings} avisos
          </Badge>
        </div>
      )}

      {results.map((r, i) => (
        <Card key={i} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              #{i + 1} · <span className="font-mono">{r.type}</span>
            </h4>
            {r.issues.length === 0 ? (
              <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> OK
              </span>
            ) : (
              <span className="text-xs text-destructive inline-flex items-center gap-1">
                <XCircle className="size-3.5" /> {r.issues.length} problemas
              </span>
            )}
          </div>
          {r.issues.length > 0 && (
            <ul className="text-xs space-y-1">
              {r.issues.map((iss, k) => (
                <li key={k} className={iss.level === "error" ? "text-destructive" : "text-amber-600"}>
                  [{iss.level}] {iss.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}

