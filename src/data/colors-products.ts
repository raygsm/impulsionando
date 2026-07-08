/**
 * Catálogo Colors Saúde — fonte única de verdade (FRONT-END).
 * Base: https://grupocolors.com.br/colors-saude/
 * Não altera backend/preços/estoque. Links de checkout são os oficiais.
 */

export type ColorsBrand = "green" | "blue" | "yellow" | "colors";

export interface ColorsFaq { q: string; a: string }
export interface ColorsTestimonial { name: string; city?: string; text: string; result?: string }

export interface ColorsProduct {
  slug: string;
  brand: ColorsBrand;
  brandLabel: "Green" | "Blue" | "Yellow" | "Colors";
  audience: string;
  name: string;
  tagline: string;
  short: string;
  description: string;
  benefits: string[];
  emoji: string;
  accent: string; // tailwind gradient classes
  links: { label: string; href: string }[];
  /** Como usar / posologia (front-end informativo). */
  howToUse?: string[];
  /** Composição / ativos principais (front-end informativo). */
  composition?: string[];
  /** Perguntas frequentes (FAQ). Renderiza schema.org FAQPage. */
  faq?: ColorsFaq[];
  /** Depoimentos exibidos na página do produto. */
  testimonials?: ColorsTestimonial[];
  /** Selo de garantia — ex.: "Garantia de 7 dias · dinheiro de volta". */
  guarantee?: string;
  /** Badge de urgência sutil — ex.: "Frete grátis acima de R$ 250". */
  urgencyBadge?: string;
}


export const COLORS_BRANDS: Record<
  ColorsBrand,
  { label: string; audience: string; gradient: string; accentText: string; description: string }
> = {
  green: {
    label: "Green",
    audience: "Público feminino",
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    accentText: "text-emerald-400",
    description: "Emagrecimento, beleza, cabelo e performance. Fórmulas premium para mulheres que querem resultado com segurança.",
  },
  blue: {
    label: "Blue",
    audience: "Público masculino",
    gradient: "from-blue-600 via-indigo-600 to-sky-500",
    accentText: "text-blue-400",
    description: "Virilidade, libido, força e vitalidade. Fórmulas premium para o homem que quer performar em qualquer situação.",
  },
  yellow: {
    label: "Yellow",
    audience: "Público infantil",
    gradient: "from-yellow-400 via-amber-400 to-orange-400",
    accentText: "text-yellow-400",
    description: "Vitaminas, crescimento e disposição em gominhas saborosas. O cuidado com quem a gente mais ama.",
  },
  colors: {
    label: "Colors",
    audience: "Bem-estar geral",
    gradient: "from-violet-600 via-fuchsia-600 to-pink-500",
    accentText: "text-fuchsia-400",
    description: "Sono, calma e equilíbrio. A linha Colors cuida do que a vida moderna esquece.",
  },
};

