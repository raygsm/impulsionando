import { createFileRoute } from '@tanstack/react-router';
import { FePersonalHome } from '@/components/fepersonal/FePersonalHome';

export const Route = createFileRoute('/fepersonal')({
  head: () => ({
    meta: [
      { title: 'Fernanda Personal — Private Performance' },
      { name: 'description', content: 'Treinamento personalizado, acompanhamento privado e performance com metodologia, ciência do movimento e cuidado individual. Atendimento presencial e remoto.' },
      { name: 'keywords', content: 'Fernanda Personal, personal trainer, treinamento personalizado, performance, exercício, saúde, bem-estar, personal online, Rio de Janeiro' },
      { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' },
      { property: 'og:site_name', content: 'Fernanda Personal' },
      { property: 'og:title', content: 'Fernanda Personal — Private Performance' },
      { property: 'og:description', content: 'Seu corpo não segue uma fórmula. Seu treino também não deveria.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://fepersonal.impulsionando.com.br/' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://fepersonal.impulsionando.com.br/' }],
  }),
  component: FePersonalHome,
});
