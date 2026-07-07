import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/core/automacao/templates")({
  head: () => ({ meta: [{ title: "Templates — Automação" }, { name: "robots", content: "noindex" }] }),
  component: TemplatesPage,
});

const GROUPS = [
  { id: "whatsapp", label: "WhatsApp", file: "docs/n8n/templates/whatsapp.md",
    items: ["wa.lead-captado","wa.lead-sem-resposta","wa.pix-gerado","wa.pix-expirado","wa.pagamento-aprovado","wa.trial-d29","wa.inadimplencia","wa.clinica-consulta-confirmada","wa.bar-pedido-saiu-entrega","wa.imob-visita-confirmada","wa.clube-voucher-usado"] },
  { id: "email", label: "E-mail", file: "docs/n8n/templates/email.md",
    items: ["em.lead-captado","em.cadastro-abandonado","em.pagamento-aprovado","em.onboarding-d0","em.onboarding-d7","em.trial-d15","em.trial-d29","em.renovacao-proxima","em.nota-fiscal-emitida","em.clube-empresa-proxima"] },
  { id: "impulsionito", label: "Impulsionito", file: "docs/n8n/templates/impulsionito.md",
    items: ["imp.onboarding-d0","imp.modulo-nao-configurado","imp.sugestao-recurso","imp.impulsionito-proativo","imp.trial-d15","imp.upsell-oportunidade","imp.clube-empresa-proxima"] },
  { id: "interna", label: "Notificação interna", file: "docs/n8n/templates/notificacao-interna.md",
    items: ["int.inadimplencia","int.repasse-pendente","int.sla-vencendo","int.avaliacao-negativa","int.workflow-falhou","int.vitrine-removido"] },
  { id: "fallback", label: "Fallback humano", file: "docs/n8n/templates/fallback-humano.md",
    items: ["fb.responsavel-tenant"] },
];

function TemplatesPage() {
  return (
    <div className="space-y-4">
      {GROUPS.map((g) => (
        <Card key={g.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">{g.label}</div>
            <code className="text-[11px] text-muted-foreground">{g.file}</code>
          </div>
          <div className="flex flex-wrap gap-1">
            {g.items.map((t) => (
              <span key={t} className="rounded border px-2 py-0.5 text-xs font-mono">{t}</span>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
