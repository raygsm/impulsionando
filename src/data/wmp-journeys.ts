export const WMP_JOURNEYS = [
  { key: 'lead_received', audience: 'lead', event: 'wmp.lead.received', channel: 'EMAIL', owner: 'Milito' },
  { key: 'briefing_incomplete', audience: 'lead', event: 'wmp.briefing.incomplete', channel: 'EMAIL', owner: 'Milito' },
  { key: 'proposal_sent', audience: 'client', event: 'wmp.proposal.sent', channel: 'EMAIL', owner: 'Milito' },
  { key: 'proposal_expiring', audience: 'client', event: 'wmp.proposal.expiring', channel: 'EMAIL', owner: 'Milito' },
  { key: 'proposal_accepted', audience: 'client', event: 'wmp.proposal.accepted', channel: 'EMAIL', owner: 'Milito' },
  { key: 'dj_offer', audience: 'dj', event: 'wmp.dj.offered', channel: 'EMAIL', owner: 'Milito' },
  { key: 'dj_confirmed', audience: 'dj', event: 'wmp.dj.confirmed', channel: 'EMAIL', owner: 'Milito' },
  { key: 'event_reminder', audience: 'client_and_team', event: 'wmp.event.reminder', channel: 'EMAIL', owner: 'Milito' },
  { key: 'event_completed', audience: 'client', event: 'wmp.event.completed', channel: 'EMAIL', owner: 'Milito' },
  { key: 'feedback_request', audience: 'client', event: 'wmp.feedback.requested', channel: 'EMAIL', owner: 'Milito' },
  { key: 'repurchase', audience: 'client', event: 'wmp.repurchase.due', channel: 'EMAIL', owner: 'Milito' },
] as const
