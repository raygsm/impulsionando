import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileText, Mail } from "lucide-react";
import { buildGarridoBreadcrumbJsonLd, GarridoBreadcrumbs } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/politicas";

export const Route = createFileRoute("/garrido/politicas")({
  head: () => ({
    meta: [
      { title: "Políticas e LGPD — Imobiliária Garrido" },
      { name: "description", content: "Política de privacidade, termos de uso, LGPD e condições de anúncio da Imobiliária Garrido, empresa conectada ao Core Impulsionando." },
      { property: "og:title", content: "Políticas e LGPD — Imobiliária Garrido" },
      { property: "og:description", content: "Privacidade, termos de uso e condições de anúncio." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Políticas e LGPD" },
      ])),
    }],
  }),
  component: PoliticasPage,
});

function PoliticasPage() {
  return (
    <>
      <GarridoBreadcrumbs items={[{ label: "Início", to: "/garrido" }, { label: "Políticas e LGPD" }]} />

      <section className="max-w-3xl mx-auto px-4 py-10 md:py-14 space-y-8">
        <header>
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
            Transparência
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[color:var(--garrido-ink)] mt-2">
            Políticas & LGPD
          </h1>
          <p className="mt-3 text-slate-600">
            A Imobiliária Garrido é uma empresa conectada ao Core Impulsionando. Seus dados
            são tratados segundo a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018)
            e as práticas de segurança do ecossistema.
          </p>
        </header>

        <Bloco icon={ShieldCheck} titulo="Privacidade">
          <p>Coletamos apenas os dados necessários para atender você — nome, contato, informações
          do imóvel e preferências de busca. Nunca vendemos seus dados para terceiros.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Acesso: consulte tudo que temos sobre você na Área do cliente.</li>
            <li>Correção e portabilidade: solicite qualquer alteração ou download completo.</li>
            <li>Exclusão: exclua sua conta e histórico a qualquer momento.</li>
          </ul>
        </Bloco>

        <Bloco icon={FileText} titulo="Termos de uso">
          <p>Ao usar o site você concorda em prestar informações verdadeiras, respeitar a legislação
          e usar os canais oficiais para negociação. Contratos, propostas e visitas geram trilha
          de auditoria e podem ser usados como prova em caso de disputa.</p>
        </Bloco>

        <Bloco icon={FileText} titulo="Condições de anúncio">
          <p>Só publicamos imóveis com documentação verificada (escritura, registro, IPTU em dia).
          A comissão de mediação é acordada em contrato específico e só é devida quando o negócio
          é fechado. Reservamos o direito de recusar anúncios que descumpram a legislação de
          direitos do consumidor.</p>
        </Bloco>

        <Bloco icon={Mail} titulo="Encarregado de dados (DPO)">
          <p>Fale com nosso encarregado por{" "}
            <a href="mailto:dpo@impulsionando.com.br" className="underline">dpo@impulsionando.com.br</a>{" "}
            para exercer qualquer direito garantido pela LGPD ou reportar incidente.
          </p>
          <p className="mt-3">
            <Link to="/garrido/contato" className="text-sm font-semibold underline">
              Ou fale com a equipe Garrido pelos canais oficiais
            </Link>
          </p>
        </Bloco>

        <p className="text-xs text-slate-400 text-center pt-4">
          Última atualização: {new Date().getFullYear()}. Este conteúdo é referência institucional
          da Garrido dentro do Core Impulsionando.
        </p>
      </section>
    </>
  );
}

function Bloco({ icon: Icon, titulo, children }: { icon: any; titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 md:p-6 border border-black/5">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-[color:var(--garrido-gold)] shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-bold text-[color:var(--garrido-ink)]">{titulo}</h2>
          <div className="mt-2 text-sm text-slate-700 leading-relaxed space-y-2">{children}</div>
        </div>
      </div>
    </section>
  );
}
