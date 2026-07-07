import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAutomationRequests, registerAutomationRequest } from "@/lib/automation-approvals.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/exports";

export const Route = createFileRoute("/_authenticated/core/automacao/aprovacoes")({
  head: () => ({ meta: [{ title: "Aprovações — Automação" }, { name: "robots", content: "noindex" }] }),
  component: AprovacoesPage,
});

const CHECKLIST = [
  ["Tenant cadastrado com plano+nicho", "companies preenchido, subdomain ativo"],
  ["Responsável de automação designado", "usuário admin do tenant"],
  ["LGPD revisada", "consentimento por canal armazenado"],
  ["Canal WhatsApp conectado", "Z-API ativo e templates homologados na Meta"],
  ["Canal e-mail verificado", "SPF/DKIM/DMARC + remetente aprovado"],
  ["Workflows testados em demo", "log status:ok registrado"],
  ["Fallback humano testado", "simulação de erro acionou notificação"],
  ["HMAC configurado", "IMPULSIONANDO_WEBHOOK_SECRET idêntico backend↔N8N"],
  ["Aprovação manual assinada", "responsável, data e escopo"],
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  registered: "secondary",
};

function ModeBadge({ mode }: { mode: string }) {
  const isProd = mode === "producao";
  return (
    <span
      data-testid={`row-mode-${mode}`}
      className={
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
        (isProd
          ? "bg-destructive/15 text-destructive border border-destructive/40"
          : "bg-amber-500/15 text-amber-700 border border-amber-500/40 dark:text-amber-400")
      }
    >
      {isProd ? "Produção" : "Demo"}
    </span>
  );
}

function AprovacoesPage() {
  const search = useSearch({ strict: false }) as { tenant?: string; mode?: "demo" | "producao" };
  const tenantSlug = search?.tenant ?? null;
  const currentMode: "demo" | "producao" = search?.mode ?? "demo";
  const list = useServerFn(listAutomationRequests);
  const register = useServerFn(registerAutomationRequest);
  const { data: rows = [], isLoading, error, refetch } = useQuery({
    queryKey: ["automation-approvals", tenantSlug],
    queryFn: () => list({ data: { tenantSlug, limit: 100 } }),
  });

  const counts = rows.reduce(
    (acc, r) => {
      const s = (r as { status: string }).status;
      if (s === "pending") acc.pending++;
      else if (s === "approved") acc.approved++;
      else if (s === "rejected") acc.rejected++;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 },
  );

  const runManualTest = async () => {
    try {
      const res = await register({
        data: {
          tenantSlug,
          mode: currentMode,
          regua: "captacao",
          action: "test",
          files: ["/downloads/n8n/captacao/01-lead-captado.json"],
          note: `Teste manual (${currentMode}) disparado em ${new Date().toLocaleString("pt-BR")}`,
        },
      });
      toast.success(`Solicitação de teste registrada (${currentMode})`, {
        description: `ID #${res.id.slice(0, 8)} — recarregando lista…`,
      });
      refetch();
    } catch (e) {
      toast.error("Falha ao registrar solicitação de teste", {
        description: String((e as Error).message),
      });
    }
  };


  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Solicitações registradas</h2>
            <p className="text-sm text-muted-foreground">
              Cada download de JSON, pacote ZIP ou pedido de ativação em produção fica auditado aqui{tenantSlug ? <> — filtrando por tenant <b>{tenantSlug}</b></> : null}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={runManualTest} data-testid="btn-manual-test">
              Disparar teste ({currentMode})
            </Button>
            <button
              onClick={() => refetch()}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]" data-testid="approval-counts">
          <span className="rounded border px-2 py-0.5">Pendentes: <b data-testid="count-pending">{counts.pending}</b></span>
          <span className="rounded border px-2 py-0.5">Aprovadas: <b data-testid="count-approved">{counts.approved}</b></span>
          <span className="rounded border px-2 py-0.5">Recusadas: <b data-testid="count-rejected">{counts.rejected}</b></span>
          <span className="rounded border px-2 py-0.5 text-muted-foreground">Total: <b data-testid="count-total">{rows.length}</b></span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          As contagens são derivadas da própria lista abaixo: se uma linha aparece, ela é somada aqui. Use <b>Disparar teste</b> e clique <b>Atualizar</b> para conferir o incremento em tempo real.
        </p>


        {isLoading && <div className="text-xs text-muted-foreground">Carregando…</div>}
        {error && <div className="text-xs text-destructive">Falha ao carregar: {String((error as Error).message)}</div>}
        {!isLoading && !error && rows.length === 0 && (
          <div className="text-xs text-muted-foreground">Nenhuma solicitação ainda.</div>
        )}

        {rows.length > 0 && (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2">Quando</th>
                  <th className="p-2">Ação</th>
                  <th className="p-2">Tenant</th>
                  <th className="p-2">Modo</th>
                  <th className="p-2">Régua</th>
                  <th className="p-2">Arquivos</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const files = Array.isArray(r.files) ? (r.files as string[]) : [];
                  return (
                    <tr key={r.id} className="border-t align-top" data-testid="approval-row" data-mode={r.mode}>
                      <td className="p-2 whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-2 font-mono">{r.action}</td>
                      <td className="p-2">{r.tenant_slug ?? "—"}</td>
                      <td className="p-2"><ModeBadge mode={r.mode} /></td>
                      <td className="p-2">{r.regua ?? "—"}</td>
                      <td className="p-2 max-w-[280px]">
                        <div className="space-y-0.5">
                          {files.slice(0, 3).map((f) => (
                            <a key={f} href={f} className="block truncate underline text-primary" target="_blank" rel="noreferrer">
                              {f.split("/").pop()}
                            </a>
                          ))}
                          {files.length > 3 && (
                            <div className="text-muted-foreground">+ {files.length - 3} arquivo(s)</div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Checklist de ativação por tenant</h2>
          <p className="text-sm text-muted-foreground">
            Nenhum workflow entra em produção sem todos os itens abaixo.
          </p>
        </div>
        <ul className="space-y-2">
          {CHECKLIST.map(([label, hint]) => (
            <li key={label} className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox disabled className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{hint}</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted-foreground">Fonte: docs/n8n/checklist-ativacao.md</p>
      </Card>
    </div>
  );
}
