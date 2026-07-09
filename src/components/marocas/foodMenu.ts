// Mock do cardápio Marocas. Fonte única para vitrine, PDP e carrinho.
// Em produção, será substituído por leitura via createServerFn.
// Não usar depoimentos, preços ou fotos reais sem autorização.

export type MarocasCategoriaId =
  | "entradas"
  | "hamburgueres"
  | "pizzas"
  | "pratos"
  | "bebidas"
  | "sobremesas";

export interface MarocasCategoria {
  id: MarocasCategoriaId;
  nome: string;
  descricao: string;
  emoji: string;
}

export interface MarocasAdicional {
  id: string;
  nome: string;
  preco: number;
  max?: number;
}

export interface MarocasGrupoAdicional {
  id: string;
  titulo: string;
  obrigatorio?: boolean;
  min?: number;
  max?: number;
  opcoes: MarocasAdicional[];
}

export interface MarocasItem {
  slug: string;
  nome: string;
  categoria: MarocasCategoriaId;
  descricao: string;
  precoBase: number;
  tempoPreparoMin: number;
  disponivel: boolean;
  tags?: ("novo" | "vegetariano" | "vegano" | "sem-gluten" | "picante" | "mais-pedido")[];
  imagem: string;
  adicionais?: MarocasGrupoAdicional[];
}

export const marocasCategorias: MarocasCategoria[] = [
  { id: "entradas", nome: "Entradas", descricao: "Para começar bem.", emoji: "🥟" },
  { id: "hamburgueres", nome: "Hambúrgueres", descricao: "Blend próprio, pão brioche artesanal.", emoji: "🍔" },
  { id: "pizzas", nome: "Pizzas", descricao: "Massa de fermentação natural.", emoji: "🍕" },
  { id: "pratos", nome: "Pratos", descricao: "Cozinha da casa.", emoji: "🍽️" },
  { id: "bebidas", nome: "Bebidas", descricao: "Chopp, drinks, refrigerantes.", emoji: "🍹" },
  { id: "sobremesas", nome: "Sobremesas", descricao: "Feitas na casa.", emoji: "🍰" },
];

const IMG = (id: string, q = "food") =>
  `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80&${q}`;

