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

export type VitrineSubniche = {
  slug: string;
  name: string;
  templateName: string;
  tagline: string;
  heroImage?: string;
  headline?: string;
  subtitle?: string;
  accent?: string;
  heroGradient?: string;
};

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
  subniches?: VitrineSubniche[];
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

// Subniches por macro — mantidos fora do objeto principal para leitura.
const SUBNICHES: Record<string, VitrineSubniche[]> = {
  saude: [
    { slug: "odontologia", name: "Clínica Odontológica", templateName: "Clínica Odontológica · Sorriso Design", tagline: "Odontologia estética e ortodontia", headline: "Sorriso que transforma", subtitle: "Ortodontia digital, clareamento e implantes com atendimento humano.", accent: "#0ea5e9", heroImage: img("odonto-hero", 1600, 1000) },
    { slug: "dermatologia", name: "Dermatologia & Estética", templateName: "Dermato · Pele & Bem-estar", tagline: "Dermatologia clínica e estética", headline: "Pele saudável, autoestima em alta", subtitle: "Protocolos personalizados, tecnologia de ponta e acompanhamento contínuo.", accent: "#db2777", heroImage: img("dermato-hero", 1600, 1000) },
    { slug: "fisioterapia", name: "Fisioterapia & RPG", templateName: "Fisio · Movimento Pleno", tagline: "Reabilitação, RPG e Pilates clínico", headline: "Movimento sem dor, vida com energia", subtitle: "Avaliação funcional, planos individuais e evolução mensurada.", accent: "#059669", heroImage: img("fisio-hero", 1600, 1000) },
  ],
  alimentacao: [
    { slug: "hamburgueria", name: "Hamburgueria Artesanal", templateName: "Hamburgueria · Smash & Craft", tagline: "Smash burger e cervejas artesanais", headline: "Do fogo direto ao seu delivery", subtitle: "Cardápio artesanal, pedido pelo QR e recompensas por visita.", accent: "#c2410c", heroImage: img("burger-hero", 1600, 1000) },
    { slug: "cafeteria", name: "Cafeteria Especial", templateName: "Cafeteria · Grão de Origem", tagline: "Cafés especiais e bistrô", headline: "Cada xícara conta uma história", subtitle: "Grãos rastreáveis, brunch autoral e clube de assinatura mensal.", accent: "#78350f", heroImage: img("cafe-hero", 1600, 1000) },
    { slug: "pizzaria", name: "Pizzaria Napoletana", templateName: "Pizzaria · Forno a Lenha", tagline: "Massa de fermentação natural", headline: "A pizza que Nápoles reconheceria", subtitle: "Forno a 450°C, ingredientes DOP e delivery com caixa térmica.", accent: "#991b1b", heroImage: img("pizza-hero", 1600, 1000) },
  ],
  fornecedores: [
    { slug: "medico-hospitalar", name: "Distribuidora Médica", templateName: "B2B · Medico-hospitalar", tagline: "Suprimentos para clínicas e hospitais", headline: "Reposição inteligente para a área da saúde", subtitle: "SLA garantido, tabela por CNPJ e rastreio de lote.", accent: "#0369a1", heroImage: img("medhosp-hero", 1600, 1000) },
    { slug: "industrial", name: "Suprimentos Industriais", templateName: "B2B · Industrial MRO", tagline: "MRO e ferramentaria", headline: "Sua linha de produção nunca para", subtitle: "Cadastro por unidade fabril, contrato de reposição e integração ERP.", accent: "#334155", heroImage: img("industry-hero", 1600, 1000) },
  ],
  imobiliario: [
    { slug: "alto-padrao", name: "Alto Padrão", templateName: "Imob · Luxo & Alto Padrão", tagline: "Coberturas, mansões e lançamentos premium", headline: "Endereços que definem uma vida", subtitle: "Curadoria discreta, tour virtual e atendimento privativo.", accent: "#0b1120", heroImage: img("luxo-hero", 1600, 1000) },
    { slug: "aluguel", name: "Locação Residencial", templateName: "Imob · Alugue em minutos", tagline: "Locação com garantia digital", headline: "Do interesse à chave em 48h", subtitle: "Análise online, contrato eletrônico e vistoria integrada.", accent: "#0f766e", heroImage: img("aluguel-hero", 1600, 1000) },
    { slug: "temporada", name: "Temporada & Airbnb", templateName: "Imob · Temporada 5★", tagline: "Gestão de imóveis por temporada", headline: "Multiplique a receita do seu imóvel", subtitle: "Precificação dinâmica, faxina orquestrada e repasse transparente.", accent: "#7c2d12", heroImage: img("temporada-hero", 1600, 1000) },
  ],
  servicos: [
    { slug: "contabilidade", name: "Contabilidade Digital", templateName: "Contab · Escritório Digital", tagline: "Contabilidade consultiva 100% online", headline: "Seu escritório sem papel, com clareza", subtitle: "Portal do cliente, obrigações no radar e IRPF descomplicado.", accent: "#065f46", heroImage: img("contab-hero", 1600, 1000) },
    { slug: "marketing", name: "Agência de Marketing", templateName: "Agência · Marketing de Performance", tagline: "Growth, mídia paga e conteúdo", headline: "Marketing que prova cada real investido", subtitle: "Dashboards em tempo real, criativo próprio e squad dedicado.", accent: "#7c3aed", heroImage: img("mkt-hero", 1600, 1000) },
  ],
  educacao: [
    { slug: "idiomas", name: "Escola de Idiomas", templateName: "Idiomas · Mundo em Aula", tagline: "Cursos regulares e imersão", headline: "Fluência acontece na conversa", subtitle: "Turmas reduzidas, professores nativos e trilha personalizada.", accent: "#1d4ed8", heroImage: img("idioma-hero", 1600, 1000) },
    { slug: "cursos-livres", name: "Cursos Livres & Bootcamps", templateName: "Cursos · Bootcamps Tech", tagline: "Formações intensivas em tecnologia", headline: "Do zero ao mercado em 6 meses", subtitle: "Projetos reais, mentoria 1:1 e carreira acompanhada.", accent: "#0891b2", heroImage: img("bootcamp-hero", 1600, 1000) },
  ],
  eventos: [
    { slug: "casamentos", name: "Casamentos", templateName: "Eventos · Cerimônia dos Sonhos", tagline: "Cerimônia, festa e experiência", headline: "O dia perfeito começa muito antes", subtitle: "Cerimonial, RSVP digital, cardápio interativo e fotos entregues no mesmo dia.", accent: "#be185d", heroImage: img("casa-hero", 1600, 1000) },
    { slug: "congressos", name: "Congressos & Convenções", templateName: "Eventos · Congresso Pro", tagline: "Eventos corporativos e científicos", headline: "Sua marca em cada detalhe", subtitle: "Credenciamento por QR, agenda pessoal, hub de patrocinadores e ROI mensurado.", accent: "#1e3a8a", heroImage: img("congresso-hero", 1600, 1000) },
  ],
  varejo: [
    { slug: "moda", name: "Boutique de Moda", templateName: "Varejo · Boutique Autoral", tagline: "Coleção autoral e clube de assinatura", headline: "Estilo que fala por você", subtitle: "Loja unificada, personal shopper no chat e assinatura mensal.", accent: "#db2777", heroImage: img("moda-hero", 1600, 1000) },
    { slug: "veiculos", name: "Revenda de Veículos", templateName: "Varejo · Auto Premium", tagline: "Seminovos com selo de qualidade", headline: "Do teste drive à chave em suas mãos", subtitle: "Vitrine 360°, simulação de financiamento e proposta digital.", accent: "#111827", heroImage: img("auto-hero", 1600, 1000) },
    { slug: "ecommerce", name: "E-commerce Nichado", templateName: "Varejo · E-commerce Nichado", tagline: "Loja online + operação omnichannel", headline: "Uma loja, todos os canais", subtitle: "Marketplace, checkout próprio e recuperação de carrinho no WhatsApp.", accent: "#f59e0b", heroImage: img("ecom-hero", 1600, 1000) },
  ],
};

