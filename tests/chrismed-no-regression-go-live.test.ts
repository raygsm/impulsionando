import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

const booking = read('src/routes/chrismed.agendar.tsx');
const payment = read('src/components/chrismed/ChrismedPaymentMethod.tsx');
const validators = read('src/lib/validators.ts');
const auth = read('src/routes/auth.tsx');
const professionalAuth = read('src/components/chrismed/ChrismedProfessionalAuth.tsx');
const shell = read('src/components/chrismed/ChrismedShell.tsx');

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

  it('bloqueia avanço com CPF inválido e explica como corrigir', () => {
    expect(booking).toContain('CPF inválido — não é possível avançar');
    expect(booking).toContain('Validar dados e continuar');
    expect(booking).toContain("if (!isValidCPF(patient.doc))");
    expect(booking).toContain("document.getElementById('doc')?.focus()");
  });

  it('mantém orientação do Impulsionito durante a jornada CHRISMED', () => {
    expect(booking).toContain('O Impulsionito e o Oliver estão disponíveis para orientar você');
    expect(shell).toContain('Impulsionito a postos');
    expect(professionalAuth).toContain('Impulsionito a postos');
  });

  it('não devolve erro bruto do provedor na autenticação CHRISMED', () => {
    expect(auth).not.toContain('Não foi possível concluir a solicitação: ${msg}');
    expect(professionalAuth).not.toContain('return message ||');
  });

  it('mantém acesso administrativo direto com e-mail pré-preenchível e destino seguro', () => {
    expect(auth).toContain('email?: string');
    expect(auth).toContain('initialEmail={search.email}');
    expect(auth).toContain('nextPath={safeNext(search.next)}');
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