import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, User, Cake, Bell, Route as RouteIcon, ClipboardList, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";

export const Route = createFileRoute("/clube/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta — Clube Impulsionando" },
      { name: "description", content: "Plano, validade, benefícios, histórico e preferências de comunicação do seu Clube Impulsionando." },
      { property: "og:title", content: "Minha Conta — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/minha-conta" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/minha-conta" }],
  }),
  component: ClubeMinhaConta,
});

function ClubeMinhaConta() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <SectionHeader
        eyebrow="Minha Conta"
        title="Sua central no Clube"
        description="Preferências, plano, benefícios ativos e preparação para o CRM (aniversário, NPS, jornadas, lembretes e notificações)."
        align="left"
      />

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Card className="p-6 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">Membro do Clube</div>
              <div className="text-xs opacity-70">membro@exemplo.com · Rio de Janeiro</div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-6 text-sm">
            <div>
              <div className="opacity-60 text-xs">Nome</div>
              <div>Exemplo Consumidor</div>
            </div>
            <div>
              <div className="opacity-60 text-xs">CEP</div>
              <div>22000-000</div>
            </div>
            <div>
              <div className="opacity-60 text-xs">Telefone</div>
              <div>+55 21 99999-0000</div>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline" size="sm">Editar dados</Button>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <div className="text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-1">
            <Crown className="w-4 h-4" /> Plano atual
          </div>
          <div className="font-serif text-2xl mt-2">Teste Premium</div>
          <div className="text-xs opacity-70 mt-1">R$ 9,99/mês · válido até 05/08/2026</div>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild size="sm"><Link to="/clube/planos">Assinar Premium</Link></Button>
            <Button variant="outline" size="sm">Cancelar teste</Button>
          </div>
        </Card>
      </div>

      {/* CRM READY */}
      <h2 className="font-serif text-2xl mt-10 mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" /> Preparação para o CRM
      </h2>
      <p className="text-sm opacity-75 mb-4">
        Estruturas de UI já prontas — quando o backend do Clube for ativado, cada
        card lê/escreve no CRM sem redesenho.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Cake, title: "Aniversariantes", desc: "Régua automática de benefício no seu aniversário." },
          { icon: ClipboardList, title: "Pesquisas", desc: "NPS por empresa após cada compra elegível." },
          { icon: Gift, title: "Benefícios ativos", desc: "Cupons e cashback conforme uso e plano." },
          { icon: RouteIcon, title: "Jornadas", desc: "Trilhas por interesse — mapeadas por N8N." },
          { icon: Bell, title: "Lembretes", desc: "Consulta, reserva e validade de voucher." },
          { icon: User, title: "Notificações", desc: "Preferências por canal (WhatsApp/e-mail/push)." },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5">
            <c.icon className="w-5 h-5 text-primary mb-2" />
            <div className="font-medium">{c.title}</div>
            <div className="text-xs opacity-75 mt-1 leading-relaxed">{c.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
