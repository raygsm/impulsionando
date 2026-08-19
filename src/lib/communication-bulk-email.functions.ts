import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

async function tenantForUser(supabase: any, userId: string) {
  const { data: memberships, error } = await supabase
    .from('communication_tenant_members')
    .select('tenant_id,role,communication_tenants(id,slug,name,company_id)')
    .eq('user_id', userId)
    .limit(20);
  if (error) throw new Error('Não foi possível identificar sua empresa.');
  const first = memberships?.[0];
  if (!first?.tenant_id) throw new Error('Seu usuário ainda não está vinculado a um ambiente de comunicação.');
  return {
    tenantId: String(first.tenant_id),
    tenant: first.communication_tenants as { id: string; slug: string; name: string; company_id?: string | null },
    role: String(first.role ?? ''),
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR');
}

function emailHash(value: string) {
  return createHash('sha256').update(normalizeEmail(value)).digest('hex');
}

export const getBulkEmailWorkspace = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const { tenantId, tenant, role } = await tenantForUser(supabase, context.userId);

    const [contactsRes, campaignsRes, providerRes, senderRes] = await Promise.all([
      supabase
        .from('communication_recipients')
        .select('id,external_id,email,display_name,locale,timezone,attributes,created_at')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1500),
      supabase
        .from('communication_campaigns')
        .select('id,name,channel,status,category,audience_mode,scheduled_for,started_at,completed_at,created_at,metadata')
        .eq('tenant_id', tenantId)
        .eq('channel', 'email')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('communication_provider_accounts')
        .select('id,provider,active,config')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .limit(10),
      supabase
        .from('communication_senders')
        .select('id,name,email,reply_to,domain,verified_at,active,dns_status')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('verified_at', { ascending: false, nullsFirst: false })
        .limit(10),
    ]);

    const providers = providerRes.data ?? [];
    const senders = senderRes.data ?? [];
    const verifiedSender = senders.find((s: any) => Boolean(s.verified_at)) ?? null;
    const emailReady = providers.length > 0 && Boolean(verifiedSender);

    return {
      tenant,
      role,
      contacts: contactsRes.data ?? [],
      campaigns: campaignsRes.data ?? [],
      providers,
      senders,
      emailReady,
      readinessMessage: emailReady
        ? `Remetente verificado: ${verifiedSender?.email ?? ''}`
        : 'Configure um provedor ativo e um remetente verificado antes de disparar.',
    };
  });

const importRowSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(40).optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const importBulkEmailContacts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.object({
    fileName: z.string().min(1).max(255).default('contatos.csv'),
    rows: z.array(importRowSchema).min(1).max(1000),
    confirmLawfulBasis: z.literal(true),
  }).parse(value))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenantId } = await tenantForUser(supabase, context.userId);

    const deduped = new Map<string, z.infer<typeof importRowSchema>>();
    for (const row of data.rows) {
      const email = normalizeEmail(row.email);
      if (!deduped.has(email)) deduped.set(email, { ...row, email });
    }
    const rows = Array.from(deduped.values());

    const { data: batch, error: batchError } = await supabase
      .from('communication_import_batches')
      .insert({
        tenant_id: tenantId,
        created_by: context.userId,
        source_file_name: data.fileName,
        source_file_type: 'text/csv',
        status: 'processing',
        headers: ['name', 'email', 'phone'],
        suggested_mapping: { name: 'name', email: 'email', phone: 'phone' },
        confirmed_mapping: { name: 'name', email: 'email', phone: 'phone' },
        row_count: rows.length,
        summary: { lawful_basis_confirmed: true, channel: 'email', source: 'bulk_email_workspace' },
      })
      .select('id')
      .single();
    if (batchError || !batch?.id) throw new Error('Não foi possível iniciar a importação em massa.');

    let imported = 0;
    let updated = 0;
    const invalid: Array<{ row: number; email: string; error: string }> = [];
    const importRows: any[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      try {
        const { data: contactId, error: contactError } = await supabase.rpc('communication_upsert_manual_contact', {
          p_tenant_id: tenantId,
          p_name: row.name,
          p_email: row.email,
          p_phone: row.phone || null,
          p_attributes: {
            ...(row.attributes ?? {}),
            source: 'bulk_email_import',
            lawful_basis_confirmed: true,
            imported_at: new Date().toISOString(),
          },
        });
        if (contactError || !contactId) throw new Error(contactError?.message ?? 'contact_upsert_failed');

        const { data: existing } = await supabase
          .from('communication_recipients')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('email', row.email)
          .is('deleted_at', null)
          .maybeSingle();

        const recipientPayload = {
          tenant_id: tenantId,
          external_id: String(contactId),
          email: row.email,
          display_name: row.name,
          locale: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          attributes: {
            ...(row.attributes ?? {}),
            communication_contact_id: String(contactId),
            source: 'bulk_email_import',
            lawful_basis_confirmed: true,
          },
          deleted_at: null,
        };

        const { error: recipientError } = await supabase
          .from('communication_recipients')
          .upsert(recipientPayload, { onConflict: 'tenant_id,email' });
        if (recipientError) throw new Error(recipientError.message);

        if (existing?.id) updated += 1;
        else imported += 1;

        importRows.push({
          batch_id: batch.id,
          tenant_id: tenantId,
          row_number: index + 1,
          raw_data: row,
          full_name: row.name,
          phone_raw: row.phone || null,
          email_raw: row.email,
          email_normalized: row.email,
          contact_id: String(contactId),
          row_status: 'valid',
          validation_errors: [],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        invalid.push({ row: index + 1, email: row.email, error: message });
        importRows.push({
          batch_id: batch.id,
          tenant_id: tenantId,
          row_number: index + 1,
          raw_data: row,
          full_name: row.name,
          phone_raw: row.phone || null,
          email_raw: row.email,
          email_normalized: row.email,
          row_status: 'invalid',
          validation_errors: [message],
        });
      }
    }

    if (importRows.length) {
      const { error } = await supabase.from('communication_import_rows').insert(importRows);
      if (error) throw new Error('Os contatos foram processados, mas o histórico de importação não pôde ser registrado.');
    }

    await supabase
      .from('communication_import_batches')
      .update({
        status: invalid.length ? 'completed_with_errors' : 'completed',
        valid_rows: rows.length - invalid.length,
        invalid_rows: invalid.length,
        summary: {
          imported,
          updated,
          invalid: invalid.length,
          duplicates_in_file: data.rows.length - rows.length,
          lawful_basis_confirmed: true,
          channel: 'email',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id)
      .eq('tenant_id', tenantId);

    return {
      batchId: batch.id,
      totalReceived: data.rows.length,
      uniqueRows: rows.length,
      imported,
      updated,
      invalid,
      duplicatesInFile: data.rows.length - rows.length,
    };
  });

export const createBulkEmailCampaign = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.object({
    name: z.string().min(2).max(160),
    subject: z.string().min(2).max(240),
    textBody: z.string().min(2).max(100000),
    htmlBody: z.string().max(250000).optional().nullable(),
    audienceMode: z.enum(['all', 'selected']).default('all'),
    recipientIds: z.array(z.string().uuid()).max(5000).optional(),
    scheduledFor: z.string().datetime().optional().nullable(),
  }).parse(value))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenantId } = await tenantForUser(supabase, context.userId);

    let recipientsQuery = supabase
      .from('communication_recipients')
      .select('id,email,display_name,external_id')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    if (data.audienceMode === 'selected') {
      const ids = data.recipientIds ?? [];
      if (!ids.length) throw new Error('Selecione ao menos um contato.');
      recipientsQuery = recipientsQuery.in('id', ids);
    }
    const { data: recipients, error: recipientsError } = await recipientsQuery.limit(5000);
    if (recipientsError) throw new Error('Não foi possível preparar os destinatários.');
    if (!recipients?.length) throw new Error('Nenhum destinatário elegível foi encontrado.');

    const hashes = recipients.map((r: any) => emailHash(r.email));
    const { data: suppressions } = await supabase
      .from('communication_suppressions')
      .select('email_hash,scope,expires_at')
      .eq('tenant_id', tenantId)
      .in('email_hash', hashes);
    const suppressedHashes = new Set(
      (suppressions ?? [])
        .filter((s: any) => !s.expires_at || new Date(s.expires_at).getTime() > Date.now())
        .map((s: any) => String(s.email_hash)),
    );

    const recipientIds = recipients.map((r: any) => r.id);
    const { data: consents } = await supabase
      .from('communication_consents')
      .select('recipient_id,granted,occurred_at,category,purpose')
      .eq('tenant_id', tenantId)
      .in('recipient_id', recipientIds)
      .order('occurred_at', { ascending: false });
    const latestConsent = new Map<string, boolean>();
    for (const consent of consents ?? []) {
      const key = String(consent.recipient_id);
      if (!latestConsent.has(key) && (String(consent.category) === 'MARKETING' || String(consent.purpose).toLowerCase().includes('marketing'))) {
        latestConsent.set(key, Boolean(consent.granted));
      }
    }

    const eligible = recipients.filter((r: any) => {
      if (suppressedHashes.has(emailHash(r.email))) return false;
      if (latestConsent.get(String(r.id)) === false) return false;
      return true;
    });
    if (!eligible.length) throw new Error('Todos os contatos selecionados estão suprimidos ou com opt-out de marketing.');

    const { data: campaign, error: campaignError } = await supabase
      .from('communication_campaigns')
      .insert({
        tenant_id: tenantId,
        channel: 'email',
        name: data.name,
        category: 'marketing',
        audience_mode: data.audienceMode,
        audience_filter: data.audienceMode === 'selected' ? { recipient_ids: eligible.map((r: any) => r.id) } : { all_active_email_contacts: true },
        status: 'draft',
        scheduled_for: data.scheduledFor || null,
        created_by: context.userId,
        unit_price_cents: 0,
        billable: false,
        tracking_enabled: true,
        metadata: {
          subject: data.subject,
          text_body: data.textBody,
          html_body: data.htmlBody || null,
          created_from: 'bulk_email_workspace',
          filtered_out: recipients.length - eligible.length,
        },
      })
      .select('id,name,status,scheduled_for')
      .single();
    if (campaignError || !campaign?.id) throw new Error('Não foi possível criar a campanha.');

    const campaignRecipients = eligible.map((r: any) => ({
      campaign_id: campaign.id,
      tenant_id: tenantId,
      contact_id: /^[0-9a-f-]{36}$/i.test(String(r.external_id ?? '')) ? r.external_id : null,
      recipient_address: r.email,
      status: 'queued',
      metadata: { recipient_id: r.id, display_name: r.display_name ?? null },
    }));
    const { error: crError } = await supabase
      .from('communication_campaign_recipients')
      .upsert(campaignRecipients, { onConflict: 'campaign_id,recipient_address' });
    if (crError) throw new Error('A campanha foi criada, mas não foi possível montar a lista de destinatários.');

    return {
      campaignId: campaign.id,
      eligibleRecipients: eligible.length,
      filteredOut: recipients.length - eligible.length,
      status: campaign.status,
    };
  });

