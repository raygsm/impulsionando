import {
  Activity, Beer, BriefcaseBusiness, Building2, BusFront, Calculator, Car, Construction, Dumbbell,
  GraduationCap, HandHeart, HeartPulse, Hotel, House, PawPrint, Pill, Scale, ShieldCheck, ShoppingBasket,
  ShoppingBag, Sparkles, Store, Stethoscope, Truck, UtensilsCrossed, Warehouse, Wrench, type LucideIcon,
} from "lucide-react";
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";
import { COMMERCIAL_NICHE_PLAYBOOK } from "@/data/commercial-niche-playbook";

export type PublicNiche = {
  slug: string;
  label: string;
  description: string;
  group: string;
  icon: LucideIcon;
  kind: "canonical" | "playbook";
};

const GROUPS: Array<{ slug: string; label: string; description: string; slugs: string[] }> = [
  { slug: "saude", label: "Saúde, bem-estar e cuidado", description: "Clínicas, laboratórios, veterinária, farmácias, fitness e operações de cuidado.", slugs: ["clinicas","psicologia","saude","laboratorios-diagnostico","clinicas-veterinarias","farmacias","academias-fitness","fitness","petshops"] },
  { slug: "alimentacao", label: "Alimentação, bebidas e conveniência", description: "Operações de alto giro em que frequência e relacionamento precisam andar com o PDV.", slugs: ["bares-restaurantes","padarias","supermercados","postos-conveniencia","microcervejarias"] },
  { slug: "varejo", label: "Varejo, lojas e construção", description: "Estoque, PDV, CRM, orçamentos, recompra e Busca Impulsionando conectados.", slugs: ["varejo-lojas","ecommerce","materiais-construcao","construtoras-incorporadoras"] },
  { slug: "automotivo", label: "Automotivo", description: "Venda, manutenção, veículos, peças, estética e recorrência por cliente e veículo.", slugs: ["veiculos","oficinas-autopecas","lava-jato"] },
  { slug: "servicos", label: "Serviços profissionais, seguros e financeiro", description: "Propostas, contratos, carteira, renovação, cobrança e relacionamento consultivo.", slugs: ["servicos","servicos-profissionais","juridico","contabilidade","corretoras-seguros-planos-saude"] },
  { slug: "b2b", label: "Indústria, distribuição e logística B2B", description: "Carteira empresarial, pedidos, estoque, recompra, representantes, logística e BI.", slugs: ["fornecedores","distribuidores-industria-b2b","transportes-logistica","locacao-equipamentos"] },
  { slug: "imobiliario", label: "Imobiliário, condomínios e propriedades", description: "Leads, unidades, contratos, administração, prestação de contas e pós-venda.", slugs: ["imobiliaria","construtoras-incorporadoras","condominios-administradoras","hoteis-pousadas"] },
  { slug: "educacao", label: "Educação e comunidades", description: "Captação, matrícula, engajamento, cobrança, renovação e comunidade.", slugs: ["educacao","educacao-cursos","associacoes-clubes","ongs-terceiro-setor"] },
  { slug: "turismo-eventos", label: "Turismo, hotelaria e eventos", description: "Reserva, experiência, pagamento, pós-evento, pós-viagem e recompra.", slugs: ["eventos","turismo-agencias","hoteis-pousadas"] },
  { slug: "parceiros", label: "White Label e parceiros", description: "Empresas que querem operar e revender o ecossistema com marca própria.", slugs: ["white-label"] },
];

const ICONS: Record<string, LucideIcon> = {
  clinicas: Stethoscope, psicologia: HeartPulse, saude: Activity, fitness: Dumbbell, "academias-fitness": Dumbbell,
  "laboratorios-diagnostico": Activity, "clinicas-veterinarias": PawPrint, farmacias: Pill, petshops: PawPrint,
  "bares-restaurantes": UtensilsCrossed, padarias: Store, supermercados: ShoppingBasket, "postos-conveniencia": Store,
  microcervejarias: Beer, ecommerce: ShoppingBag, "varejo-lojas": Store, "materiais-construcao": Construction,
  "construtoras-incorporadoras": Building2, veiculos: Car, "oficinas-autopecas": Wrench, "lava-jato": Sparkles,
  servicos: BriefcaseBusiness, "servicos-profissionais": BriefcaseBusiness, juridico: Scale, contabilidade: Calculator,
  "corretoras-seguros-planos-saude": ShieldCheck, fornecedores: Warehouse, "distribuidores-industria-b2b": Warehouse,
  "transportes-logistica": Truck, "locacao-equipamentos": Wrench, imobiliaria: House, "condominios-administradoras": Building2,
  "hoteis-pousadas": Hotel, educacao: GraduationCap, "educacao-cursos": GraduationCap, "associacoes-clubes": HandHeart,
  "ongs-terceiro-setor": HandHeart, eventos: Sparkles, "turismo-agencias": BusFront, "white-label": Building2,
};

const canonicalBySlug = new Map(NICHO_DETAILS.map((n) => [n.slug, n]));
const playbookBySlug = new Map(COMMERCIAL_NICHE_PLAYBOOK.map((n) => [n.slug, n]));

export const PUBLIC_NICHE_GROUPS = GROUPS.map((group) => ({
  ...group,
  items: group.slugs.flatMap((slug): PublicNiche[] => {
    const canonical = canonicalBySlug.get(slug);
    if (canonical) return [{ slug, label: canonical.shortLabel, description: canonical.cardDesc, group: group.slug, icon: ICONS[slug] ?? canonical.icon, kind: "canonical" }];
    const playbook = playbookBySlug.get(slug);
    if (playbook) return [{ slug, label: playbook.label, description: playbook.hiddenLoss, group: group.slug, icon: ICONS[slug] ?? Building2, kind: "playbook" }];
    return [];
  }),
})).filter((g) => g.items.length > 0);

export const PUBLIC_NICHES = PUBLIC_NICHE_GROUPS.flatMap((g) => g.items).filter((item, index, all) => all.findIndex((x) => x.slug === item.slug) === index);

export function findPublicNiche(slug: string) {
  return PUBLIC_NICHES.find((n) => n.slug === slug) ?? null;
}
