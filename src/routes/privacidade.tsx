import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Shield, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade e LGPD — Impulsionando Tecnologia" },
      { name: "description", content: "Política de Privacidade e tratamento de dados pessoais da Impulsionando Tecnologia em conformidade com a LGPD — Lei 13.709/2018." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Política de Privacidade — Impulsionando Tecnologia" },
      { property: "og:description", content: "Como tratamos seus dados pessoais conforme a LGPD." },
      { property: "og:url", content: "https://impulsionando.com.br/privacidade" },
    
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/privacidade" }],
  }),
  component: PrivacidadePage,
});

const EMAIL_DPO = "sac@impulsionando.com.br";
const WHATSAPP_URL = "https://wa.me/5521993075000";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function PrivacidadePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-content-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Versão 1.0 — atualizada em junho/2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Política de Privacidade e LGPD
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          A Impulsionando Tecnologia ("nós") respeita sua privacidade e trata dados pessoais em
          conformidade com a Lei Geral de Proteção de Dados — <strong>Lei nº 13.709/2018 (LGPD)</strong>.
          Esta política explica quais dados coletamos, como utilizamos, com quem compartilhamos
          e quais são os seus direitos como titular.
        </p>

        <Card className="p-6 sm:p-8 space-y-8">
          <Section title="1. Quem é o controlador">
            <p>
              O controlador dos dados é a <strong>Impulsionando Tecnologia</strong>, parte do grupo
              Impulsionando Brasil. Contato do encarregado (DPO):{" "}
              <a href={`mailto:${EMAIL_DPO}`} className="text-primary underline">{EMAIL_DPO}</a>.
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cadastro:</strong> nome, e-mail, telefone/WhatsApp, empresa, CNPJ.</li>
              <li><strong>Operacionais:</strong> dados de clientes, agendamentos, vendas e transações que você registra ao usar a plataforma.</li>
              <li><strong>Técnicos:</strong> endereço IP, tipo de dispositivo, navegador, páginas acessadas e cookies.</li>
              <li><strong>Comunicação:</strong> mensagens trocadas via formulários, WhatsApp e e-mail.</li>
            </ul>
          </Section>

          <Section title="3. Bases legais e finalidades">
            <p>Tratamos dados com base nas seguintes hipóteses do art. 7º da LGPD:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Execução de contrato:</strong> prestar os serviços contratados.</li>
              <li><strong>Consentimento:</strong> envio de comunicações de marketing, cookies não essenciais.</li>
              <li><strong>Cumprimento de obrigação legal:</strong> fiscal, contábil e trabalhista.</li>
              <li><strong>Legítimo interesse:</strong> segurança, prevenção a fraudes e melhoria do produto.</li>
            </ul>
          </Section>

          <Section title="4. Compartilhamento de dados">
            <p>
              Não vendemos seus dados. Compartilhamos somente com operadores necessários à
              prestação do serviço (infraestrutura em nuvem, gateways de pagamento, provedores
              de e-mail/WhatsApp) e quando exigido por autoridade competente. Todos os
              operadores são contratualmente obrigados a seguir a LGPD.
            </p>
          </Section>

          <Section title="5. Cookies">
            <p>
              Utilizamos cookies <strong>essenciais</strong> (login, segurança), de{" "}
              <strong>análise</strong> (métricas anônimas de uso) e de <strong>marketing</strong>{" "}
              (personalização). Você pode ajustar suas preferências a qualquer momento no banner
              de cookies exibido no site.
            </p>
          </Section>

          <Section title="6. Retenção">
            <p>
              Mantemos os dados pelo tempo necessário ao cumprimento das finalidades e prazos
              legais (mínimo de 5 anos para registros fiscais). Após esse período, os dados são
              eliminados ou anonimizados de forma segura.
            </p>
          </Section>

          <Section title="7. Seus direitos como titular (art. 18 da LGPD)">
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminação dos dados tratados com base no consentimento</li>
              <li>Informação sobre compartilhamento</li>
              <li>Revogação do consentimento</li>
              <li>Revisão de decisões automatizadas</li>
            </ul>
            <p className="pt-2">
              Para exercer qualquer direito, escreva para{" "}
              <a href={`mailto:${EMAIL_DPO}`} className="text-primary underline">{EMAIL_DPO}</a>{" "}
              ou fale no{" "}
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                WhatsApp +55 21 99307-5000
              </a>. Responderemos em até 15 dias.
            </p>
          </Section>

          <Section title="8. Segurança">
            <p>
              Adotamos medidas técnicas e administrativas para proteger seus dados:
              criptografia em trânsito (HTTPS/TLS), controle de acesso por perfil, registro de
              auditoria, backup periódico e monitoramento contínuo. Em caso de incidente de
              segurança, comunicaremos a ANPD e os titulares afetados conforme exige a lei.
            </p>
          </Section>

          <Section title="9. Transferência internacional">
            <p>
              Alguns provedores podem armazenar dados em servidores fora do Brasil. Sempre que
              isso ocorrer, exigimos garantias contratuais compatíveis com a LGPD.
            </p>
          </Section>

          <Section title="10. Alterações desta política">
            <p>
              Esta política pode ser atualizada periodicamente. A versão vigente estará sempre
              publicada nesta página, com a data da última atualização no topo.
            </p>
          </Section>

          <Section title="11. Encarregado de dados (DPO) e contato">
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <a href={`mailto:${EMAIL_DPO}`} className="text-primary underline">{EMAIL_DPO}</a>
            </p>
            <p className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                WhatsApp +55 21 99307-5000
              </a>
            </p>
            <p className="pt-2">
              Caso prefira, utilize nosso{" "}
              <Link to="/contato" className="text-primary underline">formulário de contato</Link>.
            </p>
          </Section>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
