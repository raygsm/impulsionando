/**
 * Vitrine de templates por macro-nicho.
 *
 * Cada template é um exemplo de front-end (site) que a Impulsionando
 * é capaz de entregar. Serve como demonstração pública em `/vitrine`
 * e como base para novos clientes que queiram apenas trocar imagens
 * e textos.
 */
import type { LucideIcon } from "lucide-react";
import {
  Stethoscope, UtensilsCrossed, PackageOpen, Home, Briefcase,
  GraduationCap, Ticket, ShoppingBag,
} from "lucide-react";

export type VitrineCTA = { label: string; href: string };

export type VitrineTemplate = {
  macro: string; // slug do macro-nicho
  label: string; // rótulo do macro
  templateName: string; // nome do template (ex.: "Foodservice · Bistrô Contemporâneo")
  icon: LucideIcon;
  liveUrl?: string; // rota interna se já existir (foodservice, etc.)
  brand: {
    name: string;
    initials: string;
    tagline: string;
  };
  palette: {
    /** cor tema (hex) usada em overlays e detalhes; tokens ficam por conta do template */
    accent: string;
    /** classe tailwind para o gradiente de destaque */
    heroGradient: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    image: string;
    primary: VitrineCTA;
    secondary: VitrineCTA;
  };
  features: { title: string; description: string }[];
  showcase: { image: string; title: string; subtitle: string; meta?: string }[];
  testimonial: { quote: string; author: string; role: string };
  contact: { whatsapp: string; email: string; address: string };
};

const img = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

