import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { getSupabaseEnvDiagnostics, triggerEnvAlert } from "@/lib/env-diagnostics.functions";
import { checkDiagnosticAccess } from "@/lib/diagnostic-access.functions";

export const Route = createFileRoute("/_authenticated/admin/env-diagnostics")({
  beforeLoad: async () => {
    const res = await checkDiagnosticAccess();
    if (!res.allowed) {
      throw redirect({ to: "/core" as never });
    }
    return { diagLevel: res.level };
  },
  head: () => ({
    meta: [
      { title: "Diagnóstico de Ambiente — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EnvDiagnosticsPage,
});

type ServerCheck = { name: string; present: boolean; length: number; preview: string | null };

function EnvDiagnosticsPage() {
  const serverFn = useServerFn(getSupabaseEnvDiagnostics);
  const alertFn = useServerFn(triggerEnvAlert);
  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ["env-diagnostics"],
    queryFn: () => serverFn(),
    staleTime: 5_000,
  });
  const alertSentRef = useRef(false);
  const [alertStatus, setAlertStatus] = useState<null | { ok: boolean; msg: string }>(null);

  const clientChecks: ServerCheck[] = [
    {
      name: "VITE_SUPABASE_URL",
      present: !!import.meta.env.VITE_SUPABASE_URL,
      length: (import.meta.env.VITE_SUPABASE_URL ?? "").length,
      preview: import.meta.env.VITE_SUPABASE_URL
        ? `${String(import.meta.env.VITE_SUPABASE_URL).slice(0, 8)}…`
        : null,
    },
    {
      name: "VITE_SUPABASE_PUBLISHABLE_KEY",
      present: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      length: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").length,
      preview: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        ? `${String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY).slice(0, 8)}…`
        : null,
    },
    {
      name: "VITE_SUPABASE_PROJECT_ID",
      present: !!import.meta.env.VITE_SUPABASE_PROJECT_ID,
      length: (import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "").length,
      preview: import.meta.env.VITE_SUPABASE_PROJECT_ID
        ? `${String(import.meta.env.VITE_SUPABASE_PROJECT_ID).slice(0, 8)}…`
        : null,
    },
  ];

  const missingServer =
    data?.server.filter((c) => ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"].includes(c.name) && !c.present) ?? [];
  const missingClient = clientChecks.filter(
    (c) => ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"].includes(c.name) && !c.present,
  );
  const hasCriticalMissing = missingServer.length > 0 || missingClient.length > 0;

  // Dispara alerta (webhook + e-mail) automaticamente na primeira detecção.
  useEffect(() => {
    if (!hasCriticalMissing || alertSentRef.current || isLoading) return;
    alertSentRef.current = true;
    const missing = [
      ...missingServer.map((c) => c.name),
      ...missingClient.map((c) => c.name),
    ];
    alertFn({ data: { missing, host: data?.host ?? (typeof window !== "undefined" ? window.location.host : null) } })
      .then((r) => {
        setAlertStatus({
          ok: !!r.sent,
          msg: r.sent
            ? `Alerta enviado (webhook: ${r.webhook ?? "—"}, e-mail: ${r.email ?? "—"}).`
            : `Alerta não enviado: ${r.reason ?? "desconhecido"}.`,
        });
      })
      .catch((err) => setAlertStatus({ ok: false, msg: `Falha ao alertar: ${(err as Error).message}` }));
  }, [hasCriticalMissing, isLoading, missingServer, missingClient, data?.host, alertFn]);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Diagnóstico de Ambiente</h1>
          <p className="text-sm text-muted-foreground">
            Verifica presença de <code>SUPABASE_URL</code> e <code>SUPABASE_PUBLISHABLE_KEY</code>{" "}
            no runtime do servidor e no bundle do cliente. Nenhum valor é exibido.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {hasCriticalMissing && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-destructive">
                Variáveis obrigatórias ausentes no ambiente publicado
              </div>
              <p className="text-muted-foreground">
                O domínio atual não recebeu as env vars do Lovable Cloud. O app carrega, mas
                chamadas ao banco falham com{" "}
                <em>“Missing Supabase environment variable(s)”</em>.
              </p>
              <div className="text-foreground">Como corrigir:</div>
              <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                <li>
                  Abra <b>Project Settings → Project → Domains</b> e verifique se o domínio
                  customizado está com status <b>Active</b>. Se aparecer <b>Failed</b>,{" "}
                  <b>Offline</b> ou <b>Setting up</b>, clique em <b>Retry</b> ou remova e
                  reconecte.
                </li>
                <li>
                  Confirme que <b>Lovable Cloud</b> está habilitado neste projeto{" "}
                  (Cloud → Overview).
                </li>
                <li>
                  Publique novamente pelo botão <b>Publish</b>. As env vars são injetadas
                  no build da publicação — reconectar o domínio ou republicar reprovisiona.
                </li>
                <li>
                  Como alternativa imediata, use a URL nativa{" "}
                  <code>impulsionando.lovable.app</code>, que sempre recebe as env vars.
                </li>
              </ol>
              {alertStatus && (
                <div className={`mt-2 text-xs ${alertStatus.ok ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {alertStatus.msg}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Servidor (SSR / server functions)</h2>
          <Badge variant="outline" className="text-[10px]">
            {data?.timestamp ? new Date(data.timestamp).toLocaleString("pt-BR") : "—"}
          </Badge>
        </div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : error ? (
          <div className="text-sm text-destructive">
            Falha ao consultar o servidor: {String((error as Error).message)}
          </div>
        ) : (
          <div className="divide-y">
            {data?.server.map((c) => (
              <EnvRow key={c.name} check={c} required={["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"].includes(c.name)} />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Cliente (bundle do navegador)</h2>
        <div className="divide-y">
          {clientChecks.map((c) => (
            <EnvRow
              key={c.name}
              check={c}
              required={["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"].includes(c.name)}
            />
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-muted/30">
        <h2 className="font-semibold mb-2 text-sm">Observações</h2>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-5">
          <li>Nenhum valor é exposto — apenas presença, tamanho e 8 primeiros caracteres.</li>
          <li>
            <code>SERVICE_ROLE_KEY</code> é opcional; use apenas para operações administrativas.
          </li>
          <li>
            Variáveis <code>VITE_*</code> são incorporadas no bundle no momento do build.
            Republicar após reconectar o domínio é obrigatório.
          </li>
        </ul>
      </Card>
    </div>
  );
}

function EnvRow({ check, required }: { check: ServerCheck; required: boolean }) {
  const ok = check.present;
  return (
    <div className="flex items-center justify-between py-2.5 gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {ok ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className={`w-4 h-4 shrink-0 ${required ? "text-destructive" : "text-muted-foreground"}`} />
        )}
        <code className="text-sm truncate">{check.name}</code>
        {required && (
          <Badge variant="secondary" className="text-[10px]">
            obrigatória
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        {ok ? (
          <>
            <span>{check.length} chars</span>
            <code className="px-1.5 py-0.5 rounded bg-muted">{check.preview}</code>
          </>
        ) : (
          <span className={required ? "text-destructive" : ""}>ausente</span>
        )}
      </div>
    </div>
  );
}
