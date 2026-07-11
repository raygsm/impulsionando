/**
 * KPIs mock para o dashboard de marketing.
 * ▸ isMock=true garante que a UI mostre o selo "Layout de desenvolvimento".
 */
export const MARKETING_KPIS = {
  isMock: true as const,
  cards: [
    { key: "sessoes", label: "Sessões", value: "48,2 mil", delta: "+12,4%", tone: "positive" as const },
    { key: "usuarios", label: "Usuários", value: "31,7 mil", delta: "+8,1%", tone: "positive" as const },
    { key: "campanhas", label: "Campanhas ativas", value: "12", delta: "+2", tone: "neutral" as const },
    { key: "conversoes", label: "Conversões", value: "1.248", delta: "+18,9%", tone: "positive" as const },
    { key: "receita", label: "Receita", value: "R$ 184,3 mil", delta: "+22,1%", tone: "positive" as const },
    { key: "roas", label: "ROAS", value: "4,7x", delta: "+0,3", tone: "positive" as const },
    { key: "ctr", label: "CTR médio", value: "3,8%", delta: "-0,2 pt", tone: "warning" as const },
    { key: "cpa", label: "CPA", value: "R$ 47,20", delta: "-6,1%", tone: "positive" as const },
    { key: "cac", label: "CAC", value: "R$ 128,90", delta: "-3,4%", tone: "positive" as const },
    { key: "ltv", label: "LTV", value: "R$ 1.984,00", delta: "+11,0%", tone: "positive" as const },
  ],
  origens: [
    { label: "Google Ads", share: 38 },
    { label: "Meta Ads", share: 24 },
    { label: "Orgânico", share: 18 },
    { label: "Direto", share: 12 },
    { label: "Outros", share: 8 },
  ],
  funil: [
    { label: "Visitantes", value: 48200 },
    { label: "Leads", value: 6820 },
    { label: "Oportunidades", value: 1980 },
    { label: "Clientes", value: 412 },
  ],
};
