import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ALL_WORKFLOWS, TENANTS_MOCK } from "@/data/automacao-catalog";

export const Route = createFileRoute("/_authenticated/core/automacao/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks — Automação" }, { name: "robots", content: "noindex" }] }),
  component: WebhooksPage,
});

function WebhooksPage() {
  return (
    <div className="space-y-4">
      <Card className="p-4 text-sm">
        <p className="mb-2 font-medium">Padrão de URL</p>
        <code className="block rounded bg-muted p-2 text-xs">
          POST {"{IMPULSIONANDO_N8N_BASE}"}/webhook/impulsionando/{"{tenant_slug}"}/{"{workflow_slug}"}
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Todo request assinado via HMAC-SHA256 (<code>x-impulsionando-signature</code>) usando
          <code className="mx-1">IMPULSIONANDO_WEBHOOK_SECRET</code>. Payloads de exemplo em
          <code className="mx-1">docs/n8n/payloads/</code>.
        </p>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left p-2">Workflow</th>
              <th className="text-left p-2">Caminho por tenant</th>
            </tr>
          </thead>
          <tbody>
            {ALL_WORKFLOWS.slice(0, 40).map((w) => (
              <tr key={w.slug} className="border-t">
                <td className="p-2 font-mono">{w.slug}</td>
                <td className="p-2 font-mono text-[11px] text-muted-foreground">
                  /webhook/impulsionando/{"{"}tenant{"}"}/{w.slug}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold mb-2">Tenants mapeados</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {TENANTS_MOCK.map((t) => (
            <span key={t.slug} className="rounded-full border px-2 py-1 font-mono">{t.slug}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}
