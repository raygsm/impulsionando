import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Impulsionando Tecnologia" },
      { name: "description", content: "Termos e condições de uso dos sistemas e serviços da Impulsionando Tecnologia." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Termos de Uso — Impulsionando Tecnologia" },
      { property: "og:description", content: "Condições gerais de uso da plataforma Impulsionando Tecnologia." },
      { property: "og:url", content: "https://impulsionando.com.br/termos" },
    
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/termos" }],
  }),
  component: TermosPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function TermosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-content-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Versão 1.0 — atualizada em junho/2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Estes Termos regem o uso dos sistemas e serviços oferecidos por <strong>Impulsionando Tecnologia</strong>
          {" "}(CNPJ 54.295.500/0001-27), doravante "Impulsionando", "nós" ou "Empresa". Ao criar uma conta,
          contratar um plano ou utilizar qualquer parte da plataforma, você ("Cliente" ou "Usuário")
          declara ter lido, compreendido e aceito integralmente estes Termos.
        </p>

        <Card className="p-6 sm:p-8 space-y-8">
          <Section title="1. Identificação do prestador">
            <p>
              O serviço é prestado por <strong>Impulsionando Tecnologia</strong>, CNPJ
              54.295.500/0001-27, parte do grupo Impulsionando Brasil. Contato:
              {" "}<a href="mailto:sac@impulsionando.com.br" className="text-primary underline">sac@impulsionando.com.br</a>.
            </p>
          </Section>

          <Section title="2. Aceitação">
            <p>
              O uso continuado da plataforma — incluindo cadastro, login, contratação de planos
              ou consumo de qualquer funcionalidade — implica concordância plena com estes Termos
              e com a <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
              Caso não concorde, não utilize o serviço.
            </p>
            <p>
              Se você aceita em nome de uma pessoa jurídica, declara possuir poderes para vincular
              essa entidade. Usuários pessoa física devem ter pelo menos 18 anos.
            </p>
          </Section>

          <Section title="3. Descrição do serviço">
            <p>
              A Impulsionando oferece uma plataforma SaaS (software como serviço) com módulos de
              gestão, automação, agendamento, vendas, atendimento e integrações. Os módulos
              disponíveis variam conforme o plano contratado.
            </p>
          </Section>

          <Section title="4. Conta, credenciais e veracidade">
            <p>
              Você é responsável por manter a confidencialidade de suas credenciais e por toda
              atividade realizada em sua conta. Deve fornecer informações verdadeiras, completas
              e atualizadas, e nos notificar imediatamente sobre qualquer uso não autorizado.
            </p>
          </Section>

          <Section title="5. Uso aceitável e proibições">
            <p>Você não pode, direta ou indiretamente:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Utilizar o serviço para fins ilegais, fraudulentos ou de spam;</li>
              <li>Violar direitos de propriedade intelectual ou de terceiros;</li>
              <li>Tentar comprometer a segurança (probes, malware, engenharia reversa, scraping massivo);</li>
              <li>Revender, sublicenciar ou redistribuir a plataforma sem autorização escrita;</li>
              <li>Contornar limites técnicos, cotas ou mecanismos de controle de acesso;</li>
              <li>Usar a plataforma para enviar conteúdo difamatório, discriminatório ou ilícito.</li>
            </ul>
          </Section>

          <Section title="6. Propriedade intelectual">
            <p>
              A plataforma, seu código-fonte, marca, layout, documentação e demais elementos
              são de titularidade exclusiva da Impulsionando Tecnologia. Concedemos a você uma
              licença limitada, não exclusiva, intransferível e revogável para utilizar o serviço
              estritamente dentro do plano contratado. Os dados que você inserir permanecem seus;
              concede-nos apenas a licença necessária para hospedá-los e processá-los na prestação
              do serviço.
            </p>
          </Section>

          <Section title="7. Pagamentos, assinaturas e revendedor (Paddle)">
            <p>
              O processo de pedido e pagamento é conduzido pelo nosso revendedor online{" "}
              <strong>Paddle.com</strong>. A <strong>Paddle é o Merchant of Record (MoR)</strong> de
              todas as nossas vendas e é responsável por: cobrança, faturamento, impostos
              aplicáveis, prevenção a fraude, atendimento a chargebacks e suporte a questões
              relacionadas ao pagamento e ao reembolso.
            </p>
            <p>
              Os termos comerciais de cobrança, renovação automática, métodos de pagamento (cartão,
              PIX, entre outros disponíveis), tributos e cancelamento estão descritos nos{" "}
              <a
                href="https://www.paddle.com/legal/checkout-buyer-terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Buyer Terms da Paddle
              </a>{" "}
              e prevalecem sobre estes Termos no que se refere à mecânica do pagamento.
            </p>
            <p>
              As assinaturas são renovadas automaticamente ao final de cada ciclo (mensal ou anual)
              pelo preço vigente, salvo cancelamento prévio realizado pelo Cliente. O cancelamento
              encerra a renovação seguinte e mantém o acesso até o fim do período já pago.
            </p>
          </Section>

          <Section title="8. Reembolso">
            <p>
              Oferecemos garantia de reembolso de <strong>30 dias</strong> a contar da data da
              compra, conforme nossa{" "}
              <Link to="/reembolso" className="text-primary underline">Política de Reembolso</Link>.
              Solicitações são processadas pela Paddle através do portal{" "}
              <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.net</a>
              {" "}ou pelo nosso suporte.
            </p>
          </Section>

          <Section title="9. Nível de serviço e disponibilidade">
            <p>
              Empregamos esforços técnicos razoáveis para manter o serviço disponível, mas{" "}
              <strong>não garantimos operação ininterrupta ou livre de erros</strong>. Janelas de
              manutenção, falhas de terceiros (provedores de nuvem, gateways, telecom) e eventos de
              força maior podem causar indisponibilidade temporária.
            </p>
          </Section>

          <Section title="10. Garantias e limitação de responsabilidade">
            <p>
              Na máxima extensão permitida pela lei aplicável, o serviço é fornecido "no estado em
              que se encontra", sem garantias implícitas de comercialização, adequação a um
              propósito específico ou não violação. Nossa responsabilidade agregada por quaisquer
              perdas relacionadas ao serviço limita-se ao valor efetivamente pago pelo Cliente nos
              12 (doze) meses anteriores ao evento. Não respondemos por danos indiretos, lucros
              cessantes, perda de dados ou de oportunidade, exceto quando a lei vedar tal
              limitação (dolo, fraude, danos corporais).
            </p>
          </Section>

          <Section title="11. Indenização">
            <p>
              Você concorda em indenizar e isentar a Impulsionando de reclamações de terceiros
              decorrentes de conteúdo inserido por você, uso indevido do serviço ou violação
              destes Termos.
            </p>
          </Section>

          <Section title="12. Suspensão e rescisão">
            <p>Podemos suspender ou encerrar seu acesso, com ou sem aviso prévio, em caso de:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violação material destes Termos ou da Política de Privacidade;</li>
              <li>Inadimplência confirmada após período de tolerância;</li>
              <li>Risco de segurança, fraude ou uso abusivo;</li>
              <li>Determinação legal ou de autoridade competente.</li>
            </ul>
            <p>
              Encerrada a relação, seus dados ficarão disponíveis para exportação por 30 dias e
              depois serão eliminados ou anonimizados, salvo retenção legal obrigatória.
            </p>
          </Section>

          <Section title="13. Alterações dos Termos">
            <p>
              Podemos alterar estes Termos a qualquer tempo. Alterações materiais serão
              comunicadas por e-mail ou pela plataforma com antecedência razoável. O uso continuado
              após a vigência implica aceitação da nova versão.
            </p>
          </Section>

          <Section title="14. Lei aplicável e foro">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
              foro da comarca da sede da Impulsionando Tecnologia para dirimir controvérsias, sem
              prejuízo dos direitos do consumidor previstos em lei.
            </p>
          </Section>

          <Section title="15. Contato">
            <p>
              Dúvidas sobre estes Termos:{" "}
              <a href="mailto:sac@impulsionando.com.br" className="text-primary underline">sac@impulsionando.com.br</a>{" "}
              ou pelo nosso{" "}
              <Link to="/contato" className="text-primary underline">formulário de contato</Link>.
            </p>
          </Section>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
