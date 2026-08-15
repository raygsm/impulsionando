/**
 * Catálogo público Colors Saúde.
 *
 * IMPORTANTE:
 * - Não é base clínica nem bula.
 * - Não contém composição, posologia, contraindicações ou promessa de resultado.
 * - Informações sensíveis de produto devem vir da base oficial versionada da Colors.
 * - Todos os produtos são apresentados sob uma única marca pública: Colors Saúde.
 */

export type ColorsBrand = "colors";
export interface ColorsFaq { q: string; a: string }
export interface ColorsTestimonial { name: string; city?: string; text: string; result?: string }
export interface ColorsProduct {
  slug: string;
  brand: ColorsBrand;
  brandLabel: "Colors";
  audience: string;
  name: string;
  tagline: string;
  short: string;
  description: string;
  benefits: string[];
  emoji: string;
  accent: string;
  links: { label: string; href: string }[];
  officialInfoUrl?: string;
  howToUse?: string[];
  composition?: string[];
  faq?: ColorsFaq[];
  testimonials?: ColorsTestimonial[];
  guarantee?: string;
  urgencyBadge?: string;
}

export const COLORS_BRANDS: Record<ColorsBrand,{label:string;audience:string;gradient:string;accentText:string;description:string}> = {
  colors: {
    label: "Colors",
    audience: "Portfólio Colors Saúde",
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    accentText: "text-emerald-400",
    description: "Portfólio oficial Colors Saúde apresentado de forma unificada, sem segmentações públicas legadas.",
  },
};

const neutral = "Consulte composição, modo de uso, contraindicações, preço, disponibilidade e demais informações vigentes exclusivamente na fonte oficial Colors e no canal oficial de compra.";

