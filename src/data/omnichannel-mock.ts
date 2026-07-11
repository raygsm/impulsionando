/**
 * Mock estático da caixa de entrada unificada.
 * Layout apenas — dados reais virão do Codex.
 */
export type OmniChannel =
  | "whatsapp"
  | "instagram"
  | "messenger"
  | "telegram"
  | "chat"
  | "google-business";

export type OmniMessage = {
  id: string;
  from: "cliente" | "atendente";
  text: string;
  time: string;
};

export type OmniConversation = {
  id: string;
  channel: OmniChannel;
  contact: string;
  preview: string;
  time: string;
  unread: number;
  messages: OmniMessage[];
};

export const OMNI_CHANNELS: { slug: OmniChannel; label: string }[] = [
  { slug: "whatsapp", label: "WhatsApp" },
  { slug: "instagram", label: "Instagram Direct" },
  { slug: "messenger", label: "Messenger" },
  { slug: "telegram", label: "Telegram" },
  { slug: "chat", label: "Chat do Site" },
  { slug: "google-business", label: "Google Business" },
];

export const OMNI_CONVERSATIONS: OmniConversation[] = [
  {
    id: "c1",
    channel: "whatsapp",
    contact: "Marina Souza",
    preview: "Tudo certo, muito obrigada!",
    time: "10:24",
    unread: 0,
    messages: [
      { id: "m1", from: "cliente", text: "Oi! Preciso remarcar minha consulta.", time: "10:20" },
      { id: "m2", from: "atendente", text: "Claro, Marina. Qual o melhor dia?", time: "10:21" },
      { id: "m3", from: "cliente", text: "Terça de manhã seria ótimo.", time: "10:22" },
      { id: "m4", from: "atendente", text: "Reservado para terça, 9h. Confirma?", time: "10:23" },
      { id: "m5", from: "cliente", text: "Tudo certo, muito obrigada!", time: "10:24" },
    ],
  },
  {
    id: "c2",
    channel: "instagram",
    contact: "@joaomendes",
    preview: "Vocês entregam para SP?",
    time: "09:58",
    unread: 2,
    messages: [
      { id: "m1", from: "cliente", text: "Oi! Vi o post e queria saber mais.", time: "09:55" },
      { id: "m2", from: "cliente", text: "Vocês entregam para SP?", time: "09:58" },
    ],
  },
  {
    id: "c3",
    channel: "chat",
    contact: "Visitante do site",
    preview: "Quero uma demonstração",
    time: "09:41",
    unread: 1,
    messages: [{ id: "m1", from: "cliente", text: "Quero uma demonstração", time: "09:41" }],
  },
  {
    id: "c4",
    channel: "messenger",
    contact: "Ana Paula",
    preview: "Recebi o orçamento, obrigada!",
    time: "ontem",
    unread: 0,
    messages: [
      { id: "m1", from: "atendente", text: "Segue orçamento em anexo.", time: "16:12" },
      { id: "m2", from: "cliente", text: "Recebi o orçamento, obrigada!", time: "16:20" },
    ],
  },
  {
    id: "c5",
    channel: "google-business",
    contact: "Cliente anônimo",
    preview: "Qual o horário de sábado?",
    time: "ontem",
    unread: 1,
    messages: [{ id: "m1", from: "cliente", text: "Qual o horário de sábado?", time: "14:02" }],
  },
];
