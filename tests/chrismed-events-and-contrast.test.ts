import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const shell = readFileSync('src/components/chrismed/ChrismedShell.tsx', 'utf8');
const route = readFileSync('src/routes/chrismed.eventos.tsx', 'utf8');
const tokens = readFileSync('src/styles/tokens-tenants.css', 'utf8');

describe('CHRISMED events and contrast contract', () => {
  it('exposes Eventos in the primary navigation and footer', () => {
    expect(shell.match(/to: '\/chrismed\/eventos'/g)).toHaveLength(2);
  });

  it('publishes a truthful events route with working actions', () => {
    expect(route).toContain("createFileRoute('/chrismed/eventos')");
    expect(route).toContain('Nenhum evento público neste momento.');
    expect(route).toContain('to="/chrismed/contato"');
    expect(route).toContain('to="/chrismed/agendar"');
  });

  it('keeps secondary and dark-surface text at strengthened contrast values', () => {
    expect(tokens).toContain('--chrismed-mist:       #596660;');
    expect(tokens).toContain('rgba(255,255,255,0.94)');
    expect(tokens).toContain('dd { color: #20312C; }');
  });
});
