import { Link } from "@tanstack/react-router";
import { MessageCircle, Mail, ExternalLink } from "lucide-react";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";

const WHATSAPP_URL = "https://wa.me/5521993075000";
const EMAIL = "sac@impulsionando.com.br";

const COLS = [
  {
    title: "Impulsionando Tecnologia",
    links: [
      { to: "/", label: "Início" },
      { to: "/modulos", label: "Soluções" },
      { to: "/modulos", label: "Módulos" },
      { to: "/nichos", label: "Nichos" },
      { to: "/demo", label: "Demonstrações" },
      { to: "/escolher-nicho", label: "Planos" },
      { to: "/orcamento", label: "Orçamento automático" },
    ],
  },
  {
    title: "Produtos",
    links: [
      { to: "/modulos", label: "CRM e Atendimento" },
      { to: "/modulos", label: "Automação e Comunicação" },
      { to: "/modulos", label: "Agenda e Reservas" },
      { to: "/modulos", label: "Pagamentos" },
      { to: "/modulos", label: "BI e Dashboards" },
      { to: "/auth", label: "Área do Cliente" },
      { to: "/orcamento", label: "White Label" },
    ],
  },
  {
    title: "Nichos",
    links: [
      { to: "/nichos/imobiliaria", label: "Imobiliárias" },
      { to: "/nichos/saude", label: "Clínicas" },
      { to: "/nichos/contabilidade", label: "Contabilidade" },
      { to: "/nichos/bares", label: "Bares e Restaurantes" },
      { to: "/nichos/eventos", label: "Eventos" },
      { to: "/nichos/ecommerce", label: "E-commerce" },
      { to: "/nichos/servicos", label: "Serviços" },
      { to: "/nichos/fitness", label: "Fitness" },
      { to: "/nichos", label: "Educação" },
      { to: "/nichos", label: "White Label" },
    ],
  },
  {
    title: "Experimente",
    links: [
      { to: "/demo", label: "Demo geral" },
      { to: "/demo", label: "Demo por nicho" },
      { to: "/demo/feira", label: "Demo feira" },
      { to: "/auth", label: "Área do cliente" },
      { to: "/orcamento", label: "Solicitar implantação" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { to: "/sobre", label: "Sobre" },
      { to: "/contato", label: "Contato" },
      { to: "/trabalhe-conosco", label: "Trabalhe Conosco" },
      { to: "/termos", label: "Termos de Uso" },
      { to: "/privacidade", label: "Política de Privacidade" },
      { to: "/reembolso", label: "Política de Reembolso" },
      { to: "/canal-oficial", label: "Canal oficial único" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/30 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6 mb-10">
          <div className="lg:col-span-1 space-y-3">
            <LogoImpulsionando variant="light" size="xl" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sistemas modulares, automação e comunicação para empresas que precisam crescer com organização.
            </p>
            <div className="space-y-1.5 text-xs">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <MessageCircle className="w-3.5 h-3.5" /> +55 21 99307-5000
              </a>
              <a href={`mailto:${EMAIL}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Mail className="w-3.5 h-3.5" /> {EMAIL}
              </a>
              <a href="https://impulsionandobrasil.com.br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <ExternalLink className="w-3.5 h-3.5" /> Impulsionando Brasil
              </a>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold mb-3 text-foreground">{col.title}</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {col.links.map((l, i) => (
                  <li key={`${col.title}-${i}`}>
                    <Link to={l.to} className="hover:text-foreground">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-3 text-[11px] leading-snug text-amber-900 dark:text-amber-100 mb-6">
          <strong>Canal oficial único.</strong> Toda e qualquer informação, envio de documentos, comprovantes de pagamento, solicitações e comunicações deve ser realizada exclusivamente pelo WhatsApp oficial da Impulsionando:{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
            (21) 99307-5000
          </a>
          . Para sua segurança e melhor acompanhamento, contatos por outros canais não oficiais não serão considerados. <Link to="/canal-oficial" className="underline underline-offset-2 font-semibold">Saiba mais</Link>.
        </div>

        <div className="border-t border-border pt-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Impulsionando Tecnologia. Todos os direitos reservados.</span>
          <span className="font-medium text-foreground">O limite é onde você quiser chegar.</span>
        </div>
      </div>
    </footer>
  );
}
