import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

const booking = read('src/routes/chrismed.agendar.tsx');
const payment = read('src/components/chrismed/ChrismedPaymentMethod.tsx');
const validators = read('src/lib/validators.ts');

describe('CHRISMED — regras congeladas de go-live', () => {
  it('mantém o hold de checkout em 5 minutos', () => {
    expect(booking).toContain('CHECKOUT_HOLD_SECONDS = 300');
    expect(booking).toMatch(/5 minutos/);
    expect(booking).not.toMatch(/90\s*segundos|90\s*s\b|CHECKOUT_HOLD_SECONDS\s*=\s*90/i);
  });

  it('mantém PIX e cartão Mercado Pago no checkout', () => {
    expect(payment).toContain("'pix' | 'credit_card'");
    expect(payment).toContain('Cartão');
    expect(payment).toContain('PIX');
    expect(payment).toContain('sdk.mercadopago.com/js/v2');
    expect(payment).toContain('createCardToken');
  });

  it('mantém validação matemática de CPF e CNPJ', () => {
    expect(validators).toContain('export function isValidCPF');
    expect(validators).toContain('export function isValidCNPJ');
    expect(validators).toContain('calculateCNPJDigit');
  });

  it('não permite os erros técnicos históricos em inglês na agenda pública', () => {
    const forbidden = [
      'valid patient CPF required',
      'valid patient email required',
      'valid patient name required',
      'terms and privacy acceptance required',
      'active offering not found',
      'active professional not found',
      'slot is no longer available',
      'slot is blocked',
      'appointment start outside allowed window',
      'token and payment_method_id required for card payments',
    ];
    for (const message of forbidden) expect(booking).not.toContain(message);
  });

  it('não volta a rotular o checkout como somente PIX', () => {
    expect(booking).not.toContain('Ir para pagamento PIX');
    expect(booking).not.toContain('STEP 8: Pagamento (PIX real)');
  });
});
