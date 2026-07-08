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
    howToUse: [
      "Tome 2 cápsulas ao dia, uma pela manhã e uma antes do almoço.",
      "Ingerir com um copo de água (250 ml).",
      "Combine com alimentação equilibrada e 2 litros de água por dia.",
      "Uso contínuo mínimo de 30 dias para resultado pleno.",
    ],
    composition: [
      "Cafeína anidra — foco e queima energética",
      "Chá verde (EGCG) — termogênico natural",
      "Faseolamina — bloqueia parte da absorção de carboidratos",
      "Cromo quelato — reduz compulsão por doces",
      "Fibras solúveis — sensação de saciedade",
    ],
    faq: [
      { q: "Em quantos dias começo a sentir efeito?", a: "A maioria das clientes relata redução de apetite e mais energia nos 3 primeiros dias. Perda de medidas visível a partir da 2ª semana." },
      { q: "Posso tomar tomando anticoncepcional?", a: "Sim, o Super Green Black não interfere em anticoncepcionais. Em caso de dúvida clínica, converse com seu médico." },
      { q: "Tem contraindicação?", a: "Não é indicado para gestantes, lactantes, menores de 18 anos e pessoas com hipertensão descontrolada." },
      { q: "É seguro para uso contínuo?", a: "Sim. A fórmula usa ativos naturais e é segura para uso prolongado com pausas semestrais recomendadas." },
      { q: "Recebo em quanto tempo?", a: "Despacho em até 3 dias úteis pela Colors Log. Entrega entre 3 e 10 dias úteis conforme CEP." },
    ],
    testimonials: [
      { name: "Juliana R.", city: "São Paulo — SP", result: "-8kg em 60 dias", text: "Já tinha tentado de tudo. Com o Super Green Black perdi 8kg em 2 meses sem passar fome. Recomendo!" },
      { name: "Camila M.", city: "Rio de Janeiro — RJ", result: "-6kg em 45 dias", text: "A energia é outra história. Consegui voltar aos treinos e emagrecer ao mesmo tempo." },
      { name: "Patrícia L.", city: "Belo Horizonte — MG", result: "-11kg em 90 dias", text: "Mudou minha relação com comida. A compulsão praticamente sumiu." },
    ],
    guarantee: "Garantia incondicional de 7 dias — dinheiro de volta se não sentir diferença.",
    urgencyBadge: "🔥 Mais vendido · frete grátis acima de R$ 250",
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
      { label: "Maisfy", href: "https://supersoshair.com.br/m" },
      { label: "Monetizze", href: "https://supersoshair.com.br/" },
      { label: "Perfect Pay", href: "https://supersoshair.com.br/p/" },
    ],
    howToUse: [
      "Tome 2 cápsulas ao dia, preferencialmente após o café da manhã.",
      "Ingerir com água — evite chás quentes que podem oxidar as vitaminas.",
      "Uso mínimo de 90 dias para ciclo capilar completo.",
    ],
    composition: [
      "Biotina (B7) — o combustível do crescimento capilar",
      "Vitaminas A, C, D, E — antioxidantes que protegem o folículo",
      "Complexo B3, B5, B6 — nutrem o couro cabeludo",
      "Zinco quelato — reduz queda hormonal",
      "L-cisteína — matéria-prima do fio",
    ],
    faq: [
      { q: "Em quanto tempo vejo resultado?", a: "Fortalecimento das unhas em 15 dias. Redução da queda em 30 a 45 dias. Crescimento visível a partir de 60 dias." },
      { q: "Funciona para calvície?", a: "Não trata calvície androgenética, mas potencializa qualquer tratamento capilar médico ao nutrir folículos ainda ativos." },
      { q: "Serve para homens?", a: "Sim. A fórmula é unissex e igualmente eficaz para cabelos masculinos e barba." },
      { q: "Pode tomar junto com outros suplementos?", a: "Sim, é seguro combinar com colágeno, ômega 3 e proteínas. Evite empilhar outras multivitamínicas para não exceder a dose diária de vitamina A." },
    ],
    testimonials: [
      { name: "Ana P.", city: "Curitiba — PR", result: "6cm em 3 meses", text: "Meu cabelo estava caindo aos punhados. Em 45 dias parou a queda e agora cresce muito rápido." },
      { name: "Marina S.", city: "Salvador — BA", result: "Unhas fortes em 20 dias", text: "As unhas nunca mais quebraram. E o brilho do cabelo voltou." },
    ],
    guarantee: "Garantia de 7 dias — devolução total se não sentir diferença.",
    urgencyBadge: "🌿 Fórmula com 8 vitaminas — envio em até 3 dias úteis",
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
    howToUse: [
      "Crianças de 4 a 12 anos: 2 gominhas por dia.",
      "Adolescentes: 3 gominhas por dia.",
      "Pode ser oferecido após qualquer refeição — não precisa de água.",
      "Guarde em local seco e longe do alcance de crianças pequenas.",
    ],
    composition: [
      "Vitamina A, C, D3, E — imunidade e crescimento",
      "Complexo B — energia e concentração",
      "Zinco — desenvolvimento saudável",
      "Sabor natural de framboesa",
      "Sem corantes artificiais, sem glúten",
    ],
    faq: [
      { q: "A partir de que idade posso oferecer?", a: "A partir de 4 anos. Para crianças menores, consulte o pediatra." },
      { q: "Tem açúcar?", a: "Contém teor reduzido de açúcar. Não substitui uma alimentação equilibrada." },
      { q: "É seguro tomar todos os dias?", a: "Sim, dentro da posologia indicada. É um suplemento vitamínico infantil registrado." },
      { q: "Meu filho é seletivo — vai gostar?", a: "O sabor framboesa e o formato de ursinho tornam a suplementação divertida. É o preferido pelas crianças brasileiras." },
    ],
    testimonials: [
      { name: "Fernanda (mãe do Théo, 6 anos)", city: "Porto Alegre — RS", text: "Meu filho comia mal e vivia doente. Depois do Bam Bam Bam melhorou a imunidade e o apetite." },
      { name: "Rodrigo (pai da Sofia, 8 anos)", city: "Recife — PE", text: "Ela pede todo dia — pensa que é doce. Melhor forma de suplementar." },
    ],
    guarantee: "Garantia de 7 dias. Se a criança não gostar, devolvemos seu dinheiro.",
    urgencyBadge: "🧸 Preferido pelas famílias brasileiras",
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
    howToUse: [
      "Tome 1 cápsula 30 minutos antes de dormir.",
      "Ingerir com água — evite café, energético ou tela azul após.",
      "Uso contínuo por 15 dias para regular o ciclo do sono.",
    ],
    composition: [
      "Melatonina — o hormônio do sono",
      "Triptofano — precursor natural da serotonina",
      "Passiflora e valeriana — relaxantes botânicos",
      "Magnésio bisglicinato — relaxamento muscular",
      "Vitamina B6 — regula o ciclo circadiano",
    ],
    faq: [
      { q: "Vicia?", a: "Não. A fórmula é natural e pode ser suspensa a qualquer momento sem efeito rebote." },
      { q: "Posso dirigir no dia seguinte?", a: "Sim. Diferente de indutores químicos, o S.O.S Sleep não deixa sonolência residual." },
      { q: "Funciona para insônia crônica?", a: "Auxilia como suporte. Casos crônicos precisam de acompanhamento médico." },
      { q: "Combina com ansiolíticos?", a: "Consulte seu médico. Não recomendamos combinar com medicamentos psiquiátricos sem orientação." },
    ],
    testimonials: [
      { name: "Beatriz T.", city: "Florianópolis — SC", result: "Dorme em 20 minutos", text: "Levava 2 horas para pegar no sono. Hoje apago em 20 minutos e acordo descansada." },
      { name: "Renata C.", city: "Brasília — DF", result: "Sono profundo", text: "Acordava várias vezes na madrugada. Agora durmo a noite toda." },
    ],
    guarantee: "Garantia de 7 dias — devolvemos seu dinheiro se não notar diferença.",
    urgencyBadge: "🌙 Fórmula natural · sem efeito rebote",
  },
];

export function productBySlug(slug: string): ColorsProduct | undefined {
  return COLORS_PRODUCTS.find((p) => p.slug === slug);
}

export function productsByBrand(brand: ColorsBrand): ColorsProduct[] {
  return COLORS_PRODUCTS.filter((p) => p.brand === brand);
}
