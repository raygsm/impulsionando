import { Link } from "@tanstack/react-router";
import { MessageCircle, Mail } from "lucide-react";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";

const WHATSAPP_URL = "https://wa.me/5521993075000";
const EMAIL = "sac@impulsionandobrasil.com.br";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/30 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <img src={logoAsset.url} alt="Impulsionando Tecnologia" className="h-14 w-auto" />
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
          <div className="text-sm font-semibold mb-3">Navegar</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Início</Link></li>
            <li><Link to="/solucoes" className="hover:text-foreground">Soluções</Link></li>
            <li><Link to="/modulos" className="hover:text-foreground">Módulos</Link></li>
            <li><Link to="/planos" className="hover:text-foreground">Planos</Link></li>
            <li><Link to="/orcamento" className="hover:text-foreground">Orçamento automático</Link></li>
            <li><Link to="/contato" className="hover:text-foreground">Contato</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/termos" className="hover:text-foreground">Termos de Uso</Link></li>
            <li><Link to="/privacidade" className="hover:text-foreground">Política de Privacidade</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Área do cliente</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Impulsionando Tecnologia. Todos os direitos reservados.</span>
          <span>Tecnologia aplicada a negócios reais.</span>
        </div>
      </div>
    </footer>
  );
}