export const marocasItens: MarocasItem[] = [
  {
    slug: "bolinho-bacalhau",
    nome: "Bolinho de Bacalhau (6un)",
    categoria: "entradas",
    descricao: "Receita tradicional portuguesa, crocante por fora e cremoso por dentro.",
    precoBase: 34.9,
    tempoPreparoMin: 12,
    disponivel: true,
    tags: ["mais-pedido"],
    imagem: IMG("photo-1626082927389-6cd097cdc6ec"),
  },
  {
    slug: "batata-rustica",
    nome: "Batata Rústica com Alecrim",
    categoria: "entradas",
    descricao: "Batatas assadas com azeite, alecrim e flor de sal. Acompanha maionese da casa.",
    precoBase: 28.0,
    tempoPreparoMin: 15,
    disponivel: true,
    tags: ["vegetariano"],
    imagem: IMG("photo-1553557202-e8e60732b8f8"),
  },
  {
    slug: "marocas-classic",
    nome: "Marocas Classic",
    categoria: "hamburgueres",
    descricao: "Blend 180g, queijo cheddar, alface, tomate e maionese da casa no pão brioche.",
    precoBase: 39.9,
    tempoPreparoMin: 18,
    disponivel: true,
    tags: ["mais-pedido"],
    imagem: IMG("photo-1568901346375-23c9450c58cd"),
    adicionais: [
      {
        id: "ponto",
        titulo: "Ponto da carne",
        obrigatorio: true,
        min: 1,
        max: 1,
        opcoes: [
          { id: "mal", nome: "Ao ponto para mal", preco: 0 },
          { id: "ponto", nome: "Ao ponto", preco: 0 },
          { id: "bem", nome: "Bem passado", preco: 0 },
        ],
      },
      {
        id: "extras",
        titulo: "Adicionais",
        max: 4,
        opcoes: [
          { id: "bacon", nome: "Bacon crocante", preco: 6 },
          { id: "cheddar-extra", nome: "Cheddar extra", preco: 5 },
          { id: "ovo", nome: "Ovo", preco: 4 },
          { id: "cebola-crispy", nome: "Cebola crispy", preco: 5 },
        ],
      },
    ],
  },
  {
    slug: "marocas-veggie",
    nome: "Marocas Veggie",
    categoria: "hamburgueres",
    descricao: "Burger de grão-de-bico, queijo coalho, rúcula e chutney de tomate.",
    precoBase: 38.0,
    tempoPreparoMin: 18,
    disponivel: true,
    tags: ["vegetariano", "novo"],
    imagem: IMG("photo-1550547660-d9450f859349"),
  },
  {
    slug: "pizza-margherita",
    nome: "Pizza Margherita",
    categoria: "pizzas",
    descricao: "Molho de tomate San Marzano, mozzarella fior di latte, manjericão fresco.",
    precoBase: 62.0,
    tempoPreparoMin: 22,
    disponivel: true,
    tags: ["vegetariano", "mais-pedido"],
    imagem: IMG("photo-1604382354936-07c5d9983bd3"),
  },
  {
    slug: "pizza-pepperoni",
    nome: "Pizza Pepperoni",
    categoria: "pizzas",
    descricao: "Pepperoni artesanal, mozzarella, molho de tomate assado.",
    precoBase: 68.0,
    tempoPreparoMin: 22,
    disponivel: true,
    tags: ["picante"],
    imagem: IMG("photo-1628840042765-356cda07504e"),
  },
  {
    slug: "risoto-cogumelos",
    nome: "Risoto de Cogumelos",
    categoria: "pratos",
    descricao: "Arroz arbóreo, mix de cogumelos frescos, parmesão e azeite trufado.",
    precoBase: 72.0,
    tempoPreparoMin: 28,
    disponivel: true,
    tags: ["vegetariano"],
    imagem: IMG("photo-1476124369491-e7addf5db371"),
  },
  {
    slug: "moqueca-peixe",
    nome: "Moqueca de Peixe",
    categoria: "pratos",
    descricao: "Peixe branco, leite de coco, dendê, pimentões. Serve 2. Acompanha arroz e farofa.",
    precoBase: 129.0,
    tempoPreparoMin: 35,
    disponivel: false,
    imagem: IMG("photo-1512058564366-18510be2db19"),
  },
  {
    slug: "chopp-pilsen",
    nome: "Chopp Pilsen 300ml",
    categoria: "bebidas",
    descricao: "Chopp claro, servido no ponto certo.",
    precoBase: 12.0,
    tempoPreparoMin: 2,
    disponivel: true,
    imagem: IMG("photo-1600788886242-5c96aabe3757"),
  },
  {
    slug: "limonada-suica",
    nome: "Limonada Suíça",
    categoria: "bebidas",
    descricao: "Limão siciliano batido com leite condensado. Sem álcool.",
    precoBase: 14.0,
    tempoPreparoMin: 4,
    disponivel: true,
    tags: ["vegano"],
    imagem: IMG("photo-1621263764928-df1444c5e859"),
  },
  {
    slug: "pudim-leite",
    nome: "Pudim de Leite",
    categoria: "sobremesas",
    descricao: "Receita da vó, calda de caramelo. Feito diariamente.",
    precoBase: 18.0,
    tempoPreparoMin: 3,
    disponivel: true,
    tags: ["vegetariano"],
    imagem: IMG("photo-1551024506-0bccd828d307"),
  },
  {
    slug: "brownie-sorvete",
    nome: "Brownie com Sorvete",
    categoria: "sobremesas",
    descricao: "Brownie quente com sorvete de creme e calda de chocolate belga.",
    precoBase: 24.0,
    tempoPreparoMin: 6,
    disponivel: true,
    imagem: IMG("photo-1499636136210-6f4ee915583e"),
  },
];

export function getMarocasItem(slug: string) {
  return marocasItens.find((i) => i.slug === slug);
}
