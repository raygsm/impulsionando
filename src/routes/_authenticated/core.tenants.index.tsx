import { createFileRoute } from "@tanstack/react-router";
import { CoreHubPage } from "@/components/app/CoreHubPage";
import { Building2, Plus, Globe, CreditCard, Boxes, Users, KeyRound, Rocket, Wallet, ClipboardList, Plug, HeartPulse, ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/tenants/")({
  head: () => ({ meta: [{ title: "Clientes & Operações — Core Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: ClientOperationsHub,
});

function ClientOperationsHub() {
  return (
    <CoreHubPage
      title="Clientes & Operações"
      description="Gerencie cada empresa conectada ao Core seguindo a jornada real: entrada → plano → implantação → recursos → integrações → operação → relacionamento → evolução."
      intro={
        <div className="space-y-2">
          <p>O objetivo desta área é permitir que a gestão enxergue o cliente como uma operação viva, e não como uma coleção de telas técnicas.</p>
          <p className="text-sm text-muted-foreground">Termos técnicos como tenant, RLS, webhooks e runtime ficam nos detalhes avançados. Na operação diária usamos cliente, empresa, plano, recursos, integrações, implantação e saúde.</p>
        </div>
      }
      items={[
        { to: "/core/clientes", label: "1. Clientes", icon: Building2, description: "Carteira completa, status, plano, módulos, implantação e acesso assistido ao ambiente do cliente.", status: "pronto" },
        { to: "/core/tenants/novo", label: "2. Novo cliente", icon: Plus, description: "Crie a empresa e conduza identidade, plano, nicho, domínio e recursos iniciais.", status: "pronto" },
        { to: "/core/planos", label: "3. Planos & contratação", icon: CreditCard, description: "Essencial, Ideal e Full; setup, 90 dias, dia 5, visibilidade e checkout controlados pelo Core.", status: "pronto" },
        { to: "/admin/billing", label: "4. Upgrade & downgrade", icon: ArrowUpDown, description: "Mudança de plano, diferença proporcional até o próximo dia 5, crédito no downgrade e aceite auditável.", status: "em-homologacao" },
        { to: "/core/importar-clientes", label: "5. Migração de dados", icon: Users, description: "Importação assistida de clientes, contatos e dados operacionais com validação antes da aplicação.", status: "em-homologacao" },
        { to: "/core/implantacoes", label: "6. Implantações", icon: Rocket, description: "Setup, onboarding de 90 dias, responsáveis, pendências e acompanhamento permanente com o Impulsionito.", status: "pronto" },
        { to: "/core/modulos", label: "7. Recursos & módulos", icon: Boxes, description: "CRM, ERP/PDV, estoque, agenda, financeiro, relacionamento, pesquisas e demais capacidades homologadas.", status: "pronto" },
        { to: "/core/integracoes/diagnostico", label: "8. Integrações & APIs", icon: Plug, description: "Mercado Pago, e-mail, WhatsApp oficial, SMS, VoIP, N8N e demais integrações com estado real de homologação.", status: "pronto" },
        { to: "/core/tenants/dominios", label: "9. Domínios & presença", icon: Globe, description: "Domínio oficial, DNS, SSL e endpoints monitorados pelo Pulsonitor.", status: "pronto" },
        { to: "/core/financeiro-consolidado", label: "10. Financeiro", icon: Wallet, description: "Contratos, vencimentos, pagamentos, inadimplência, ajustes e conciliação.", status: "pronto" },
        { to: "/core/go-live", label: "11. Saúde & go-live", icon: HeartPulse, description: "Gates objetivos, segurança, Pulsonitor, evidências e bloqueadores antes de promover qualquer capacidade.", status: "pronto" },
        { to: "/core/administracao", label: "12. Governança & permissões", icon: KeyRound, description: "Papéis, acesso mínimo necessário, auditoria, rollout universal e ações de maior risco.", status: "em-homologacao" },
        { to: "/core/nova-implantacao", label: "Abrir implantação manual", icon: ClipboardList, description: "Atalho operacional para iniciar uma implantação assistida fora do fluxo automático.", status: "pronto" },
      ]}
    />
  );
}
