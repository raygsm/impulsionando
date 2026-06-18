import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

/**
 * Bloco de chamada pública para a Rede de Talentos.
 * Use nas páginas de nicho (saúde, jurídico, restaurantes, etc.).
 */
export function TalentosCTA() {
  return (
    <section aria-labelledby="talentos-cta" className="border-t bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <Users className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <h2 id="talentos-cta" className="mt-4 text-3xl font-bold tracking-tight">
          Encontre talentos para sua operação
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Além de CRM, ERP, automação e relacionamento, a Impulsionando ajuda sua empresa
          a encontrar profissionais da sua região. Receba candidatos compatíveis e filtre
          por experiência, formação, cidade, faixa etária e disponibilidade — tudo dentro
          do mesmo ecossistema.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link to="/empresa/talentos">Acessar Banco de Talentos</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/talentos">Sou candidato</Link></Button>
        </div>
      </div>
    </section>
  );
}
