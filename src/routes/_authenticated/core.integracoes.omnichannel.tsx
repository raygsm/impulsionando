import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { OmnichannelInbox } from "@/components/integracoes/OmnichannelInbox";
import { ImpulsinitoHint } from "@/components/integracoes/ImpulsinitoHint";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/integracoes/omnichannel")({
  head: () => ({
    meta: [{ title: "Omnichannel — Caixa unificada" }, { name: "robots", content: "noindex" }],
  }),
  component: OmnichannelPage,
});

function OmnichannelPage() {
  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
          <Link to="/core/integracoes">
            <ChevronLeft className="h-4 w-4" /> Integrações
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Caixa de entrada unificada"
        description="Todas as conversas do WhatsApp, Instagram, Messenger, Telegram, chat do site e Google Business em um só lugar."
      />
      <ImpulsinitoHint title="Como usar">
        Selecione um canal à esquerda para filtrar. Clique numa conversa para responder. As respostas
        entram no histórico automaticamente.
      </ImpulsinitoHint>
      <OmnichannelInbox />
    </div>
  );
}
