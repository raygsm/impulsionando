/**
 * Validadores e máscaras BR — CPF, CNPJ, e-mail, telefone, CEP.
 *
 * Regras de dados:
 * - CPF: normalizado em 11 dígitos e validado pelos dígitos verificadores.
 * - CNPJ: aceita o legado numérico e o padrão alfanumérico vigente da Receita
 *   Federal (12 posições alfanuméricas + 2 dígitos verificadores numéricos).
 * - CEP: consulta sempre pelo backend do Core; formulários não dependem
 *   diretamente do provedor externo.
 */

// ============== NORMALIZAÇÃO / MÁSCARAS ==============
export const normalizeCPF = (v: string) => v.replace(/\D/g, "").slice(0, 11);

export const normalizeCNPJ = (v: string) =>
  v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 14);

export const maskCPF = (v: string) =>
  normalizeCPF(v)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

/**
 * A pontuação histórica do CNPJ continua útil para exibição porque a Receita
 * manteve 14 posições: raiz (8), ordem do estabelecimento (4) e DVs (2).
 * As 12 primeiras posições podem conter A-Z e 0-9; os DVs permanecem numéricos.
 */
export const maskCNPJ = (v: string) =>
  normalizeCNPJ(v)
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3/$4")
    .replace(/\/([A-Z0-9]{4})(\d{1,2})$/, "/$1-$2");

export const maskCEP = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};

// ============== VALIDAÇÕES ==============
export function isValidCPF(cpf: string): boolean {
  const d = normalizeCPF(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  let dig = 11 - (sum % 11);
  if (dig >= 10) dig = 0;
  if (dig !== Number(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
  dig = 11 - (sum % 11);
  if (dig >= 10) dig = 0;
  return dig === Number(d[10]);
}

const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/** Receita Federal: valor do caractere = código ASCII - 48. */
function cnpjCharValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

function calculateCNPJDigit(base: string, weights: readonly number[]): number {
  const sum = [...base].reduce(
    (total, char, index) => total + cnpjCharValue(char) * weights[index],
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Valida CNPJ numérico legado e CNPJ alfanumérico da Receita Federal.
 * Formato normalizado: [A-Z0-9]{12}[0-9]{2}.
 * Esta validação comprova formato/DV; situação cadastral na Receita é uma
 * consulta distinta e não deve ser inferida apenas pelo dígito verificador.
 */
export function isValidCNPJ(cnpj: string): boolean {
  const normalized = normalizeCNPJ(cnpj);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(normalized)) return false;
  if (/^(\d)\1{13}$/.test(normalized)) return false;

  const base12 = normalized.slice(0, 12);
  const first = calculateCNPJDigit(base12, CNPJ_WEIGHTS_1);
  const second = calculateCNPJDigit(`${base12}${first}`, CNPJ_WEIGHTS_2);

  return first === Number(normalized[12]) && second === Number(normalized[13]);
}

export const isValidEmail = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function isValidPhoneBR(p: string): boolean {
  const d = p.replace(/\D/g, "");
  if (d.length < 10 || d.length > 11) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
}

export const isValidCEP = (c: string) => /^\d{5}-?\d{3}$/.test(c.trim());

// ============== CEP CENTRALIZADO NO CORE ==============
export interface CepResult {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge?: string;
}

type CepApiResponse = {
  ok?: boolean;
  address?: {
    cep?: string;
    logradouro?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    ibge?: string;
  };
};

export async function lookupCEP(cep: string): Promise<CepResult | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;

  try {
    const response = await fetch(`/api/public/cep/${clean}`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as CepApiResponse;
    const address = payload.address;
    if (!payload.ok || !address) return null;

    return {
      cep: address.cep ?? maskCEP(clean),
      logradouro: address.logradouro ?? "",
      bairro: address.bairro ?? "",
      cidade: address.cidade ?? "",
      uf: address.uf ?? "",
      ibge: address.ibge,
    };
  } catch {
    return null;
  }
}
