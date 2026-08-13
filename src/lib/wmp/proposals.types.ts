export type WmpProposalStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'SENT'
  | 'DELIVERED'
  | 'VIEWED'
  | 'NEGOTIATION'
  | 'REVISION_REQUESTED'
  | 'ACCEPTED'
  | 'SIGNED'
  | 'WON'
  | 'LOST'
  | 'CANCELLED'
  | 'EXPIRED';

export type WmpProposalItemType =
  | 'SERVICE'
  | 'EQUIPMENT'
  | 'TEAM'
  | 'LOGISTICS'
  | 'EXTRA';

export type WmpProposalLogistics = {
  djArrivalOffsetMinutes: number;
  djDepartureOffsetMinutes: number;
  parkingResponsibility: 'CONTRATANTE' | 'WMP' | 'INCLUSO' | 'REEMBOLSAVEL' | 'NAO_APLICAVEL';
  mealResponsibility: 'CONTRATANTE' | 'WMP' | 'AUXILIO_ALIMENTACAO' | 'NAO_APLICAVEL';
  transportMode: string;
};

export type WmpMilitoSuggestion = {
  title: string;
  rationale: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  payload: Record<string, unknown>;
};
