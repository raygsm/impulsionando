export const WMP_AUDIENCE_RANGES = [
  { value: '1_50', label: '1 a 50 pessoas', technicalValue: 50 },
  { value: '51_100', label: '51 a 100 pessoas', technicalValue: 100 },
  { value: '101_200', label: '101 a 200 pessoas', technicalValue: 200 },
  { value: '201_500', label: '201 a 500 pessoas', technicalValue: 500 },
  { value: '501_1000', label: '501 a 1.000 pessoas', technicalValue: 1000 },
  { value: '1001_2000', label: '1.001 a 2.000 pessoas', technicalValue: 2000 },
  { value: '2001_plus', label: 'Acima de 2.001 pessoas', technicalValue: 2001 },
] as const;

export const WMP_FLOOR_MATERIALS = [
  ['carpete','Carpete'], ['madeira','Madeira'], ['ceramica','Cerâmica / porcelanato'],
  ['concreto','Concreto / cimento'], ['borracha','Borracha / piso emborrachado'],
  ['vinilico','Vinílico / PVC'], ['pedra','Pedra / mármore / granito'],
  ['metal','Metal'], ['grama','Grama / solo natural'], ['misto','Misto / vários materiais'],
] as const;

export const WMP_WALL_MATERIALS = [
  ['alvenaria','Alvenaria rebocada / pintada'], ['drywall','Drywall / gesso acartonado'],
  ['ceramica','Cerâmica / azulejo / porcelanato'], ['borracha','Borracha / revestimento emborrachado'],
  ['concreto','Concreto aparente'], ['madeira','Madeira / painel de madeira'], ['vidro','Vidro'],
  ['espelho','Espelho / superfície espelhada'], ['tecido','Tecido / cortina'],
  ['painel_acustico','Painel acústico / lã mineral revestida'], ['espuma_acustica','Espuma acústica'],
  ['pedra','Pedra / mármore / granito'], ['metal','Metal / chapa metálica'], ['tijolo_aparente','Tijolo aparente'],
  ['vinilico','Vinílico / PVC'], ['misto','Misto / vários materiais'], ['outro','Outro / não identificado'],
] as const;

export const WMP_UFS = [
  ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal'],
  ['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],
  ['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],
  ['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins'],
] as const;

export const WMP_BASE_MICROPHONES: Record<string, number> = {
  dj_eletronico: 1,
  musica_ambiente: 0,
  voz_palestra: 2,
  banda_rock: 8,
  show_grande_porte: 12,
};
