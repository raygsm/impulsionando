import { Link } from "@tanstack/react-router";
import { MessageCircle, Mail, ExternalLink } from "lucide-react";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { BuildStamp } from "@/components/brand/BuildStamp";

/* ============================================================================
 * PublicFooter — Onda A1 (redundâncias eliminadas, jornada clara)
 *
 * Estrutura: 4 colunas por JORNADA (Explorar · Contratar · Cliente · Institucional).
 * Cada destino aparece 1x; /modulos e /demo não são repetidos com labels
 * artificiais. Setores agrupados por macro sem paralelismo confuso.
 * ========================================================================== */

const WHATSAPP_URL = "https://wa.me/5521993075000";
const EMAIL = "sac@impulsionando.com.br";

type Col = {
  title: string;
  eyebrow: string;
  links: { to: string; label: string; hash?: string }[];
};

const COLS: Col[] = [
  {
    eyebrow: "Explorar",
    title: "Conhecer a plataforma",
    links: [
      { to: "/modulos", label: "Soluções e módulos" },
      { to: "/nichos", label: "Setores atendidos" },
      { to: "/demo", label: "Demonstrações" },
      { to: "/vitrine", label: "Vitrine de páginas prontas" },
      { to: "/ecossistema", label: "Ecossistema Impulsionando" },
      { to: "/clube", label: "Clube (consumidor final)" },
    ],
  },
  {
    eyebrow: "Contratar",
    title: "Começar agora",
    links: [
      { to: "/escolher-nicho", label: "Descobrir minha solução" },
      { to: "/orcamento", label: "Montar orçamento" },
      { to: "/contratar", label: "Contratar direto" },
      { to: "/app", label: "Baixar o app" },
    ],
  },
  {
    eyebrow: "Cliente",
    title: "Já sou cliente",
    links: [
      { to: "/auth", label: "Entrar no Core" },
      { to: "/suporte", label: "Suporte" },
      { to: "/central-de-ajuda", label: "Central de ajuda" },
      { to: "/canal-oficial", label: "Canal oficial único" },
    ],
  },
  {
    eyebrow: "Institucional",
    title: "Impulsionando Tecnologia",
    links: [
      { to: "/sobre", label: "Sobre" },
      { to: "/contato", label: "Contato" },
      { to: "/trabalhe-conosco", label: "Trabalhe conosco" },
      { to: "/termos", label: "Termos de uso" },
      { to: "/privacidade", label: "Política de privacidade" },
      { to: "/reembolso", label: "Política de reembolso" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border surface-2 mt-20">
      <div className="container-narrow section-tight">
        {/* Bloco superior: marca + navegação por jornada */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,3fr)]">
          <div className="space-y-4 min-w-0">
            <LogoImpulsionando variant="light" size="xl" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Uma plataforma que entende sua empresa, organiza suas jornadas e cresce com você.
            </p>
            <div className="space-y-1.5 text-xs">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" /> +55 21 99307-5000
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <Mail className="w-3.5 h-3.5" /> {EMAIL}
              </a>
              <a
                href="https://impulsionandobrasil.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Impulsionando Tecnologia
              </a>
            </div>
          </div>

          <nav aria-label="Rodapé" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {COLS.map((col) => (
              <div key={col.title} className="min-w-0">
                <div className="text-eyebrow mb-2">{col.eyebrow}</div>
                <div className="text-sm font-semibold text-foreground mb-3">{col.title}</div>
                <ul className="space-y-1.5 text-sm">
                  {col.links.map((l) => (
                    <li key={`${col.title}-${l.to}-${l.label}`}>
                      <Link
                        to={l.to}
                        className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Canal oficial — mantido, sem "Saiba mais" duplicado (já linkado ao lado) */}
        <div className="mt-10 rounded-md border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-4 text-xs leading-snug text-amber-900 dark:text-amber-100">
          <strong>Canal oficial único.</strong> Toda comunicação, envio de documentos, comprovantes
          e solicitações acontece exclusivamente pelo WhatsApp oficial:{" "}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            (21) 99307-5000
          </a>
          . Para sua segurança, contatos por outros canais não serão considerados{" "}
          <Link to="/canal-oficial" className="underline underline-offset-2 font-semibold">
            (política completa)
          </Link>
          .
        </div>

        <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Impulsionando Tecnologia. Todos os direitos reservados.</span>
          <div className="flex items-center gap-3">
            <BuildStamp />
            <span className="font-medium text-foreground">O limite é onde você quiser chegar.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
