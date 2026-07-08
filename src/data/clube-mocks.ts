/**
 * Mocks de front-end do Clube Impulsionando.
 * Nenhum destes dados vai para backend — servem apenas para popular
 * a interface homologada do consumidor final. Assim que o backend
 * do Clube estiver ligado, estes arquivos serão substituídos por
 * hooks reais (`useClubeVouchers`, `useClubeCashback`, etc.).
 */

export type ClubeCategoria = {
  slug: string;
  label: string;
  icon: string; // nome do ícone lucide (renderizado na página)
  count: number;
};

export const CLUBE_CATEGORIAS: ClubeCategoria[] = [
  { slug: "saude", label: "Saúde & Bem-estar", icon: "HeartPulse", count: 128 },
  { slug: "gastronomia", label: "Gastronomia", icon: "UtensilsCrossed", count: 210 },
  { slug: "imoveis", label: "Imóveis", icon: "Building", count: 84 },
  { slug: "eventos", label: "Eventos", icon: "CalendarDays", count: 46 },
  { slug: "compras", label: "Compras", icon: "ShoppingBag", count: 315 },
  { slug: "servicos", label: "Serviços", icon: "Wrench", count: 152 },
  { slug: "beleza", label: "Beleza", icon: "Scissors", count: 73 },
  { slug: "educacao", label: "Educação", icon: "GraduationCap", count: 41 },
];

export type ClubeVoucher = {
  id: string;
  titulo: string;
  empresa: string;
  categoria: string;
  desconto: string;
  validade: string;
  status: "ativo" | "usado" | "expirado";
  cidade: string;
};

export const CLUBE_VOUCHERS: ClubeVoucher[] = [
  { id: "v1", titulo: "10% off em consulta", empresa: "CHRISMED", categoria: "Saúde", desconto: "10%", validade: "31/08/2026", status: "ativo", cidade: "Rio de Janeiro" },
  { id: "v2", titulo: "Frete grátis", empresa: "Colors Saúde", categoria: "Nutracêuticos", desconto: "Frete", validade: "15/09/2026", status: "ativo", cidade: "Nacional" },
  { id: "v3", titulo: "Cortesia entrada VIP", empresa: "WMP Eventos", categoria: "Eventos", desconto: "VIP", validade: "20/07/2026", status: "ativo", cidade: "Rio de Janeiro" },
  { id: "v4", titulo: "R$ 30 off no delivery", empresa: "Food Service", categoria: "Gastronomia", desconto: "R$ 30", validade: "10/08/2026", status: "ativo", cidade: "Rio de Janeiro" },
  { id: "v5", titulo: "Avaliação imóvel grátis", empresa: "Garrido", categoria: "Imóveis", desconto: "100%", validade: "31/12/2026", status: "ativo", cidade: "Rio de Janeiro" },
  { id: "v6", titulo: "10% na diária", empresa: "Marocas", categoria: "Property Management", desconto: "10%", validade: "30/09/2026", status: "usado", cidade: "Búzios" },
  { id: "v7", titulo: "Kit de EPI", empresa: "RIOMED", categoria: "B2B", desconto: "Brinde", validade: "10/05/2026", status: "expirado", cidade: "Rio de Janeiro" },
];

export type ClubeCashbackEvento = {
  id: string;
  data: string;
  descricao: string;
  valor: number; // positivo = crédito, negativo = uso
  status: "creditado" | "pendente" | "utilizado";
};

export const CLUBE_CASHBACK_SALDO = 187.4;
export const CLUBE_CASHBACK_PENDENTE = 42.1;

export const CLUBE_CASHBACK_HISTORICO: ClubeCashbackEvento[] = [
  { id: "c1", data: "05/07/2026", descricao: "Compra Colors Saúde — Super Green Black", valor: 24.9, status: "creditado" },
  { id: "c2", data: "02/07/2026", descricao: "Consulta CHRISMED", valor: 12.5, status: "creditado" },
  { id: "c3", data: "28/06/2026", descricao: "Delivery Food Service", valor: 8.7, status: "pendente" },
  { id: "c4", data: "20/06/2026", descricao: "Uso no checkout Colors", valor: -35.0, status: "utilizado" },
  { id: "c5", data: "12/06/2026", descricao: "Reserva Marocas", valor: 60.0, status: "creditado" },
];

