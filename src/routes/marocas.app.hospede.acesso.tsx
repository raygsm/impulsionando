import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, SuccessBanner } from "@/components/marocas/MarocasUI";
import { MOCK_HOSPEDE_RESERVA } from "@/components/marocas/marocasMockData";
import { Eye, EyeOff, KeyRound, Wifi, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/acesso")({
  head: () => ({ meta: [{ title: "Acesso & senha — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AcessoPage,
});

function AcessoPage() {
  const r = MOCK_HOSPEDE_RESERVA;
  const [showPorta, setShowPorta] = useState(false);
  const [showWifi, setShowWifi] = useState(false);
  return (
    <MarocasAppShell
      title="Acesso ao imóvel"
      description="Dados sensíveis liberados a partir de 24h antes do seu check-in. Nunca compartilhe com terceiros."
      breadcrumbs={[{ label: "Hóspede", to: "/marocas/app/hospede" }, { label: "Acesso" }]}
    >
      <div className="mb-4">
        <SuccessBanner title="Dados prontos" description="Guarde este aviso no seu celular. Em caso de problema no acesso, ligue para o concierge." />
      </div>

      <Section title="Senha da porta">
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <KeyRound className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Fechadura eletrônica</p>
            <p className="text-3xl font-mono tabular-nums mt-1">
              {showPorta ? "4 8 2 6" : r.senhaPortaMock}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Válida por toda a estadia · reset automático após check-out</p>
          </div>
          <button
            onClick={() => setShowPorta((v) => !v)}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted inline-flex items-center gap-1"
          >
            {showPorta ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPorta ? "Ocultar" : "Revelar"}
          </button>
        </div>
      </Section>

      <Section title="Wi-Fi">
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <Wifi className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Rede</p>
            <p className="text-lg font-mono">{r.wifiSsid}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Senha</p>
            <p className="text-lg font-mono">{showWifi ? "praia@2026" : r.wifiSenhaMock}</p>
          </div>
          <button
            onClick={() => setShowWifi((v) => !v)}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted inline-flex items-center gap-1"
          >
            {showWifi ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showWifi ? "Ocultar" : "Revelar"}
          </button>
        </div>
      </Section>

      <div className="mt-6 rounded-xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Segurança primeiro</p>
          <p className="text-xs text-muted-foreground mt-1">
            Estes dados são exibidos apenas como mock. No ambiente real, senhas são criadas por reserva, revogadas
            no check-out e nunca ficam expostas em logs. Integração com fechaduras inteligentes será conectada pelo Codex.
          </p>
        </div>
      </div>
    </MarocasAppShell>
  );
}
