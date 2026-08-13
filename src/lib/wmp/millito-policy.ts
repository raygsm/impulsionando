export const MILLITO_STAGES = ['QUALIFY','VENUE','MEDIA','TECHNICAL','SETUP','PROPOSAL','CLOSE'] as const
export type MillitoStage = typeof MILLITO_STAGES[number]

export const MILLITO_REQUIRED_FACTS = [
  'client_name','client_email','client_whatsapp','event_type','event_date','event_city',
  'venue_type','indoor_outdoor','audience_size','start_time','end_time'
] as const

export const MILLITO_MEDIA_RULES = {
  accepted: ['image/jpeg','image/png','image/webp'],
  maxImagesPerVenue: 12,
  mustAskScaleReferenceWhenUnknown: true,
  neverClaimExactMeasurementFromSingleImage: true,
  output: ['estimated_dimensions','ceiling_height','materials','access','power','risks','confidence'],
} as const

export const MILLITO_HANDOFF_REASONS = [
  'technical_confidence_low','structural_risk','electrical_risk','legal_or_noise_restriction',
  'custom_contract_exception','discount_outside_policy','client_requests_human','final_management_approval'
] as const

export const MILLITO_AUTONOMOUS_ACTIONS = [
  'qualify_lead','request_images','analyze_venue','suggest_setup','select_catalog_items',
  'estimate_logistics','prepare_proposal','request_fiscal_data','validate_proposal_inputs','ask_send_confirmation'
] as const
