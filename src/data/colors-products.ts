/**
 * Catálogo público Colors Saúde.
 *
 * REGRAS:
 * - Não é base clínica nem bula.
 * - Não contém composição, posologia, contraindicações ou promessa de resultado.
 * - Não atribui emagrecimento, tratamento, prevenção, cura ou benefício funcional não validado.
 * - Informações sensíveis de produto devem vir da base oficial versionada da Colors.
 * - Checkout público Colors: exclusivamente MaisFy. Nunca inventar URL de oferta.
 */

export type ColorsBrand = "colors";
export interface ColorsFaq { q: string; a: string }
export interface ColorsTestimonial { name: string; city?: string; text: string; result?: string }
export interface ColorsProduct { slug:string; brand:ColorsBrand; brandLabel:"Colors"; audience:string; name:string; tagline:string; short:string; description:string; benefits:string[]; emoji:string; accent:string; links:{label:string;href:string}[]; officialInfoUrl?:string; howToUse?:string[]; composition?:string[]; faq?:ColorsFaq[]; testimonials?:ColorsTestimonial[]; guarantee?:string; urgencyBadge?:string; }
export const COLORS_BRANDS:Record<ColorsBrand,{label:string;audience:string;gradient:string;accentText:string;description:string}>={colors:{label:"Colors",audience:"Portfólio Colors Saúde",gradient:"from-emerald-500 via-green-500 to-lime-500",accentText:"text-emerald-400",description:"Portfólio oficial Colors Saúde apresentado de forma unificada, com informação pública protegida e compra exclusivamente por checkout MaisFy validado."}};
const neutral="Consulte composição, modo de uso, advertências, preço, disponibilidade e demais informações vigentes exclusivamente na fonte oficial Colors e no canal oficial de compra. Não utilize este catálogo como orientação clínica.";
const operationalBenefits=["Produto oficial Colors","Checkout MaisFy quando disponível","Rastreabilidade de origem e jornada","Suporte pós-venda Colors"];
export const COLORS_PRODUCTS:ColorsProduct[]=[
{slug:"super-green-black",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Super Green Black",tagline:"O produto protagonista da Colors Saúde",short:"Produto oficial Colors Saúde e principal referência comercial da marca.",description:neutral,benefits:operationalBenefits,emoji:"🔥",accent:"from-emerald-500 to-lime-500",links:[{label:"MaisFy",href:"https://supergreenblack.com.br/m"}],officialInfoUrl:"https://supergreenblack.com.br/"},
{slug:"sos-hair",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Super S.O.S. Hair",tagline:"Produto oficial Colors Saúde",short:"Conheça o Super S.O.S. Hair pelos canais oficiais Colors.",description:neutral,benefits:operationalBenefits,emoji:"🌿",accent:"from-emerald-500 to-teal-500",links:[{label:"MaisFy",href:"https://supersoshair.com.br/m"}],officialInfoUrl:"https://supersoshair.com.br/"},
{slug:"creatina",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Super Green Black Creatina",tagline:"Produto oficial Colors Saúde",short:"Produto da família Super Green Black.",description:neutral,benefits:operationalBenefits,emoji:"💪",accent:"from-emerald-600 to-green-500",links:[],officialInfoUrl:"https://supergreenblack.com.br/creatina/"},
{slug:"pre-treino",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Super Green Black Pré-Treino",tagline:"Produto oficial Colors Saúde",short:"Produto da família Super Green Black.",description:neutral,benefits:operationalBenefits,emoji:"⚡",accent:"from-lime-500 to-emerald-500",links:[],officialInfoUrl:"https://supergreenblack.com.br/pre-treino/"},
{slug:"omega-3",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Ômega 3 Peixinho — Sabor Cereja",tagline:"Produto oficial Colors Saúde",short:"Conheça as informações vigentes diretamente no canal oficial.",description:neutral,benefits:operationalBenefits,emoji:"🐟",accent:"from-teal-500 to-cyan-500",links:[],officialInfoUrl:"https://supergreenblack.com.br/omega3/"},
{slug:"mesa-no-pau",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Mesa no Pau",tagline:"Produto oficial Colors Saúde",short:"Produto Colors Saúde voltado ao público adulto.",description:neutral,benefits:operationalBenefits,emoji:"💙",accent:"from-sky-600 to-indigo-600",links:[{label:"MaisFy",href:"https://mesanopau.com.br/m"}],officialInfoUrl:"https://mesanopau.com.br/"},
{slug:"bam-bam-bam",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Super Bam Bam Bam",tagline:"Produto oficial Colors Saúde",short:"Produto Colors Saúde; informações de uso devem seguir exclusivamente a fonte oficial e, quando pertinente, orientação profissional.",description:neutral,benefits:operationalBenefits,emoji:"🧸",accent:"from-amber-400 to-orange-500",links:[{label:"MaisFy",href:"https://superbambam.com.br/m"}],officialInfoUrl:"https://superbambam.com.br/"},
{slug:"sos-sleep",brand:"colors",brandLabel:"Colors",audience:"Suplementação",name:"Super S.O.S Sleep",tagline:"Produto oficial Colors Saúde",short:"Conheça o Super S.O.S Sleep pelos canais oficiais Colors.",description:neutral,benefits:operationalBenefits,emoji:"🌙",accent:"from-violet-600 to-fuchsia-600",links:[{label:"MaisFy",href:"https://supersossleep.com.br/m"}],officialInfoUrl:"https://supersossleep.com.br/"}
];
export function productBySlug(slug:string):ColorsProduct|undefined{return COLORS_PRODUCTS.find(p=>p.slug===slug);}
export function productsByBrand(_brand:ColorsBrand):ColorsProduct[]{return COLORS_PRODUCTS;}
