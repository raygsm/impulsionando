import { createFileRoute } from "@tanstack/react-router";
import { CoreHubPage } from "@/components/app/CoreHubPage";
import { Sparkles, GitBranch, Rocket, History, ClipboardList, Layers, Undo2, FileCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/estudio-visual/")({
  head: () => ({ meta: [{ title: "Estúdio Visual — Core Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: EstudioVisualHub,
});

function EstudioVisualHub() {
  return (
    <CoreHubPage
      title="Estúdio Visual do Tenant"
      description="Check-in / check-out visual das criações de front-end. Nada vai para produção sem aprovação manual + comando explícito."
      intro={
        <div className="space-y-1">
          <p>Cada versão registra: tenant, prompt, objetivo, origem (Core/Lovable/Bolt/Importado), tipo, status, autor e histórico.</p>
          <p className="text-xs">
            Homologação oficial em <code>impulsionando.lovable.app</code>. Produção só via
            <code className="mx-1">Publicar Tenant [nome] no domínio principal [domínio completo]</code>.
          </p>
        </div>
      }
      items={[
        { to: "/core/estudio-visual/prompt", label: "Novo Prompt Visual", icon: Sparkles, description: "Escolher tenant, escrever prompt, definir objetivo e tipo de criação.", status: "em-construcao" },
        { to: "/core/estudio-visual/front-end", label: "Front-end por Tenant", icon: FileCode, description: "Versões visuais ativas e em teste, com origem de execução declarada.", status: "em-construcao" },
        { to: "/core/estudio-visual/homologacoes", label: "Homologações", icon: ClipboardList, description: "Kanban rascunho → em criação → homologação → aprovado → publicado.", status: "em-construcao" },
        { to: "/core/estudio-visual/versoes", label: "Versões Visuais", icon: History, description: "Linha do tempo por tenant com diffs, autor e status de cada versão.", status: "em-construcao" },
        { to: "/core/templates", label: "Modelos por Nicho", icon: Layers, description: "Templates iniciais por macro-nicho, prontos para clonar em tenants.", status: "pronto" },
        { to: "/core/estudio-visual/publicacao", label: "Publicação", icon: Rocket, description: "Comando explícito e checklist final antes de subir no domínio principal.", status: "em-construcao" },
        { to: "/core/estudio-visual/rollback", label: "Rollback", icon: Undo2, description: "Voltar para uma versão anterior aprovada, com auditoria.", status: "em-construcao" },
        { to: "/core/releases", label: "Releases da Plataforma", icon: GitBranch, description: "Notas de release do Core, mudanças de módulos e navegação.", status: "pronto" },
      ]}
    />
  );
}
