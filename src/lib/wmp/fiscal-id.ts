const onlyDigits = (v: string) => v.replace(/\D/g, '')
const cleanCnpj = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value)
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const digit = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i)
    const mod = (sum * 10) % 11
    return mod === 10 ? 0 : mod
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

function cnpjCharValue(ch: string): number {
  return ch.charCodeAt(0) - 48
}

function cnpjDv(base: string, weights: number[]): number {
  const sum = [...base].reduce((acc, ch, i) => acc + cnpjCharValue(ch) * weights[i], 0)
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

export function isValidCnpj(value: string): boolean {
  const cnpj = cleanCnpj(value)
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) return false
  const base = cnpj.slice(0, 12)
  const d1 = cnpjDv(base, [5,4,3,2,9,8,7,6,5,4,3,2])
  const d2 = cnpjDv(base + d1, [6,5,4,3,2,9,8,7,6,5,4,3,2])
  return cnpj.endsWith(`${d1}${d2}`)
}

export function validateBrazilFiscalId(value: string, type: 'CPF' | 'CNPJ'): boolean {
  return type === 'CPF' ? isValidCpf(value) : isValidCnpj(value)
}
