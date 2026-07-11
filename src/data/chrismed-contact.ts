/**
 * Dados oficiais CHRISMED — Dra. Christiane Soares Alencar
 * Fonte: https://airgo.bio/chrismed (cartão digital oficial)
 */

export const CHRISMED_CONTACT = {
  doctor: {
    fullName: 'Dra. Christiane Soares Alencar',
    shortName: 'Dra. Christiane Alencar',
    formation: 'Médica formada pela UFRJ',
    experience: '+30 anos · +80.000 atendimentos',
    areas: 'Gastroenterologia · Hepatologia · Clínica Médica · Medicina Ocupacional',
    bio: 'Atendimento 360°, unindo ciência, experiência e acolhimento humano para cuidar da sua saúde com excelência.',
    photoUrl: 'https://meuairgo.com.br/assets/uploads/images/users/image-20-05-2026-20-28.webp',
  },
  channels: {
    airgo: 'https://airgo.bio/chrismed',
    vcard: 'https://meuairgo.com.br/vcard/e8a396ca',
    whatsapp: 'https://api.whatsapp.com/send?phone=5521972537868',
    phone: 'tel:+5521972537868',
    phoneDisplay: '+55 (21) 97253-7868',
    email: 'mailto:sac@chrismed.com.br',
    emailDisplay: 'sac@chrismed.com.br',
    website: 'https://chrismed.com.br/',
    instagram: 'https://instagram.com/csachrismed',
    location: 'https://www.google.com/maps/search/?api=1&query=Rua+Santa+Clara%2C+50+-+Sala+912',
    locationDisplay: 'Rua Santa Clara, 50 — Sala 912 · Copacabana · Rio de Janeiro',
    pix: 'https://meuairgo.com.br/pixPayment/value/e8a396ca',
    reviewDoctoralia: 'https://www.doctoralia.com.br/adicionar-opiniao/christiane-alencar#/opiniao',
    reviewGoogle: 'https://g.page/r/CRm36Pikv8xJEBM/review',
    schedule: 'https://agenda.chrismed.com.br/',
    scheduleASO:
      'https://www.doctoralia.com.br/christiane-alencar/gastroenterologista-medico-clinico-geral-medico-do-trabalho/rio-de-janeiro',
  },
  services: [
    {
      slug: 'domiciliar',
      name: 'Consulta Domiciliar',
      price: 'R$ 2.400,00',
      schedule: 'https://agenda.chrismed.com.br/',
      image:
        'https://meuairgo.com.br/assets/uploads/images/catalog-products/produto-chrismed-imagem11-20-05-2026-19-45.png',
      short:
        'Atendimento médico premium no conforto do seu ambiente, com discrição absoluta.',
    },
    {
      slug: 'teleconsulta',
      name: 'Teleconsulta',
      price: 'R$ 600,00',
      schedule: 'https://agenda.chrismed.com.br/',
      image:
        'https://meuairgo.com.br/assets/uploads/images/catalog-products/produto-chrismed-imagem-teleconsulta12-20-05-2026-19-58.png',
      short:
        'Atendimento online com padrão premium, segurança e discrição.',
    },
    {
      slug: 'consultorio',
      name: 'Consulta Presencial · Gastroenterologia e Clínica Médica',
      price: 'R$ 1.200,00',
      schedule: 'https://agenda.chrismed.com.br/',
      image:
        'https://meuairgo.com.br/assets/uploads/images/catalog-products/produto-chrismed-consultorio-copacabana-13-20-05-2026-20-03.png',
      short:
        'Consultório reservado em Copacabana, estrutura premium e discrição absoluta.',
    },
    {
      slug: 'aso',
      name: 'Consulta Ocupacional (ASO)',
      price: 'R$ 110,00',
      schedule:
        'https://www.doctoralia.com.br/christiane-alencar/gastroenterologista-medico-clinico-geral-medico-do-trabalho/rio-de-janeiro',
      image:
        'https://meuairgo.com.br/assets/uploads/images/catalog-products/produto-chrismed-ocupacional-aso-20-05-2026-20-10.png',
      short:
        'Avaliação clínica para emissão do Atestado de Saúde Ocupacional.',
    },
  ],
} as const;

export type ChrismedContact = typeof CHRISMED_CONTACT;
