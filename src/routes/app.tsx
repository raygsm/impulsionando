import { createFileRoute } from "@tanstack/react-router";
import { Smartphone, Apple, Monitor, Users, Building2, Layers, Zap, ShieldCheck, RefreshCw } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "App Impulsionando — Instale no celular ou desktop" },
      {
        name: "description",
        content:
          "App único Impulsionando: empresas, white label e Clube do consumidor final em um só aplicativo. Sempre 100% sincronizado com a plataforma — sem versões defasadas.",
      },
      { property: "og:title", content: "App Impulsionando" },
      {
        property: "og:description",
        content:
          "Instale o app Impulsionando no celular ou desktop e acesse todas as soluções — agenda, CRM, vendas, financeiro, Clube e mais.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/app" }],
  }),
  component: AppLandingPage,
});

function AppLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
        <header className="text-center mb-10">
          <Badge className="bg-gradient-primary mb-3 gap-1">
            <Zap className="w-3 h-3" /> Um único app para tudo
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            App Impulsionando
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
            Todos os clientes, nichos e marcas — white label, empresas e consumidor final (Clube) —
            acessam suas operações por aqui. Mesma plataforma da web, agora no ícone do seu celular.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <InstallAppButton size="lg" variant="default" label="Instalar app agora" />
            <a
              href="/auth"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent/10 transition"
            >
              Entrar pelo navegador
            </a>
          </div>
        </header>

        <section aria-labelledby="benefits" className="mb-12">
          <h2 id="benefits" className="sr-only">Benefícios</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <RefreshCw className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">Sempre atualizado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Mesma base do site. Toda nova função aparece no app no mesmo deploy — sem updates de loja.
              </p>
            </Card>
            <Card className="p-5">
              <Layers className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">Multi-tenant e multi-marca</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Um único app: seu cliente troca entre empresas, unidades e perfis sem reinstalar nada.
              </p>
            </Card>
            <Card className="p-5">
              <ShieldCheck className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">Seguro por padrão</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Login Impulsionando, RBAC granular e isolamento por empresa em todas as telas.
              </p>
            </Card>
          </div>
        </section>

        <section aria-labelledby="howto" className="mb-12">
          <h2 id="howto" className="text-xl sm:text-2xl font-semibold tracking-tight mb-5">
            Como instalar no seu dispositivo
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <Smartphone className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">Android (Chrome / Edge)</h3>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal pl-4">
                <li>Abra o site impulsionando.com.br no Chrome.</li>
                <li>Toque no menu (⋮) e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</li>
                <li>Confirme. O ícone Impulsionando aparece junto aos seus apps.</li>
              </ol>
            </Card>
            <Card className="p-5">
              <Apple className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">iPhone / iPad (Safari)</h3>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal pl-4">
                <li>Abra o site no Safari (não em outro navegador).</li>
                <li>Toque no botão Compartilhar (□↑) na barra inferior.</li>
                <li>Escolha “Adicionar à Tela de Início” e confirme.</li>
              </ol>
            </Card>
            <Card className="p-5">
              <Monitor className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">Desktop (Chrome / Edge)</h3>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal pl-4">
                <li>Acesse pelo navegador.</li>
                <li>Clique no ícone de instalação na barra de endereço (ou menu → Instalar).</li>
                <li>O app abre em janela própria, sem abas.</li>
              </ol>
            </Card>
          </div>
        </section>

        <section aria-labelledby="audiences" className="mb-6">
          <h2 id="audiences" className="text-xl sm:text-2xl font-semibold tracking-tight mb-5">
            Quem usa o mesmo app
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <Building2 className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">Empresas e equipe</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Agenda, CRM, vendas, estoque, financeiro, prontuário, comunicação e BI — operação completa.
              </p>
            </Card>
            <Card className="p-5">
              <Layers className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">White label</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Revendedores e franquias: painel master, gestão de clientes, módulos liberados e faturamento.
              </p>
            </Card>
            <Card className="p-5">
              <Users className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-semibold">Consumidor final (Clube)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Benefícios, fidelidade, agendas, pedidos, cupons e eventos das empresas participantes.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