export const VITRINE_TEMPLATES: VitrineTemplate[] = [
  {
    macro: "saude",
    label: "Saúde, Bem-estar e Performance",
    templateName: "Clínica · Cuidado Integral",
    icon: Stethoscope,
    liveUrl: "/showroom/clinicas",
    brand: { name: "Clínica Vitalis", initials: "CV", tagline: "Cuidado integral para a sua saúde" },
    palette: { accent: "#0f766e", heroGradient: "from-teal-900/70 via-teal-800/40 to-transparent" },
    hero: {
      eyebrow: "Clínica multiespecialidades",
      title: "Sua saúde em mãos que cuidam",
      subtitle: "Agendamento online, prontuário digital e atendimento humanizado em uma única plataforma.",
      image: img("clinica-hero", 1600, 1000),
      primary: { label: "Agendar consulta", href: "#agendar" },
      secondary: { label: "Conhecer especialidades", href: "#especialidades" },
    },
    features: [
      { title: "Agenda inteligente", description: "Escolha profissional, horário e receba lembretes automáticos por WhatsApp." },
      { title: "Prontuário digital", description: "Histórico clínico seguro, acessível a você e ao profissional autorizado." },
      { title: "Telemedicina", description: "Consultas por vídeo com receita e atestado digitais válidos em todo o Brasil." },
    ],
    showcase: [
      { image: img("clinica-1"), title: "Cardiologia", subtitle: "Check-up completo", meta: "a partir de R$ 320" },
      { image: img("clinica-2"), title: "Pediatria", subtitle: "Do recém-nascido ao adolescente" },
      { image: img("clinica-3"), title: "Dermatologia", subtitle: "Clínica e estética" },
      { image: img("clinica-4"), title: "Nutrição", subtitle: "Planos personalizados" },
      { image: img("clinica-5"), title: "Psicologia", subtitle: "Presencial e online" },
      { image: img("clinica-6"), title: "Fisioterapia", subtitle: "Reabilitação e RPG" },
    ],
    testimonial: {
      quote: "Atendimento rápido, humano e organizado. Consegui marcar, remarcar e ver meus exames sem sair do WhatsApp.",
      author: "Marina R.",
      role: "Paciente há 3 anos",
    },
    contact: { whatsapp: "(21) 99999-0000", email: "contato@vitalis.med.br", address: "Av. das Américas, 500 — Rio de Janeiro/RJ" },
  },
  {
    macro: "alimentacao",
    label: "Alimentação, Bebidas e Experiências",
    templateName: "Foodservice · Bistrô Contemporâneo",
    icon: UtensilsCrossed,
    liveUrl: "/foodservice",
    brand: { name: "Bistrô Impulso", initials: "BI", tagline: "Cozinha autoral & experiência" },
    palette: { accent: "#b45309", heroGradient: "from-amber-950/75 via-amber-900/40 to-transparent" },
    hero: {
      eyebrow: "Casa autoral · Reservas abertas",
      title: "Sabores que contam histórias",
      subtitle: "Cardápio sazonal, carta de vinhos curada e experiência de salão pensada nos detalhes.",
      image: img("bistro-hero", 1600, 1000),
      primary: { label: "Reservar mesa", href: "#reservar" },
      secondary: { label: "Ver cardápio", href: "#cardapio" },
    },
    features: [
      { title: "Reserva em 30s", description: "Escolha data, mesa e ambiente. Confirmação instantânea por WhatsApp." },
      { title: "Cardápio digital", description: "QR na mesa, pedidos por celular e pagamento pelo próprio app." },
      { title: "Fidelidade", description: "Cada visita vira pontos e cortesias que o cliente resgata no clube." },
    ],
    showcase: [
      { image: img("prato-1"), title: "Risoto de funghi", subtitle: "Arbóreo, funghi porcini e trufa negra", meta: "R$ 78" },
      { image: img("prato-2"), title: "Filé Wellington", subtitle: "Ao molho madeira e purê rústico", meta: "R$ 129" },
      { image: img("prato-3"), title: "Salmão grelhado", subtitle: "Aspargos e molho beurre blanc", meta: "R$ 96" },
      { image: img("prato-4"), title: "Ravioli de burrata", subtitle: "Tomate confit e manjericão", meta: "R$ 84" },
      { image: img("prato-5"), title: "Petit gâteau", subtitle: "Sorvete de baunilha de Madagascar", meta: "R$ 38" },
      { image: img("prato-6"), title: "Carta de vinhos", subtitle: "Novo mundo e velho mundo" },
    ],
    testimonial: {
      quote: "Experiência do início ao fim impecável. Reservei pelo WhatsApp e chegou um lembrete lindo com o mapa.",
      author: "Rafael G.",
      role: "Cliente fidelidade ouro",
    },
    contact: { whatsapp: "(21) 98888-1111", email: "reservas@bistroimpulso.com", address: "Rua Dias Ferreira, 120 — Leblon" },
  },
  {
    macro: "fornecedores",
    label: "Fornecedores e Indústria",
    templateName: "Distribuidora B2B · Portal do Comprador",
    icon: PackageOpen,
    liveUrl: "/riomed",
    brand: { name: "RioSupply", initials: "RS", tagline: "Distribuição inteligente para revendas" },
    palette: { accent: "#1d4ed8", heroGradient: "from-slate-950/75 via-blue-900/40 to-transparent" },
    hero: {
      eyebrow: "Portal B2B · Pedidos 24/7",
      title: "Estoque, condição e prazo — em um só lugar",
      subtitle: "Catálogo com preço por CNPJ, pedidos recorrentes e integração direta com a sua revenda.",
      image: img("distri-hero", 1600, 1000),
      primary: { label: "Abrir conta B2B", href: "#cadastro" },
      secondary: { label: "Ver catálogo", href: "#catalogo" },
    },
    features: [
      { title: "Preço por CNPJ", description: "Tabelas negociadas, política de desconto e limite de crédito automatizados." },
      { title: "Pedido recorrente", description: "Assine reposições semanais/mensais e libere seu comprador para o estratégico." },
      { title: "Rastreio integrado", description: "Nota, romaneio e transportadora sincronizados em tempo real." },
    ],
    showcase: [
      { image: img("prod-1"), title: "Linha Hospitalar", subtitle: "1.240 SKUs", meta: "Pronta entrega" },
      { image: img("prod-2"), title: "Linha Odontológica", subtitle: "820 SKUs", meta: "Pronta entrega" },
      { image: img("prod-3"), title: "Equipamentos", subtitle: "310 SKUs", meta: "Sob consulta" },
      { image: img("prod-4"), title: "Consumíveis", subtitle: "2.100 SKUs", meta: "Recorrência" },
      { image: img("prod-5"), title: "EPIs", subtitle: "540 SKUs", meta: "Contrato" },
      { image: img("prod-6"), title: "Higiene & limpeza", subtitle: "680 SKUs", meta: "Recorrência" },
    ],
    testimonial: {
      quote: "Diminuímos 40% do tempo de compra semanal. O portal já sabe o que costumamos pedir.",
      author: "Ana P.",
      role: "Compradora — Rede de clínicas",
    },
    contact: { whatsapp: "(21) 97777-2222", email: "comercial@riosupply.com.br", address: "Distrito Industrial — Duque de Caxias/RJ" },
  },
  {
    macro: "imobiliario",
    label: "Imobiliário",
    templateName: "Imobiliária · Vitrine Inteligente",
    icon: Home,
    liveUrl: "/imobiliaria",
    brand: { name: "Garrido Imóveis", initials: "GI", tagline: "Encontre o lar que combina com você" },
    palette: { accent: "#0e7490", heroGradient: "from-cyan-950/70 via-cyan-900/35 to-transparent" },
    hero: {
      eyebrow: "Vitrine inteligente · 1.240 imóveis",
      title: "O imóvel certo, sem perder tempo",
      subtitle: "Filtros por bairro, orçamento e estilo de vida. Match automático com novos anúncios.",
      image: img("imob-hero", 1600, 1000),
      primary: { label: "Buscar imóvel", href: "#buscar" },
      secondary: { label: "Falar com corretor", href: "#corretor" },
    },
    features: [
      { title: "Match inteligente", description: "Diga seu perfil e receba as melhores opções primeiro — inclusive fora da vitrine." },
      { title: "Visita agendada", description: "Escolha horário, corretor e receba confirmação por WhatsApp em segundos." },
      { title: "Proposta digital", description: "Simulação de financiamento, proposta e assinatura sem sair da plataforma." },
    ],
    showcase: [
      { image: img("imob-1"), title: "Cobertura Duplex — Barra", subtitle: "3 suítes · 240m² · vista mar", meta: "R$ 3.2M" },
      { image: img("imob-2"), title: "Apto Reformado — Botafogo", subtitle: "2 quartos · 78m²", meta: "R$ 890k" },
      { image: img("imob-3"), title: "Casa em Condomínio — Recreio", subtitle: "4 suítes · piscina", meta: "R$ 2.1M" },
      { image: img("imob-4"), title: "Loft Design — Ipanema", subtitle: "1 quarto · pé-direito duplo", meta: "R$ 1.4M" },
      { image: img("imob-5"), title: "Studio Novo — Tijuca", subtitle: "38m² · lazer completo", meta: "R$ 420k" },
      { image: img("imob-6"), title: "Sala Comercial — Centro", subtitle: "48m² · aluguel", meta: "R$ 3.5k/mês" },
    ],
    testimonial: {
      quote: "Recebi 4 opções que faziam sentido no mesmo dia. Fechei em 3 semanas — sem visitar imóvel errado.",
      author: "Bruno L.",
      role: "Comprador — Barra da Tijuca",
    },
    contact: { whatsapp: "(21) 96666-3333", email: "contato@garridoimoveis.com.br", address: "Av. das Américas, 1500 — Barra" },
  },
  {
    macro: "servicos",
    label: "Serviços Profissionais",
    templateName: "Escritório · Advocacia Consultiva",
    icon: Briefcase,
    brand: { name: "Monnerat Advocacia", initials: "MA", tagline: "Direito empresarial estratégico" },
    palette: { accent: "#78350f", heroGradient: "from-stone-950/80 via-stone-900/40 to-transparent" },
    hero: {
      eyebrow: "Advocacia empresarial · Desde 1998",
      title: "Segurança jurídica que acompanha o seu negócio",
      subtitle: "Consultoria contratual, contencioso estratégico e compliance com o rigor que a sua empresa merece.",
      image: img("advoc-hero", 1600, 1000),
      primary: { label: "Agendar diagnóstico", href: "#diagnostico" },
      secondary: { label: "Áreas de atuação", href: "#areas" },
    },
    features: [
      { title: "Diagnóstico gratuito", description: "Análise inicial do seu cenário em até 48h úteis, sem compromisso." },
      { title: "Portal do cliente", description: "Andamento processual, documentos e prazos em um painel único." },
      { title: "Time multidisciplinar", description: "Tributário, societário, trabalhista e digital atuando de forma integrada." },
    ],
    showcase: [
      { image: img("adv-1"), title: "Direito Societário", subtitle: "M&A · Governança" },
      { image: img("adv-2"), title: "Tributário", subtitle: "Planejamento · Contencioso" },
      { image: img("adv-3"), title: "Trabalhista", subtitle: "Consultivo · Reformas" },
      { image: img("adv-4"), title: "Contratos", subtitle: "Nacionais e internacionais" },
      { image: img("adv-5"), title: "LGPD & Digital", subtitle: "Programas de conformidade" },
      { image: img("adv-6"), title: "Recuperação", subtitle: "Judicial e extrajudicial" },
    ],
    testimonial: {
      quote: "Passamos a antecipar riscos em vez de apagar incêndio. O portal deixou tudo transparente para a diretoria.",
      author: "Cláudio M.",
      role: "CEO — Grupo industrial",
    },
    contact: { whatsapp: "(21) 95555-4444", email: "contato@monneratadv.com.br", address: "Av. Rio Branco, 100 — Centro/RJ" },
  },
  {
    macro: "educacao",
    label: "Educação",
    templateName: "Escola & Cursos · Portal do Aluno",
    icon: GraduationCap,
    brand: { name: "Instituto Horizonte", initials: "IH", tagline: "Educação que forma protagonistas" },
    palette: { accent: "#7c3aed", heroGradient: "from-violet-950/70 via-violet-900/40 to-transparent" },
    hero: {
      eyebrow: "Matrículas abertas · 2026",
      title: "Aprender é a melhor viagem de uma vida",
      subtitle: "Ensino híbrido, portal do aluno, financeiro simplificado e trilhas de aprendizagem personalizadas.",
      image: img("edu-hero", 1600, 1000),
      primary: { label: "Fazer matrícula", href: "#matricula" },
      secondary: { label: "Ver cursos", href: "#cursos" },
    },
    features: [
      { title: "Matrícula 100% online", description: "Contrato, documentos e primeira mensalidade em minutos, com validação automática." },
      { title: "Portal do aluno", description: "Notas, frequência, boletos e conteúdos das aulas em um único lugar." },
      { title: "Comunicação direta", description: "Coordenação, professores e responsáveis conversando por WhatsApp oficial." },
    ],
    showcase: [
      { image: img("curso-1"), title: "Educação Infantil", subtitle: "Berçário · Pré-escola" },
      { image: img("curso-2"), title: "Ensino Fundamental", subtitle: "Anos iniciais e finais" },
      { image: img("curso-3"), title: "Ensino Médio", subtitle: "Trilhas e vestibular" },
      { image: img("curso-4"), title: "Cursos Livres", subtitle: "Idiomas · Robótica · Música" },
      { image: img("curso-5"), title: "Educação Corporativa", subtitle: "Trilhas B2B" },
      { image: img("curso-6"), title: "Extensão EAD", subtitle: "Certificados reconhecidos" },
    ],
    testimonial: {
      quote: "Recebo boletim, financeiro e recados da coordenação sem instalar app. Simples e resolvido.",
      author: "Fernanda C.",
      role: "Mãe de aluno · 5º ano",
    },
    contact: { whatsapp: "(21) 94444-5555", email: "secretaria@institutohorizonte.edu.br", address: "Rua das Palmeiras, 300 — Botafogo" },
  },
  {
    macro: "eventos",
    label: "Eventos e Experiências",
    templateName: "Casa de Eventos · Produção 360°",
    icon: Ticket,
    liveUrl: "/wmp",
    brand: { name: "WMP Produções", initials: "WMP", tagline: "Eventos memoráveis, do palco ao pós-venda" },
    palette: { accent: "#be123c", heroGradient: "from-rose-950/75 via-rose-900/40 to-transparent" },
    hero: {
      eyebrow: "Casa & produção · 400 eventos/ano",
      title: "Cada evento vira lembrança que gera receita",
      subtitle: "Bilheteria própria, check-in por QR, ativações no local e relacionamento pós-evento.",
      image: img("evento-hero", 1600, 1000),
      primary: { label: "Comprar ingresso", href: "#ingresso" },
      secondary: { label: "Fazer meu evento", href: "#produzir" },
    },
    features: [
      { title: "Ingresso oficial", description: "Antifraude, meia validada por QR e passe VIP com regras próprias." },
      { title: "Check-in relâmpago", description: "Fila fluindo com leitura por celular e passaportes reutilizáveis." },
      { title: "Pós-evento inteligente", description: "NPS, fotos e próximas datas disparadas 30 minutos depois do encerramento." },
    ],
    showcase: [
      { image: img("event-1"), title: "Show acústico", subtitle: "12/nov · Fundição Progresso", meta: "R$ 120" },
      { image: img("event-2"), title: "Festival gastronômico", subtitle: "3 dias · Marina da Glória", meta: "R$ 90" },
      { image: img("event-3"), title: "Congresso corporativo", subtitle: "Riocentro · 2 mil pax" },
      { image: img("event-4"), title: "Formatura", subtitle: "Cerimônia + baile" },
      { image: img("event-5"), title: "Casamento", subtitle: "Salão + gastronomia" },
      { image: img("event-6"), title: "Ativação de marca", subtitle: "Trailer itinerante" },
    ],
    testimonial: {
      quote: "Ingresso, check-in, bar e fidelidade em uma coisa só. Encerramos com CAC 40% menor.",
      author: "Diego S.",
      role: "Produtor executivo",
    },
    contact: { whatsapp: "(21) 93333-6666", email: "contato@wmp.com.br", address: "Rua do Mercado, 11 — Centro/RJ" },
  },
  {
    macro: "varejo",
    label: "Varejo, E-commerce e Veículos",
    templateName: "Boutique · Loja Autoral",
    icon: ShoppingBag,
    brand: { name: "Colors Concept", initials: "CC", tagline: "Moda autoral com curadoria" },
    palette: { accent: "#db2777", heroGradient: "from-pink-950/70 via-pink-900/40 to-transparent" },
    hero: {
      eyebrow: "Coleção · Outono/Inverno",
      title: "Estilo que fala por você",
      subtitle: "Loja física, e-commerce e clube de assinatura em uma experiência única.",
      image: img("varejo-hero", 1600, 1000),
      primary: { label: "Comprar agora", href: "#loja" },
      secondary: { label: "Visitar showroom", href: "#showroom" },
    },
    features: [
      { title: "Loja unificada", description: "Estoque de loja física e online sempre sincronizados — sem venda perdida." },
      { title: "Clube da assinatura", description: "Recorrência mensal com curadoria personalizada e frete grátis." },
      { title: "Vendedor no WhatsApp", description: "Consultora dedicada com catálogo e checkout no chat." },
    ],
    showcase: [
      { image: img("prod-mod-1"), title: "Casaco Lã Merino", subtitle: "Alfaiataria autoral", meta: "R$ 1.290" },
      { image: img("prod-mod-2"), title: "Vestido Midi Seda", subtitle: "Edição limitada", meta: "R$ 890" },
      { image: img("prod-mod-3"), title: "Bota Cano Alto", subtitle: "Couro legítimo", meta: "R$ 1.180" },
      { image: img("prod-mod-4"), title: "Bolsa Estruturada", subtitle: "Costura à mão", meta: "R$ 990" },
      { image: img("prod-mod-5"), title: "Blazer Oversized", subtitle: "Lã batida", meta: "R$ 1.450" },
      { image: img("prod-mod-6"), title: "Camisa Popeline", subtitle: "Alfaiataria feminina", meta: "R$ 590" },
    ],
    testimonial: {
      quote: "Comprei pelo WhatsApp da consultora, retirei no showroom e ganhei ajustes de graça. Experiência que fideliza.",
      author: "Letícia M.",
      role: "Cliente clube · 12 meses",
    },
    contact: { whatsapp: "(21) 92222-7777", email: "ola@colorsconcept.com.br", address: "Rua Visconde de Pirajá, 400 — Ipanema" },
  },
];

export function getVitrineTemplate(macro: string): VitrineTemplate | undefined {
  return VITRINE_TEMPLATES.find((t) => t.macro === macro);
}
