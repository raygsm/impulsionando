import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/reembolso")({
  head: () => ({
    meta: [
      { title: "Política de Reembolso — Impulsionando" },
      {
        name: "description",
        content:
          "Pagamentos processados via Mercado Pago. A política de reembolso varia conforme cada vendedor do ecossistema Impulsionando.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Política de Reembolso — Impulsionando" },
      {
        property: "og:description",
        content:
          "Pagamentos via Mercado Pago. Política de reembolso definida por cada vendedor participante.",
      },
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
            <RotateCcw className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <span className="text-xs text-muted-foreground">
            Versão 2.0 — atualizada em junho/2026
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Política de Reembolso
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          A <strong>Impulsionando Tecnologia</strong> (CNPJ 54.295.500/0001-27) opera um
          ecossistema com diferentes empresas vendedoras de serviços e produtos. Os pagamentos
          do ecossistema são processados via <strong>Mercado Pago</strong>, e a política de
          reembolso aplicada a cada compra varia conforme o vendedor responsável pela oferta.
        </p>

        <Card className="p-6 sm:p-8 space-y-8">
          <Section title="1. Processamento de pagamentos">
            <p>
              Todos os pagamentos do ecossistema Impulsionando — assinaturas, planos, compras
              avulsas e cobranças recorrentes — são <strong>processados via Mercado Pago</strong>,
              que atua como operador da transação (cartão de crédito, débito, PIX e boleto).
              A Impulsionando Tecnologia recebe os valores líquidos repassados pelo Mercado Pago
              conforme o meio de pagamento utilizado.
            </p>
          </Section>

          <Section title="2. Política de reembolso varia por vendedor">
            <p>
              Cada empresa vendedora participante do ecossistema Impulsionando define sua{" "}
              <strong>própria política de reembolso, garantia, cancelamento e estorno</strong>
              , de acordo com a natureza do produto ou serviço comercializado. A política
              aplicável aparece na página do produto, no checkout e no contrato/termo enviado
              ao cliente no momento da compra.
            </p>
            <p>
              Quando a compra é feita diretamente da Impulsionando Tecnologia (assinaturas da
              plataforma), aplica-se a regra padrão descrita no item 3.
            </p>
          </Section>

          <Section title="3. Regra padrão Impulsionando (quando o vendedor é a própria Impulsionando)">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Arrependimento (Art. 49 do CDC):</strong> em compras realizadas fora do
                estabelecimento físico, o cliente pode desistir em até{" "}
                <strong>7 (sete) dias corridos</strong> após a confirmação do pagamento, com
                devolução integral.
              </li>
              <li>
                <strong>Garantia estendida:</strong> nas assinaturas mensais e anuais da
                Impulsionando, oferecemos reembolso integral em até{" "}
                <strong>30 (trinta) dias corridos</strong> da primeira cobrança do ciclo.
              </li>
              <li>
                <strong>Após 30 dias:</strong> assinaturas podem ser canceladas a qualquer
                momento; o cancelamento encerra a próxima renovação e o acesso permanece ativo
                até o fim do ciclo já pago.
              </li>
            </ul>
          </Section>

          <Section title="4. Como solicitar reembolso">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Compras de vendedores parceiros:</strong> abra a solicitação diretamente
                com o vendedor responsável pela oferta — o canal de contato consta no e-mail de
                confirmação da compra e no recibo do Mercado Pago.
              </li>
              <li>
                <strong>Compras Impulsionando Tecnologia:</strong> escreva para{" "}
                <a
                  href="mailto:sac@impulsionando.com.br"
                  className="text-primary underline underline-offset-2"
                >
                  sac@impulsionando.com.br
                </a>{" "}
                informando o e-mail e o ID da transação Mercado Pago.
              </li>
              <li>
                O estorno é executado pelo Mercado Pago no mesmo meio de pagamento utilizado
                (cartão, PIX ou boleto) e segue os prazos do emissor — em geral, de 5 a 10 dias
                úteis para aparecer na fatura.
              </li>
            </ul>
          </Section>

          <Section title="5. Casos excepcionais">
            <p>
              Cobrança duplicada, falha técnica comprovada ou indisponibilidade prolongada do
              serviço por culpa do vendedor podem ser tratadas a qualquer tempo e serão
              analisadas prontamente, independentemente do prazo padrão.
            </p>
          </Section>

          <Section title="6. Contato">
            <p>
              Dúvidas sobre reembolso ou cancelamento de assinaturas da Impulsionando:{" "}
              <a
                href="mailto:sac@impulsionando.com.br"
                className="text-primary underline underline-offset-2"
              >
                sac@impulsionando.com.br
              </a>{" "}
              ou pelo{" "}
              <Link to="/contato" className="text-primary underline underline-offset-2">
                formulário de contato
              </Link>
              . Veja também os{" "}
              <Link to="/termos" className="text-primary underline underline-offset-2">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link to="/privacidade" className="text-primary underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
          </Section>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
