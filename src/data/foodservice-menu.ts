// ============================================================
// Dataset oficial do tenant Food Service
// Modelo definitivo para: bares, restaurantes, hamburguerias,
// pizzarias, cafeterias, adegas, delivery, casas noturnas,
// food trucks, dark kitchens e operações de alimentação em geral.
//
// Arquitetura pronta para o Impulsionito (agente IA): cada item
// carrega atributos semânticos (dieta, ocasião, harmonização,
// ticket, público) que alimentam recomendações contextuais.
// ============================================================

export type FoodDiet = "vegetariano" | "vegano" | "sem-gluten" | "sem-lactose" | "kids" | "fit";
export type FoodOcasiao = "almoco" | "jantar" | "happy-hour" | "brunch" | "evento" | "delivery" | "cafe-manha";
export type FoodCanal = "salao" | "balcao" | "delivery" | "retirada" | "evento";

export interface FoodCategoria {
  slug: string;
  nome: string;
  descricao: string;
  ordem: number;
  destaque?: boolean;
}

export interface FoodProduto {
  slug: string;
  nome: string;
  descricao: string;
  descricaoLonga?: string;
  categoria: string;
  preco: number;
  precoPromo?: number;
  imagem: string;
  disponivel: boolean;
  destaque?: boolean;
  novo?: boolean;
  maisPedido?: boolean;
  tempoPreparo: string;   // "20-25min"
  serve?: string;         // "1 pessoa" / "2-3 pessoas"
  calorias?: number;
  dieta?: FoodDiet[];
  ocasiao?: FoodOcasiao[];
  harmonizacao?: string[]; // slugs de bebidas
  adicionais?: { nome: string; preco: number }[];
  ingredientes?: string[];
  alergenos?: string[];
  canaisDisponiveis: FoodCanal[];
  tags?: string[];
}

export interface FoodCombo {
  slug: string;
  nome: string;
  descricao: string;
  preco: number;
  precoOriginal: number;
  itens: string[]; // slugs de produtos
  imagem: string;
  serve: string;
  ocasiao?: FoodOcasiao[];
  destaque?: boolean;
}

export interface FoodPromocao {
  slug: string;
  titulo: string;
  chamada: string;
  descricao: string;
  tipo: "desconto" | "cupom" | "happy-hour" | "combo" | "primeira-compra";
  desconto?: string;    // "20% OFF" / "R$ 15 de desconto"
  codigo?: string;      // cupom
  validade?: string;    // "válido até 31/12" ou "seg a sex, 18h-20h"
  categorias?: string[];
  imagem?: string;
  destaque?: boolean;
}

// ------------------------------------------------------------
// Marca demo oficial: Casa Impulsiona
// (bar + restaurante + delivery + eventos)
// ------------------------------------------------------------
export const FOOD_MARCA = {
  nome: "Casa Impulsiona",
  tagline: "Bar, cozinha e delivery — do happy hour ao jantar",
  cnpj: "00.000.000/0001-00",
  endereco: "Av. das Américas, 3500 — Barra da Tijuca, Rio de Janeiro/RJ",
  telefone: "(21) 4002-8922",
  whatsapp: "https://wa.me/5521999990000",
  instagram: "https://instagram.com/casaimpulsiona",
  horario: {
    "Segunda a Quinta": "12h às 00h",
    "Sexta e Sábado": "12h às 02h",
    "Domingo": "12h às 23h",
  },
  raioEntrega: "6 km",
  ticketMedio: 78,
  capacidade: 180,
  mesas: 42,
};

export const FOOD_CATEGORIAS: FoodCategoria[] = [
  { slug: "entradas", nome: "Entradas & Petiscos", descricao: "Para dividir com quem você ama.", ordem: 1, destaque: true },
  { slug: "hamburgueres", nome: "Hambúrgueres Artesanais", descricao: "Blend 180g grelhado na chapa.", ordem: 2, destaque: true },
  { slug: "pizzas", nome: "Pizzas Napolitanas", descricao: "Massa de fermentação natural 48h.", ordem: 3, destaque: true },
  { slug: "principais", nome: "Pratos Principais", descricao: "Do executivo ao chef.", ordem: 4 },
  { slug: "saladas", nome: "Saladas & Fit", descricao: "Frescas, coloridas e proteicas.", ordem: 5 },
  { slug: "sobremesas", nome: "Sobremesas", descricao: "Feitas na casa.", ordem: 6 },
  { slug: "cervejas", nome: "Cervejas Artesanais", descricao: "Rotativas na tap house.", ordem: 7 },
  { slug: "drinks", nome: "Drinks & Coquetéis", descricao: "Autoral e clássicos.", ordem: 8, destaque: true },
  { slug: "vinhos", nome: "Vinhos & Rótulos", descricao: "Carta curada da adega.", ordem: 9 },
  { slug: "nao-alcoolicos", nome: "Sem Álcool", descricao: "Sucos, mocktails, refris.", ordem: 10 },
  { slug: "kids", nome: "Menu Kids", descricao: "Para os pequenos.", ordem: 11 },
];