export const COLORS_PRODUCTS: ColorsProduct[] = [
  {
    slug: "super-green-black",
    brand: "green",
    brandLabel: "Green",
    audience: "Emagrecimento feminino",
    name: "Super Green Black",
    tagline: "O campeão do emagrecimento",
    short: "Resultados já nos primeiros 3 dias. Queima de gordura e energia diária.",
    description:
      "Unimos os melhores segredos do emagrecimento com poderosos ativos de queima de gordura. Seus componentes proporcionam uma verdadeira revolução — imediata — que faz você emagrecer já nos primeiros três dias. Com o Super Green Black você conquista o peso e o corpo dos seus sonhos.",
    benefits: [
      "Queima de gordura acelerada",
      "Redução do apetite e da compulsão",
      "Mais energia e disposição diária",
      "Ativos naturais e seguros",
      "Resultados nos primeiros 3 dias",
      "Milhões de vidas transformadas",
    ],
    emoji: "🔥",
    accent: "from-emerald-500 to-lime-500",
    links: [
      { label: "Maisfy", href: "https://supergreenblack.com.br/m" },
      { label: "Monetizze", href: "https://supergreenblack.com.br/" },
      { label: "Perfect Pay", href: "https://supergreenblack.com.br/p" },
    ],
  },
  {
    slug: "sos-hair",
    brand: "green",
    brandLabel: "Green",
    audience: "Cabelo e beleza",
    name: "Super S.O.S. Hair",
    tagline: "A revolução em crescimento capilar",
    short: "Vitaminas A, D, E, C, B3, B5, B6 e B7. Crescimento até 6x mais rápido.",
    description:
      "Transforme seu cabelo com Super S.O.S. Hair. Vitaminas essenciais para crescimento acelerado, combate à queda e fortalecimento de fios e unhas.",
    benefits: [
      "Crescimento até 6x mais rápido",
      "Combate à queda capilar",
      "Unhas mais fortes",
      "Cabelo menos quebradiço",
      "Fórmula com 8 vitaminas",
    ],
    emoji: "🌿",
    accent: "from-emerald-500 to-teal-500",
    links: [
      { label: "Maisfy", href: "http://supersoshair.com.br/m" },
      { label: "Monetizze", href: "http://supersoshair.com.br/" },
      { label: "Perfect Pay", href: "https://supersoshair.com.br/p/" },
    ],
  },
  {
    slug: "creatina",
    brand: "green",
    brandLabel: "Green",
    audience: "Performance",
    name: "Super Green Black Creatina",
    tagline: "100% pura. Força e performance.",
    short: "Aumento de força, potência e recuperação muscular.",
    description:
      "Aumento de força e potência muscular, melhora de performance em exercícios de alta intensidade, ganho de massa magra, recuperação aprimorada, hidratação intracelular e benefícios cognitivos.",
    benefits: [
      "Mais força e potência",
      "Ganho de massa muscular",
      "Recuperação acelerada",
      "Hidratação intracelular",
      "Foco cognitivo",
    ],
    emoji: "💪",
    accent: "from-emerald-600 to-green-500",
    links: [
      { label: "Monetizze", href: "https://supergreenblack.com.br/creatina/" },
      { label: "Perfect Pay", href: "https://supergreenblack.com.br/p-creatina/" },
    ],
  },
  {
    slug: "pre-treino",
    brand: "green",
    brandLabel: "Green",
    audience: "Performance",
    name: "Super Green Black Pré-Treino",
    tagline: "Explosão de energia e foco",
    short: "Energia, força, foco e queima de gordura para treinos de alta intensidade.",
    description:
      "Explosão de energia e resiliência muscular, aumento de força e potência, queima de gordura, recuperação rápida, foco mental e clareza, melhora na circulação sanguínea.",
    benefits: [
      "Energia imediata",
      "Foco e clareza mental",
      "Queima de gordura no treino",
      "Melhor circulação",
    ],
    emoji: "⚡",
    accent: "from-lime-500 to-emerald-500",
    links: [
      { label: "Monetizze", href: "https://supergreenblack.com.br/pre-treino/" },
      { label: "Perfect Pay", href: "https://supergreenblack.com.br/p-pre-treino/" },
    ],
  },
  {
    slug: "omega-3",
    brand: "green",
    brandLabel: "Green",
    audience: "Saúde geral",
    name: "Ômega 3 Peixinho — Sabor Cereja",
    tagline: "Saúde do coração e do cérebro",
    short: "Cápsulas saborosas para toda a família. Coração, cérebro e imunidade.",
    description:
      "Ômega 3 com sabor irresistível. Suporte cardiovascular, cerebral e imunológico em cápsulas divertidas que toda a família adora.",
    benefits: [
      "Saúde do coração",
      "Função cerebral",
      "Imunidade fortalecida",
      "Sabor cereja irresistível",
    ],
    emoji: "🐟",
    accent: "from-teal-500 to-cyan-500",
    links: [
      { label: "Monetizze", href: "https://supergreenblack.com.br/omega3/" },
      { label: "Perfect Pay", href: "https://supergreenblack.com.br/p-omega3/" },
    ],
  },
  {
    slug: "mesa-no-pau",
    brand: "blue",
    brandLabel: "Blue",
    audience: "Virilidade masculina",
    name: "Mesa no Pau",
    tagline: "Seja o super herói da sua própria história",
    short: "Performance de até 4 horas. Confiança e vitalidade masculina.",
    description:
      "A revolução masculina da Blue. Performance de até 4 horas, mais confiança, disposição e vitalidade em uma fórmula premium desenvolvida para o homem moderno.",
    benefits: [
      "Performance de até 4 horas",
      "Mais confiança e libido",
      "Vitalidade e disposição",
      "Fórmula premium masculina",
    ],
    emoji: "💙",
    accent: "from-blue-600 to-indigo-600",
    links: [
      { label: "Maisfy", href: "https://mesanopau.com.br/m" },
      { label: "Monetizze", href: "https://mesanopau.com.br/" },
      { label: "Perfect Pay", href: "https://mesanopau.com.br/p" },
    ],
  },
  {
    slug: "bam-bam-bam",
    brand: "yellow",
    brandLabel: "Yellow",
    audience: "Saúde infantil",
    name: "Super Bam Bam Bam",
    tagline: "A energia que toda criança precisa",
    short: "Gominhas em formato de ursinho, sabor framboesa. Crescimento e disposição.",
    description:
      "A linha infantil mais querida do Brasil. Auxilia no crescimento e no desenvolvimento saudável, fornece energia e é fácil de ingerir — gominhas em formato de ursinho com sabor framboesa.",
    benefits: [
      "Auxilia no crescimento",
      "Energia para o dia a dia",
      "Sabor framboesa",
      "Formato divertido",
    ],
    emoji: "🧸",
    accent: "from-yellow-400 to-amber-500",
    links: [
      { label: "Maisfy", href: "https://superbambam.com.br/m" },
      { label: "Monetizze", href: "https://superbambam.com.br/" },
      { label: "Perfect Pay", href: "https://superbambam.com.br/p" },
    ],
  },
  {
    slug: "sos-sleep",
    brand: "colors",
    brandLabel: "Colors",
    audience: "Sono e relaxamento",
    name: "Super S.O.S Sleep",
    tagline: "O rei do sono",
    short: "Induz o sono naturalmente e melhora a qualidade das suas noites.",
    description:
      "Dormir não pode ser um problema. Super S.O.S Sleep induz o sono de forma natural, promove sono restaurador, auxilia no combate à insônia e melhora o humor e a disposição.",
    benefits: [
      "Sono natural e restaurador",
      "Combate à insônia",
      "Humor e disposição",
      "Fórmula segura",
    ],
    emoji: "🌙",
    accent: "from-violet-600 to-fuchsia-600",
    links: [
      { label: "Maisfy", href: "https://supersossleep.com.br/m" },
      { label: "Monetizze", href: "https://supersossleep.com.br/" },
      { label: "Perfect Pay", href: "https://supersossleep.com.br/p" },
    ],
  },
];

export function productBySlug(slug: string): ColorsProduct | undefined {
  return COLORS_PRODUCTS.find((p) => p.slug === slug);
}

export function productsByBrand(brand: ColorsBrand): ColorsProduct[] {
  return COLORS_PRODUCTS.filter((p) => p.brand === brand);
}