export const COLORS_PRODUCTS: ColorsProduct[] = [
  {
    slug:"super-green-black", brand:"colors", brandLabel:"Colors", audience:"Bem-estar e controle de peso", name:"Super Green Black",
    tagline:"O produto protagonista da Colors Saúde", short:"Produto oficial Colors Saúde e principal referência comercial da marca.",
    description:neutral, benefits:["Compra em canais oficiais","Atendimento integrado à Íris","Rastreabilidade de origem e jornada","Suporte pós-venda Colors"],
    emoji:"🔥", accent:"from-emerald-500 to-lime-500",
    links:[{label:"Maisfy",href:"https://supergreenblack.com.br/m"},{label:"Monetizze",href:"https://supergreenblack.com.br/"},{label:"Perfect Pay",href:"https://supergreenblack.com.br/p/"}],
    officialInfoUrl:"https://supergreenblack.com.br/",
  },
  {
    slug:"sos-hair",brand:"colors",brandLabel:"Colors",audience:"Cuidados com cabelos e unhas",name:"Super S.O.S. Hair",
    tagline:"Produto oficial Colors Saúde",short:"Conheça o Super S.O.S. Hair pelos canais oficiais Colors.",description:neutral,
    benefits:["Produto oficial Colors","Informação centralizada","Compra rastreável","Suporte integrado"],emoji:"🌿",accent:"from-emerald-500 to-teal-500",
    links:[{label:"Maisfy",href:"https://supersoshair.com.br/m"},{label:"Monetizze",href:"https://supersoshair.com.br/"},{label:"Perfect Pay",href:"https://supersoshair.com.br/p/"}],officialInfoUrl:"https://supersoshair.com.br/",
  },
  {
    slug:"creatina",brand:"colors",brandLabel:"Colors",audience:"Performance",name:"Super Green Black Creatina",tagline:"Produto oficial Colors Saúde",
    short:"Produto da família Super Green Black.",description:neutral,benefits:["Produto oficial Colors","Compra pelos canais autorizados","Íris acompanha a jornada","Suporte Colors"],emoji:"💪",accent:"from-emerald-600 to-green-500",
    links:[{label:"Monetizze",href:"https://supergreenblack.com.br/creatina/"},{label:"Perfect Pay",href:"https://supergreenblack.com.br/p-creatina/"}],officialInfoUrl:"https://supergreenblack.com.br/creatina/",
  },
  {
    slug:"pre-treino",brand:"colors",brandLabel:"Colors",audience:"Performance",name:"Super Green Black Pré-Treino",tagline:"Produto oficial Colors Saúde",
    short:"Produto da família Super Green Black.",description:neutral,benefits:["Produto oficial Colors","Compra pelos canais autorizados","Íris acompanha a jornada","Suporte Colors"],emoji:"⚡",accent:"from-lime-500 to-emerald-500",
    links:[{label:"Monetizze",href:"https://supergreenblack.com.br/pre-treino/"},{label:"Perfect Pay",href:"https://supergreenblack.com.br/p-pre-treino/"}],officialInfoUrl:"https://supergreenblack.com.br/pre-treino/",
  },
  {
    slug:"omega-3",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Ômega 3 Peixinho — Sabor Cereja",tagline:"Produto oficial Colors Saúde",
    short:"Conheça as informações vigentes diretamente no canal oficial.",description:neutral,benefits:["Produto oficial Colors","Informação centralizada","Compra rastreável","Suporte integrado"],emoji:"🐟",accent:"from-teal-500 to-cyan-500",
    links:[{label:"Monetizze",href:"https://supergreenblack.com.br/omega3/"},{label:"Perfect Pay",href:"https://supergreenblack.com.br/p-omega3/"}],officialInfoUrl:"https://supergreenblack.com.br/omega3/",
  },
  {
    slug:"mesa-no-pau",brand:"colors",brandLabel:"Colors",audience:"Bem-estar masculino",name:"Mesa no Pau",tagline:"Produto oficial Colors Saúde",
    short:"Produto Colors Saúde voltado ao público adulto.",description:neutral,benefits:["Produto oficial Colors","Compra pelos canais autorizados","Privacidade no atendimento","Suporte integrado"],emoji:"💙",accent:"from-sky-600 to-indigo-600",
    links:[{label:"Maisfy",href:"https://mesanopau.com.br/m"},{label:"Monetizze",href:"https://mesanopau.com.br/"},{label:"Perfect Pay",href:"https://mesanopau.com.br/p"}],officialInfoUrl:"https://mesanopau.com.br/",
  },
  {
    slug:"bam-bam-bam",brand:"colors",brandLabel:"Colors",audience:"Linha infantil",name:"Super Bam Bam Bam",tagline:"Produto oficial Colors Saúde",
    short:"Produto Colors Saúde; informações de uso infantil exigem referência oficial e, quando pertinente, orientação profissional.",description:neutral,
    benefits:["Produto oficial Colors","Informação de uso protegida por fonte oficial","Compra rastreável","Suporte integrado"],emoji:"🧸",accent:"from-amber-400 to-orange-500",
    links:[{label:"Maisfy",href:"https://superbambam.com.br/m"},{label:"Monetizze",href:"https://superbambam.com.br/"},{label:"Perfect Pay",href:"https://superbambam.com.br/p"}],officialInfoUrl:"https://superbambam.com.br/",
  },
  {
    slug:"sos-sleep",brand:"colors",brandLabel:"Colors",audience:"Sono e relaxamento",name:"Super S.O.S Sleep",tagline:"Produto oficial Colors Saúde",
    short:"Conheça o Super S.O.S Sleep pelos canais oficiais Colors.",description:neutral,benefits:["Produto oficial Colors","Informação centralizada","Compra rastreável","Suporte integrado"],emoji:"🌙",accent:"from-violet-600 to-fuchsia-600",
    links:[{label:"Maisfy",href:"https://supersossleep.com.br/m"},{label:"Monetizze",href:"https://supersossleep.com.br/"},{label:"Perfect Pay",href:"https://supersossleep.com.br/p"}],officialInfoUrl:"https://supersossleep.com.br/",
  },
];

export function productBySlug(slug:string):ColorsProduct|undefined{return COLORS_PRODUCTS.find(p=>p.slug===slug);}
export function productsByBrand(_brand:ColorsBrand):ColorsProduct[]{return COLORS_PRODUCTS;}
