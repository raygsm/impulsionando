/**
 * Combinações recomendadas por nicho de negócio.
 * Cada bundle é uma sugestão de módulos prontos para um caso de uso.
 */

import type { CatalogModule } from "@/data/moduleCatalog";
import { getModule } from "@/data/moduleCatalog";

export interface RecommendedBundle {
  /** Identificador único. */
  slug: string;
  /** Nome exibido no chip. */
  name: string;
  /** Linha curta de venda. */
  pitch: string;
  /** Slugs dos módulos sugeridos. */
  moduleSlugs: string[];
  /** Categorias do wizard onde o bundle aparece como sugestão. */
  matchCategories: string[];
  /** Segmentos onde o bundle aparece como sugestão (opcional). */
  matchSegments?: string[];
}

export const RECOMMENDED_BUNDLES: RecommendedBundle[] = [
  {
    slug: "clinica",
    name: "Clínica e Consultório",
    pitch: "Agenda, prontuário e área do paciente, do agendamento ao pós-atendimento.",
    moduleSlugs: ["crm", "agenda", "whatsapp", "checkout", "prontuario", "area_paciente", "bi"],
    matchCategories: ["saude"],
  },
  {
    slug: "restaurante",
    name: "Restaurante e Bar",
    pitch: "Reservas pagas, PDV, comandas, estoque e relacionamento em um lugar só.",
    moduleSlugs: ["crm", "reservas", "whatsapp", "pdv", "checkout", "estoque", "bi"],
    matchCategories: ["alimentacao"],
  },
  {
    slug: "delivery",
    name: "Delivery",
    pitch: "Cardápio, pedidos, pagamentos, entregadores e estoque integrados.",
    moduleSlugs: ["crm", "produtos", "delivery", "checkout", "whatsapp", "estoque", "bi"],
    matchCategories: ["alimentacao"],
  },
  {
    slug: "eventos",
    name: "Eventos e Ingressos",
    pitch: "Venda de ingressos, lotes, check-in, afiliados e relacionamento pós-evento.",
    moduleSlugs: ["eventos", "checkout", "whatsapp", "crm", "afiliados", "bi"],
    matchCategories: ["eventos"],
  },
  {
    slug: "afiliados",
    name: "Afiliados e Produtos",
    pitch: "Plataforma completa para produtores, afiliados e vendas digitais.",
    moduleSlugs: ["produtos", "afiliados", "checkout", "crm", "followups", "bi"],
    matchCategories: ["afiliados"],
  },
  {
    slug: "white_label",
    name: "White Label",
    pitch: "Revenda a plataforma com sua marca, identidade e clientes próprios.",
    moduleSlugs: ["white_label", "crm", "bi", "permissoes", "followups"],
    matchCategories: ["white-label"],
  },
];

export function bundlesForCategory(category: string): RecommendedBundle[] {
  return RECOMMENDED_BUNDLES.filter((b) => b.matchCategories.includes(category));
}

export function resolveBundleModules(bundle: RecommendedBundle): CatalogModule[] {
  return bundle.moduleSlugs
    .map(getModule)
    .filter((m): m is CatalogModule => Boolean(m));
}
