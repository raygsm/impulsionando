import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync('supabase/migrations/20260808213000_chrismed_secure_booking.sql', 'utf8');
const communicationSettings = readFileSync('supabase/migrations/20260808223000_chrismed_communication_settings.sql', 'utf8');
const occupationalMigration = readFileSync('supabase/migrations/20260809124500_chrismed_offerings_and_occupational_intake.sql', 'utf8');
const createPayment = readFileSync('supabase/functions/mpago-create-payment/index.ts', 'utf8');
const webhook = readFileSync('supabase/functions/mpago-webhook/index.ts', 'utf8');
const healthcheck = readFileSync('supabase/functions/chrismed-healthcheck/index.ts', 'utf8');
const supabaseConfig = readFileSync('supabase/config.toml', 'utf8');
const booking = readFileSync('src/routes/chrismed.agendar.tsx', 'utf8');
const professionalAuth = readFileSync('src/components/chrismed/ChrismedProfessionalAuth.tsx', 'utf8');
const server = readFileSync('src/server.ts', 'utf8');
const cleanPaths = readFileSync('src/lib/chrismed-clean-paths.ts', 'utf8');
const cleanRoutes = readFileSync('src/lib/chrismed-clean-routes.ts', 'utf8');
const setup = readFileSync('src/routes/_authenticated/chrismed.setup.tsx', 'utf8');
const occupationalBooking = readFileSync('src/routes/chrismed.ocupacional.agendar.tsx', 'utf8');

describe('CHRISMED secure booking gate', () => {
  it('prevents concurrent bookings for the same professional and interval', () => {
    expect(migration).toContain('chrismed_appointments_no_overlap');
    expect(migration).toContain("status IN ('held','pending_payment','confirmed')");
  });

  it('derives price and duration from active server-side offerings', () => {
    expect(migration).toContain('v_offering.duration_minutes');
    expect(createPayment).toContain('body.amount_cents = offering.price_cents');
    expect(createPayment).toContain('A valid CHRISMED booking hold is required');
    expect(booking).toContain("rpc('create_chrismed_booking_hold'");
    expect(booking).toContain("rpc('list_chrismed_available_slots'");
    expect(booking).not.toContain('buildChrismedMockCalendar');
  });

  it('reconciles official prices and persists occupational requests before success', () => {
    expect(occupationalMigration).toContain("'presencial',120000");
    expect(occupationalMigration).toContain("'telemedicina',60000");
    expect(occupationalMigration).toContain("'domiciliar',240000");
    expect(occupationalMigration).toContain("'ocupacional',11000");
    expect(occupationalMigration).toContain('CREATE TABLE IF NOT EXISTS public.chrismed_occupational_intakes');
    expect(occupationalMigration).toContain("'occupational_intake_management'");
    expect(occupationalMigration).toContain("'occupational_intake_received'");
    expect(occupationalBooking).toContain("supabase.rpc('submit_chrismed_occupational_intake'");
    expect(occupationalBooking.indexOf('if (error)')).toBeLessThan(occupationalBooking.indexOf('setSent(true)'));
  });

  it('fails closed when the Mercado Pago webhook is not authenticated', () => {
    expect(createPayment).toContain('mpago-webhook?company_id=');
    expect(createPayment).toContain('/functions/v1/mpago-webhook');
    expect(createPayment).not.toContain("replace('.supabase.co', '.functions.supabase.co')");
    expect(healthcheck).toContain('/functions/v1/mpago-webhook');
    expect(healthcheck).not.toContain('fpywvlhsfdtztkbncmdt');
    expect(createPayment).toContain("rpc('reveal_secret_value'");
    expect(webhook).toContain("rpc('reveal_secret_value'");
    expect(webhook).toContain('signatureValid !== true');
    expect(webhook).toContain("status: 401");
    expect(webhook).toContain("status: 500");
  });

  it('keeps the Mercado Pago healthcheck read-only', () => {
    expect(healthcheck).toContain('https://api.mercadopago.com/users/me');
    expect(healthcheck).not.toContain('transaction_amount: 0.01');
    expect(healthcheck).not.toContain('X-Idempotency-Key');
  });

  it('restricts the CHRISMED healthcheck to authorized management users', () => {
    expect(supabaseConfig.replace(/\r\n/g, '\n')).toContain(
      '[functions.chrismed-healthcheck]\nverify_jwt = true',
    );
    expect(healthcheck).toContain('sb.auth.getUser(accessJwt)');
    expect(healthcheck).toContain('.in("role", ["admin", "gestor"])');
    expect(healthcheck).toContain('status: 401');
    expect(healthcheck).toContain('status: 403');
    expect(setup).toContain('supabase.auth.getSession()');
    expect(setup).toContain('Authorization: `Bearer ${sessionData.session.access_token}`');
  });

  it('confirms appointments and queues idempotent reminders only from the webhook', () => {
    expect(webhook).toContain("nextAppointmentStatus = mpData.status === 'approved'");
    expect(webhook).toContain('appointment_reminder_24h');
    expect(webhook).toContain('appointment_reminder_2h');
    expect(migration).toContain('idempotency_key text NOT NULL UNIQUE');
  });

  it('does not grant the professional role before approval', () => {
    expect(migration).toContain("NEW.profile_status IN ('approved','active')");
    expect(migration).toContain("p.profile_status NOT IN ('approved','active')");
  });

  it('requires and persists versioned professional consent', () => {
    expect(professionalAuth).toContain('acceptedTerms');
    expect(professionalAuth).toContain('chrismed_terms_version');
    expect(professionalAuth).toContain('minLength={12}');
    expect(migration).toContain('capture_chrismed_professional_consent');
  });

  it('serves clean CHRISMED subdomain paths through internal tenant routes', () => {
    expect(server).toContain('toChrismedInternalPathname(url.hostname, url.pathname)');
    expect(server).toContain('canonicalTenantHostRedirect({');
    expect(server).toContain('Response.redirect(canonicalTenantUrl, 308)');
    expect(cleanPaths).toContain('PUBLIC_ROUTE_ROOTS');
    expect(cleanPaths).not.toContain('"alth"');
    expect(cleanRoutes).toContain('createBrowserHistory({');
    expect(cleanRoutes).toContain('toChrismedPublicPathname');
  });

  it('routes patient and technical communication through tenant-editable settings', () => {
    expect(communicationSettings).toContain("'comms.patient_email'");
    expect(communicationSettings).toContain("'comms.technical_support_email'");
    expect(communicationSettings).toContain('sac@chrismed.com.br');
    expect(communicationSettings).toContain('ti@chrismed.com.br');
    expect(communicationSettings).toContain('get_chrismed_contact_emails');
    expect(webhook).toContain("rpc('get_chrismed_contact_emails')");
    expect(webhook).toContain('from_email: patientChannelEmail');
    expect(setup).toContain('<ClientSettingsPanel');
    expect(setup).toContain('companyId={CHRISMED_COMPANY_ID}');
    expect(setup).not.toContain('settingKeys=');
    expect(professionalAuth).toContain('technicalSupportEmail');
    expect(professionalAuth).not.toContain('atendimento@chrismed.com.br');
  });
});
