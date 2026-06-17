import type { ComponentType } from 'react'
import { template as siteDownTemplate } from './site-down'
import { template as siteUpTemplate } from './site-up'
import { template as marketingLeadNewTemplate } from './marketing-lead-new'
import { template as trialStartedTemplate } from './trial-started'
import { template as trialEndingTemplate } from './trial-ending'
import { template as welcomePaidTemplate } from './welcome-paid'
import { template as invoicePaidTemplate } from './invoice-paid'
import { template as invoiceOverdueTemplate } from './invoice-overdue'
import { template as realestatePropertyApprovalTemplate } from './realestate-property-approval'
import { template as realestateVitrineInterestCustomerTemplate } from './realestate-vitrine-interest-customer'
import { template as realestateVitrineInterestAgencyTemplate } from './realestate-vitrine-interest-agency'
import { template as realestateVitrineSearchCustomerTemplate } from './realestate-vitrine-search-customer'
import { template as realestateVitrineSearchAgencyTemplate } from './realestate-vitrine-search-agency'
import { template as contractGeneratedTemplate } from './contract-generated'
import { template as contractSignedTemplate } from './contract-signed'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'site-down': siteDownTemplate,
  'site-up': siteUpTemplate,
  'marketing-lead-new': marketingLeadNewTemplate,
  'trial-started': trialStartedTemplate,
  'trial-ending': trialEndingTemplate,
  'welcome-paid': welcomePaidTemplate,
  'invoice-paid': invoicePaidTemplate,
  'invoice-overdue': invoiceOverdueTemplate,
  'realestate-property-approval': realestatePropertyApprovalTemplate,
  'realestate-vitrine-interest-customer': realestateVitrineInterestCustomerTemplate,
  'realestate-vitrine-interest-agency': realestateVitrineInterestAgencyTemplate,
  'realestate-vitrine-search-customer': realestateVitrineSearchCustomerTemplate,
  'realestate-vitrine-search-agency': realestateVitrineSearchAgencyTemplate,
  'contract-generated': contractGeneratedTemplate,
  'contract-signed': contractSignedTemplate,
}
