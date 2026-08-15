import { createFileRoute } from '@tanstack/react-router';
import { AnaMaduHome } from '@/components/anamadu/AnaMaduHome';
import { AnaMaduPixCheckout } from '@/components/anamadu/AnaMaduPixCheckout';
import { AnitaDock } from '@/components/anamadu/AnitaDock';

export const Route = createFileRoute('/anamadu')({
  head: () => ({
    meta: [
      { title: 'Ana Madú — Acessórios e joias autorais com pedras naturais' },
      { name: 'description', content: 'Conheça peças autorais Ana Madú com pedras naturais, coleções, presentes e projetos personalizados Ourives. Descubra sua peça com a consultora virtual Anita.' },
      { name: 'keywords', content: 'Ana Madú, acessórios, pedras naturais, joias autorais, colares, brincos, pulseiras, anéis, joias personalizadas, ourives, Rio de Janeiro' },
      { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' },
      { property: 'og:site_name', content: 'Ana Madú' },
      { property: 'og:title', content: 'Ana Madú — Pedras naturais, peças autorais e Ourives' },
      { property: 'og:description', content: 'Descubra acessórios com pedras naturais e crie projetos exclusivos com curadoria e atendimento consultivo.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://anamadu.impulsionando.com.br/' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://anamadu.impulsionando.com.br/' }],
  }),
  component: AnaMaduExperience,
});

function AnaMaduExperience() {
  return (
    <>
      <AnaMaduHome />
      <AnaMaduPixCheckout />
      <AnitaDock />
    </>
  );
}
