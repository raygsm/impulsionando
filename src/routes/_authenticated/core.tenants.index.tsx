import { createFileRoute } from "@tanstack/react-router";
import { CoreHubPage } from "@/components/app/CoreHubPage";
import { Building2, Plus, Globe, CreditCard, Boxes, Users, KeyRound, Rocket, Wallet, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/tenants/")({
  head: () => ({ meta: [{ title: "Tenants — Core Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: TenantsHub,
});

function TenantsHub() {
  return (
    <CoreHubPage
      title="Tenants"
      description="Cada tenant é uma unidade operacional do Core: cliente empresa, white-label, consumidor final, projeto interno, demo ou landing."
      intro={
        <p>
          Um tenant carrega plano, nicho/subnicho, módulos, domínio, usuários,
          permissões, integrações, financeiro, vitrine e onboarding próprios.
          Ações destrutivas (suspender/arquivar) exigem confirmação.
        </p>
      }
      items={[
        { to: "/core/clientes", label: "Todos os Tenants", icon: Building2, description: "Lista completa com filtros por tipo, plano, status, nicho e origem visual.", status: "pronto" },
        { to: "/core/tenants/novo", label: "Novo Tenant", icon: Plus, description: "Wizard visual: identidade → plano → nicho → módulos → domínio.", status: "pronto" },
        { to: "/core/tenants/dominios", label: "Domínios por Tenant", icon: Globe, description: "Mapa domínio × tenant, status DNS/SSL e responsável.", status: "pronto" },
        { to: "/core/planos", label: "Planos por Tenant", icon: CreditCard, description: "Plano ativo, upgrade, downgrade, cortesia, trial e cancelamento.", status: "pronto" },
        { to: "/core/modulos", label: "Módulos por Tenant", icon: Boxes, description: "Matriz Sim/Não: ativo, incluído no plano, liberado manual, homologação.", status: "pronto" },
        { to: "/core/importar-clientes", label: "Importar Clientes", icon: Users, description: "Importação em lote com validação e checklist de onboarding.", status: "em-homologacao" },
        { to: "/core/implantacoes", label: "Implantações", icon: Rocket, description: "Fila de setup, status por fase e responsável interno.", status: "pronto" },
        { to: "/core/nova-implantacao", label: "Nova Implantação", icon: ClipboardList, description: "Abrir nova implantação com checklist operacional.", status: "pronto" },
        { to: "/core/financeiro-consolidado", label: "Status Financeiro", icon: Wallet, description: "Assinaturas, cobranças, inadimplência e retenções por tenant.", status: "pronto" },
        { to: "/core/administracao", label: "Permissões por Tenant", icon: KeyRound, description: "Áreas internas Impulsionando × tenant × ações permitidas.", status: "em-construcao" },
      ]}
    />
  );
}
