import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const shell = readFileSync('src/components/chrismed/ChrismedShell.tsx', 'utf8');
const route = readFileSync('src/routes/chrismed.eventos.tsx', 'utf8');
const eventFunctions = readFileSync('src/lib/chrismed-events.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260807212613_chrismed_events_registration.sql', 'utf8');
const tokens = readFileSync('src/styles/tokens-tenants.css', 'utf8');

describe('CHRISMED events and contrast contract', () => {
  it('exposes Eventos in the primary navigation and footer', () => {
    expect(shell.match(/to: '\/chrismed\/eventos'/g)).toHaveLength(2);
  });

  it('publishes an events-only route with its own registration action', () => {
    expect(route).toContain("createFileRoute('/chrismed/eventos')");
    expect(route).toContain('Esta agenda é exclusiva para eventos e não agenda consultas.');
    expect(route).toContain('to="/chrismed/contato"');
    expect(route).not.toContain('to="/chrismed/agendar"');
    expect(route).toContain('registerForChrismedEvent');
  });

  it('keeps event registrations isolated from clinical scheduling', () => {
    expect(eventFunctions).toContain("from('chrismed_events' as never)");
    expect(eventFunctions).toContain("rpc('chrismed_register_event' as never");
    expect(eventFunctions).not.toMatch(/agenda_|appointment|patient|prontu/i);
    expect(migration).toContain('create table public.chrismed_events');
    expect(migration).toContain('create table public.chrismed_event_registrations');
    expect(migration).toContain('for update');
    expect(migration).toContain("'waitlisted'");
    expect(migration).toContain('revoke all on function public.chrismed_register_event');
  });

  it('keeps secondary and dark-surface text at strengthened contrast values', () => {
    expect(tokens).toContain('--chrismed-mist:       #596660;');
    expect(tokens).toContain('rgba(255,255,255,0.94)');
    expect(tokens).toContain('dd { color: #20312C; }');
  });
});
