import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, RefreshCw, Globe, GitCommit, Clock, ExternalLink } from "lucide-react";
import { BUILD_INFO } from "@/generated/build-info";

export const Route = createFileRoute("/_authenticated/admin/deploy-status")({
  component: DeployStatusPage,
  head: () => ({
    meta: [{ title: "Status de Publicação · Impulsionando" }],
  }),
});

type VersionResponse = {
  commit: string;
  commitShort: string;
  branch: string;
  builtAt: string;
  mode: string;
  service: string;
  host: string;
  servedAt: string;
};

type DomainCheck = {
  url: string;
  label: string;
  loading: boolean;
  data?: VersionResponse;
  error?: string;
  latencyMs?: number;
  fetchedAt?: string;
};

const DOMAINS: { url: string; label: string }[] = [
  { url: "https://impulsionando.com.br", label: "impulsionando.com.br" },
  { url: "https://www.impulsionando.com.br", label: "www.impulsionando.com.br" },
  { url: "https://riomed.impulsionando.com.br", label: "riomed.impulsionando.com.br" },
  { url: "https://impulsionando.lovable.app", label: "impulsionando.lovable.app" },
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
    const res = await fetch(`${url}/api/public/version`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) return { error: `HTTP ${res.status}`, latencyMs, fetchedAt: new Date().toISOString() };
    const data = (await res.json()) as VersionResponse;
    return { data, latencyMs, fetchedAt: new Date().toISOString() };
  } catch (e: any) {
    return {
      error: String(e?.message ?? e).slice(0, 200),
      latencyMs: Math.round(performance.now() - start),
      fetchedAt: new Date().toISOString(),
    };
  }
}

function DeployStatusPage() {
  const [checks, setChecks] = useState<DomainCheck[]>(
    DOMAINS.map((d) => ({ ...d, loading: false })),
  );
  const [verifying, setVerifying] = useState(false);

  async function runAll() {
    setVerifying(true);
    setChecks((cs) => cs.map((c) => ({ ...c, loading: true, error: undefined })));
    const results = await Promise.all(
      DOMAINS.map(async (d) => {
        const r = await checkDomain(d.url);
        return { ...d, loading: false, ...r };
      }),
    );
    setChecks(results);
    setVerifying(false);
  }

  const localCommit = BUILD_INFO.commit;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Status de publicação</h1>
        <p className="text-sm text-muted-foreground">
          Compara o commit publicado em cada domínio com o build atual (este editor / preview).
          Útil para confirmar quando uma publicação chega no domínio público.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCommit className="w-4 h-4" /> Build atual deste preview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Commit</div>
            <div className="font-mono font-medium">{BUILD_INFO.commitShort}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Branch</div>
            <div className="font-medium">{BUILD_INFO.branch}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Compilado em</div>
            <div className="font-medium">{rel(BUILD_INFO.builtAt)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Modo</div>
            <div className="font-medium">{BUILD_INFO.mode}</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <Clock className="w-3 h-3 inline mr-1" />
          Cada verificação consulta <code>/api/public/version</code> direto no domínio.
        </p>
        <Button onClick={runAll} disabled={verifying} size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${verifying ? "animate-spin" : ""}`} />
          {verifying ? "Verificando..." : "Verificar implantação"}
        </Button>
      </div>

      <div className="grid gap-3">
        {checks.map((c) => {
          const sameAsLocal = c.data && c.data.commit === localCommit;
          const stale = c.data && !sameAsLocal;
          return (
            <Card key={c.url}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {c.label}
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                  {c.loading ? (
                    <Badge variant="secondary">Consultando…</Badge>
                  ) : c.error ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" /> Erro
                    </Badge>
                  ) : sameAsLocal ? (
                    <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Atualizado
                    </Badge>
                  ) : stale ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" /> Desatualizado
                    </Badge>
                  ) : (
                    <Badge variant="outline">Não verificado</Badge>
                  )}
                </CardTitle>
                {c.fetchedAt ? (
                  <CardDescription className="text-xs">
                    Verificado {rel(c.fetchedAt)} · {c.latencyMs}ms
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="text-sm">
                {c.error ? (
                  <div className="text-destructive text-xs font-mono">{c.error}</div>
                ) : c.data ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Commit publicado</div>
                      <div className="font-mono font-medium">{c.data.commitShort}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Branch</div>
                      <div className="font-medium">{c.data.branch}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Compilado</div>
                      <div className="font-medium">{rel(c.data.builtAt)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Modo</div>
                      <div className="font-medium">{c.data.mode}</div>
                    </div>
                    {stale ? (
                      <div className="col-span-full text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded p-2">
                        Este domínio ainda está servindo um commit anterior ao build atual.
                        Aguarde alguns minutos após o <strong>Publish</strong> ou force
                        refresh (Ctrl+Shift+R). Se persistir, refaça a publicação.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Clique em <strong>Verificar implantação</strong> para consultar este domínio.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm">Como funciona o cache</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• HTML servido com <code>cache-control: no-store</code> — cada navegação busca a versão nova.</p>
          <p>• JS/CSS em <code>/assets/*</code> têm hash no nome + <code>immutable</code> (cache longo seguro).</p>
          <p>• Endpoint <code>/api/public/version</code> sempre sem cache, retorna commit + horário do build.</p>
        </CardContent>
      </Card>
    </div>
  );
}