export const queueBulkEmailCampaign = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.object({ campaignId: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { tenantId, tenant } = await tenantForUser(supabase, context.userId);

    const [{ data: provider }, { data: sender }] = await Promise.all([
      supabase
        .from('communication_provider_accounts')
        .select('id,provider,active')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('communication_senders')
        .select('id,email,verified_at,active')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .not('verified_at', 'is', null)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (!provider || !sender) throw new Error('Disparo bloqueado: configure provedor de e-mail e remetente verificado para este cliente.');

    const { data: campaign, error: campaignError } = await supabase
      .from('communication_campaigns')
      .select('id,name,status,scheduled_for,metadata')
      .eq('id', data.campaignId)
      .eq('tenant_id', tenantId)
      .eq('channel', 'email')
      .single();
    if (campaignError || !campaign) throw new Error('Campanha não encontrada.');
    if (!['draft', 'scheduled'].includes(String(campaign.status))) throw new Error('Esta campanha já foi iniciada ou concluída.');

    const { data: campaignRecipients, error: campaignRecipientsError } = await supabase
      .from('communication_campaign_recipients')
      .select('id,recipient_address,contact_id,metadata,status')
      .eq('campaign_id', campaign.id)
      .eq('tenant_id', tenantId)
      .eq('status', 'queued')
      .limit(5000);
    if (campaignRecipientsError) throw new Error('Não foi possível carregar os destinatários da campanha.');
    if (!campaignRecipients?.length) throw new Error('A campanha não possui destinatários pendentes.');

    const recipientAddresses = campaignRecipients.map((r: any) => normalizeEmail(r.recipient_address));
    const { data: recipientRows } = await supabase
      .from('communication_recipients')
      .select('id,email,display_name')
      .eq('tenant_id', tenantId)
      .in('email', recipientAddresses)
      .is('deleted_at', null);
    const recipientByEmail = new Map((recipientRows ?? []).map((r: any) => [normalizeEmail(r.email), r]));

    const scheduledFor = campaign.scheduled_for ? new Date(campaign.scheduled_for) : null;
    const future = scheduledFor && scheduledFor.getTime() > Date.now();
    const messageStatus = future ? 'SCHEDULED' : 'PENDING';
    const subject = String(campaign.metadata?.subject ?? '').trim();
    const textBody = String(campaign.metadata?.text_body ?? '').trim();
    const htmlBody = campaign.metadata?.html_body ? String(campaign.metadata.html_body) : null;
    if (!subject || !textBody) throw new Error('Campanha sem assunto ou conteúdo.');

    let queued = 0;
    for (const campaignRecipient of campaignRecipients) {
      const email = normalizeEmail(campaignRecipient.recipient_address);
      const recipient = recipientByEmail.get(email);
      if (!recipient?.id) continue;

      const correlationId = `email-campaign:${campaign.id}:${recipient.id}`;
      const idempotencyKey = correlationId;
      const { data: existingEvent } = await supabase
        .from('communication_events')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (existingEvent?.id) continue;

      const { data: event, error: eventError } = await supabase
        .from('communication_events')
        .insert({
          event_type: 'bulk_email_campaign',
          tenant_id: tenantId,
          company_id: tenant.company_id ?? null,
          recipient_id: recipient.id,
          actor_id: context.userId,
          entity_type: 'communication_campaign',
          entity_id: campaign.id,
          channel: 'EMAIL',
          priority: 5,
          locale: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          occurred_at: new Date().toISOString(),
          scheduled_for: future ? campaign.scheduled_for : null,
          correlation_id: correlationId,
          idempotency_key: idempotencyKey,
          metadata: { campaign_id: campaign.id, provider: provider.provider },
          payload: { campaign_id: campaign.id, recipient_email: email, subject },
          source: 'core_bulk_email_workspace',
          environment: 'production',
        })
        .select('id')
        .single();
      if (eventError || !event?.id) throw new Error(`Falha ao criar evento para ${email}.`);

      const { data: message, error: messageError } = await supabase
        .from('communication_messages')
        .insert({
          tenant_id: tenantId,
          event_id: event.id,
          recipient_id: recipient.id,
          sender_id: sender.id,
          category: 'MARKETING',
          status: messageStatus,
          priority: 5,
          subject,
          html_body: htmlBody,
          text_body: textBody,
          render_context: {
            campaign_id: campaign.id,
            contact_name: recipient.display_name ?? '',
            unsubscribe_required: true,
          },
          scheduled_for: future ? campaign.scheduled_for : null,
          max_attempts: 5,
        })
        .select('id')
        .single();
      if (messageError || !message?.id) throw new Error(`Falha ao enfileirar e-mail para ${email}.`);

      await supabase
        .from('communication_campaign_recipients')
        .update({ message_id: message.id, status: future ? 'scheduled' : 'queued', updated_at: new Date().toISOString() })
        .eq('id', campaignRecipient.id)
        .eq('tenant_id', tenantId);
      queued += 1;
    }

    await supabase
      .from('communication_campaigns')
      .update({
        status: future ? 'scheduled' : 'queued',
        started_at: future ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign.id)
      .eq('tenant_id', tenantId);

    return {
      campaignId: campaign.id,
      queued,
      status: future ? 'scheduled' : 'queued',
      sender: sender.email,
      provider: provider.provider,
    };
  });
