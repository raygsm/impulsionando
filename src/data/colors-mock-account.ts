/**
 * Mock da área do cliente Colors — dados fictícios para validação visual.
 * NÃO conecta a Supabase/Auth. Pronto para ser trocado por queries reais
 * quando o Codex integrar backend.
 */

export type ColorsOrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface TrackingEvent {
  date: string; // ISO
  title: string;
  location?: string;
  description?: string;
  done: boolean;
}

export interface ColorsOrderItem {
  slug: string;
  name: string;
  variant?: string;
  qty: number;
  priceCents: number;
  brandLabel: "Green" | "Blue" | "Yellow" | "Colors";
}

export interface ColorsOrder {
  id: string;
  number: string;
  createdAt: string;
  status: ColorsOrderStatus;
  totalCents: number;
  shippingCents: number;
  paymentMethod: "pix" | "credit_card" | "boleto";
  carrier: "Correios" | "Melhor Envio";
  trackingCode: string;
  estimatedDelivery: string;
  items: ColorsOrderItem[];
  address: {
    street: string; number: string; complement?: string;
    district: string; city: string; state: string; zip: string;
  };
  timeline: TrackingEvent[];
}

export const COLORS_MOCK_USER = {
  name: "Ana Silva",
  firstName: "Ana",
  email: "ana.silva@exemplo.com.br",
  phone: "(21) 96786-2834",
  document: "123.456.789-00",
  addresses: [
    {
      id: "addr-1", label: "Casa",
      street: "Rua das Palmeiras", number: "245", complement: "Apto 302",
      district: "Copacabana", city: "Rio de Janeiro", state: "RJ", zip: "22040-020",
      default: true,
    },
  ],
};

export const COLORS_MOCK_ORDERS: ColorsOrder[] = [
  {
    id: "ord-1042",
    number: "#COL-1042",
    createdAt: "2026-07-01T14:22:00Z",
    status: "in_transit",
    totalCents: 24700,
    shippingCents: 0,
    paymentMethod: "pix",
    carrier: "Melhor Envio",
    trackingCode: "ME1234567BR",
    estimatedDelivery: "2026-07-12",
    items: [
      { slug: "super-green-black", name: "Super Green Black", variant: "60 cápsulas", qty: 1, priceCents: 24700, brandLabel: "Green" },
    ],
    address: COLORS_MOCK_USER.addresses[0],
    timeline: [
      { date: "2026-07-01T14:22:00Z", title: "Pedido recebido", description: "Pagamento Pix aprovado.", done: true },
      { date: "2026-07-02T09:15:00Z", title: "Em separação", location: "CD Colors — Rio de Janeiro/RJ", description: "Produto embalado e conferido.", done: true },
      { date: "2026-07-03T18:44:00Z", title: "Postado", location: "Rio de Janeiro/RJ", description: "Objeto entregue à transportadora.", done: true },
      { date: "2026-07-05T07:02:00Z", title: "Em trânsito", location: "Cajamar/SP", description: "Encaminhado ao centro de distribuição de destino.", done: true },
      { date: "", title: "Saiu para entrega", done: false },
      { date: "", title: "Entregue", done: false },
    ],
  },
  {
    id: "ord-0987",
    number: "#COL-0987",
    createdAt: "2026-05-12T10:04:00Z",
    status: "delivered",
    totalCents: 18900,
    shippingCents: 1990,
    paymentMethod: "credit_card",
    carrier: "Correios",
    trackingCode: "OT987654321BR",
    estimatedDelivery: "2026-05-20",
    items: [
      { slug: "mesa-no-pau", name: "Mesa no Pau", variant: "30 cápsulas", qty: 1, priceCents: 16910, brandLabel: "Blue" },
    ],
    address: COLORS_MOCK_USER.addresses[0],
    timeline: [
      { date: "2026-05-12T10:04:00Z", title: "Pedido recebido", done: true },
      { date: "2026-05-13T09:00:00Z", title: "Em separação", done: true },
      { date: "2026-05-14T18:30:00Z", title: "Postado", location: "Rio de Janeiro/RJ", done: true },
      { date: "2026-05-17T11:20:00Z", title: "Em trânsito", location: "Cajamar/SP", done: true },
      { date: "2026-05-19T08:15:00Z", title: "Saiu para entrega", location: "São Paulo/SP", done: true },
      { date: "2026-05-19T15:42:00Z", title: "Entregue", location: "São Paulo/SP", description: "Recebido por: Ana Silva.", done: true },
    ],
  },
];

export function findOrderByTracking(code: string): ColorsOrder | undefined {
  const c = code.trim().toUpperCase();
  return COLORS_MOCK_ORDERS.find((o) => o.trackingCode.toUpperCase() === c || o.number.toUpperCase().includes(c));
}

export function orderStatusLabel(s: ColorsOrderStatus): string {
  return ({
    pending_payment: "Aguardando pagamento",
    paid: "Pagamento aprovado",
    preparing: "Em separação",
    shipped: "Postado",
    in_transit: "Em trânsito",
    out_for_delivery: "Saiu para entrega",
    delivered: "Entregue",
    cancelled: "Cancelado",
  } as const)[s];
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDatePt(iso: string, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", withTime
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" });
}
