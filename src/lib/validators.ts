/**
 * Validadores e máscaras BR — CPF, CNPJ, e-mail, telefone, CEP.
 * Uso em formulários (demo feira, orçamento, contratação, admin).
 */

// ============== MÁSCARAS ==============
export const maskCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
   .replace(/(\d{3})(\d)/, "$1.$2")
   .replace(/(\d{3})(\d)/, "$1.$2")
   .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const maskCNPJ = (v: string) =>
  v.replace(/\D/g, "").slice(0, 14)
   .replace(/(\d{2})(\d)/, "$1.$2")
   .replace(/(\d{3})(\d)/, "$1.$2")
   .replace(/(\d{3})(\d)/, "$1/$2")
   .replace(/(\d{4})(\d{1,2})$/, "$1-$2");

export const maskCEP = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};

// ============== VALIDAÇÕES ==============
export function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let dig = 11 - (sum % 11);
  if (dig >= 10) dig = 0;
  if (dig !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  dig = 11 - (sum % 11);
  if (dig >= 10) dig = 0;
  return dig === parseInt(d[10]);
}

export function isValidCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    const weights = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

export const isValidEmail = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function isValidPhoneBR(p: string): boolean {
  const d = p.replace(/\D/g, "");
  if (d.length < 10 || d.length > 11) return false;
  const ddd = parseInt(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  // celular precisa começar com 9
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
}

export const isValidCEP = (c: string) => /^\d{5}-?\d{3}$/.test(c.trim());

// ============== ViaCEP ==============
export interface CepResult {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge?: string;
}

export async function lookupCEP(cep: string): Promise<CepResult | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!r.ok) return null;
    const j = await r.json();
    if (j.erro) return null;
    return {
      cep: j.cep,
      logradouro: j.logradouro ?? "",
      bairro: j.bairro ?? "",
      cidade: j.localidade ?? "",
      uf: j.uf ?? "",
      ibge: j.ibge,
    };
  } catch {
    return null;
  }
}
