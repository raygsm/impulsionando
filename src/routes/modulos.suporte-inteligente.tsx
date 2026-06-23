// Landing comercial — Módulo Suporte Inteligente (R$ 497/mês).
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Headphones, MessageCircle, Mail, RotateCcw, Sparkles, Shield, Clock,
  CheckCircle2, X, TrendingUp, Users, Zap, AlertTriangle, ArrowRight,
} from 'lucide-react'

export const Route = createFileRoute('/modulos/suporte-inteligente')({
  head: () => ({ meta: [
    { title: 'Suporte Inteligente — Tickets integrados ao CRM | Impulsionando' },
    { name: 'description', content: 'Sistema de tickets com SLA, follow-up por WhatsApp e Email, IA que agrupa problemas recorrentes em % e integração nativa ao CRM. R$ 497/mês, agentes ilimitados.' },
    { property: 'og:title', content: 'Suporte Inteligente — Impulsionando' },
    { property: 'og:description', content: 'Muito mais que um help desk. Tickets que conversam com CRM, WhatsApp, Email e IA — único no Brasil.' },
  ]}),
  component: SuporteIntelLanding,
})

const WHATSAPP = 'https://wa.me/5521972631063?text=Quero%20contratar%20o%20m%C3%B3dulo%20Suporte%20Inteligente'

function SuporteIntelLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative bg-gradient-to-b from-primary/5 via-background to-background border-b">
        <div className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
          <Badge className="mb-4 bg-primary/15 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" /> Lançamento · Add-on do core Impulsionando
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Suporte Inteligente que <span className="text-primary">conversa com o seu CRM</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Muito mais que um sistema de tickets. O suporte vive dentro do ecossistema:
            cada chamado se relaciona com o lead, dispara follow-up por WhatsApp e Email,
            e a IA resume os problemas mais recorrentes em <strong>% para a gestão</strong>.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-3xl font-bold">R$ 497<span className="text-base font-normal text-muted-foreground">/mês</span></div>
            <Badge variant="outline" className="text-xs">Agentes ilimitados</Badge>
            <Badge variant="outline" className="text-xs">Sem cobrança por seat</Badge>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" /> Contratar agora
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/escolher-nicho">Adicionar ao meu plano</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Setup zero · Ativação em 24h · Cancela quando quiser
          </p>
        </div>
      </section>

      {/* DIFERENCIAL ÚNICO */}
      <section className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-3 bg-amber-500/15 text-amber-700 border-amber-500/30">
            Only Impulsionando
          </Badge>
          <h2 className="text-3xl font-bold">O que nenhum concorrente entrega</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Zendesk, Freshdesk, Movidesk, Octadesk — todos são sistemas isolados.
            Aqui o suporte é parte do ecossistema, integrado nativamente.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Users, title: 'Integração nativa ao CRM', desc: 'Cada ticket aparece dentro do lead e da oportunidade. O atendente vê histórico, pedidos, faturas e agenda do solicitante sem trocar de tela.' },
            { icon: MessageCircle, title: 'Follow-up automático', desc: 'Toda mudança de status dispara WhatsApp + Email para o cliente, com templates editáveis. Sem integrações de terceiros.' },
            { icon: Sparkles, title: 'IA que resume em %', desc: 'A IA agrupa todos os tickets em temas e mostra o percentual de cada problema. A gestão entende o que está doendo de verdade.' },
            { icon: RotateCcw, title: 'Reabertura no mesmo protocolo', desc: 'Cliente volta? O ticket é reaberto sem criar protocolo novo. Histórico contínuo, contagem de reaberturas para análise.' },
            { icon: Clock, title: 'SLA por plano e prioridade', desc: 'Cada plano contratado tem SLA próprio. Tickets em risco e estourados são sinalizados em tempo real.' },
            { icon: TrendingUp, title: 'Métricas que fazem sentido', desc: 'TTFR (tempo até 1ª resposta), TTR (tempo até solução), CSAT, backlog e taxa de reabertura — tudo no mesmo painel.' },
          ].map((f, i) => (
            <Card key={i} className="border-primary/10 hover:border-primary/40 transition">
              <CardContent className="pt-6">
                <f.icon className="h-6 w-6 text-primary mb-3" />
                <div className="font-semibold mb-1">{f.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="bg-muted/30 border-y">
        <div className="container max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-3">Como nos comparamos</h2>
          <p className="text-center text-muted-foreground mb-10">Preço, recursos e o que ninguém mais oferece.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-background rounded-lg border">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold">Recurso</th>
                  <th className="p-4 font-semibold bg-primary/10">Impulsionando</th>
                  <th className="p-4 font-semibold text-muted-foreground">Zendesk</th>
                  <th className="p-4 font-semibold text-muted-foreground">Movidesk</th>
                  <th className="p-4 font-semibold text-muted-foreground">Octadesk</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Preço fixo (não por agente)', '✓ R$ 497/mês', 'US$ 55/agente', 'R$ 219/agente', 'R$ 199/agente'],
                  ['CRM integrado nativamente', '✓', '✕', '✕', '✕'],
                  ['Follow-up WhatsApp automático', '✓ incluso', 'Add-on pago', 'Limitado', '✓'],
                  ['Follow-up Email automático', '✓ incluso', '✓', '✓', '✓'],
                  ['IA agrupando temas em %', '✓ Lovable AI', 'Add-on enterprise', '✕', '✕'],
                  ['Reabertura no mesmo protocolo', '✓', '✓', '✓', 'Parcial'],
                  ['Visão 360 do solicitante', '✓ pedidos, faturas, agenda', 'Só tickets', 'Só tickets', 'Só tickets'],
                  ['Ecossistema (agenda, financeiro, marketplace)', '✓', '✕', '✕', '✕'],
                ].map(([f, us, z, m, o], i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-4 font-medium">{f}</td>
                    <td className="p-4 bg-primary/5 text-primary font-semibold">{us}</td>
                    <td className="p-4 text-muted-foreground text-center">{z}</td>
                    <td className="p-4 text-muted-foreground text-center">{m}</td>
                    <td className="p-4 text-muted-foreground text-center">{o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="container max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Do chamado à solução, com inteligência</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { n: '1', t: 'Cliente abre chamado', d: 'Via portal, email, WhatsApp ou form. Gera protocolo único.' },
            { n: '2', t: 'Vincula ao CRM', d: 'Sistema identifica o lead/oportunidade e mostra todo o contexto ao operador.' },
            { n: '3', t: 'Atendimento + follow-up', d: 'Cada mudança de status dispara WhatsApp + Email para o cliente. SLA monitorado.' },
            { n: '4', t: 'Encerra + IA aprende', d: 'CSAT é coletado, IA categoriza o problema. Gestão vê % por tema.' },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold flex items-center justify-center text-lg mb-3">{s.n}</div>
              <div className="font-semibold mb-1">{s.t}</div>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PARA O GESTOR */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-y">
        <div className="container max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-3">Painel do Gestor</Badge>
              <h2 className="text-3xl font-bold mb-4">Saiba onde o tempo da sua equipe está indo</h2>
              <ul className="space-y-3 text-sm">
                {[
                  'Tempo médio até a primeira resposta (TTFR)',
                  'Tempo médio até a solução (TTR)',
                  'Backlog de tickets abertos por prioridade',
                  'CSAT médio + nº de respostas',
                  'Tickets que foram reabertos (e quantas vezes)',
                  'IA mostra os 10 temas mais recorrentes em %',
                  'Tickets com SLA estourado ou em risco em destaque',
                ].map((m) => (
                  <li key={m} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span>{m}</span></li>
                ))}
              </ul>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="text-xs font-semibold text-primary mb-3">Exemplo do painel</div>
                <div className="space-y-3">
                  {[
                    ['Erro no checkout Pix', 32],
                    ['Dúvida sobre nota fiscal', 21],
                    ['Acesso bloqueado', 15],
                    ['Lentidão no app', 12],
                    ['Outros', 20],
                  ].map(([t, p]) => (
                    <div key={t as string}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{t}</span>
                        <span className="text-muted-foreground tabular-nums">{p}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Perguntas frequentes</h2>
        <div className="space-y-4">
          {[
            ['É um módulo separado?', 'Sim. É um add-on contratado à parte por R$ 497/mês. Mas, ao ativar, ele se conecta automaticamente ao CRM, agenda, financeiro e marketplace que você já tem.'],
            ['Cobra por atendente?', 'Não. O preço é fixo, com agentes ilimitados. Você cresce a equipe sem multiplicar o custo.'],
            ['Precisa do CRM contratado?', 'Não, ele funciona sozinho. Mas se você tiver o CRM da Impulsionando, ele vira poderoso: cada ticket aparece dentro do lead e da oportunidade.'],
            ['O WhatsApp e Email já vêm?', 'Sim. As mensagens de follow-up por status saem via os canais do ecossistema, sem integrações externas.'],
            ['Como funciona a reabertura?', 'O cliente pode reabrir um ticket fechado pelo portal. Mantemos o mesmo protocolo, com contagem de reaberturas — você sabe quais problemas voltaram.'],
            ['A IA é confiável?', 'Usamos o Lovable AI Gateway (Google Gemini). Ela categoriza tickets em temas curtos e gera um resumo de 1 frase. O agrupamento alimenta o painel de % por tema.'],
          ].map(([q, a]) => (
            <Card key={q as string}>
              <CardContent className="pt-5">
                <div className="font-semibold mb-2">{q}</div>
                <p className="text-sm text-muted-foreground">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <Headphones className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pare de operar suporte às cegas</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Cada ticket vira informação útil. Cada problema recorrente aparece em %.
            Cada cliente recebe acompanhamento por WhatsApp e Email automaticamente.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                Contratar por R$ 497/mês <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/escolher-nicho">Ver no orçamento</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
