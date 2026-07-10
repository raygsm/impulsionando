import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section } from "@/components/marocas/MarocasUI";
import { Building2, Bell, CreditCard, Users2, Shield } from "lucide-react";

export const Route = createFileRoute("/marocas/app/anfitriao/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: ConfigPage,
});

const GROUPS = [
  { icon: Building2, titulo: "Perfil da empresa", desc: "Razão social, CNPJ, marca visual, e-mail de contato." },
  { icon: Users2,   titulo: "Equipe", desc: "Convide sócios, gestores e assistentes com permissões por perfil." },
  { icon: Bell,     titulo: "Notificações", desc: "Alertas por WhatsApp, e-mail e push para eventos críticos." },
  { icon: CreditCard, titulo: "Pagamentos & repasse", desc: "Conta bancária de repasse, forma de cobrança da taxa Marocas." },
  { icon: Shield,   titulo: "Segurança & LGPD", desc: "Autenticação em 2 fatores, política de retenção, exportação de dados." },
];

function ConfigPage() {
  return (
    <MarocasAppShell
      title="Configurações"
      description="Preferências da conta, equipe, notificações e privacidade."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Configurações" }]}
    >
      <Section title="Áreas">
        <div className="grid md:grid-cols-2 gap-3">
          {GROUPS.map((g) => (
            <article key={g.titulo} className="rounded-xl border bg-card p-4 flex items-start gap-3">
              <g.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{g.titulo}</h3>
                <p className="text-xs text-muted-foreground mt-1">{g.desc}</p>
                <button className="mt-3 text-xs text-primary font-medium hover:underline">Abrir</button>
              </div>
            </article>
          ))}
        </div>
      </Section>
      <p className="mt-6 text-xs text-muted-foreground max-w-2xl">
        Autenticação real, permissões e integração com o core Impulsionando serão conectadas pelo Codex.
      </p>
    </MarocasAppShell>
  );
}