export type ClubeFavorito = {
  id: string;
  tipo: "empresa" | "produto" | "servico" | "evento" | "imovel";
  titulo: string;
  contexto: string;
  href: string;
};

export const CLUBE_FAVORITOS: ClubeFavorito[] = [
  { id: "f1", tipo: "empresa", titulo: "CHRISMED", contexto: "Saúde · Rio de Janeiro", href: "/chrismed" },
  { id: "f2", tipo: "produto", titulo: "Super Green Black", contexto: "Colors Saúde · Nutracêuticos", href: "/colors/super-green-black" },
  { id: "f3", tipo: "servico", titulo: "Produção de evento", contexto: "WMP · Rio de Janeiro", href: "/wmp/pacotes" },
  { id: "f4", tipo: "evento", titulo: "Casamento em Grumari", contexto: "WMP · Julho/2026", href: "/wmp/cases" },
  { id: "f5", tipo: "imovel", titulo: "Cobertura Ipanema", contexto: "Garrido · Rio de Janeiro", href: "/garrido" },
];

export type ClubeAvaliacao = {
  id: string;
  empresa: string;
  data: string;
  nota: 1 | 2 | 3 | 4 | 5;
  comentario: string;
};

export const CLUBE_AVALIACOES: ClubeAvaliacao[] = [
  { id: "a1", empresa: "CHRISMED", data: "01/07/2026", nota: 5, comentario: "Atendimento impecável, teleconsulta funcionou muito bem." },
  { id: "a2", empresa: "Food Service", data: "27/06/2026", nota: 4, comentario: "Delivery rápido, hambúrguer excelente. Faltou molho extra." },
  { id: "a3", empresa: "Colors Saúde", data: "18/06/2026", nota: 5, comentario: "Produto entregou o que promete, cashback creditado em 48h." },
];

export type ClubeHistoricoItem = {
  id: string;
  data: string;
  tipo: "compra" | "reserva" | "consulta" | "evento" | "voucher";
  descricao: string;
  empresa: string;
  valor?: number;
};

export const CLUBE_HISTORICO: ClubeHistoricoItem[] = [
  { id: "h1", data: "05/07/2026", tipo: "compra", descricao: "Super Green Black — 60 cápsulas", empresa: "Colors Saúde", valor: 249.0 },
  { id: "h2", data: "02/07/2026", tipo: "consulta", descricao: "Consulta clínica geral", empresa: "CHRISMED", valor: 125.0 },
  { id: "h3", data: "28/06/2026", tipo: "compra", descricao: "Pedido delivery — combo casal", empresa: "Food Service", valor: 87.4 },
  { id: "h4", data: "20/06/2026", tipo: "voucher", descricao: "Voucher R$ 30 off aplicado", empresa: "Food Service" },
  { id: "h5", data: "12/06/2026", tipo: "reserva", descricao: "Diária casa Búzios — 3 noites", empresa: "Marocas", valor: 1890.0 },
];

/**
 * Recomendações de exemplo para a interface do Impulsionito
 * (sem IA — apenas mapeamento determinístico exemplificado).
 */
export type ImpulsionitoExemplo = {
  intent: string;
  tenantSlug: string;
  motivo: string;
};

export const IMPULSIONITO_EXEMPLOS: ImpulsionitoExemplo[] = [
  { intent: "Quero emagrecer.", tenantSlug: "colors", motivo: "Nutracêuticos com foco em performance e detox." },
  { intent: "Preciso de gastro.", tenantSlug: "chrismed", motivo: "Clínica premium com especialistas e teleconsulta." },
  { intent: "Desejo alugar apartamento.", tenantSlug: "garrido", motivo: "Curadoria imobiliária premium com locação e temporada." },
  { intent: "Preciso de equipamentos médicos.", tenantSlug: "riomed", motivo: "Distribuidora médico-hospitalar B2B com SLA." },
  { intent: "Quero organizar um evento.", tenantSlug: "wmp", motivo: "Produção completa com pré-diagnóstico acústico." },
  { intent: "Quero pedir jantar.", tenantSlug: "foodservice", motivo: "Cardápio digital com delivery e fidelidade." },
  { intent: "Quero hospedagem.", tenantSlug: "marocas", motivo: "Property management com casas prontas para hóspedes." },
];