export const FOOD_PRODUTOS: FoodProduto[] = [
  {
    slug: "burrata-artesanal",
    nome: "Burrata Artesanal com Tomate Confit",
    descricao: "Burrata cremosa, tomate confit, pesto, azeite extravirgem e pão focaccia da casa.",
    descricaoLonga: "Nossa burrata é servida sobre cama de tomatinhos confitados por 4h em azeite e ervas, finalizada com pesto de manjericão e crocante de amêndoas. Acompanha focaccia artesanal da nossa padaria interna.",
    categoria: "entradas",
    preco: 58, imagem: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800",
    disponivel: true, destaque: true, maisPedido: true,
    tempoPreparo: "10-15min", serve: "2 pessoas", calorias: 420,
    dieta: ["vegetariano"], ocasiao: ["jantar", "happy-hour"],
    harmonizacao: ["vinho-branco-sauvignon", "drink-gin-tropical"],
    ingredientes: ["burrata 125g", "tomatinho confit", "pesto genovês", "focaccia", "azeite extra virgem"],
    alergenos: ["lactose", "glúten"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
    tags: ["premium", "para dividir"],
  },
  {
    slug: "bolinho-bacalhau",
    nome: "Bolinho de Bacalhau (6un)",
    descricao: "Receita portuguesa, batata amarela, salsinha e limão siciliano.",
    categoria: "entradas", preco: 42,
    imagem: "https://images.unsplash.com/photo-1626200925887-2b1a4f4f31c4?w=800",
    disponivel: true, tempoPreparo: "15min", serve: "2 pessoas",
    ocasiao: ["happy-hour"], harmonizacao: ["cerveja-pilsen", "vinho-verde"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
    alergenos: ["peixe", "glúten"],
  },
  {
    slug: "batata-rustica",
    nome: "Batata Rústica com Cheddar & Bacon",
    descricao: "Batata assada, cheddar cremoso, bacon crocante, cebolinha.",
    categoria: "entradas", preco: 38,
    imagem: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800",
    disponivel: true, maisPedido: true, tempoPreparo: "15min", serve: "2-3 pessoas",
    ocasiao: ["happy-hour"], harmonizacao: ["cerveja-ipa"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
    tags: ["compartilhar"],
  },
  {
    slug: "impulsa-burger",
    nome: "Impulsa Burger",
    descricao: "Blend 180g, cheddar inglês, cebola caramelizada, molho da casa, pão brioche.",
    descricaoLonga: "Nosso carro-chefe: 180g de blend bovino selecionado (fraldinha + acém), grelhado ao ponto no chapão de ferro. Servido no pão brioche artesanal com cheddar inglês derretido, cebolas caramelizadas em cerveja preta e nosso molho secreto da casa. Acompanha porção de batata rústica.",
    categoria: "hamburgueres", preco: 52,
    imagem: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    disponivel: true, destaque: true, maisPedido: true,
    tempoPreparo: "20-25min", serve: "1 pessoa", calorias: 780,
    ocasiao: ["almoco", "jantar", "delivery"],
    harmonizacao: ["cerveja-ipa", "drink-old-fashioned"],
    ingredientes: ["blend 180g", "cheddar inglês", "cebola caramelizada", "molho da casa", "pão brioche", "batata rústica"],
    alergenos: ["glúten", "lactose"],
    adicionais: [
      { nome: "Bacon crocante (30g)", preco: 8 },
      { nome: "Cheddar extra", preco: 6 },
      { nome: "Ovo caipira", preco: 5 },
      { nome: "Onion rings", preco: 12 },
      { nome: "Trocar batata por salada", preco: 0 },
    ],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
    tags: ["assinatura", "carro-chefe"],
  },
  {
    slug: "veg-burger",
    nome: "Veg Burger de Grão-de-Bico",
    descricao: "Burger 160g de grão-de-bico e cogumelos, maionese vegana, rúcula, tomate seco.",
    categoria: "hamburgueres", preco: 46,
    imagem: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800",
    disponivel: true, novo: true, tempoPreparo: "20min",
    dieta: ["vegetariano", "vegano"], ocasiao: ["almoco", "jantar", "delivery"],
    harmonizacao: ["cerveja-witbier"], alergenos: ["glúten"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
    tags: ["plant-based"],
  },
  {
    slug: "pizza-margherita",
    nome: "Pizza Margherita D.O.P.",
    descricao: "Molho de tomate San Marzano, mussarela de búfala, manjericão fresco, azeite.",
    categoria: "pizzas", preco: 68,
    imagem: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800",
    disponivel: true, destaque: true, tempoPreparo: "25min", serve: "2 pessoas",
    dieta: ["vegetariano"], ocasiao: ["jantar", "delivery"],
    harmonizacao: ["vinho-tinto-chianti", "cerveja-pilsen"],
    alergenos: ["glúten", "lactose"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
    tags: ["clássica"],
  },
  {
    slug: "pizza-pepperoni",
    nome: "Pizza Pepperoni Artesanal",
    descricao: "Molho de tomate, mussarela, pepperoni curado, mel picante opcional.",
    categoria: "pizzas", preco: 76,
    imagem: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800",
    disponivel: true, maisPedido: true, tempoPreparo: "25min", serve: "2 pessoas",
    ocasiao: ["jantar", "delivery"], harmonizacao: ["cerveja-ipa"],
    alergenos: ["glúten", "lactose"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
  },
  {
    slug: "risoto-camarao",
    nome: "Risoto de Camarão ao Limão Siciliano",
    descricao: "Arroz arbóreo, camarões salteados, manteiga, parmesão, raspas de limão.",
    categoria: "principais", preco: 89,
    imagem: "https://images.unsplash.com/photo-1633504581786-316c8002b1b9?w=800",
    disponivel: true, tempoPreparo: "30min", serve: "1 pessoa",
    dieta: ["sem-gluten"], ocasiao: ["jantar", "evento"],
    harmonizacao: ["vinho-branco-chardonnay"], alergenos: ["crustáceos", "lactose"],
    canaisDisponiveis: ["salao"], tags: ["chef", "assinatura"],
  },
  {
    slug: "salada-buddha",
    nome: "Buddha Bowl Fit",
    descricao: "Quinoa, grão-de-bico, abacate, folhas, cenoura ralada, molho tahine.",
    categoria: "saladas", preco: 44,
    imagem: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    disponivel: true, novo: true, tempoPreparo: "12min",
    dieta: ["vegetariano", "vegano", "sem-gluten", "fit"], calorias: 480,
    ocasiao: ["almoco", "brunch", "delivery"], canaisDisponiveis: ["salao", "delivery", "retirada"],
    tags: ["saudável", "leve"],
  },
  {
    slug: "cheesecake-frutas-vermelhas",
    nome: "Cheesecake de Frutas Vermelhas",
    descricao: "Base crocante, creme suave, calda quente de frutas vermelhas.",
    categoria: "sobremesas", preco: 28,
    imagem: "https://images.unsplash.com/photo-1567327613485-fbc7bf196198?w=800",
    disponivel: true, maisPedido: true, tempoPreparo: "5min",
    dieta: ["vegetariano"], ocasiao: ["jantar"], alergenos: ["glúten", "lactose"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
  },
  {
    slug: "cerveja-ipa",
    nome: "IPA Impulsiona 500ml",
    descricao: "IPA cítrica, amargor equilibrado, produzida em parceria com cervejaria local.",
    categoria: "cervejas", preco: 24,
    imagem: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800",
    disponivel: true, destaque: true, tempoPreparo: "2min",
    ocasiao: ["happy-hour", "jantar"], canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
    tags: ["assinatura"],
  },
  {
    slug: "cerveja-pilsen",
    nome: "Pilsen Gelada 600ml",
    descricao: "Puro malte, corpo leve, para acompanhar petiscos.",
    categoria: "cervejas", preco: 18,
    imagem: "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=800",
    disponivel: true, tempoPreparo: "2min", ocasiao: ["happy-hour"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
  },
  {
    slug: "cerveja-witbier",
    nome: "Witbier Cítrica 500ml",
    descricao: "Trigo, coentro e casca de laranja. Leve e refrescante.",
    categoria: "cervejas", preco: 22, imagem: "https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=800",
    disponivel: true, tempoPreparo: "2min", ocasiao: ["happy-hour"],
    canaisDisponiveis: ["salao", "balcao", "delivery", "retirada"],
  },
  {
    slug: "drink-gin-tropical",
    nome: "Gin Tropical da Casa",
    descricao: "Gin, xarope de maracujá, limão, tônica artesanal, alecrim.",
    categoria: "drinks", preco: 36, imagem: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800",
    disponivel: true, destaque: true, tempoPreparo: "8min",
    ocasiao: ["happy-hour", "jantar", "evento"], canaisDisponiveis: ["salao", "balcao"],
    tags: ["autoral"],
  },
  {
    slug: "drink-old-fashioned",
    nome: "Old Fashioned Clássico",
    descricao: "Bourbon, açúcar, angostura, casca de laranja.",
    categoria: "drinks", preco: 42, imagem: "https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=800",
    disponivel: true, tempoPreparo: "6min", ocasiao: ["jantar", "happy-hour"],
    canaisDisponiveis: ["salao", "balcao"], tags: ["clássico"],
  },
  {
    slug: "mocktail-frutas",
    nome: "Mocktail Frutas Vermelhas",
    descricao: "Sem álcool. Frutas vermelhas, hortelã, limão e água com gás.",
    categoria: "nao-alcoolicos", preco: 22, imagem: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800",
    disponivel: true, tempoPreparo: "5min",
    dieta: ["vegano", "sem-gluten", "sem-lactose"], ocasiao: ["brunch", "happy-hour"],
    canaisDisponiveis: ["salao", "balcao", "delivery"],
    tags: ["sem-alcool"],
  },
  {
    slug: "vinho-branco-sauvignon",
    nome: "Sauvignon Blanc Chileno",
    descricao: "Cítrico, mineral, notas de maracujá. Excelente para peixes e queijos.",
    categoria: "vinhos", preco: 148, imagem: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800",
    disponivel: true, tempoPreparo: "3min", ocasiao: ["jantar", "evento"],
    canaisDisponiveis: ["salao", "delivery"], tags: ["carta-vinhos"],
  },
  {
    slug: "vinho-tinto-chianti",
    nome: "Chianti Classico DOCG",
    descricao: "Sangiovese italiano, taninos elegantes, ideal com massas e pizzas.",
    categoria: "vinhos", preco: 186, imagem: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800",
    disponivel: true, tempoPreparo: "3min", ocasiao: ["jantar", "evento"],
    canaisDisponiveis: ["salao", "delivery"],
  },
  {
    slug: "vinho-verde",
    nome: "Vinho Verde Português",
    descricao: "Leve, jovem, com leve efervescência. Perfeito para petiscos.",
    categoria: "vinhos", preco: 98, imagem: "https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?w=800",
    disponivel: true, tempoPreparo: "3min", ocasiao: ["happy-hour", "almoco"],
    canaisDisponiveis: ["salao", "delivery"],
  },
  {
    slug: "vinho-branco-chardonnay",
    nome: "Chardonnay Argentino",
    descricao: "Untuoso, notas de baunilha e frutas amarelas.",
    categoria: "vinhos", preco: 168, imagem: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800",
    disponivel: true, tempoPreparo: "3min", ocasiao: ["jantar"],
    canaisDisponiveis: ["salao", "delivery"],
  },
  {
    slug: "kids-nuggets",
    nome: "Prato Kids: Nuggets & Batata",
    descricao: "Nuggets caseiros de frango, batata frita, suco natural inclus.",
    categoria: "kids", preco: 32, imagem: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800",
    disponivel: true, tempoPreparo: "15min", serve: "1 criança",
    dieta: ["kids"], ocasiao: ["almoco", "jantar"], canaisDisponiveis: ["salao", "delivery", "retirada"],
  },
];

export const FOOD_COMBOS: FoodCombo[] = [
  {
    slug: "combo-happy-hour",
    nome: "Combo Happy Hour para 2",
    descricao: "2 chopes IPA + porção de batata rústica + bolinho de bacalhau (6un).",
    preco: 98, precoOriginal: 132,
    itens: ["cerveja-ipa", "batata-rustica", "bolinho-bacalhau"],
    imagem: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800",
    serve: "2 pessoas", ocasiao: ["happy-hour"], destaque: true,
  },
  {
    slug: "combo-pizza-noite",
    nome: "Combo Pizza Night",
    descricao: "Pizza grande à escolha + 2 chopes ou 1 vinho verde.",
    preco: 128, precoOriginal: 164,
    itens: ["pizza-margherita", "cerveja-ipa"],
    imagem: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    serve: "2 pessoas", ocasiao: ["jantar", "delivery"],
  },
  {
    slug: "combo-burger-duplo",
    nome: "Combo Impulsa Duplo",
    descricao: "2 Impulsa Burgers + 2 bebidas + porção de batata para dividir.",
    preco: 158, precoOriginal: 204,
    itens: ["impulsa-burger", "batata-rustica"],
    imagem: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
    serve: "2 pessoas", ocasiao: ["almoco", "delivery"], destaque: true,
  },
  {
    slug: "combo-almoco-executivo",
    nome: "Menu Executivo (11h-15h)",
    descricao: "Entrada + prato principal + bebida + sobremesa. Segunda a sexta.",
    preco: 58, precoOriginal: 84,
    itens: ["salada-buddha", "impulsa-burger", "cheesecake-frutas-vermelhas"],
    imagem: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800",
    serve: "1 pessoa", ocasiao: ["almoco"],
  },
];

export const FOOD_PROMOCOES: FoodPromocao[] = [
  {
    slug: "primeira-compra",
    titulo: "15% OFF na primeira compra",
    chamada: "Cadastre-se e ganhe 15% de desconto no seu primeiro pedido pelo app.",
    descricao: "Válido para pedidos delivery, retirada ou salão. Uso único por CPF. Não cumulativo.",
    tipo: "primeira-compra", desconto: "15% OFF", codigo: "IMPULSA15",
    destaque: true,
  },
  {
    slug: "happy-hour",
    titulo: "Happy Hour Todo Dia",
    chamada: "Chopes e petiscos com preço especial de segunda a sexta, das 17h às 20h.",
    descricao: "Chope IPA por R$ 18, batata rústica por R$ 28 e bolinhos por R$ 32.",
    tipo: "happy-hour", validade: "seg a sex, 17h-20h",
    categorias: ["cervejas", "entradas"], destaque: true,
  },
  {
    slug: "delivery-frete-gratis",
    titulo: "Frete grátis acima de R$ 89",
    chamada: "Peça pelo delivery e não pague entrega em pedidos acima de R$ 89 no raio de 4km.",
    descricao: "Válido para bairros da Barra, Recreio e Jacarepaguá.",
    tipo: "desconto", codigo: "FRETEGRATIS",
  },
  {
    slug: "aniversariante",
    titulo: "Aniversariante ganha sobremesa",
    chamada: "No mês do seu aniversário, a Casa Impulsiona te presenteia com sobremesa cortesia.",
    descricao: "Basta apresentar documento com foto na mesa. Cortesia para o aniversariante.",
    tipo: "combo", validade: "todo mês do aniversário",
  },
  {
    slug: "combo-familia",
    titulo: "Domingo em Família",
    chamada: "Combo família com 20% OFF aos domingos: 2 pizzas + 4 bebidas.",
    descricao: "Aplicado automaticamente no carrinho aos domingos.",
    tipo: "combo", desconto: "20% OFF", validade: "todos os domingos",
    categorias: ["pizzas"], destaque: true,
  },
  {
    slug: "indique-amigo",
    titulo: "Indicou, ganhou",
    chamada: "Indique um amigo e ambos ganham R$ 25 de crédito ao primeiro pedido dele.",
    descricao: "Sem limite de indicações. Créditos válidos por 90 dias.",
    tipo: "cupom", desconto: "R$ 25 + R$ 25",
  },
];

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getProduto(slug: string) {
  return FOOD_PRODUTOS.find((p) => p.slug === slug);
}

export function getCategoria(slug: string) {
  return FOOD_CATEGORIAS.find((c) => c.slug === slug);
}

export function produtosPorCategoria(slug: string) {
  return FOOD_PRODUTOS.filter((p) => p.categoria === slug);
}
