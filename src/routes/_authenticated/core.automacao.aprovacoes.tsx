import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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

function AprovacoesPage() {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Checklist de ativação por tenant</h2>
        <p className="text-sm text-muted-foreground">
          Nenhum workflow entra em produção sem todos os itens abaixo. Registro real vive no backend
          (pendente) — este painel é visual até habilitação.
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
  );
}