// Anexa os subniches em cada template.
for (const t of VITRINE_TEMPLATES) {
  t.subniches = SUBNICHES[t.macro] ?? [];
}

export function getVitrineTemplate(macro: string): VitrineTemplate | undefined {
  return VITRINE_TEMPLATES.find((t) => t.macro === macro);
}

export function getVitrineSubniche(macro: string, sub: string):
  | { base: VitrineTemplate; subniche: VitrineSubniche; merged: VitrineTemplate }
  | undefined {
  const base = getVitrineTemplate(macro);
  if (!base) return undefined;
  const subniche = base.subniches?.find((s) => s.slug === sub);
  if (!subniche) return undefined;
  const merged: VitrineTemplate = {
    ...base,
    templateName: subniche.templateName,
    brand: { ...base.brand, name: subniche.name, tagline: subniche.tagline },
    palette: {
      accent: subniche.accent ?? base.palette.accent,
      heroGradient: subniche.heroGradient ?? base.palette.heroGradient,
    },
    hero: {
      ...base.hero,
      eyebrow: subniche.name,
      title: subniche.headline ?? base.hero.title,
      subtitle: subniche.subtitle ?? base.hero.subtitle,
      image: subniche.heroImage ?? base.hero.image,
    },
  };
  return { base, subniche, merged };
}

