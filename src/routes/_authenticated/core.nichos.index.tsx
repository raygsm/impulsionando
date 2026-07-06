import { createFileRoute } from "@tanstack/react-router";
import { CoreHubPage } from "@/components/app/CoreHubPage";
import {
  HeartPulse, Utensils, ShoppingBag, Wrench, Home, Ticket,
  GraduationCap, Factory, Cpu, Scale, Sparkles, Palmtree,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/nichos/")({
  head: () => ({ meta: [{ title: "Nichos — Core Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: NichosHub,
});

function NichosHub() {
  return (
    <CoreHubPage
      title="Nichos"
      description="Macro-nichos do ecossistema. Cada macro agrupa subnichos e a matriz de módulos que faz sentido para ele."
      intro={
        <p>
          Nichos específicos (Microcervejaria, Clínica de estética, Hamburgueria, Salão…)
          são subnichos dentro do macro correspondente — nunca item de menu principal.
        </p>
      }
      items={[
        { to: "/core/nichos/saude", label: "Saúde", icon: HeartPulse, description: "Clínicas, consultórios, hospitais, medicina ocupacional, telemedicina.", status: "pronto" },
        { to: "/core/nichos/alimentacao", label: "Alimentação & Bebidas", icon: Utensils, description: "Restaurantes, bares, delivery, cafeterias, microcervejarias, hamburguerias.", status: "pronto" },
        { to: "/core/nichos/comercio", label: "Comércio & Varejo", icon: ShoppingBag, description: "Lojas físicas, e-commerce, PDV, marketplace multi-loja.", status: "em-construcao" },
        { to: "/core/nichos/servicos", label: "Serviços", icon: Wrench, description: "Prestadores autônomos, oficinas, estúdios, agências.", status: "em-construcao" },
        { to: "/core/nichos/imobiliario", label: "Imobiliário", icon: Home, description: "Imobiliárias, corretores, temporada, incorporadoras.", status: "pronto" },
        { to: "/core/nichos/eventos", label: "Eventos", icon: Ticket, description: "Produtores, casas de show, ingressos, lista VIP, patrocínios.", status: "em-construcao" },
        { to: "/core/nichos/educacao", label: "Educação", icon: GraduationCap, description: "Escolas, cursos, polos, banco de talentos.", status: "em-construcao" },
        { to: "/core/nichos/fornecedores", label: "Fornecedores", icon: Factory, description: "Distribuidores, fabricantes, representantes, indústrias artesanais.", status: "em-construcao" },
        { to: "/core/nichos/tecnologia", label: "Tecnologia", icon: Cpu, description: "Software houses, agências digitais, integradores.", status: "em-construcao" },
        { to: "/core/nichos/juridico", label: "Jurídico & Contábil", icon: Scale, description: "Escritórios de advocacia, contabilidade, consultorias regulatórias.", status: "em-construcao" },
        { to: "/core/nichos/beleza", label: "Beleza & Estética", icon: Sparkles, description: "Salões, barbearias, estética avançada, spa.", status: "em-construcao" },
        { to: "/core/nichos/turismo", label: "Turismo & Hospitalidade", icon: Palmtree, description: "Pousadas, hotéis, receptivos, aluguel por temporada.", status: "em-construcao" },
      ]}
    />
  );
}
