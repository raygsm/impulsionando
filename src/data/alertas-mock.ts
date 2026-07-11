/**
 * Alertas mock para o painel de integrações.
 * Substituição pelo Codex quando os monitores reais entrarem.
 */
export type AlertaSeveridade = "erro" | "atencao" | "info";

export type AlertaItem = {
  id: string;
  titulo: string;
  descricao: string;
  severidade: AlertaSeveridade;
  integracaoSlug?: string;
  grupo?: string;
  quando: string;
};

export const ALERTAS: AlertaItem[] = [
  {
    id: "a1",
    titulo: "Google Ads desconectado",
    descricao: "A conexão expirou. Refaça o login para continuar recebendo dados de conversão.",
    severidade: "erro",
    integracaoSlug: "google-ads",
    grupo: "marketing",
    quando: "há 12 minutos",
  },
  {
    id: "a2",
    titulo: "Meta Token expirado",
    descricao: "O acesso do Meta Business precisa ser renovado.",
    severidade: "erro",
    integracaoSlug: "meta-ads",
    grupo: "marketing",
    quando: "há 1 hora",
  },
  {
    id: "a3",
    titulo: "Pixel sem eventos",
    descricao: "Nenhum evento foi recebido pelo Pixel nas últimas 24h.",
    severidade: "atencao",
    integracaoSlug: "meta-ads",
    grupo: "marketing",
    quando: "há 3 horas",
  },
  {
    id: "a4",
    titulo: "Instagram desconectado",
    descricao: "Reconecte a conta profissional para voltar a sincronizar mensagens.",
    severidade: "erro",
    integracaoSlug: "instagram",
    grupo: "redes-sociais",
    quando: "ontem",
  },
  {
    id: "a5",
    titulo: "WhatsApp aguardando verificação",
    descricao: "O número precisa concluir a verificação do WhatsApp Business.",
    severidade: "atencao",
    integracaoSlug: "whatsapp",
    grupo: "mensagens",
    quando: "há 2 dias",
  },
  {
    id: "a6",
    titulo: "TikTok Ads aguardando configuração",
    descricao: "Complete os campos obrigatórios para ativar a integração.",
    severidade: "info",
    integracaoSlug: "tiktok-ads",
    grupo: "marketing",
    quando: "há 4 dias",
  },
];
