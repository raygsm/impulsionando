export const WMP_JOURNEYS = [
  { key: 'lead_received', audience: 'lead', event: 'wmp.lead.received', channel: 'EMAIL', owner: 'Millito' },
  { key: 'briefing_incomplete', audience: 'lead', event: 'wmp.briefing.incomplete', channel: 'EMAIL', owner: 'Millito' },
  { key: 'proposal_sent', audience: 'client', event: 'wmp.proposal.sent', channel: 'EMAIL', owner: 'Millito' },
  { key: 'proposal_expiring', audience: 'client', event: 'wmp.proposal.expiring', channel: 'EMAIL', owner: 'Millito' },
  { key: 'proposal_accepted', audience: 'client', event: 'wmp.proposal.accepted', channel: 'EMAIL', owner: 'Millito' },
  { key: 'dj_offer', audience: 'dj', event: 'wmp.dj.offered', channel: 'EMAIL', owner: 'Millito' },
  { key: 'dj_confirmed', audience: 'dj', event: 'wmp.dj.confirmed', channel: 'EMAIL', owner: 'Millito' },
  { key: 'event_reminder', audience: 'client_and_team', event: 'wmp.event.reminder', channel: 'EMAIL', owner: 'Millito' },
  { key: 'event_completed', audience: 'client', event: 'wmp.event.completed', channel: 'EMAIL', owner: 'Millito' },
  { key: 'feedback_request', audience: 'client', event: 'wmp.feedback.requested', channel: 'EMAIL', owner: 'Millito' },
  { key: 'repurchase', audience: 'client', event: 'wmp.repurchase.due', channel: 'EMAIL', owner: 'Millito' },
] as const
