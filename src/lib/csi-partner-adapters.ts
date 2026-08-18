export type CsiPartnerStatus = "pending" | "sandbox" | "homologation" | "active" | "paused" | "blocked";

export type CsiInvestmentIntentPayload = {
  intentId: string;
  investorId: string;
  productReference?: string;
  productName?: string;
  productCategory?: string;
  intendedAmount?: number;
  currency: string;
  suitabilitySnapshot: Record<string, unknown>;
  disclosureVersion: string;
};

export type CsiPortfolioPosition = {
  externalId: string;
  symbol?: string;
  name: string;
  assetClass: string;
  quantity?: number;
  marketValue: number;
  currency: string;
  asOf: string;
};

export type CsiPortfolioSnapshot = {
  provider: string;
  accountReference: string;
  totalMarketValue: number;
  currency: string;
  asOf: string;
  positions: CsiPortfolioPosition[];
};

export interface CsiInvestmentPartnerAdapter {
  readonly key: string;
  readonly displayName: string;
  healthcheck(): Promise<{ ok: boolean; status: CsiPartnerStatus; detail?: string }>;
  createInvestorHandoff(payload: CsiInvestmentIntentPayload): Promise<{
    externalReference: string;
    redirectUrl?: string;
    status: "submitted" | "pending";
  }>;
  getPortfolio?(accountReference: string): Promise<CsiPortfolioSnapshot>;
  getDocuments?(accountReference: string): Promise<Array<{ id: string; title: string; url?: string; issuedAt?: string }>>;
}

class UnconfiguredPartnerAdapter implements CsiInvestmentPartnerAdapter {
  readonly key: string;
  readonly displayName: string;
  constructor(key: string, displayName: string) {
    this.key = key;
    this.displayName = displayName;
  }
  async healthcheck() {
    return { ok: false, status: "homologation" as const, detail: "Credenciais/API ainda não configuradas." };
  }
  async createInvestorHandoff(): Promise<{ externalReference: string; status: "pending" }> {
    throw new Error(`${this.displayName}: API ainda não configurada. Nenhuma ordem foi enviada.`);
  }
}

export function getCsiInvestmentPartnerAdapter(partnerKey: string): CsiInvestmentPartnerAdapter {
  switch (partnerKey.toLowerCase()) {
    case "btg":
    case "btg-pactual":
      return new UnconfiguredPartnerAdapter("btg-pactual", "BTG Pactual");
    default:
      return new UnconfiguredPartnerAdapter(partnerKey, partnerKey);
  }
}

export interface CsiMarketDataAdapter {
  healthcheck(): Promise<{ ok: boolean; detail?: string }>;
  getQuote(symbol: string): Promise<{ symbol: string; price: number; currency: string; asOf: string; source: string }>;
}

export class UnconfiguredMarketDataAdapter implements CsiMarketDataAdapter {
  async healthcheck() { return { ok: false, detail: "Provider de market data ainda não configurado." }; }
  async getQuote(): Promise<never> { throw new Error("Market data indisponível até configuração de API licenciada."); }
}

export function getCsiMarketDataAdapter(): CsiMarketDataAdapter {
  return new UnconfiguredMarketDataAdapter();
}
