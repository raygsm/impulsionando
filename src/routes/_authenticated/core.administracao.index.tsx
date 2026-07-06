import { createFileRoute } from "@tanstack/react-router";
import { CoreHubPage } from "@/components/app/CoreHubPage";
import { Users, KeyRound, ShieldCheck, SlidersHorizontal, ScrollText, Building2, Crown, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/administracao/")({
  head: () => ({ meta: [{ title: "Administração — Core Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: AdministracaoHub,
});

function AdministracaoHub() {
  return (
    <CoreHubPage
      title="Administração"
      description="Gestão interna Impulsionando: usuários, perfis, permissões, parâmetros globais, segurança e auditoria."
      items={[
        { to: "/users", label: "Usuários", icon: Users, description: "Time interno, clientes e consumidores. Vincular a tenant + área + cargo.", status: "pronto" },
        { to: "/access-profiles", label: "Perfis de acesso", icon: KeyRound, description: "Papéis pré-definidos: Super Admin, Diretoria, Marketing, Suporte, WL, Cliente…", status: "pronto" },
        { to: "/access-profiles/matrix", label: "Matriz de Permissões", icon: KeyRound, description: "Matriz Sim/Não das 20+ ações críticas (criar tenant, publicar, aprovar cobrança).", status: "pronto" },
        { to: "/core/parametros", label: "Parâmetros Globais", icon: SlidersHorizontal, description: "Configurações que atravessam todos os tenants (branding, políticas, defaults).", status: "pronto" },
        { to: "/admin/audit-trail", label: "Auditoria", icon: ScrollText, description: "Trilha de auditoria de ações administrativas críticas.", status: "pronto" },
        { to: "/admin/security-compliance", label: "Segurança & Compliance", icon: ShieldCheck, description: "Postura de segurança, LGPD, revisões e alertas.", status: "pronto" },
        { to: "/admin/master-hub", label: "★ Master Hub", icon: Crown, description: "Portal master exclusivo — visão global e ações destrutivas.", status: "pronto" },
        { to: "/admin/env-diagnostics", label: "Diagnóstico de Ambiente", icon: Activity, description: "Presença das env vars críticas no domínio publicado.", status: "pronto" },
        { to: "/companies", label: "Empresas", icon: Building2, description: "Cadastro de empresas do ecossistema.", status: "pronto" },
      ]}
    />
  );
}
