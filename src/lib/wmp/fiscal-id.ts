import { isValidCPF, isValidCNPJ } from '@/lib/validators'

/**
 * Compatibilidade WMP: toda validação fiscal delega ao Core.
 * Mantemos estes nomes para não quebrar consumidores antigos, mas a regra
 * de CPF/CNPJ passa a ter uma única fonte de verdade no ecossistema.
 */
export const isValidCpf = isValidCPF
export const isValidCnpj = isValidCNPJ

export function validateBrazilFiscalId(value: string, type: 'CPF' | 'CNPJ'): boolean {
  return type === 'CPF' ? isValidCPF(value) : isValidCNPJ(value)
}
