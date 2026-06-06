import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/reembolso")({
  head: () => ({
    meta: [
      { title: "Política de Reembolso — Impulsionando Tecnologia" },
      { name: "description", content: "Garantia de reembolso de 30 dias nas assinaturas da Impulsionando Tecnologia. Saiba como solicitar." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Política de Reembolso — Impulsionando Tecnologia" },
      { property: "og:description", content: "Garantia de 30 dias e instruções para solicitar reembolso." },
      { property: "og:url", content: "https://impulsionando.com.br/reembolso" },
    
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/reembolso" }],
  }),
  component: ReembolsoPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function ReembolsoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-content-center">
            <RotateCcw className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Versão 1.0 — atualizada em junho/2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Política de Reembolso</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          A <strong>Impulsionando Tecnologia</strong> (CNPJ 54.295.500/0001-27) oferece uma
          garantia de satisfação para as assinaturas contratadas em sua plataforma. Esta política
          descreve o prazo e o procedimento para solicitar o reembolso.
        </p>

        <Card className="p-6 sm:p-8 space-y-8">
          <Section title="1. Garantia de 30 dias">
            <p>
              Você pode solicitar o reembolso integral da sua assinatura em até{" "}
              <strong>30 (trinta) dias corridos</strong> a contar da data da compra (primeira
              cobrança do ciclo). Aplica-se a planos mensais e anuais.
            </p>
          </Section>

          <Section title="2. Como solicitar">
            <p>
              Os pagamentos são processados pelo nosso revendedor oficial{" "}
              <strong>Paddle.com</strong>, que atua como Merchant of Record. Para solicitar o
              reembolso, utilize qualquer um dos canais abaixo:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Acesse{" "}
                <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  paddle.net
                </a>{" "}
                e localize sua compra usando o e-mail utilizado no checkout;
              </li>
              <li>
                Ou escreva para{" "}
                <a href="mailto:sac@impulsionando.com.br" className="text-primary underline">sac@impulsionando.com.br</a>
                {" "}informando o e-mail da compra e o motivo — nós encaminharemos à Paddle.
              </li>
            </ul>
            <p>
              O estorno é processado pela Paddle no mesmo meio de pagamento utilizado (cartão,
              PIX, etc.) e pode levar de 5 a 10 dias úteis para aparecer na fatura, conforme
              prazos do emissor.
            </p>
          </Section>

          <Section title="3. Após o prazo de 30 dias">
            <p>
              Passado o período de garantia, assinaturas ativas podem ser canceladas a qualquer
              momento — o cancelamento encerra a renovação seguinte e mantém o acesso até o fim
              do ciclo já pago. Não há reembolso proporcional do período em curso, salvo
              determinação legal em contrário ou avaliação caso a caso pela Paddle.
            </p>
          </Section>

          <Section title="4. Casos excepcionais">
            <p>
              Em situações de cobrança duplicada, indisponibilidade prolongada do serviço por
              nossa culpa ou erro técnico comprovado, a solicitação pode ser feita a qualquer
              tempo e será analisada prontamente.
            </p>
          </Section>

          <Section title="5. Contato">
            <p>
              Dúvidas sobre reembolso ou cancelamento:{" "}
              <a href="mailto:sac@impulsionando.com.br" className="text-primary underline">sac@impulsionando.com.br</a>{" "}
              ou pelo{" "}
              <Link to="/contato" className="text-primary underline">formulário de contato</Link>.
              Veja também nossos{" "}
              <Link to="/termos" className="text-primary underline">Termos de Uso</Link> e{" "}
              <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
            </p>
          </Section>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
