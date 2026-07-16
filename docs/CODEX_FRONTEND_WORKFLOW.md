# Fluxo oficial de frontend no Codex

Desde 16 de julho de 2026, o Codex passa a ser o fluxo principal de manutenção e publicação do frontend da Impulsionando e dos clientes atuais e novos.

## Regras

- O código-fonte e as mudanças de frontend ficam no GitHub em `raygsm/impulsionando`.
- O build usa Vite + TanStack Start + Nitro diretamente, sem depender do wrapper de build da Lovable.
- O Core permanece em `https://impulsionando.com.br`.
- Cada cliente deve usar seu subdomínio canônico: `cliente.impulsionando.com.br`.
- CHRISMED usa `https://chrismed.impulsionando.com.br`; `/chrismed` no apex é apenas uma entrada legada que redireciona para o subdomínio.
- Publicações são disparadas pelo workflow `Deploy Core Frontend`, com validação de testes, build, serviço SSR, HTTPS e smoke tests públicos.

Este documento registra a decisão operacional de usar o Codex como substituto do fluxo de frontend anteriormente associado à Lovable.
