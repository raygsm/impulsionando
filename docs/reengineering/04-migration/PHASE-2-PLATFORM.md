# Fase 2 — Plataforma e staging

## Objetivo

Construir o caminho seguro de entrega antes de migrar o produto.

## Trabalho

- criar workspace e imagens mínimas dos serviços;
- provisionar Supabase de staging separado;
- provisionar Dokploy e servidor limpo;
- configurar GHCR e imagens por SHA;
- configurar DNS de staging e Traefik;
- implementar health/readiness;
- centralizar logs e alertas mínimos;
- testar deploy, falha, rollback e restauração.

## Critério de saída

Um commit passa pela CI, vira uma imagem única, é implantado em staging sem SSH manual, falha de forma observável e pode ser revertido para uma imagem conhecida.

