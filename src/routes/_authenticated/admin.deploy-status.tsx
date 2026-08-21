import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, RefreshCw, Globe, GitCommit, Clock, ExternalLink } from "lucide-react";
import { BUILD_INFO } from "@/generated/build-info";

export const Route = createFileRoute("/_authenticated/admin/deploy-status")({
  component: DeployStatusPage,
  head: () => ({ meta: [{ title: "Status de Publicação · Impulsionando" }] }),
});

type VersionResponse = { commit: string; commitShort: string; branch: string; builtAt: string; mode: string; service: string; host: string; servedAt: string };
type DomainCheck = { url: string; label: string; loading: boolean; data?: VersionResponse; error?: string; latencyMs?: number; fetchedAt?: string };

const DOMAINS = [
  { url: "https://impulsionando.com.br", label: "impulsionando.com.br" },
  { url: "https://www.impulsionando.com.br", label: "www.impulsionando.com.br" },
  { url: "https://wmp.impulsionando.com.br", label: "wmp.impulsionando.com.br" },
  { url: "https://chrismed.impulsionando.com.br", label: "chrismed.impulsionando.com.br" },
  { url: "https://riomed.impulsionando.com.br", label: "riomed.impulsionando.com.br" },
  { url: "https://marocas.impulsionando.com.br", label: "marocas.impulsionando.com.br" },
];

function rel(iso?: string) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!t || Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

async function checkDomain(url: string): Promise<Partial<DomainCheck>> {
  const start = performance.now();
  try {
    const res = await fetch(`${url}/api/public/version`, { cache: "no-store", headers: { accept: "application/json" } });
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) return { error: `HTTP ${res.status}`, latencyMs, fetchedAt: new Date().toISOString() };
    return { data: (await res.json()) as VersionResponse, latencyMs, fetchedAt: new Date().toISOString() };
  } catch (e: any) {
    return { error: String(e?.message ?? e).slice(0, 200), latencyMs: Math.round(performance.now() - start), fetchedAt: new Date().toISOString() };
  }
}

function DeployStatusPage() {
  const [checks, setChecks] = useState<DomainCheck[]>(DOMAINS.map((d) => ({ ...d, loading: false })));
  const [verifying, setVerifying] = useState(false);
  async function runAll() {
    setVerifying(true);
    setChecks((cs) => cs.map((c) => ({ ...c, loading: true, error: undefined })));
    setChecks(await Promise.all(DOMAINS.map(async (d) => ({ ...d, loading: false, ...(await checkDomain(d.url)) }))));
    setVerifying(false);
  }
  const localCommit = BUILD_INFO.commit;
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <header className="flex flex-col gap-2"><h1 className="text-2xl font-bold tracking-tight">Status de publicação</h1><p className="text-sm text-muted-foreground">Compara o commit publicado nos domínios canônicos com o build atual.</p></header>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitCommit className="w-4 h-4" /> Build atual</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div><div className="text-xs text-muted-foreground">Commit</div><div className="font-mono font-medium">{BUILD_INFO.commitShort}</div></div><div><div className="text-xs text-muted-foreground">Branch</div><div>{BUILD_INFO.branch}</div></div><div><div className="text-xs text-muted-foreground">Compilado</div><div>{rel(BUILD_INFO.builtAt)}</div></div><div><div className="text-xs text-muted-foreground">Modo</div><div>{BUILD_INFO.mode}</div></div></CardContent></Card>
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />Verificação sem cache em /api/public/version.</p><Button onClick={runAll} disabled={verifying} size="sm"><RefreshCw className={`w-4 h-4 mr-2 ${verifying ? "animate-spin" : ""}`} />{verifying ? "Verificando..." : "Verificar implantação"}</Button></div>
      <div className="grid gap-3">{checks.map((c) => { const same = c.data?.commit === localCommit; return <Card key={c.url}><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base"><span className="flex items-center gap-2"><Globe className="w-4 h-4" />{c.label}<a href={c.url} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3" /></a></span>{c.loading ? <Badge variant="secondary">Consultando…</Badge> : c.error ? <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Erro</Badge> : same ? <Badge className="bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" />Atualizado</Badge> : <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Desatualizado</Badge>}</CardTitle>{c.fetchedAt && <CardDescription>{rel(c.fetchedAt)} · {c.latencyMs}ms</CardDescription>}</CardHeader><CardContent className="text-xs">{c.error ? <div className="text-destructive font-mono">{c.error}</div> : c.data ? <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><div><div className="text-muted-foreground">Commit</div><div className="font-mono">{c.data.commitShort}</div></div><div><div className="text-muted-foreground">Branch</div><div>{c.data.branch}</div></div><div><div className="text-muted-foreground">Compilado</div><div>{rel(c.data.builtAt)}</div></div><div><div className="text-muted-foreground">Host</div><div>{c.data.host}</div></div></div> : <div className="text-muted-foreground">Ainda não verificado.</div>}</CardContent></Card>})}</div>
      <Card className="bg-muted/30"><CardHeader><CardTitle className="text-sm">Invariante Zero-Drift</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Somente os domínios canônicos autorizados são monitorados. Um domínio é considerado atualizado apenas quando o SHA publicado coincide com o build esperado.</CardContent></Card>
    </div>
  );
}
