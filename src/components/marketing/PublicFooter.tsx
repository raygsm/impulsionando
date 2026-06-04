import { Link } from "@tanstack/react-router";
import { MessageCircle, Mail } from "lucide-react";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";

const WHATSAPP_URL = "https://wa.me/5521993075000";
const EMAIL = "sac@impulsionandobrasil.com.br";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/30 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2 space-y-4">
          <img src={logoAsset.url} alt="Impulsionando Tecnologia" className="h-28 md:h-32 w-auto object-contain" />
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Tecnologia, automação, sistemas inteligentes e integrações digitais para empresas que precisam crescer com organização e eficiência.
          </p>
          <div className="space-y-2 text-sm">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <MessageCircle className="w-4 h-4" /> +55 21 99307-5000
            </a>
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Mail className="w-4 h-4" /> {EMAIL}
            </a>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Tecnologia</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/solucoes" className="hover:text-foreground">Soluções</Link></li>
            <li><Link to="/modulos" className="hover:text-foreground">Módulos</Link></li>
            <li><Link to="/nichos" className="hover:text-foreground">Nichos</Link></li>
            <li><Link to="/planos" className="hover:text-foreground">Planos</Link></li>
            <li><Link to="/orcamento" className="hover:text-foreground">Orçamento automático</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Experimente</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/demo" className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                ▶ Acessar Sistema DEMO
              </Link>
            </li>
            <li><Link to="/showroom/fitness" className="hover:text-foreground">Showroom Fitness</Link></li>
            <li><Link to="/showroom/eventos" className="hover:text-foreground">Showroom Eventos</Link></li>
            <li><Link to="/como-funciona/fitness" className="hover:text-foreground">Como funciona (Fitness)</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Área do cliente</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Grupo Impulsionando</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/sobre" className="hover:text-foreground">Sobre o grupo</Link></li>
            <li><Link to="/contato" className="hover:text-foreground">Contato</Link></li>
            <li><Link to="/trabalhe-conosco" className="hover:text-foreground">Trabalhe conosco</Link></li>
            <li>
              <a
                href="https://impulsionandobrasil.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1"
              >
                Impulsionando Brasil (Marketing) ↗
              </a>
            </li>
            <li><Link to="/termos" className="hover:text-foreground">Termos de Uso</Link></li>
            <li><Link to="/privacidade" className="hover:text-foreground">Política de Privacidade (LGPD)</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Impulsionando Tecnologia. Todos os direitos reservados.</span>
          <span className="font-medium text-foreground">O limite é onde você quiser chegar.</span>
        </div>
      </div>
    </footer>
  );
}
